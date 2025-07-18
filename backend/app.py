from flask import Flask, render_template, request, jsonify, make_response, send_from_directory, send_file
from flask_migrate import Migrate
from flask_cors import CORS
from weasyprint import HTML
import os
from datetime import datetime
import logging
from io import BytesIO
from werkzeug.security import generate_password_hash, check_password_hash

from db import db

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL',
    'postgresql://postgres:123Logocart%3F@localhost/invoicegen'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
from models import User, Client, Invoice
# Initialize Flask-Migrate
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

    # Handle tax (percent or fixed)
    tax_percent = float(data.get('tax_percent', 0) or 0)
    tax_type = data.get('tax_type', 'percent')
    show_tax = data.get('show_tax', False)

    if show_tax:
        if tax_type == 'percent':
            tax_amount = subtotal * (tax_percent / 100)
        else:  # fixed
            tax_amount = tax_percent
    else:
        tax_amount = 0

    # Handle discount (percent or fixed)
    discount_percent = float(data.get('discount_percent', 0) or 0)
    discount_type = data.get('discount_type', 'percent')
    show_discount = data.get('show_discount', False)

    if show_discount:
        if discount_type == 'percent':
            discount_amount = subtotal * (discount_percent / 100)
        else:  # fixed
            discount_amount = discount_percent
    else:
        discount_amount = 0

    # Handle shipping
    shipping_amount = float(data.get('shipping_amount', 0) or 0)
    show_shipping = data.get('show_shipping', False)

    if not show_shipping:
        shipping_amount = 0

    total = subtotal + tax_amount - discount_amount + shipping_amount

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
        'tax_type': tax_type,
        'show_tax': show_tax,
        'discount_percent': discount_percent,
        'discount_amount': discount_amount,
        'discount_type': discount_type,
        'show_discount': show_discount,
        'shipping_amount': shipping_amount,
        'show_shipping': show_shipping,
        'total': total,
        'invoice_number': invoice_number,
        'issued_date': issued_date,
        'due_date': due_date,
        'payment_details': data.get('payment_details', ''),
        'payment_instructions': data.get('payment_instructions', ''),
        'terms': data.get('terms', ''),
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

@app.route('/api/invoices', methods=['GET'])
def get_invoices():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'user_id required'}), 400
    from models import Invoice
    invoices = Invoice.query.filter_by(user_id=user_id).all()
    # You may want to serialize your invoices appropriately:
    result = [
        {
            'id': str(inv.id),
            'user_id': str(inv.user_id),
            'client_id': str(inv.client_id),
            'data': inv.data,
            'issued_date': inv.issued_date,
            'due_date': inv.due_date,
            'status': inv.status
        }
        for inv in invoices
    ]
    return jsonify({'success': True, 'invoices': result})

@app.route('/api/invoices', methods=['POST'])
def save_invoice():
    data = request.get_json()
    user_id = data.get('user_id')
    client_id = data.get('client_id')
    invoice_data = data.get('data')  # All invoice details as JSON
    issued_date = data.get('issued_date')
    due_date = data.get('due_date')
    status = data.get('status', 'draft')

    # Validate required fields
    if not user_id or not invoice_data:
        return jsonify({'success': False, 'error': 'Missing required fields (user_id, data)'}), 400

    invoice = Invoice(
        user_id=user_id,
        client_id=client_id,
        data=invoice_data,
        issued_date=issued_date,
        due_date=due_date,
        status=status
    )
    db.session.add(invoice)
    db.session.commit()
    return jsonify({'success': True, 'invoice_id': str(invoice.id)})


@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        if not email or not password or not first_name or not last_name:
            return jsonify({'success': False, 'error': 'Email, password, first name, and last name required.'}), 400
        from models import User
        existing = User.query.filter_by(email=email).first()
        if existing:
            return jsonify({'success': False, 'error': 'Email already registered.'}), 409
        pw_hash = generate_password_hash(password)
        user = User(email=email, password_hash=pw_hash, first_name=first_name, last_name=last_name)
        db.session.add(user)
        db.session.commit()
        return jsonify({'success': True, 'user': {'id': str(user.id), 'email': user.email, 'first_name': user.first_name, 'last_name': user.last_name}})
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/signin', methods=['POST'])
def signin():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password required.'}), 400
    from models import User
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'success': False, 'error': 'Invalid email or password.'}), 401
    return jsonify({'success': True, 'user': {'id': str(user.id), 'email': user.email, 'first_name': user.first_name, 'last_name': user.last_name}})



if __name__ == '__main__':
    app.run(port=5000, debug=True)