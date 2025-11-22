from flask import Blueprint, request, jsonify
from utils.email_sender import send_invoice

# Create Blueprint for invoice routes
invoice_bp = Blueprint('invoice', __name__)


@invoice_bp.route('/send-invoice', methods=['POST'])
def handle_send_invoice():
    """
    Handle invoice sending request
    """
    data = request.get_json()

    # Validate required data
    if not data:
        return jsonify({
            "success": False,
            "error": "No JSON data provided"
        }), 400

    recipients = data.get('recipients', [])
    message = data.get('message', '')
    attach_pdf = data.get('attachPdf', True)
    invoice_data = data.get('invoiceData', {})
    client_data = data.get('clientData', {})

    # Validate recipients
    if not recipients:
        return jsonify({
            "success": False,
            "error": "No recipients provided"
        }), 400

    # Merge invoice and client data for template
    template_data = {**invoice_data, **client_data}

    # Set PDF URL (you can make this dynamic based on your needs)
    pdf_url = "https://drive.google.com/file/d/1lDbReqwQuV735OQ_hmmlw2Smtgvh-VSY/view?usp=sharing"

    # Use the send_invoice function
    result = send_invoice(
        recipients=recipients,
        template_data=template_data,
        message=message,
        attach_pdf=attach_pdf,
        pdf_url=pdf_url
    )

    # Return appropriate response
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