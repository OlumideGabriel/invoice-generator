from flask import Flask, render_template, request, jsonify, make_response, send_from_directory, send_file
from flask_migrate import Migrate
from flask_cors import CORS
from weasyprint import HTML
import os
from datetime import datetime
import logging
from io import BytesIO

from flask_sqlalchemy import SQLAlchemy

logging.basicConfig(level=logging.DEBUG)

db = SQLAlchemy()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL',
    'postgresql://postgres:123Logocart%3F@localhost/invoicegen'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Import models before initializing Migrate
from models import User, Client, Invoice

migrate = Migrate(app, db)

CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = os.path.abspath('uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.after_request
def add_permissions_policy_header(response):
    response.headers['Permissions-Policy'] = 'payment=*'
    return response

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/upload-logo', methods=['POST'])
def upload_logo():
    if 'logo' not in request.files or request.files['logo'].filename == '':
        return jsonify({'error': 'No logo file provided'}), 400

    logo = request.files['logo']
    logo_path = os.path.join(UPLOAD_FOLDER, logo.filename)
    logo.save(logo_path)

    logo_url = f"http://localhost:5000/uploads/{logo.filename}"
    return jsonify({'message': 'Logo uploaded successfully', 'logo_url': logo_url}), 200

def parse_invoice_data(data):
    if not data:
        raise ValueError("Missing JSON payload.")

    required = {'from', 'to', 'items'}
    missing = required - data.keys()
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    items = data['items']
    subtotal = 0
    items_with_subtotals = []

    for item in items:
        qty = float(item.get('quantity', 0) or 0)
        cost = float(item.get('unit_cost', 0) or 0)
        sub = qty * cost
        item['subtotal'] = sub
        item['description'] = item.get('description', '')
        items_with_subtotals.append(item)
        subtotal += sub

    tax_percent = float(data.get('tax_percent', 0) or 0)
    discount_percent = float(data.get('discount_percent', 0) or 0)

    tax_amount = subtotal * (tax_percent / 100)
    discount_amount = subtotal * (discount_percent / 100)
    total = subtotal + tax_amount - discount_amount

    invoice_number = data.get('invoice_number', f"INV-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    issued_date = data.get('issued_date', datetime.now().strftime('%Y-%m-%d'))
    due_date = data.get('due_date', '')

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
        'invoice_number': invoice_number,
        'issued_date': issued_date,
        'due_date': due_date,
        'payment_details': data.get('payment_details', ''),
        'payment_instructions': data.get('payment_instructions', ''),
        'logo_url': data.get('logo_url', None)
    }

    return template_data

@app.route('/preview-invoice', methods=['POST'])
def preview_invoice():
    try:
        data = request.get_json()
        app.logger.debug(f"[PREVIEW] Received data: {data}")
        template_data = parse_invoice_data(data)
        html = render_template('invoice_template.html', **template_data)

        # Render PDF first
        pdf_io = BytesIO()
        HTML(string=html).write_pdf(pdf_io)
        pdf_io.seek(0)

        # Convert PDF to PNG using pdf2image
        from pdf2image import convert_from_bytes
        images = convert_from_bytes(pdf_io.read())
        img_io = BytesIO()
        images[0].save(img_io, format='PNG')
        img_io.seek(0)

        return send_file(img_io, mimetype='image/png')

    except Exception as e:
        logging.exception("Error in preview_invoice")
        return jsonify({'error': str(e)}), 500

@app.route('/generate-invoice', methods=['POST'])
def generate_invoice():
    try:
        data = request.get_json()
        app.logger.debug(f"[GENERATE] Received data: {data}")
        template_data = parse_invoice_data(data)
        html = render_template('invoice3.html', **template_data)
        pdf = HTML(string=html).write_pdf()

        response = make_response(pdf)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=invoice_{template_data["invoice_number"]}.pdf'
        return response

    except Exception as e:
        logging.exception("Error in generate_invoice")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)