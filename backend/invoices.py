from flask import request, jsonify
from db import db
from models import Invoice
from datetime import datetime
import uuid
import logging
from sqlalchemy import asc, desc, func


class InvoiceOperations:
    """Additional CRUD operations for Invoice model to complement existing app.py routes"""

    # Valid invoice statuses
    VALID_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled']

    @staticmethod
    def validate_uuid(uuid_string):
        """Validate UUID format"""
        try:
            uuid.UUID(uuid_string)
            return True
        except (ValueError, TypeError):
            return False

    @staticmethod
    def validate_status(status):
        """Validate invoice status"""
        return status.lower() in InvoiceOperations.VALID_STATUSES

    @staticmethod
    def update_invoice_status(invoice_id):
        """Update invoice status - Enhanced version of existing route"""
        try:
            if not InvoiceOperations.validate_uuid(invoice_id):
                return jsonify({'success': False, 'error': 'Invalid invoice ID format'}), 400

            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400

            new_status = data.get('status')
            user_id = data.get('user_id')

            if not new_status:
                return jsonify({'success': False, 'error': 'Status is required'}), 400

            if not InvoiceOperations.validate_status(new_status):
                return jsonify({
                    'success': False,
                    'error': f'Invalid status. Must be one of: {", ".join(InvoiceOperations.VALID_STATUSES)}'
                }), 400

            # Get the invoice with user validation if user_id provided
            if user_id:
                if not InvoiceOperations.validate_uuid(user_id):
                    return jsonify({'success': False, 'error': 'Invalid user ID format'}), 400
                invoice = Invoice.query.filter_by(id=invoice_id, user_id=user_id).first()
            else:
                invoice = Invoice.query.get(invoice_id)

            if not invoice:
                return jsonify({'success': False, 'error': 'Invoice not found or access denied'}), 404

            # Store old status for logging
            old_status = invoice.status

            # Update status
            invoice.status = new_status.lower()

            # Update timestamp if column exists
            if hasattr(invoice, 'updated_at'):
                invoice.updated_at = datetime.utcnow()

            # If marking as paid, update paid date in data if it exists
            if new_status.lower() == 'paid' and isinstance(invoice.data, dict):
                if 'data' not in invoice.data:
                    invoice.data = dict(invoice.data)  # Ensure it's mutable
                invoice.data['paid_date'] = datetime.utcnow().isoformat()
                # Mark the attribute as modified for SQLAlchemy
                db.session.merge(invoice)

            db.session.commit()

            logging.info(f"Invoice {invoice_id} status updated from '{old_status}' to '{new_status}'" +
                         (f" by user {user_id}" if user_id else ""))

            return jsonify({
                'success': True,
                'message': f'Invoice status updated from {old_status} to {new_status}',
                'invoice': {
                    'id': str(invoice.id),
                    'status': invoice.status,
                    'updated_at': invoice.updated_at.isoformat() if hasattr(invoice,
                                                                            'updated_at') and invoice.updated_at else None
                }
            })

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error updating invoice status {invoice_id}: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to update invoice status'}), 500

    @staticmethod
    def delete_invoice(invoice_id):
        """Delete an invoice"""
        try:
            if not InvoiceOperations.validate_uuid(invoice_id):
                return jsonify({'success': False, 'error': 'Invalid invoice ID format'}), 400

            # Get user_id from request data or query params for additional security
            user_id = request.args.get('user_id') or (request.get_json() or {}).get('user_id')

            # Get the invoice with optional user validation
            if user_id:
                if not InvoiceOperations.validate_uuid(user_id):
                    return jsonify({'success': False, 'error': 'Invalid user ID format'}), 400
                invoice = Invoice.query.filter_by(id=invoice_id, user_id=user_id).first()
            else:
                invoice = Invoice.query.get(invoice_id)

            if not invoice:
                return jsonify({'success': False, 'error': 'Invoice not found or access denied'}), 404

            # Optional: Check if invoice can be deleted (business rule)
            if invoice.status == 'paid':
                return jsonify({
                    'success': False,
                    'error': 'Cannot delete paid invoices. Please contact support if you need to delete this invoice.'
                }), 400

            # Store invoice info for logging before deletion
            invoice_number = 'N/A'
            if isinstance(invoice.data, dict):
                invoice_number = invoice.data.get('invoice_number', 'N/A')

            invoice_id_str = str(invoice.id)
            user_id_str = str(invoice.user_id)

            # Delete the invoice
            db.session.delete(invoice)
            db.session.commit()

            logging.info(f"Invoice {invoice_id_str} (#{invoice_number}) deleted by user {user_id_str}")

            return jsonify({
                'success': True,
                'message': f'Invoice #{invoice_number} deleted successfully'
            })

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error deleting invoice {invoice_id}: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to delete invoice'}), 500

    @staticmethod
    def bulk_delete_invoices():
        """Delete multiple invoices at once"""
        try:
            data = request.get_json()
            if not data or 'invoice_ids' not in data:
                return jsonify({'success': False, 'error': 'invoice_ids are required'}), 400

            invoice_ids = data['invoice_ids']
            user_id = data.get('user_id')

            if not isinstance(invoice_ids, list) or not invoice_ids:
                return jsonify({'success': False, 'error': 'invoice_ids must be a non-empty list'}), 400

            # Validate user_id if provided
            if user_id and not InvoiceOperations.validate_uuid(user_id):
                return jsonify({'success': False, 'error': 'Invalid user ID format'}), 400

            # Validate all invoice IDs
            for invoice_id in invoice_ids:
                if not InvoiceOperations.validate_uuid(invoice_id):
                    return jsonify({'success': False, 'error': f'Invalid invoice ID format: {invoice_id}'}), 400

            # Get all invoices with optional user filtering
            if user_id:
                invoices = Invoice.query.filter(
                    Invoice.id.in_(invoice_ids),
                    Invoice.user_id == user_id
                ).all()
            else:
                invoices = Invoice.query.filter(Invoice.id.in_(invoice_ids)).all()

            if len(invoices) != len(invoice_ids):
                return jsonify({
                    'success': False,
                    'error': 'Some invoices were not found or you do not have permission to delete them'
                }), 404

            # Check for paid invoices (optional business rule)
            paid_invoices = []
            invoices_to_delete = []

            for invoice in invoices:
                if invoice.status == 'paid':
                    invoice_number = 'N/A'
                    if isinstance(invoice.data, dict):
                        invoice_number = invoice.data.get('invoice_number', 'N/A')
                    paid_invoices.append({
                        'id': str(invoice.id),
                        'invoice_number': invoice_number,
                        'status': invoice.status
                    })
                else:
                    invoices_to_delete.append(invoice)

            if paid_invoices:
                return jsonify({
                    'success': False,
                    'error': 'Cannot delete paid invoices',
                    'paid_invoices': paid_invoices
                }), 400

            # Delete all non-paid invoices
            deleted_count = 0
            deleted_numbers = []

            for invoice in invoices_to_delete:
                invoice_number = 'N/A'
                if isinstance(invoice.data, dict):
                    invoice_number = invoice.data.get('invoice_number', 'N/A')
                deleted_numbers.append(invoice_number)

                db.session.delete(invoice)
                deleted_count += 1

            db.session.commit()

            user_info = f" by user {user_id}" if user_id else ""
            logging.info(f"Bulk deleted {deleted_count} invoices{user_info}: {deleted_numbers}")

            return jsonify({
                'success': True,
                'message': f'Successfully deleted {deleted_count} invoices',
                'deleted_count': deleted_count,
                'deleted_invoices': deleted_numbers
            })

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error bulk deleting invoices: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to delete invoices'}), 500

    @staticmethod
    def get_invoices_paginated():
        """
        GET /api/invoices?user_id=<uuid>&page=<int>&per_page=<int>
                      &sort_by=<field>&sort_order=<asc|desc>&status=<status>
        """
        try:
            # 1. Parse request args
            user_id = request.args.get('user_id')
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 10, type=int)
            sort_by = request.args.get('sort_by', 'created_at')
            sort_order = request.args.get('sort_order', 'desc')
            status_filter = request.args.get('status')

            # 2. Validate user_id (required)
            if not user_id:
                return jsonify({'success': False, 'error': 'user_id is required'}), 400
            if not InvoiceOperations.validate_uuid(user_id):
                return jsonify({'success': False, 'error': 'Invalid user ID format'}), 400

            # 3. Base query for this user
            query = Invoice.query.filter_by(user_id=user_id)

            # 4. Optional status filter
            if status_filter:
                if not InvoiceOperations.validate_status(status_filter):
                    return jsonify({'success': False, 'error': 'Invalid status filter'}), 400
                query = query.filter(Invoice.status == status_filter.lower())

            # 5. Sorting
            allowed_sort_fields = {'created_at', 'updated_at', 'status', 'invoice_number'}
            if sort_by not in allowed_sort_fields:
                sort_by = 'created_at'  # fallback

            if sort_by == 'invoice_number':
                # Extract invoice_number from JSON data column.
                # Uses JSON path: data->>'invoice_number' (PostgreSQL) or JSON_EXTRACT (MySQL)
                # Adjust to your DB dialect if needed. This works for PostgreSQL and SQLite with JSON1.
                order_column = Invoice.data['invoice_number'].astext
            else:
                order_column = getattr(Invoice, sort_by)

            if sort_order.lower() == 'asc':
                query = query.order_by(asc(order_column))
            else:
                query = query.order_by(desc(order_column))

            # 6. Paginate
            paginated = query.paginate(page=page, per_page=per_page, error_out=False)

            # 7. Build response data
            invoices_data = []
            for inv in paginated.items:
                # Convert invoice to dict (using your existing method if available)
                # Otherwise manually build:
                inv_dict = {
                    'id': str(inv.id),
                    'user_id': str(inv.user_id),
                    'status': inv.status,
                    'created_at': inv.created_at.isoformat() if hasattr(inv, 'created_at') and inv.created_at else None,
                    'updated_at': inv.updated_at.isoformat() if hasattr(inv, 'updated_at') and inv.updated_at else None,
                    'data': inv.data,   # includes invoice_number, items, totals, etc.
                }
                invoices_data.append(inv_dict)

            return jsonify({
                'success': True,
                'data': invoices_data,
                'pagination': {
                    'page': paginated.page,
                    'per_page': paginated.per_page,
                    'total_items': paginated.total,
                    'total_pages': paginated.pages,
                    'has_prev': paginated.has_prev,
                    'has_next': paginated.has_next,
                }
            })

        except Exception as e:
            logging.error(f"Error fetching paginated invoices: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to fetch invoices'}), 500    

    @staticmethod
    def get_invoice_statistics(user_id):
        """Get invoice statistics for a user"""
        try:
            if not InvoiceOperations.validate_uuid(user_id):
                return jsonify({'success': False, 'error': 'Invalid user ID format'}), 400

            # Get all invoices for the user
            invoices = Invoice.query.filter_by(user_id=user_id).all()

            # Calculate statistics
            stats = {
                'total_invoices': len(invoices),
                'draft': 0,
                'sent': 0,
                'paid': 0,
                'overdue': 0,
                'cancelled': 0,
                'total_amount': 0.0,
                'paid_amount': 0.0,
                'outstanding_amount': 0.0
            }

            for invoice in invoices:
                # Count by status
                status = invoice.status.lower()
                if status in stats:
                    stats[status] += 1

                # Calculate amounts based on your existing data structure
                try:
                    amount = 0.0
                    if isinstance(invoice.data, dict):
                        # Try to get total from data, fallback to calculating from items
                        amount = float(invoice.data.get('total', 0))
                        if amount == 0 and 'items' in invoice.data:
                            # Calculate from items like in your parse_invoice_data function
                            items = invoice.data.get('items', [])
                            subtotal = sum(
                                float(item.get('quantity', 0)) * float(item.get('unit_cost', 0))
                                for item in items
                            )

                            # Add tax, shipping, subtract discount (simplified)
                            tax_amount = float(invoice.data.get('tax_amount', 0))
                            shipping_amount = float(invoice.data.get('shipping_amount', 0))
                            discount_amount = float(invoice.data.get('discount_amount', 0))

                            amount = subtotal + tax_amount + shipping_amount - discount_amount

                    stats['total_amount'] += amount

                    if status == 'paid':
                        stats['paid_amount'] += amount
                    elif status in ['sent', 'overdue']:
                        stats['outstanding_amount'] += amount

                except (ValueError, TypeError, KeyError):
                    continue

            return jsonify({
                'success': True,
                'statistics': stats
            })

        except Exception as e:
            logging.error(f"Error getting invoice statistics for user {user_id}: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to get invoice statistics'}), 500