from flask import request, jsonify
from db import db
from models import Business, User
from datetime import datetime
import uuid
import logging

FREE_PLAN_BUSINESS_LIMIT = 1


class Businesses:
    """CRUD operations for Business model"""

    @staticmethod
    def format_business_response(business, include_invoice_count=False):
        response_data = {
            'id': str(business.id),
            'user_id': str(business.user_id),
            'name': business.name,
            'email': business.email,
            'address': business.address,
            'phone': business.phone,
            'tax_id': business.tax_id,
            'paystack_subaccount_code': business.paystack_subaccount_code,
            'is_verified': business.is_verified,
            'data': business.data,
            'created_at': business.created_at.isoformat() if business.created_at else None,
            'updated_at': business.updated_at.isoformat() if business.updated_at else None
        }

        if include_invoice_count:
            invoice_count = len(business.invoices) if business.invoices else 0
            response_data['invoice_count'] = invoice_count

        return response_data

    @staticmethod
    def validate_uuid(uuid_string):
        try:
            uuid.UUID(uuid_string)
            return True
        except (ValueError, TypeError):
            return False

    @staticmethod
    def validate_business_data(data, is_update=False):
        errors = []

        if not is_update and not data.get('name'):
            errors.append('Name is required')
        elif is_update and 'name' in data and not data['name']:
            errors.append('Name cannot be empty')

        if not is_update and not data.get('user_id'):
            errors.append('User ID is required')
        elif not is_update and not Businesses.validate_uuid(data.get('user_id')):
            errors.append('Invalid user ID format')

        if data.get('email'):
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, data['email']):
                errors.append('Invalid email format')

        return errors

    @staticmethod
    def create_business():
        """Create a new business — enforces plan limit server-side"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400

            errors = Businesses.validate_business_data(data)
            if errors:
                return jsonify({'success': False, 'errors': errors}), 400

            user_id = data['user_id']

            # ── Plan enforcement ──────────────────────────────────────────────
            user = User.query.get(user_id)
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 404

            if user.plan != 'pro':
                existing_count = Business.query.filter_by(user_id=user_id).count()
                if existing_count >= FREE_PLAN_BUSINESS_LIMIT:
                    return jsonify({
                        'success': False,
                        'error': 'Free plan supports only one business. Upgrade to Pro to add more.',
                        'upgrade_required': True
                    }), 403
            # ─────────────────────────────────────────────────────────────────

            if data.get('email'):
                existing_business = Business.query.filter_by(
                    user_id=user_id,
                    email=data['email']
                ).first()
                if existing_business:
                    return jsonify({
                        'success': False,
                        'error': 'Business with this email already exists'
                    }), 409

            business = Business(
                user_id=user_id,
                name=data['name'],
                email=data.get('email'),
                address=data.get('address'),
                phone=data.get('phone'),
                tax_id=data.get('tax_id'),
                data=data.get('data')
            )

            db.session.add(business)
            db.session.commit()

            return jsonify({
                'success': True,
                'business': Businesses.format_business_response(business)
            }), 201

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error creating business: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to create business'}), 500

    @staticmethod
    def get_businesses():
        """Get all businesses for a user — also returns plan info for the frontend"""
        try:
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({'success': False, 'error': 'user_id is required'}), 400

            if not Businesses.validate_uuid(user_id):
                return jsonify({'success': False, 'error': 'Invalid user_id format'}), 400

            user = User.query.get(user_id)
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 404

            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 10))
            search = request.args.get('search', '')

            query = Business.query.filter_by(user_id=user_id)

            if search:
                search_term = f"%{search}%"
                query = query.filter(
                    db.or_(
                        Business.name.ilike(search_term),
                        Business.email.ilike(search_term),
                        Business.phone.ilike(search_term),
                        Business.tax_id.ilike(search_term)
                    )
                )

            query = query.order_by(Business.created_at.desc())

            paginated = query.paginate(page=page, per_page=per_page, error_out=False)

            businesses = [
                Businesses.format_business_response(b, include_invoice_count=True)
                for b in paginated.items
            ]

            return jsonify({
                'success': True,
                'businesses': businesses,
                # ── Expose plan info so the frontend knows the limit ──────────
                'plan': user.plan,
                'can_add_business': user.plan == 'pro' or paginated.total < FREE_PLAN_BUSINESS_LIMIT,
                # ─────────────────────────────────────────────────────────────
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
            logging.error(f"Error getting businesses: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to get businesses'}), 500

    @staticmethod
    def get_business(business_id):
        try:
            if not Businesses.validate_uuid(business_id):
                return jsonify({'success': False, 'error': 'Invalid business ID format'}), 400

            business = Business.query.get(business_id)
            if not business:
                return jsonify({'success': False, 'error': 'Business not found'}), 404

            return jsonify({
                'success': True,
                'business': Businesses.format_business_response(business, include_invoice_count=True)
            })

        except Exception as e:
            logging.error(f"Error getting business {business_id}: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to get business'}), 500

    @staticmethod
    def update_business(business_id):
        try:
            if not Businesses.validate_uuid(business_id):
                return jsonify({'success': False, 'error': 'Invalid business ID format'}), 400

            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400

            errors = Businesses.validate_business_data(data, is_update=True)
            if errors:
                return jsonify({'success': False, 'errors': errors}), 400

            business = Business.query.get(business_id)
            if not business:
                return jsonify({'success': False, 'error': 'Business not found'}), 404

            if data.get('email') and data['email'] != business.email:
                existing_business = Business.query.filter_by(
                    user_id=business.user_id,
                    email=data['email']
                ).filter(Business.id != business_id).first()

                if existing_business:
                    return jsonify({
                        'success': False,
                        'error': 'Another business with this email already exists'
                    }), 409

            if 'name' in data:
                business.name = data['name']
            if 'email' in data:
                business.email = data['email']
            if 'address' in data:
                business.address = data['address']
            if 'phone' in data:
                business.phone = data['phone']
            if 'tax_id' in data:
                business.tax_id = data['tax_id']
            if 'data' in data:
                business.data = data['data']
            if 'paystack_subaccount_code' in data:
                business.paystack_subaccount_code = data['paystack_subaccount_code']
            if 'is_verified' in data:
                business.is_verified = data['is_verified']

            business.updated_at = datetime.utcnow()
            db.session.commit()

            return jsonify({
                'success': True,
                'business': Businesses.format_business_response(business, include_invoice_count=True)
            })

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error updating business {business_id}: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to update business'}), 500

    @staticmethod
    def delete_business(business_id):
        try:
            if not Businesses.validate_uuid(business_id):
                return jsonify({'success': False, 'error': 'Invalid business ID format'}), 400

            business = Business.query.get(business_id)
            if not business:
                return jsonify({'success': False, 'error': 'Business not found'}), 404

            if business.invoices:
                return jsonify({
                    'success': False,
                    'error': f'Cannot delete business. Business has {len(business.invoices)} associated invoices.'
                }), 400

            db.session.delete(business)
            db.session.commit()

            return jsonify({'success': True, 'message': 'Business deleted successfully'})

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error deleting business {business_id}: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to delete business'}), 500

    @staticmethod
    def get_business_invoices(business_id):
        try:
            if not Businesses.validate_uuid(business_id):
                return jsonify({'success': False, 'error': 'Invalid business ID format'}), 400

            business = Business.query.get(business_id)
            if not business:
                return jsonify({'success': False, 'error': 'Business not found'}), 404

            invoices = []
            for invoice in business.invoices:
                amount = 0.0
                if isinstance(invoice.data, dict):
                    try:
                        amount = float(invoice.data.get('total', 0))
                    except (ValueError, TypeError):
                        pass

                invoices.append({
                    'id': str(invoice.id),
                    'invoice_number': invoice.data.get('invoice_number', '') if isinstance(invoice.data, dict) else '',
                    'amount': amount,
                    'currency': invoice.data.get('currency', 'USD') if isinstance(invoice.data, dict) else 'USD',
                    'status': invoice.status,
                    'issued_date': invoice.issued_date.isoformat() if invoice.issued_date else None,
                    'due_date': invoice.due_date.isoformat() if invoice.due_date else None,
                    'created_at': invoice.created_at.isoformat() if invoice.created_at else None
                })

            return jsonify({
                'success': True,
                'business': {
                    'id': str(business.id),
                    'name': business.name,
                    'email': business.email
                },
                'invoices': invoices,
                'total_invoices': len(invoices)
            })

        except Exception as e:
            logging.error(f"Error getting business invoices {business_id}: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to get business invoices'}), 500

    @staticmethod
    def bulk_delete_businesses():
        try:
            data = request.get_json()
            if not data or 'business_ids' not in data:
                return jsonify({'success': False, 'error': 'business_ids are required'}), 400

            business_ids = data['business_ids']
            if not isinstance(business_ids, list) or not business_ids:
                return jsonify({'success': False, 'error': 'business_ids must be a non-empty list'}), 400

            for business_id in business_ids:
                if not Businesses.validate_uuid(business_id):
                    return jsonify({'success': False, 'error': f'Invalid business ID format: {business_id}'}), 400

            businesses = Business.query.filter(Business.id.in_(business_ids)).all()

            businesses_with_invoices = []
            businesses_to_delete = []

            for business in businesses:
                if business.invoices:
                    businesses_with_invoices.append({
                        'id': str(business.id),
                        'name': business.name,
                        'invoice_count': len(business.invoices)
                    })
                else:
                    businesses_to_delete.append(business)

            if businesses_with_invoices:
                return jsonify({
                    'success': False,
                    'error': 'Some businesses cannot be deleted because they have associated invoices',
                    'businesses_with_invoices': businesses_with_invoices
                }), 400

            deleted_count = 0
            for business in businesses_to_delete:
                db.session.delete(business)
                deleted_count += 1

            db.session.commit()

            return jsonify({
                'success': True,
                'message': f'Successfully deleted {deleted_count} businesses',
                'deleted_count': deleted_count
            })

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error bulk deleting businesses: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to delete businesses'}), 500