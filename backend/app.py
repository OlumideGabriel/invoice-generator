from flask import Flask, render_template, request, jsonify, make_response, send_file
import requests
import json
from flask_migrate import Migrate
from flask_cors import CORS
from weasyprint import HTML
import tempfile
import ssl
import certifi
from dotenv import load_dotenv
import os
import logging
from datetime import datetime
from io import BytesIO
from werkzeug.security import generate_password_hash, check_password_hash
from db import db
from sqlalchemy import text
from clients import Clients
from invoices import InvoiceOperations
import jwt
import uuid
from functools import lru_cache
from supabase import create_client, Client
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
load_dotenv()
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DATABASE_URL = os.environ.get("DATABASE_URL")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")


supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL'
)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
from models import User, Client, Invoice

# Initialize Flask-Migrate
migrate = Migrate(app, db)

CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = os.path.abspath('uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# Create tables if they don't exist
with app.app_context():
    try:
        db.create_all()
        print("Database tables created successfully")
    except Exception as e:
        print(f"Error creating database tables: {e}")


@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

@app.after_request
def add_permissions_policy_header(response):
    response.headers['Permissions-Policy'] = 'payment=*'
    return response


@app.route('/upload-logo', methods=['POST'])
def upload_logo():
    if 'logo' not in request.files or request.files['logo'].filename == '':
        return jsonify({'error': 'No logo file provided'}), 400

    logo = request.files['logo']
    file_name = f"{uuid.uuid4()}-{logo.filename}"

    try:
        # Upload the file - this will raise an exception if it fails
        supabase.storage.from_(os.environ['SUPABASE_BUCKET']).upload(
            file_name, logo.read(), {"content-type": logo.content_type}
        )

        # If upload succeeds, generate the public URL
        logo_url = f"{os.environ['SUPABASE_URL']}/storage/v1/object/public/{os.environ['SUPABASE_BUCKET']}/{file_name}"

        return jsonify({'message': 'Logo uploaded successfully', 'logo_url': logo_url}), 200

    except Exception as e:
        print("Exception:", e)
        return jsonify({'error': str(e)}), 500



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
        'logo_url': data.get('logo_url', None),
        'currency': data.get('currency'),
        'currency_symbol': data.get('currency_symbol'),
    }

    return template_data


@app.route('/preview-invoice', methods=['POST'])
def preview_invoice():
    try:
        data = request.get_json()
        app.logger.debug(f"[PREVIEW] Received data: {data}")
        template_data = parse_invoice_data(data)
        html = render_template('invoice_template3.html', **template_data)

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


# @app.route('/generate-invoice', methods=['POST'])
# def generate_invoice():
#     try:
#         data = request.get_json()
#         app.logger.debug(f"[GENERATE] Received data: {data}")
#
#         template_data = parse_invoice_data(data)
#
#         # Render the HTML template with invoice data
#         html = render_template('invoice_template3.html', **template_data)
#
#         # Generate PDF with WeasyPrint
#         pdf = HTML(
#             string=html,
#             base_url=os.path.dirname(os.path.abspath(__file__))
#         ).write_pdf()
#
#         # Send PDF as response
#         response = make_response(pdf)
#         response.headers['Content-Type'] = 'application/pdf'
#         response.headers['Content-Disposition'] = (
#             f'attachment; filename=invoice_{template_data["invoice_number"]}.pdf'
#         )
#         return response
#
#     except Exception as e:
#         logging.exception("Error in generate_invoice")
#         return jsonify({'error': str(e)}), 500

@app.route('/generate-invoice', methods=['POST'])
def generate_invoice():
    temp_files = []  # Store temporary files to clean up later

    try:
        data = request.get_json()
        app.logger.debug(f"[GENERATE] Received data: {data}")

        template_data = parse_invoice_data(data)

        # Download and replace external image URLs with local file paths
        if 'logo_url' in template_data and template_data['logo_url']:
            try:
                logo_path = download_image_for_weasyprint(template_data['logo_url'])
                temp_files.append(logo_path)
                template_data['logo_url'] = logo_path
                app.logger.debug(f"Downloaded logo to: {logo_path}")
            except Exception as e:
                app.logger.warning(f"Failed to download logo: {e}")
                # Keep original URL as fallback

        # Render the HTML template with invoice data
        html = render_template('invoice_template3.html', **template_data)

        # Create SSL context for WeasyPrint
        ssl_context = ssl.create_default_context(cafile=certifi.where())

        # Generate PDF with WeasyPrint using SSL context
        pdf = HTML(
            string=html,
            base_url=os.path.dirname(os.path.abspath(__file__))
        ).write_pdf(ssl_context=ssl_context)

        # Clean up temporary files
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
            except:
                pass

        # Send PDF as response
        response = make_response(pdf)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = (
            f'attachment; filename=invoice_{template_data["invoice_number"]}.pdf'
        )
        return response

    except Exception as e:
        # Clean up temporary files even if error occurs
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
            except:
                pass
        logging.exception("Error in generate_invoice")
        return jsonify({'error': str(e)}), 500


def download_image_for_weasyprint(image_url):
    """Download image from URL and return local file path"""
    try:
        # First try with proper SSL verification
        response = requests.get(image_url, verify=True, timeout=30)
        response.raise_for_status()

    except requests.exceptions.SSLError:
        # If SSL verification fails, try with certifi's certificates
        response = requests.get(image_url, verify=certifi.where(), timeout=30)
        response.raise_for_status()

    except Exception:
        # Final fallback: try without verification (use with caution)
        response = requests.get(image_url, verify=False, timeout=30)
        response.raise_for_status()

    # Create temporary file
    file_extension = os.path.splitext(image_url)[1] or '.png'
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
        tmp_file.write(response.content)
        return tmp_file.name


@app.route('/api/invoices', methods=['GET'])
def get_invoices():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'user_id required'}), 400

    # Add validation for proper UUID format
    try:
        import uuid
        # This will raise ValueError if not a valid UUID
        uuid.UUID(user_id)
    except ValueError:
        return jsonify({'success': False, 'error': 'Invalid UUID format for user_id'}), 400

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
            'status': inv.status,
            'currency': inv.data.get('currency', 'USD') if isinstance(inv.data, dict) else 'USD',
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

    # Validate UUID format
    try:
        import uuid
        uuid.UUID(user_id)
        if client_id:
            uuid.UUID(client_id)
    except ValueError:
        return jsonify({'success': False, 'error': 'Invalid UUID format'}), 400

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


@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    try:
        from sqlalchemy.orm import Session
        session = Session(bind=db.engine)

        # Check if user exists
        user = session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Get all invoices for the user
        invoices = session.query(Invoice).filter_by(user_id=user_id).all()

        # Initialize stats
        stats = {
            'total_revenue': 0.0,
            'pending_amount': 0.0,
            'total_invoices': len(invoices),
            'total_clients': 0,
            'paid_invoices': 0,
            'overdue_invoices': 0,
            'monthly_growth': 0.0
        }

        # Track unique clients
        client_ids = set()

        for invoice in invoices:
            if invoice.client_id:
                client_ids.add(str(invoice.client_id))

            # Get amount from invoice data
            amount = 0.0
            if isinstance(invoice.data, dict):
                try:
                    amount = float(invoice.data.get('amount', 0))
                except (ValueError, TypeError):
                    pass

            # Update stats based on status
            if invoice.status == 'paid':
                stats['total_revenue'] += amount
                stats['paid_invoices'] += 1
            elif invoice.status == 'overdue':
                stats['pending_amount'] += amount
                stats['overdue_invoices'] += 1
            elif invoice.status == 'sent':
                stats['pending_amount'] += amount

        stats['total_clients'] = len(client_ids)

        # Get recent invoices (last 5)
        recent_invoices = []
        for inv in sorted(invoices, key=lambda x: x.created_at, reverse=True)[:5]:
            recent_invoices.append({
                'id': str(inv.id),
                'invoice_number': inv.data.get('invoice_number', '') if isinstance(inv.data, dict) else '',
                'client_name': inv.data.get('to', '') if isinstance(inv.data, dict) else '',
                'client_email': inv.data.get('email', '') if isinstance(inv.data, dict) else '',
                'amount': float(inv.data.get('amount', 0)) if isinstance(inv.data, dict) else 0.0,
                'status': inv.status,
                'created_date': inv.created_at.isoformat() if inv.created_at else None,
                'due_date': inv.due_date.isoformat() if inv.due_date else None,
                'description': ', '.join([item.get('name', '') for item in inv.data.get('items', [])])
                if isinstance(inv.data, dict) and isinstance(inv.data.get('items'), list)
                else ''
            })

        return jsonify({
            'success': True,
            'data': {
                'stats': stats,
                'recent_invoices': recent_invoices
            }
        })

    except Exception as e:
        app.logger.error(f"Error in get_dashboard_data: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to fetch dashboard data',
            'message': str(e)
        }), 500


# Additional helper routes you might need

@app.route('/api/invoices/<uuid:invoice_id>', methods=['GET'])
def get_invoice(invoice_id):
    """Get a specific invoice by ID"""
    try:
        # Get invoice using SQLAlchemy
        invoice = db.session.query(Invoice).filter_by(id=invoice_id).first()
        if not invoice:
            return jsonify({'success': False, 'error': 'Invoice not found'}), 404

        return jsonify({
            'success': True,
            'invoice': {
                'id': str(invoice.id),
                'user_id': str(invoice.user_id),
                'client_id': str(invoice.client_id) if invoice.client_id else None,
                'data': invoice.data,
                'status': invoice.status,
                'created_at': invoice.created_at.isoformat() if invoice.created_at else None,
                'updated_at': invoice.updated_at.isoformat() if hasattr(invoice, 'updated_at') and invoice.updated_at else None,
                'issued_date': invoice.issued_date.isoformat() if invoice.issued_date else None,
                'due_date': invoice.due_date.isoformat() if invoice.due_date else None
            }
        })

    except Exception as e:
        app.logger.error(f"Error getting invoice {invoice_id}: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': 'Failed to get invoice'}), 500



@app.route('/api/invoices/<uuid:invoice_id>/status', methods=['PUT'])
def update_invoice_status(invoice_id):
    """
    Enhanced version of status update with better validation and logging
    PATCH /api/invoices/<invoice_id>/status

    Request body:
    {
        "status": "paid|draft|sent|overdue|cancelled",
        "user_id": "<uuid>" (optional for additional security)
    }
    """
    return InvoiceOperations.update_invoice_status(str(invoice_id))


# Add delete functionality (NEW)
@app.route('/api/invoices/<invoice_id>', methods=['DELETE'])
def delete_invoice(invoice_id):
    """
    DELETE /api/invoices/<invoice_id>?user_id=<uuid>
    OR
    DELETE /api/invoices/<invoice_id>
    with JSON body: {"user_id": "<uuid>"}

    Delete a specific invoice
    """
    return InvoiceOperations.delete_invoice(str(invoice_id))


# Add bulk delete functionality (NEW)
@app.route('/api/invoices/bulk/delete', methods=['POST'])
def bulk_delete_invoices():
    """
    POST /api/invoices/bulk/delete multiple invoices at once

    Request body:
    {
        "invoice_ids": ["uuid1", "uuid2", ...],
        "user_id": "<uuid>" (optional for additional security)
    }
    """
    return InvoiceOperations.bulk_delete_invoices()


# Add invoice statistics (NEW)
@app.route('/api/invoices/statistics/<uuid:user_id>', methods=['GET'])
def get_invoice_statistics(user_id):
    """
    GET /api/invoices/statistics/<user_id>
    Get invoice statistics for a user
    """
    return InvoiceOperations.get_invoice_statistics(str(user_id))


# Add utility route for valid statuses (NEW)
@app.route('/api/invoices/status/valid', methods=['GET'])
def get_valid_invoice_statuses():
    """
    GET /api/invoices/status/valid
    Get list of valid invoice statuses
    """
    return jsonify({
        'success': True,
        'valid_statuses': InvoiceOperations.VALID_STATUSES
    })


# Optional: Update your existing PUT route to use PATCH instead (more RESTful)
# Keep your existing route but you can also add this one
@app.route('/api/invoices/<uuid:invoice_id>/status', methods=['PUT'])
def update_invoice_status_legacy(invoice_id):
    """
    Legacy PUT route for backwards compatibility
    Redirects to the enhanced PATCH version
    """
    return InvoiceOperations.update_invoice_status(str(invoice_id))


@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name')
        last_name = data.get('last_name')

        if not email or not password or not first_name or not last_name:
            return jsonify({
                'success': False,
                'error': 'Email, password, first name, and last name required.'
            }), 400

        from models import User
        existing = User.query.filter_by(email=email).first()
        if existing:
            return jsonify({
                'success': False,
                'error': 'Email already registered.'
            }), 409

        pw_hash = generate_password_hash(password)
        user = User(
            email=email,
            password_hash=pw_hash,
            first_name=first_name,
            last_name=last_name
        )
        db.session.add(user)
        db.session.commit()

        return jsonify({
            'success': True,
            'user': {
                'id': str(user.id),  # This is what your frontend expects as 'user_id'
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'auth_method': 'native'
            }
        })

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Signup error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'An error occurred during signup'
        }), 500


@lru_cache(maxsize=1)
def get_supabase_jwks():
    """Fetch and cache Supabase JWKS keys."""
    jwks_url = f"{SUPABASE_URL}/auth/v1/keys"
    res = requests.get(jwks_url, timeout=5)
    res.raise_for_status()
    return res.json()




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
    return jsonify({'success': True, 'user': {'id': str(user.id), 'email': user.email, 'first_name': user.first_name,
                                              'last_name': user.last_name}})


@app.route('/api/auth/status', methods=['GET'])
def check_auth_status():
    """Check if user is authenticated and return user info"""
    try:
        user_id = request.args.get('user_id')

        if not user_id:
            return jsonify({
                'success': False,
                'error': 'user_id parameter required'
            }), 400

        # Validate UUID format
        try:
            uuid.UUID(user_id)
        except ValueError:
            return jsonify({
                'success': False,
                'error': 'Invalid UUID format for user_id'
            }), 400

        # Check if user exists
        user = User.query.filter_by(id=user_id).first()

        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404

        return jsonify({
            'success': True,
            'user': {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'google_id': user.google_id,
                'auth_method': 'google' if user.google_id else 'native',
                'is_guest': user.is_guest,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        })

    except Exception as e:
        app.logger.error(f"Auth status check error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to check authentication status'
        }), 500


# Add this route to handle user profile updates
@app.route('/api/auth/profile', methods=['PUT'])
def update_profile():
    """Update user profile information"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')

        if not user_id:
            return jsonify({
                'success': False,
                'error': 'user_id required'
            }), 400

        # Validate UUID format
        try:
            uuid.UUID(user_id)
        except ValueError:
            return jsonify({
                'success': False,
                'error': 'Invalid UUID format for user_id'
            }), 400

        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404

        # Update allowed fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        # Note: email updates would require additional verification

        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'user': {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'google_id': user.google_id,
                'auth_method': 'google' if user.google_id else 'native',
                'updated_at': user.updated_at.isoformat()
            }
        })

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Profile update error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to update profile'
        }), 500

# Debug route to check database connection
@app.route('/db-info')
def db_info():
    try:
        # Test database connection using SQLAlchemy
        db.session.execute(text('SELECT 1'))
        db_version = db.session.execute(text('SELECT version()')).scalar()
        return jsonify({
            'status': 'success',
            'database': str(db.engine.url),
            'version': db_version
        })
    except Exception as e:
        app.logger.error(f"Database connection failed: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/clients', methods=['POST'])
def create_client():
    """Create a new client"""
    return Clients.create_client()


@app.route('/api/clients', methods=['GET'])
def get_clients():
    """Get all clients for a user with optional filtering and pagination"""
    return Clients.get_clients()


@app.route('/api/clients/<uuid:client_id>', methods=['GET'])
def get_client(client_id):
    """Get a specific client by ID"""
    return Clients.get_client(str(client_id))


@app.route('/api/clients/<uuid:client_id>', methods=['PUT'])
def update_client(client_id):
    """Update a client"""
    return Clients.update_client(str(client_id))


@app.route('/api/clients/<uuid:client_id>', methods=['DELETE'])
def delete_client(client_id):
    """Delete a client"""
    return Clients.delete_client(str(client_id))


@app.route('/api/clients/<uuid:client_id>/invoices', methods=['GET'])
def get_client_invoices(client_id):
    """Get all invoices for a specific client"""
    return Clients.get_client_invoices(str(client_id))


@app.route('/api/clients/bulk-delete', methods=['DELETE'])
def bulk_delete_clients():
    """Delete multiple clients at once"""
    return Clients.bulk_delete_clients()


@app.route('/', methods=['GET'])
def home():
    """Simple JSON status for debugging"""

    # Check database status
    try:
        db.session.execute(text('SELECT 1'))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    # Get basic stats
    route_count = len([rule for rule in app.url_map.iter_rules()])
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    return jsonify({
        "service": "InvoiceGen Backend API",
        "status": "online",
        "database": db_status,
        "routes": route_count,
        "debug_mode": app.debug,
        "timestamp": current_time
    })


if __name__ == '__main__':
    app.run(port=5000, debug=True)