from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import db
from models import User, UserSubscription, SubscriptionPlan, BillingTransaction
from datetime import datetime, timedelta
import uuid
import logging

billing_bp = Blueprint('billing', __name__, url_prefix='/api/billing')
logger = logging.getLogger(__name__)


@billing_bp.route('/invoices', methods=['GET'])
@jwt_required()
def get_billing_history():
    """Get user's billing transaction history (subscription payments)"""
    try:
        current_user_id = get_jwt_identity()
        user_id = request.args.get('user_id')
        
        if isinstance(current_user_id, str):
            current_user_id = uuid.UUID(current_user_id)
        if isinstance(user_id, str):
            user_id = uuid.UUID(user_id)
        
        if current_user_id != user_id:
            return jsonify({'error': 'Unauthorized access'}), 403
        
        # Get billing transactions (payments made by user for subscription)
        transactions = BillingTransaction.query.filter_by(
            user_id=user_id, 
            status='success'
        ).order_by(BillingTransaction.created_at.desc()).all()
        
        transactions_data = []
        for transaction in transactions:
            transactions_data.append({
                'id': str(transaction.id),
                'date': transaction.created_at.isoformat(),
                'amount': float(transaction.amount),
                'status': transaction.status,
                'description': transaction.description or 'Subscription payment'
            })
        
        return jsonify({
            'success': True,
            'invoices': transactions_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching billing history: {str(e)}")
        return jsonify({'error': 'Failed to fetch billing history'}), 500


@billing_bp.route('/current', methods=['GET'])
@jwt_required()
def get_current_subscription():
    """Get user's current subscription details"""
    try:
        current_user_id = get_jwt_identity()
        user_id = request.args.get('user_id')
        
        if isinstance(current_user_id, str):
            current_user_id = uuid.UUID(current_user_id)
        if isinstance(user_id, str):
            user_id = uuid.UUID(user_id)
        
        if current_user_id != user_id:
            return jsonify({'error': 'Unauthorized access'}), 403
        
        user = User.query.get(user_id)
        subscription = UserSubscription.query.filter_by(user_id=user_id, status='active').first()
        
        subscription_data = {
            'plan': user.plan if user.plan else 'free',
            'status': 'active',
            'current_period_start': None,
            'current_period_end': None,
            'cancel_at_period_end': False
        }
        
        if subscription:
            subscription_data['current_period_start'] = subscription.current_period_start.isoformat()
            subscription_data['current_period_end'] = subscription.current_period_end.isoformat()
            subscription_data['cancel_at_period_end'] = subscription.cancel_at_period_end
        
        return jsonify({
            'success': True,
            'subscription': subscription_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching subscription: {str(e)}")
        return jsonify({'error': 'Failed to fetch subscription details'}), 500