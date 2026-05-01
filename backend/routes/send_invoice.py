from flask import Blueprint, request, jsonify
from utils.email_sender import send_invoice

# Create Blueprint for invoice routes
invoice_bp = Blueprint('invoice', __name__)


@invoice_bp.route('/send-invoice', methods=['POST'])
def handle_send_invoice():
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "error": "No JSON data provided"}), 400

    # ✅ Match frontend field names
    email = data.get('email')
    recipients = [email] if email else []
    message = data.get('message', '')
    invoice = data.get('invoice', {})
    client = data.get('client', {})
    business = data.get('business', {})

    if not recipients:
        return jsonify({"success": False, "error": "No recipients provided"}), 400

    # Build template data from all three objects
    template_data = {
        **invoice.get('data', {}),
        **client,
        **business,
        'INVOICE_NUMBER': invoice.get('invoice_number', ''),
    }

    pdf_url = "https://drive.google.com/file/d/1lDbReqwQuV735OQ_hmmlw2Smtgvh-VSY/view?usp=sharing"

    result = send_invoice(
        recipients=recipients,
        template_data=template_data,
        message=message,
        attach_pdf=True,
        pdf_url=pdf_url
    )

    status_code = 200 if result['success'] else 400
    return jsonify(result), status_code

@invoice_bp.route('/send-test-invoice', methods=['POST'])
def send_test_invoice():
    """
    Test endpoint for sending invoice emails
    """
    data = request.get_json() or {}

    test_recipients = data.get('recipients', ['test@example.com'])
    test_template_data = data.get('template_data', {
        'INVOICE_NUMBER': 'TEST-001',
        'COMPANY_NAME': 'Test Company',
        'AMOUNT': '$100.00',
        'DATE': '2023-01-01'
    })

    result = send_invoice(
        recipients=test_recipients,
        template_data=test_template_data,
        message='This is a test invoice email.',
        attach_pdf=data.get('attach_pdf', False)
    )

    status_code = 200 if result['success'] else 400
    return jsonify(result), status_code


@invoice_bp.route('/invoice-health', methods=['GET'])
def invoice_health():
    """
    Health check for invoice routes
    """
    return jsonify({
        "status": "healthy",
        "service": "invoice_email",
        "message": "Invoice routes are working correctly"
    })