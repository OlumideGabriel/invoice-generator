from flask import request, jsonify
from db import db
from models import Client
from datetime import datetime
import uuid
import logging


class Clients:
    """CRUD operations for Client model"""

    @staticmethod
    def validate_uuid(uuid_string):
        """Validate UUID format"""
        try:
            uuid.UUID(uuid_string)
            return True
        except (ValueError, TypeError):
            return False

    @staticmethod
    def validate_client_data(data, is_update=False):
        """Validate client data"""
        errors = []

        if not is_update and not data.get('name'):
            errors.append('Name is required')
        elif is_update and 'name' in data and not data['name']:
            errors.append('Name cannot be empty')

        if not is_update and not data.get('user_id'):
            errors.append('User ID is required')
        elif not is_update and not Clients.validate_uuid(data.get('user_id')):
            errors.append('Invalid user ID format')

        # Validate email format if provided
        if data.get('email'):
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, data['email']):
                errors.append('Invalid email format')

        return errors

    @staticmethod
    def create_client():
        """Create a new client"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400

            # Validate data
            errors = Clients.validate_client_data(data)
            if errors:
                return jsonify({'success': False, 'errors': errors}), 400

            # Check if client with same email already exists for this user
            if data.get('email'):
                existing_client = Client.query.filter_by(
                    user_id=data['user_id'],
                    email=data['email']
                ).first()
                if existing_client:
                    return jsonify({
                        'success': False,
                        'error': 'Client with this email already exists'
                    }), 409

            # Create new client
            client = Client(
                user_id=data['user_id'],
                name=data['name'],
                email=data.get('email'),
                address=data.get('address'),
                phone=data.get('phone')
            )

            db.session.add(client)
            db.session.commit()

            return jsonify({
                'success': True,
                'client': {
                    'id': str(client.id),
                    'user_id': str(client.user_id),
                    'name': client.name,
                    'email': client.email,
                    'address': client.address,
                    'phone': client.phone,
                    'created_at': client.created_at.isoformat() if client.created_at else None,
                    'updated_at': client.updated_at.isoformat() if client.updated_at else None
                }
            }), 201

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error creating client: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to create client'}), 500

    @staticmethod
    def get_clients():
        """Get all clients for a user with optional filtering and pagination"""
        try:
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({'success': False, 'error': 'user_id is required'}), 400

            if not Clients.validate_uuid(user_id):
                return jsonify({'success': False, 'error': 'Invalid user_id format'}), 400

            # Pagination parameters
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 10))
            search = request.args.get('search', '')

            # Build query
            query = Client.query.filter_by(user_id=user_id)

            # Apply search filter if provided
            if search:
                search_term = f"%{search}%"
                query = query.filter(
                    db.or_(
                        Client.name.ilike(search_term),
                        Client.email.ilike(search_term),
                        Client.phone.ilike(search_term)
                    )
                )

            # Order by created_at descending
            query = query.order_by(Client.created_at.desc())

            # Paginate
            paginated = query.paginate(
                page=page,
                per_page=per_page,
                error_out=False
            )

            clients = []
            for client in paginated.items:
                # Count invoices for this client
                invoice_count = len(client.invoices) if client.invoices else 0

                clients.append({
                    'id': str(client.id),
                    'user_id': str(client.user_id),
                    'name': client.name,
                    'email': client.email,
                    'address': client.address,
                    'phone': client.phone,
                    'invoice_count': invoice_count,
                    'created_at': client.created_at.isoformat() if client.created_at else None,
                    'updated_at': client.updated_at.isoformat() if client.updated_at else None
                })

            return jsonify({
                'success': True,
                'clients': clients,
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
            logging.error(f"Error getting clients: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to get clients'}), 500

    @staticmethod
    def get_client(client_id):
        """Get a specific client by ID"""
        try:
            if not Clients.validate_uuid(client_id):
                return jsonify({'success': False, 'error': 'Invalid client ID format'}), 400

            client = Client.query.get(client_id)
            if not client:
                return jsonify({'success': False, 'error': 'Client not found'}), 404

            # Count invoices for this client
            invoice_count = len(client.invoices) if client.invoices else 0

            return jsonify({
                'success': True,
                'client': {
                    'id': str(client.id),
                    'user_id': str(client.user_id),
                    'name': client.name,
                    'email': client.email,
                    'address': client.address,
                    'phone': client.phone,
                    'invoice_count': invoice_count,
                    'created_at': client.created_at.isoformat() if client.created_at else None,
                    'updated_at': client.updated_at.isoformat() if client.updated_at else None
                }
            })

        except Exception as e:
            logging.error(f"Error getting client {client_id}: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to get client'}), 500

    @staticmethod
    def update_client(client_id):
        """Update a client"""
        try:
            if not Clients.validate_uuid(client_id):
                return jsonify({'success': False, 'error': 'Invalid client ID format'}), 400

            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400

            # Validate data for update
            errors = Clients.validate_client_data(data, is_update=True)
            if errors:
                return jsonify({'success': False, 'errors': errors}), 400

            client = Client.query.get(client_id)
            if not client:
                return jsonify({'success': False, 'error': 'Client not found'}), 404

            # Check if email is being changed and if it conflicts with another client
            if data.get('email') and data['email'] != client.email:
                existing_client = Client.query.filter_by(
                    user_id=client.user_id,
                    email=data['email']
                ).filter(Client.id != client_id).first()

                if existing_client:
                    return jsonify({
                        'success': False,
                        'error': 'Another client with this email already exists'
                    }), 409

            # Update fields
            if 'name' in data:
                client.name = data['name']
            if 'email' in data:
                client.email = data['email']
            if 'address' in data:
                client.address = data['address']
            if 'phone' in data:
                client.phone = data['phone']

            client.updated_at = datetime.utcnow()
            db.session.commit()

            # Count invoices for response
            invoice_count = len(client.invoices) if client.invoices else 0

            return jsonify({
                'success': True,
                'client': {
                    'id': str(client.id),
                    'user_id': str(client.user_id),
                    'name': client.name,
                    'email': client.email,
                    'address': client.address,
                    'phone': client.phone,
                    'invoice_count': invoice_count,
                    'created_at': client.created_at.isoformat() if client.created_at else None,
                    'updated_at': client.updated_at.isoformat() if client.updated_at else None
                }
            })

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error updating client {client_id}: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to update client'}), 500

    @staticmethod
    def delete_client(client_id):
        """Delete a client"""
        try:
            if not Clients.validate_uuid(client_id):
                return jsonify({'success': False, 'error': 'Invalid client ID format'}), 400

            client = Client.query.get(client_id)
            if not client:
                return jsonify({'success': False, 'error': 'Client not found'}), 404

            # Check if client has invoices
            if client.invoices:
                return jsonify({
                    'success': False,
                    'error': f'Cannot delete client. Client has {len(client.invoices)} associated invoices.'
                }), 400

            db.session.delete(client)
            db.session.commit()

            return jsonify({
                'success': True,
                'message': 'Client deleted successfully'
            })

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error deleting client {client_id}: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to delete client'}), 500

    @staticmethod
    def get_client_invoices(client_id):
        """Get all invoices for a specific client"""
        try:
            if not Clients.validate_uuid(client_id):
                return jsonify({'success': False, 'error': 'Invalid client ID format'}), 400

            client = Client.query.get(client_id)
            if not client:
                return jsonify({'success': False, 'error': 'Client not found'}), 404

            invoices = []
            for invoice in client.invoices:
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
                'client': {
                    'id': str(client.id),
                    'name': client.name,
                    'email': client.email
                },
                'invoices': invoices,
                'total_invoices': len(invoices)
            })

        except Exception as e:
            logging.error(f"Error getting client invoices {client_id}: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to get client invoices'}), 500

    @staticmethod
    def bulk_delete_clients():
        """Delete multiple clients at once"""
        try:
            data = request.get_json()
            if not data or 'client_ids' not in data:
                return jsonify({'success': False, 'error': 'client_ids are required'}), 400

            client_ids = data['client_ids']
            if not isinstance(client_ids, list) or not client_ids:
                return jsonify({'success': False, 'error': 'client_ids must be a non-empty list'}), 400

            # Validate all client IDs
            for client_id in client_ids:
                if not Clients.validate_uuid(client_id):
                    return jsonify({'success': False, 'error': f'Invalid client ID format: {client_id}'}), 400

            # Get all clients
            clients = Client.query.filter(Client.id.in_(client_ids)).all()

            # Check for clients with invoices
            clients_with_invoices = []
            clients_to_delete = []

            for client in clients:
                if client.invoices:
                    clients_with_invoices.append({
                        'id': str(client.id),
                        'name': client.name,
                        'invoice_count': len(client.invoices)
                    })
                else:
                    clients_to_delete.append(client)

            if clients_with_invoices:
                return jsonify({
                    'success': False,
                    'error': 'Some clients cannot be deleted because they have associated invoices',
                    'clients_with_invoices': clients_with_invoices
                }), 400

            # Delete all clients without invoices
            deleted_count = 0
            for client in clients_to_delete:
                db.session.delete(client)
                deleted_count += 1

            db.session.commit()

            return jsonify({
                'success': True,
                'message': f'Successfully deleted {deleted_count} clients',
                'deleted_count': deleted_count
            })

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error bulk deleting clients: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to delete clients'}), 500