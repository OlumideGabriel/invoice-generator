# users.py
from flask import request, jsonify
from db import db
from models import User
from datetime import datetime
import uuid
import logging
from werkzeug.security import generate_password_hash, check_password_hash


class Users:
    """CRUD operations for User model"""

    @staticmethod
    def validate_uuid(uuid_string):
        """Validate UUID format"""
        try:
            uuid.UUID(uuid_string)
            return True
        except (ValueError, TypeError):
            return False

    @staticmethod
    def validate_user_data(data, is_update=False):
        """Validate user data"""
        errors = []

        if not is_update and not data.get('email'):
            errors.append('Email is required')
        elif is_update and 'email' in data and not data['email']:
            errors.append('Email cannot be empty')

        if not is_update and not data.get('password'):
            errors.append('Password is required')
        elif not is_update and len(data.get('password', '')) < 6:
            errors.append('Password must be at least 6 characters')

        # Validate email format if provided
        if data.get('email'):
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, data['email']):
                errors.append('Invalid email format')

        return errors

    @staticmethod
    def delete_user():
        """Delete user account"""
        try:
            data = request.get_json()
            user_id = data.get('user_id')

            if not user_id:
                return jsonify({'success': False, 'error': 'user_id is required'}), 400

            if not Users.validate_uuid(user_id):
                return jsonify({'success': False, 'error': 'Invalid user ID format'}), 400

            user = User.query.get(user_id)
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 404

            # Optional: Add confirmation password check
            password = data.get('password')
            if password and not check_password_hash(user.password_hash, password):
                return jsonify({'success': False, 'error': 'Password incorrect'}), 401

            db.session.delete(user)
            db.session.commit()

            return jsonify({'success': True, 'message': 'User deleted successfully'})

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error deleting user: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to delete user'}), 500

    @staticmethod
    def update_password():
        """Update user password"""
        try:
            data = request.get_json()
            user_id = data.get('user_id')
            current_password = data.get('current_password')
            new_password = data.get('new_password')

            if not all([user_id, current_password, new_password]):
                return jsonify({'success': False, 'error': 'All fields required'}), 400

            if not Users.validate_uuid(user_id):
                return jsonify({'success': False, 'error': 'Invalid user ID format'}), 400

            user = User.query.get(user_id)
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 404

            # Check if user has password (OAuth users might not)
            if not user.password_hash:
                return jsonify({'success': False, 'error': 'Password cannot be changed for OAuth users'}), 400

            if not check_password_hash(user.password_hash, current_password):
                return jsonify({'success': False, 'error': 'Current password incorrect'}), 401

            if len(new_password) < 6:
                return jsonify({'success': False, 'error': 'New password must be at least 6 characters'}), 400

            user.password_hash = generate_password_hash(new_password)
            user.updated_at = datetime.utcnow()
            db.session.commit()

            return jsonify({'success': True, 'message': 'Password updated successfully'})

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error updating password: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to update password'}), 500

    @staticmethod
    def get_user_profile():
        """Get user profile (alternative to your existing route)"""
        try:
            user_id = request.args.get('user_id')

            if not user_id:
                return jsonify({'success': False, 'error': 'user_id is required'}), 400

            if not Users.validate_uuid(user_id):
                return jsonify({'success': False, 'error': 'Invalid user ID format'}), 400

            user = User.query.get(user_id)
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 404

            return jsonify({
                'success': True,
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'google_id': user.google_id,
                    'auth_method': 'google' if user.google_id else 'native',
                    'is_guest': user.is_guest,
                    'profile_picture_url': user.profile_picture_url,
                    'email_verified': user.email_verified,
                    'created_at': user.created_at.isoformat() if user.created_at else None,
                    'updated_at': user.updated_at.isoformat() if user.updated_at else None
                }
            })

        except Exception as e:
            logging.error(f"Error getting user profile: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to get user profile'}), 500