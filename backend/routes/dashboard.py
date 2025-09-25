# routes/dashboard.py or similar file
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
import os
import requests

load_dotenv()

dashboard_bp = Blueprint('dashboard', __name__)
API_KEY = os.getenv("CURRENCY_FREAKS")


def get_total_revenue(invoices, target_currency):
    """
    Calculate total revenue with currency conversion
    """
    try:
        # Get rates once
        response = requests.get(
            "https://api.currencyfreaks.com/v2.0/rates/latest",
            params={'apikey': API_KEY}
        )
        response.raise_for_status()
        rates = response.json()['rates']

        total = 0

        for invoice in invoices:
            amount = invoice.get('amount', 0)
            currency = invoice.get('currency', 'USD')

            if currency == target_currency:
                total += amount
            else:
                # Convert via USD
                # Step 1: Convert to USD
                usd_amount = amount / float(rates[currency])
                # Step 2: Convert USD to target currency
                target_amount = usd_amount * float(rates[target_currency])
                total += target_amount

        return round(total, 2)
    except Exception as e:
        print(f"Error in currency conversion: {e}")
        # Fallback: simple sum without conversion
        return round(sum(invoice.get('amount', 0) for invoice in invoices), 2)


@dashboard_bp.route('/api/dashboard/revenue', methods=['GET'])
def get_dashboard_revenue():
    """
    API endpoint to get total revenue with currency conversion
    """
    try:
        user_id = request.args.get('user_id')
        target_currency = request.args.get('currency', 'USD')

        if not user_id:
            return jsonify({'success': False, 'error': 'User ID is required'}), 400

        # Fetch user's invoices from your database
        # Replace this with your actual database query
        from your_database_module import get_invoices_by_user_id
        invoices = get_invoices_by_user_id(user_id)

        # Transform invoices to the expected format
        formatted_invoices = []
        for invoice in invoices:
            # Adjust this based on your invoice structure
            formatted_invoices.append({
                'amount': invoice.get('total_amount', 0),
                'currency': invoice.get('currency', 'USD')
            })

        total_revenue = get_total_revenue(formatted_invoices, target_currency)

        return jsonify({
            'success': True,
            'total_revenue': total_revenue,
            'currency': target_currency,
            'converted_currency': target_currency
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# routes/dashboard.py
@dashboard_bp.route('/api/dashboard/outstanding', methods=['GET'])
def get_outstanding_receivables():
    """
    API endpoint to get outstanding receivables with currency conversion
    """
    try:
        user_id = request.args.get('user_id')
        target_currency = request.args.get('currency', 'USD')

        if not user_id:
            return jsonify({'success': False, 'error': 'User ID is required'}), 400

        # Fetch user's invoices from your database
        from your_database_module import get_invoices_by_user_id
        invoices = get_invoices_by_user_id(user_id)

        # Filter unpaid invoices (sent, in progress, overdue, etc.)
        unpaid_invoices = [
            invoice for invoice in invoices
            if invoice.get('status') in ['sent', 'in progress', 'overdue']
        ]

        # Transform invoices to the expected format
        formatted_invoices = []
        for invoice in unpaid_invoices:
            formatted_invoices.append({
                'amount': invoice.get('total_amount', 0),
                'currency': invoice.get('currency', 'USD')
            })

        total_outstanding = get_total_revenue(formatted_invoices, target_currency)

        return jsonify({
            'success': True,
            'total_outstanding': total_outstanding,
            'unpaid_invoices_count': len(unpaid_invoices),
            'currency': target_currency,
            'converted_currency': target_currency
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


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

        # Fetch user's invoices
        from your_database_module import get_invoices_by_user_id
        invoices = get_invoices_by_user_id(user_id)

        # Calculate metrics
        paid_invoices = [inv for inv in invoices if inv.get('status') == 'paid']
        unpaid_invoices = [inv for inv in invoices if inv.get('status') in ['sent', 'in progress', 'overdue']]
        draft_invoices = [inv for inv in invoices if inv.get('status') == 'draft']
        overdue_invoices = [inv for inv in invoices if inv.get('status') == 'overdue']

        # Calculate totals
        revenue_invoices = [{'amount': inv.get('total_amount', 0), 'currency': inv.get('currency', 'USD')} for inv in
                            paid_invoices]
        outstanding_invoices = [{'amount': inv.get('total_amount', 0), 'currency': inv.get('currency', 'USD')} for inv
                                in unpaid_invoices]

        total_revenue = get_total_revenue(revenue_invoices, target_currency)
        total_outstanding = get_total_revenue(outstanding_invoices, target_currency)

        # Get unique clients
        unique_clients = set()
        for invoice in invoices:
            client_name = invoice.get('client_name') or invoice.get('to')
            if client_name and client_name != 'None' and client_name.strip():
                unique_clients.add(client_name)

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
            'currency': target_currency
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Register the blueprint in your main app
# from routes.dashboard import dashboard_bp
# app.register_blueprint(dashboard_bp)