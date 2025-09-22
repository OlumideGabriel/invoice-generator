from flask import request, jsonify
from db import db
from models import Notification
from datetime import datetime
import uuid
import logging


class Notifications:
    """CRUD operations for Notification model"""

    @staticmethod
    def format_notification_response(notification):
        """Format notification response consistently across all methods"""
        return {
            'id': str(notification.id),
            'user_id': str(notification.user_id),
            'title': notification.title,
            'message': notification.message,
            'type': notification.type,
            'is_read': notification.is_read,
            'related_entity_type': notification.related_entity_type,
            'related_entity_id': str(notification.related_entity_id) if notification.related_entity_id else None,
            'created_at': notification.created_at.isoformat() if notification.created_at else None
        }

    @staticmethod
    def validate_uuid(uuid_string):
        """Validate UUID format"""
        try:
            uuid.UUID(uuid_string)
            return True
        except (ValueError, TypeError):
            return False

    @staticmethod
    def validate_notification_data(data, is_update=False):
        """Validate notification data"""
        errors = []

        if not is_update and not data.get('title'):
            errors.append('Title is required')
        elif is_update and 'title' in data and not data['title']:
            errors.append('Title cannot be empty')

        if not is_update and not data.get('message'):
            errors.append('Message is required')
        elif is_update and 'message' in data and not data['message']:
            errors.append('Message cannot be empty')

        if not is_update and not data.get('user_id'):
            errors.append('User ID is required')
        elif not is_update and not Notifications.validate_uuid(data.get('user_id')):
            errors.append('Invalid user ID format')

        # Validate type if provided
        valid_types = ['info', 'success', 'warning', 'error']
        if data.get('type') and data['type'] not in valid_types:
            errors.append(f'Type must be one of: {", ".join(valid_types)}')

        return errors

    @staticmethod
    def create_notification():
        """Create a new notification"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400

            # Validate data
            errors = Notifications.validate_notification_data(data)
            if errors:
                return jsonify({'success': False, 'errors': errors}), 400

            # Create new notification
            notification = Notification(
                user_id=data['user_id'],
                title=data['title'],
                message=data['message'],
                type=data.get('type', 'info'),
                related_entity_type=data.get('related_entity_type'),
                related_entity_id=data.get('related_entity_id')
            )

            db.session.add(notification)
            db.session.commit()

            return jsonify({
                'success': True,
                'notification': Notifications.format_notification_response(notification)
            }), 201

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error creating notification: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to create notification'}), 500

    @staticmethod
    def get_notifications():
        """Get all notifications for a user with optional filtering and pagination"""
        try:
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({'success': False, 'error': 'user_id is required'}), 400

            if not Notifications.validate_uuid(user_id):
                return jsonify({'success': False, 'error': 'Invalid user_id format'}), 400

            # Pagination parameters
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 20))
            unread_only = request.args.get('unread_only', 'false').lower() == 'true'
            type_filter = request.args.get('type')

            # Build query
            query = Notification.query.filter_by(user_id=user_id)

            # Apply filters
            if unread_only:
                query = query.filter_by(is_read=False)

            if type_filter:
                query = query.filter_by(type=type_filter)

            # Order by created_at descending (newest first)
            query = query.order_by(Notification.created_at.desc())

            # Paginate
            paginated = query.paginate(
                page=page,
                per_page=per_page,
                error_out=False
            )

            notifications = []
            for notification in paginated.items:
                notifications.append(Notifications.format_notification_response(notification))

            return jsonify({
                'success': True,
                'notifications': notifications,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': paginated.total,
                    'pages': paginated.pages,
                    'has_prev': paginated.has_prev,
                    'has_next': paginated.has_next
                }
            })

        except Exception as e:
            logging.error(f"Error getting notifications: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to get notifications'}), 500

    @staticmethod
    def get_unread_count():
        """Get count of unread notifications for a user"""
        try:
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({'success': False, 'error': 'user_id is required'}), 400

            if not Notifications.validate_uuid(user_id):
                return jsonify({'success': False, 'error': 'Invalid user_id format'}), 400

            count = Notification.query.filter_by(
                user_id=user_id,
                is_read=False
            ).count()

            return jsonify({
                'success': True,
                'count': count
            })

        except Exception as e:
            logging.error(f"Error getting unread count: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to get unread count'}), 500

    @staticmethod
    def mark_as_read(notification_id):
        """Mark a notification as read"""
        try:
            if not Notifications.validate_uuid(notification_id):
                return jsonify({'success': False, 'error': 'Invalid notification ID format'}), 400

            notification = Notification.query.get(notification_id)
            if not notification:
                return jsonify({'success': False, 'error': 'Notification not found'}), 404

            notification.is_read = True
            db.session.commit()

            return jsonify({
                'success': True,
                'notification': Notifications.format_notification_response(notification)
            })

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error marking notification as read {notification_id}: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to mark notification as read'}), 500

    @staticmethod
    def mark_all_as_read():
        """Mark all notifications as read for a user"""
        try:
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({'success': False, 'error': 'user_id is required'}), 400

            if not Notifications.validate_uuid(user_id):
                return jsonify({'success': False, 'error': 'Invalid user_id format'}), 400

            # Update all unread notifications for this user
            updated_count = Notification.query.filter_by(
                user_id=user_id,
                is_read=False
            ).update({'is_read': True})

            db.session.commit()

            return jsonify({
                'success': True,
                'message': f'Marked {updated_count} notifications as read'
            })

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error marking all notifications as read: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to mark notifications as read'}), 500

    @staticmethod
    def delete_notification(notification_id):
        """Delete a notification"""
        try:
            if not Notifications.validate_uuid(notification_id):
                return jsonify({'success': False, 'error': 'Invalid notification ID format'}), 400

            notification = Notification.query.get(notification_id)
            if not notification:
                return jsonify({'success': False, 'error': 'Notification not found'}), 404

            db.session.delete(notification)
            db.session.commit()

            return jsonify({
                'success': True,
                'message': 'Notification deleted successfully'
            })

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error deleting notification {notification_id}: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to delete notification'}), 500

    @staticmethod
    def bulk_delete_notifications():
        """Delete multiple notifications at once"""
        try:
            data = request.get_json()
            if not data or 'notification_ids' not in data:
                return jsonify({'success': False, 'error': 'notification_ids are required'}), 400

            notification_ids = data['notification_ids']
            if not isinstance(notification_ids, list) or not notification_ids:
                return jsonify({'success': False, 'error': 'notification_ids must be a non-empty list'}), 400

            # Validate all notification IDs
            for notification_id in notification_ids:
                if not Notifications.validate_uuid(notification_id):
                    return jsonify(
                        {'success': False, 'error': f'Invalid notification ID format: {notification_id}'}), 400

            # Delete all notifications
            deleted_count = Notification.query.filter(
                Notification.id.in_(notification_ids)
            ).delete(synchronize_session=False)

            db.session.commit()

            return jsonify({
                'success': True,
                'message': f'Successfully deleted {deleted_count} notifications',
                'deleted_count': deleted_count
            })

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error bulk deleting notifications: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to delete notifications'}), 500