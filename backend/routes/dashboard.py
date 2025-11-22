# routes/dashboard.py
from flask import Blueprint, request, jsonify
from datetime import datetime

dashboard_bp = Blueprint('dashboard', __name__)


def normalize_currency(currency):
    """Normalize currency codes"""
    if not currency:
        return 'USD'

    currency = str(currency).upper().strip()

    # Common currency symbols to codes
    currency_map = {
        '$': 'USD', 'US$': 'USD', 'USD$': 'USD',
        '€': 'EUR', 'EURO': 'EUR',
        '£': 'GBP', 'GB£': 'GBP',
        '¥': 'JPY', 'JP¥': 'JPY',
        '₦': 'NGN', 'NG₦': 'NGN',
        'CAD$': 'CAD', 'CA$': 'CAD',
        'AUD$': 'AUD', 'AU$': 'AUD'
    }

    return currency_map.get(currency, currency)


def calculate_invoice_total(invoice_data):
    """Calculate total amount from invoice data"""
    if not isinstance(invoice_data, dict):
        return 0.0

    try:
        # First try to get the total directly
        total = invoice_data.get('total')
        if total is not None:
            try:
                total_float = float(total)
                if total_float > 0:
                    return total_float
            except (ValueError, TypeError):
                pass

        # Calculate from items if total is not available or invalid
        items = invoice_data.get('items', [])
        if not isinstance(items, list):
            return 0.0

        subtotal = 0.0
        for item in items:
            if not isinstance(item, dict):
                continue

            try:
                quantity = float(item.get('quantity', 0)) or 0
                unit_cost = float(item.get('unit_cost', 0)) or 0
                subtotal += quantity * unit_cost
            except (ValueError, TypeError):
                continue

        # Apply tax if enabled
        if invoice_data.get('show_tax', False):
            try:
                tax_percent = float(invoice_data.get('tax_percent', 0)) or 0
                tax_type = invoice_data.get('tax_type', 'percent')
                if tax_type == 'percent':
                    tax_amount = subtotal * (tax_percent / 100)
                else:
                    tax_amount = tax_percent
                subtotal += tax_amount
            except (ValueError, TypeError):
                pass

        # Apply discount if enabled
        if invoice_data.get('show_discount', False):
            try:
                discount_percent = float(invoice_data.get('discount_percent', 0)) or 0
                discount_type = invoice_data.get('discount_type', 'percent')
                if discount_type == 'percent':
                    discount_amount = subtotal * (discount_percent / 100)
                else:
                    discount_amount = discount_percent
                subtotal -= discount_amount
            except (ValueError, TypeError):
                pass

        # Apply shipping if enabled
        if invoice_data.get('show_shipping', False):
            try:
                shipping_amount = float(invoice_data.get('shipping_amount', 0)) or 0
                subtotal += shipping_amount
            except (ValueError, TypeError):
                pass

        return max(0.0, round(subtotal, 2))

    except (ValueError, TypeError) as e:
        print(f"Error calculating invoice total: {e}")
        return 0.0


def calculate_currency_metrics(invoices):
    """
    Calculate metrics grouped by currency
    Returns a dictionary with currency-specific metrics
    """
    currency_data = {}

    for invoice in invoices:
        # Get invoice data
        if hasattr(invoice, 'data'):
            invoice_data = invoice.data
        else:
            invoice_data = invoice.get('data', {})

        # Get currency and amount
        currency = normalize_currency(invoice_data.get('currency', 'USD') if isinstance(invoice_data, dict) else 'USD')
        amount = calculate_invoice_total(invoice_data)

        # Initialize currency data if not exists
        if currency not in currency_data:
            currency_data[currency] = {
                'total_revenue': 0.0,
                'total_outstanding': 0.0,
                'total_invoices': 0,
                'paid_invoices': 0,
                'unpaid_invoices': 0,
                'draft_invoices': 0,
                'overdue_invoices': 0
            }

        # Update metrics based on status
        currency_data[currency]['total_invoices'] += 1

        status = invoice.status if hasattr(invoice, 'status') else invoice.get('status', '')

        if status == 'paid':
            currency_data[currency]['total_revenue'] += amount
            currency_data[currency]['paid_invoices'] += 1
        elif status in ['sent', 'in progress', 'overdue']:
            currency_data[currency]['total_outstanding'] += amount
            currency_data[currency]['unpaid_invoices'] += 1
        elif status == 'draft':
            currency_data[currency]['draft_invoices'] += 1

        if status == 'overdue':
            currency_data[currency]['overdue_invoices'] += 1

    # Round all currency totals
    for currency in currency_data:
        currency_data[currency]['total_revenue'] = round(currency_data[currency]['total_revenue'], 2)
        currency_data[currency]['total_outstanding'] = round(currency_data[currency]['total_outstanding'], 2)

    return currency_data


@dashboard_bp.route('/api/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    """
    Combined endpoint for all dashboard metrics
    """
    try:
        user_id = request.args.get('user_id')

        if not user_id:
            return jsonify({'success': False, 'error': 'User ID is required'}), 400

        # Import here to avoid circular imports
        from models import Invoice, User

        # Check if user exists
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        # Get all invoices for the user
        invoices = Invoice.query.filter_by(user_id=user_id).all()

        # Calculate overall metrics
        paid_invoices = [inv for inv in invoices if inv.status == 'paid']
        unpaid_invoices = [inv for inv in invoices if inv.status in ['sent', 'in progress', 'overdue']]
        draft_invoices = [inv for inv in invoices if inv.status == 'draft']
        overdue_invoices = [inv for inv in invoices if inv.status == 'overdue']

        # Calculate currency-specific metrics
        currency_metrics = calculate_currency_metrics(invoices)

        # Get unique clients
        unique_clients = set()
        for invoice in invoices:
            if invoice.client_id:
                unique_clients.add(str(invoice.client_id))
            elif isinstance(invoice.data, dict):
                client_name = invoice.data.get('to', '')
                if client_name and client_name != 'None' and client_name.strip():
                    unique_clients.add(client_name)

        # Prepare invoice data for frontend
        invoices_data = []
        for inv in invoices:
            try:
                # Calculate total for each invoice
                invoice_total = calculate_invoice_total(inv.data) if inv.data else 0.0

                # Get currency from invoice data
                invoice_currency = 'USD'
                if isinstance(inv.data, dict):
                    invoice_currency = normalize_currency(inv.data.get('currency', 'USD'))

                invoice_data = {
                    'id': str(inv.id),
                    'user_id': str(inv.user_id),
                    'client_id': str(inv.client_id) if inv.client_id else None,
                    'data': inv.data,
                    'status': inv.status,
                    'issued_date': inv.issued_date.isoformat() if inv.issued_date else None,
                    'due_date': inv.due_date.isoformat() if inv.due_date else None,
                    'created_at': inv.created_at.isoformat() if inv.created_at else None,
                    'total_amount': invoice_total,
                    'currency': invoice_currency
                }
                invoices_data.append(invoice_data)
            except Exception as e:
                print(f"Error processing invoice {inv.id}: {e}")
                continue

        return jsonify({
            'success': True,
            'total_invoices': len(invoices),
            'paid_invoices': len(paid_invoices),
            'unpaid_invoices': len(unpaid_invoices),
            'draft_invoices': len(draft_invoices),
            'overdue_invoices': len(overdue_invoices),
            'unique_clients': len(unique_clients),
            'currency_metrics': currency_metrics,
            'invoices': invoices_data
        })

    except Exception as e:
        print(f"Error in dashboard summary: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500