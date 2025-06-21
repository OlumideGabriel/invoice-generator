from flask import Flask, render_template, request, jsonify, make_response
from flask_cors import CORS
from weasyprint import HTML
import os
from datetime import datetime
import logging

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)

# Apply CORS globally to all routes, allow all origins and common methods
CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = os.path.abspath('uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.after_request
def add_permissions_policy_header(response):
    # Allow Payment API in Permissions-Policy header
    response.headers['Permissions-Policy'] = 'payment=*'
    return response

@app.route('/upload-logo', methods=['POST'])
def upload_logo():
    app.logger.debug(f"Headers: {request.headers}")
    app.logger.debug(f"Files: {request.files}")

    if 'logo' not in request.files:
        return jsonify({'error': 'No logo file provided'}), 400

    logo = request.files['logo']
    if logo.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    logo_path = os.path.join(UPLOAD_FOLDER, logo.filename)
    logo.save(logo_path)

    return jsonify({'message': 'Logo uploaded successfully', 'path': logo_path}), 200


@app.route('/generate-invoice', methods=['POST', 'OPTIONS'])
def generate_invoice():
    try:
        if request.method == 'OPTIONS':
            response = jsonify()
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
            response.headers.add('Access-Control-Allow-Methods', 'POST')
            return response

        data = request.get_json()

        # Basic validation
        required_fields = ['from', 'to', 'items']
        if not data or any(field not in data for field in required_fields):
            return jsonify({'error': 'Missing required fields: from, to, items'}), 400

        items = data['items']

        # Calculate subtotal per item and overall subtotal
        subtotal = 0
        items_with_subtotals = []
        for item in items:
            quantity = float(item.get('quantity', 0))
            unit_cost = float(item.get('unit_cost', 0))
            item_subtotal = quantity * unit_cost
            item['subtotal'] = item_subtotal
            # Include description if present (for rendering)
            item_description = item.get('description', '')
            if item_description:
                item['description'] = item_description
            items_with_subtotals.append(item)
            subtotal += item_subtotal

        # Get tax and discount percentages, default to 0 if missing
        tax_percent = float(data.get('tax_percent', 0))
        discount_percent = float(data.get('discount_percent', 0))

        # Calculate tax and discount amounts
        tax_amount = subtotal * (tax_percent / 100)
        discount_amount = subtotal * (discount_percent / 100)

        # Calculate final total
        total = subtotal + tax_amount - discount_amount

        # Prepare template data
        template_data = {
            'date': datetime.now().strftime('%B %d, %Y'),
            'from': data['from'],
            'to': data['to'],
            'items': items_with_subtotals,
            'subtotal': subtotal,
            'tax_percent': tax_percent,
            'tax_amount': tax_amount,
            'discount_percent': discount_percent,
            'discount_amount': discount_amount,
            'total': total,
            'invoice_number': f"INV-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            'payment_details': data.get('payment_details', ''),
            'payment_instructions': data.get('payment_instructions', ''),
            'logo_url': data.get('logo_url', None)
        }

        # Render HTML invoice
        html = render_template('invoice.html', **template_data)

        # Generate PDF
        pdf = HTML(string=html).write_pdf()

        # Build response
        response = make_response(pdf)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=invoice_{template_data["invoice_number"]}.pdf'
        response.headers.add('Access-Control-Allow-Origin', '*')

        return response

    except Exception as e:
        logging.error(f"Error in generate_invoice: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
