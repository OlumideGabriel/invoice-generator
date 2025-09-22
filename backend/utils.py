# utils.py
from flask import current_app
from db import db
from models import Notification
from datetime import datetime
import uuid
import logging
from typing import Optional


def create_notification(user_id: str, title: str, message: str,
                        type: str = 'info',
                        related_entity_type: Optional[str] = None,
                        related_entity_id: Optional[str] = None) -> Optional[Notification]:
    """
    Helper function to create notifications easily from anywhere in the app

    Args:
        user_id: The UUID of the user who should receive the notification
        title: Short title for the notification
        message: Detailed message content
        type: Notification type ('info', 'success', 'warning', 'error')
        related_entity_type: Type of related entity ('invoice', 'client', 'business')
        related_entity_id: UUID of the related entity

    Returns:
        Notification object if successful, None if failed
    """
    try:
        # Validate UUID format
        try:
            uuid.UUID(user_id)
            if related_entity_id:
                uuid.UUID(related_entity_id)
        except ValueError:
            logging.error(
                f"Invalid UUID format in create_notification: user_id={user_id}, related_entity_id={related_entity_id}")
            return None

        # Validate notification type
        valid_types = ['info', 'success', 'warning', 'error']
        if type not in valid_types:
            logging.warning(f"Invalid notification type: {type}. Defaulting to 'info'")
            type = 'info'

        # Create new notification
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id
        )

        db.session.add(notification)
        db.session.commit()

        logging.info(f"Notification created successfully: {notification.id} for user {user_id}")
        return notification

    except Exception as e:
        db.session.rollback()
        logging.error(f"Error creating notification: {str(e)}", exc_info=True)
        return None


def create_invoice_notification(user_id: str, invoice_number: str, action: str,
                                invoice_id: Optional[str] = None,
                                is_success: bool = True) -> Optional[Notification]:
    """
    Helper specifically for invoice-related notifications

    Args:
        user_id: The UUID of the user
        invoice_number: Number/identifier of the invoice
        action: Action performed ('created', 'updated', 'sent', 'paid', 'deleted')
        invoice_id: UUID of the invoice (optional)
        is_success: Whether the action was successful

    Returns:
        Notification object if successful, None if failed
    """
    type = 'success' if is_success else 'error'
    title = f"Invoice {action.capitalize()}"
    message = f"Invoice {invoice_number} has been {action} successfully"

    if not is_success:
        message = f"Failed to {action} invoice {invoice_number}"

    return create_notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        related_entity_type='invoice' if invoice_id else None,
        related_entity_id=invoice_id
    )


def create_client_notification(user_id: str, client_name: str, action: str,
                               client_id: Optional[str] = None,
                               is_success: bool = True) -> Optional[Notification]:
    """
    Helper specifically for client-related notifications

    Args:
        user_id: The UUID of the user
        client_name: Name of the client
        action: Action performed ('created', 'updated', 'deleted')
        client_id: UUID of the client (optional)
        is_success: Whether the action was successful

    Returns:
        Notification object if successful, None if failed
    """
    type = 'success' if is_success else 'error'
    title = f"Client {action.capitalize()}"
    message = f"Client {client_name} has been {action} successfully"

    if not is_success:
        message = f"Failed to {action} client {client_name}"

    return create_notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        related_entity_type='client' if client_id else None,
        related_entity_id=client_id
    )


def create_user_notification(user_id: str, action: str,
                             is_success: bool = True,
                             additional_info: str = "") -> Optional[Notification]:
    """
    Helper specifically for user account-related notifications

    Args:
        user_id: The UUID of the user
        action: Action performed ('signed_up', 'profile_updated', 'password_changed', 'account_deleted')
        is_success: Whether the action was successful
        additional_info: Additional context for the notification

    Returns:
        Notification object if successful, None if failed
    """
    type = 'success' if is_success else 'error'

    messages = {
        'signed_up': 'Welcome to Envoyce! Your account has been created successfully.',
        'profile_updated': 'Your profile has been updated successfully.',
        'password_changed': 'Your password has been changed successfully.',
        'account_deleted': 'Your account has been deleted successfully.'
    }

    title = f"Account {action.replace('_', ' ').title()}"
    message = messages.get(action, f"Account {action.replace('_', ' ')} completed")

    if not is_success:
        message = f"Failed to {action.replace('_', ' ')} your account"

    if additional_info:
        message += f". {additional_info}"

    return create_notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type
    )


def create_system_notification(user_id: str, title: str, message: str,
                               type: str = 'info') -> Optional[Notification]:
    """
    Helper for system-level notifications (maintenance, updates, etc.)

    Args:
        user_id: The UUID of the user
        title: Notification title
        message: Detailed message
        type: Notification type ('info', 'warning')

    Returns:
        Notification object if successful, None if failed
    """
    return create_notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type
    )


def create_payment_notification(user_id: str, invoice_number: str, amount: float,
                                currency: str = 'USD',
                                invoice_id: Optional[str] = None,
                                is_success: bool = True) -> Optional[Notification]:
    """
    Helper specifically for payment-related notifications

    Args:
        user_id: The UUID of the user
        invoice_number: Number/identifier of the invoice
        amount: Payment amount
        currency: Currency code
        invoice_id: UUID of the invoice (optional)
        is_success: Whether the payment was successful

    Returns:
        Notification object if successful, None if failed
    """
    type = 'success' if is_success else 'error'

    if is_success:
        title = "Payment Received"
        message = f"Payment of {currency} {amount:.2f} for invoice {invoice_number} has been received"
    else:
        title = "Payment Failed"
        message = f"Payment for invoice {invoice_number} failed. Please try again."

    return create_notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        related_entity_type='invoice' if invoice_id else None,
        related_entity_id=invoice_id
    )


def mark_notification_as_read(notification_id: str, user_id: str) -> bool:
    """
    Mark a specific notification as read

    Args:
        notification_id: UUID of the notification to mark as read
        user_id: UUID of the user (for validation)

    Returns:
        True if successful, False if failed
    """
    try:
        # Validate UUID format
        try:
            uuid.UUID(notification_id)
            uuid.UUID(user_id)
        except ValueError:
            logging.error(
                f"Invalid UUID format in mark_notification_as_read: notification_id={notification_id}, user_id={user_id}")
            return False

        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=user_id
        ).first()

        if not notification:
            logging.warning(f"Notification {notification_id} not found for user {user_id}")
            return False

        notification.is_read = True
        db.session.commit()

        logging.info(f"Notification {notification_id} marked as read for user {user_id}")
        return True

    except Exception as e:
        db.session.rollback()
        logging.error(f"Error marking notification as read: {str(e)}", exc_info=True)
        return False


def mark_all_notifications_as_read(user_id: str) -> bool:
    """
    Mark all notifications as read for a user

    Args:
        user_id: UUID of the user

    Returns:
        True if successful, False if failed
    """
    try:
        # Validate UUID format
        try:
            uuid.UUID(user_id)
        except ValueError:
            logging.error(f"Invalid UUID format in mark_all_notifications_as_read: user_id={user_id}")
            return False

        updated_count = Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).update({'is_read': True})

        db.session.commit()

        logging.info(f"Marked {updated_count} notifications as read for user {user_id}")
        return True

    except Exception as e:
        db.session.rollback()
        logging.error(f"Error marking all notifications as read: {str(e)}", exc_info=True)
        return False


def get_unread_notification_count(user_id: str) -> int:
    """
    Get count of unread notifications for a user

    Args:
        user_id: UUID of the user

    Returns:
        Count of unread notifications, or -1 if error
    """
    try:
        # Validate UUID format
        try:
            uuid.UUID(user_id)
        except ValueError:
            logging.error(f"Invalid UUID format in get_unread_notification_count: user_id={user_id}")
            return -1

        count = Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).count()

        return count

    except Exception as e:
        logging.error(f"Error getting unread notification count: {str(e)}", exc_info=True)
        return -1