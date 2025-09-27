# routes/dashboard.py
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
import os
import requests
from datetime import datetime

load_dotenv()

dashboard_bp = Blueprint('dashboard', __name__)
API_KEY = os.getenv("CURRENCY_FREAKS")


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


def get_total_revenue(invoices, target_currency):
    """
    Calculate total revenue with strict currency conversion
    No fallbacks - will raise exception if conversion fails
    """
    # Normalize target currency
    target_currency = normalize_currency(target_currency)

    # If target is USD, use simple calculation
    if target_currency == 'USD':
        total = 0
        for invoice in invoices:
            if hasattr(invoice, 'data'):
                invoice_data = invoice.data
            else:
                invoice_data = invoice.get('data', {})
            amount = calculate_invoice_total(invoice_data)
            total += amount
        return round(total, 2)

    # For non-USD currencies, require API key and successful conversion
    if not API_KEY:
        raise Exception("Currency conversion requires API key")

    # Get exchange rates
    response = requests.get(
        "https://api.currencyfreaks.com/v2.0/rates/latest",
        params={'apikey': API_KEY, 'base': 'USD'},
        timeout=10
    )
    response.raise_for_status()
    rates_data = response.json()
    rates = rates_data.get('rates', {})

    # Ensure USD is in rates
    rates['USD'] = 1.0

    # Check if target currency is supported
    if target_currency not in rates:
        raise Exception(f"Currency {target_currency} not supported")

    total = 0

    for invoice in invoices:
        # Get invoice data and amount
        if hasattr(invoice, 'data'):
            invoice_data = invoice.data
        else:
            invoice_data = invoice.get('data', {})

        amount = calculate_invoice_total(invoice_data)
        if amount == 0:
            continue

        # Get invoice currency
        currency = 'USD'
        if isinstance(invoice_data, dict):
            currency = invoice_data.get('currency', 'USD')
        currency = normalize_currency(currency)

        # Convert to target currency
        if currency == target_currency:
            total += amount
        else:
            # Convert via USD
            # First: from invoice currency to USD
            if currency not in rates:
                raise Exception(f"Invoice currency {currency} not supported for conversion")

            if rates[currency] == 0:
                raise Exception(f"Zero exchange rate for currency {currency}")

            usd_amount = amount / float(rates[currency])

            # Second: from USD to target currency
            target_amount = usd_amount * float(rates[target_currency])
            total += target_amount

    return round(total, 2)


@dashboard_bp.route('/api/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    """
    Combined endpoint for all dashboard metrics
    """
    try:
        user_id = request.args.get('user_id')
        target_currency = request.args.get('currency', 'USD')

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

        # Calculate metrics
        paid_invoices = [inv for inv in invoices if inv.status == 'paid']
        unpaid_invoices = [inv for inv in invoices if inv.status in ['sent', 'in progress', 'overdue']]
        draft_invoices = [inv for inv in invoices if inv.status == 'draft']
        overdue_invoices = [inv for inv in invoices if inv.status == 'overdue']

        # Calculate totals using the strict function
        total_revenue = get_total_revenue(paid_invoices, target_currency)
        total_outstanding = get_total_revenue(unpaid_invoices, target_currency)

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
            'total_revenue': total_revenue,
            'total_outstanding': total_outstanding,
            'total_invoices': len(invoices),
            'paid_invoices': len(paid_invoices),
            'unpaid_invoices': len(unpaid_invoices),
            'draft_invoices': len(draft_invoices),
            'overdue_invoices': len(overdue_invoices),
            'unique_clients': len(unique_clients),
            'currency': target_currency,
            'invoices': invoices_data
        })

    except Exception as e:
        print(f"Error in dashboard summary: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@dashboard_bp.route('/api/dashboard/revenue', methods=['GET'])
def get_dashboard_revenue():
    """
    Individual endpoint for revenue only
    """
    try:
        user_id = request.args.get('user_id')
        target_currency = request.args.get('currency', 'USD')

        if not user_id:
            return jsonify({'success': False, 'error': 'User ID is required'}), 400

        from models import Invoice, User

        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        invoices = Invoice.query.filter_by(user_id=user_id).all()
        paid_invoices = [inv for inv in invoices if inv.status == 'paid']

        total_revenue = get_total_revenue(paid_invoices, target_currency)

        return jsonify({
            'success': True,
            'total_revenue': total_revenue,
            'currency': target_currency,
            'paid_invoices_count': len(paid_invoices)
        })

    except Exception as e:
        print(f"Error in revenue endpoint: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@dashboard_bp.route('/api/dashboard/outstanding', methods=['GET'])
def get_outstanding_receivables():
    """
    Individual endpoint for outstanding receivables only
    """
    try:
        user_id = request.args.get('user_id')
        target_currency = request.args.get('currency', 'USD')

        if not user_id:
            return jsonify({'success': False, 'error': 'User ID is required'}), 400

        from models import Invoice, User

        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        invoices = Invoice.query.filter_by(user_id=user_id).all()
        unpaid_invoices = [inv for inv in invoices if inv.status in ['sent', 'in progress', 'overdue']]

        total_outstanding = get_total_revenue(unpaid_invoices, target_currency)

        return jsonify({
            'success': True,
            'total_outstanding': total_outstanding,
            'unpaid_invoices_count': len(unpaid_invoices),
            'currency': target_currency
        })

    except Exception as e:
        print(f"Error in outstanding endpoint: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@dashboard_bp.route('/api/dashboard/currencies', methods=['GET'])
def get_supported_currencies():
    """
    Get list of supported currencies from CurrencyFreaks
    """
    try:
        if not API_KEY:
            # Without API key, only allow USD
            return jsonify({
                'success': True,
                'currencies': ['USD']
            })

        response = requests.get(
            "https://api.currencyfreaks.com/v2.0/rates/latest",
            params={'apikey': API_KEY},
            timeout=10
        )
        response.raise_for_status()
        rates_data = response.json()
        rates = rates_data.get('rates', {})

        currencies = list(rates.keys())
        # Ensure USD is included
        if 'USD' not in currencies:
            currencies.append('USD')

        currencies.sort()

        return jsonify({
            'success': True,
            'currencies': currencies
        })
    except Exception as e:
        print(f"Error fetching currencies: {e}")
        # Without API access, only allow USD
        return jsonify({
            'success': True,
            'currencies': ['USD']
        })