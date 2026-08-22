import os
import hmac
import hashlib
import requests
import uuid
from flask import Blueprint, request, jsonify, current_app
from functools import wraps
from sqlalchemy.orm.attributes import flag_modified
from db import db
from datetime import datetime, timedelta
from models import User, Invoice, Business, SubscriptionPlan, UserSubscription, BillingTransaction


paystack_bp = Blueprint('paystack', __name__)

PAYSTACK_SECRET_KEY = os.getenv('PAYSTACK_SECRET_KEY')
PAYSTACK_BASE = 'https://api.paystack.co'
ENVOYCE_SPLIT_PERCENT = 2
BREVO_API_KEY = os.getenv('BREVO_API_KEY')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://envoyce.xyz')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')


def supabase_jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing token'}), 401

        token = auth_header.split(' ')[1]

        # Verify with Supabase
        res = requests.get(
            f'{SUPABASE_URL}/auth/v1/user',
            headers={
                'Authorization': f'Bearer {token}',
                'apikey': SUPABASE_ANON_KEY
            },
            timeout=10
        )

        if res.status_code != 200:
            return jsonify({'error': 'Invalid or expired token'}), 401

        request.supabase_user_id = res.json().get('id')
        return f(*args, **kwargs)

    return decorated


def paystack_headers():
    return {
        'Authorization': f'Bearer {PAYSTACK_SECRET_KEY}',
        'Content-Type': 'application/json',
    }
# ─── Email notification helper ────────────────────────────────────────────────

def _send_payment_notification(
    *,
    to_email: str,
    to_name: str,
    business_name: str,
    invoice_number: str,
    amount: float,
    currency_symbol: str,
    payer_email: str,
    invoice_id: str,
):
    if not to_email:
        return

    try:
        amount_fmt   = f"{currency_symbol}{amount:,.2f}"
        invoice_url  = f"{FRONTEND_URL}/invoice/{invoice_id}"

        subject = f"💰 Payment received — Invoice #{invoice_number}"

        html_content = f"""
        <div style="font-family:'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif;
                    max-width:520px;margin:0 auto;padding:32px 24px;color:#111827;">

          <div style="margin-bottom:24px;">
            <span style="font-size:13px;font-weight:700;color:#0f766e;
                         letter-spacing:0.05em;">envoyce</span>
          </div>

          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;
                      padding:20px 24px;margin-bottom:24px;text-align:center;">
            <div style="font-size:32px;margin-bottom:4px;">💰</div>
            <div style="font-size:22px;font-weight:800;color:#14532d;">
              Payment Received
            </div>
            <div style="font-size:13px;color:#166534;margin-top:4px;">
              Invoice #{invoice_number}
            </div>
          </div>

          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151;">
            Hi <strong>{business_name}</strong>,<br>
            A payment has just been confirmed for one of your invoices.
          </p>

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;
                        font-size:13px;">
            <tr style="border-bottom:1px solid #e5e7eb;">
              <td style="padding:10px 0;color:#6b7280;">Invoice</td>
              <td style="padding:10px 0;text-align:right;font-weight:600;
                         color:#111827;">#{invoice_number}</td>
            </tr>
            <tr style="border-bottom:1px solid #e5e7eb;">
              <td style="padding:10px 0;color:#6b7280;">Amount paid</td>
              <td style="padding:10px 0;text-align:right;font-weight:700;
                         color:#14532d;font-size:16px;">{amount_fmt}</td>
            </tr>
            <tr style="border-bottom:1px solid #e5e7eb;">
              <td style="padding:10px 0;color:#6b7280;">Paid by</td>
              <td style="padding:10px 0;text-align:right;color:#111827;">
                {payer_email}
              </td>
            </tr>
          </table>

          <a href="{invoice_url}"
             style="display:block;text-align:center;background:#111827;color:#fff;
                    text-decoration:none;padding:13px 20px;border-radius:10px;
                    font-weight:700;font-size:14px;margin-bottom:24px;">
            View Invoice →
          </a>

          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
            The invoice has been automatically marked as paid.<br>
            Paystack will settle the funds per your settlement schedule.
          </p>
        </div>
        """

        payload = {
            "sender": {
                "name":  "envoyce",
                "email": "support@envoyce.xyz"
            },
            "to": [{"email": to_email, "name": to_name}],
            "subject": subject,
            "htmlContent": html_content,
        }

        res = requests.post(
            'https://api.brevo.com/v3/smtp/email',
            headers={
                'accept':       'application/json',
                'content-type': 'application/json',
                'api-key':      BREVO_API_KEY,
            },
            json=payload,
            timeout=10,
        )

        if res.status_code != 201:
            current_app.logger.warning(
                f"[paystack] Brevo notification failed ({res.status_code}): {res.text}"
            )

    except Exception as exc:
        current_app.logger.error(
            f"[paystack] _send_payment_notification error → {exc}"
        )


def _notify_from_invoice(invoice, tx_amount_smallest: int, payer_email: str, currency: str = 'NGN'):
    from models import User, Business

    inv_data       = invoice.data or {}
    currency_sym   = inv_data.get('currency_symbol', '₦')
    invoice_number = inv_data.get('invoice_number', str(invoice.id)[:8])
    # tx_amount_smallest is in the currency's smallest unit (e.g. kobo, cents)
    divisor = 1 if (currency or 'NGN').upper() == 'JPY' else 100
    amount         = tx_amount_smallest / divisor

    business_name = inv_data.get('from', '').split('\n')[0] or 'there'

    to_email = None
    to_name  = business_name

    if invoice.business_id:
        biz = db.session.query(Business).filter_by(id=invoice.business_id).first()
        if biz and biz.email:
            to_email = biz.email
            to_name  = biz.name or business_name

    if not to_email:
        owner = db.session.query(User).filter_by(id=invoice.user_id).first()
        if owner and owner.email:
            to_email = owner.email
            to_name  = (
                f"{owner.first_name or ''} {owner.last_name or ''}".strip()
                or business_name
            )

    if not to_email:
        current_app.logger.warning(
            f"[paystack] No notification email found for invoice {invoice.id}"
        )
        return

    _send_payment_notification(
        to_email=to_email,
        to_name=to_name,
        business_name=business_name,
        invoice_number=invoice_number,
        amount=amount,
        currency_symbol=currency_sym,
        payer_email=payer_email or 'your client',
        invoice_id=str(invoice.id),
    )


# ─── 1. Verify bank account ───────────────────────────────────────────────────

@paystack_bp.route('/api/paystack/verify-account', methods=['POST'])
def verify_account():
    data           = request.get_json()
    account_number = data.get('account_number')
    bank_code      = data.get('bank_code')

    if not account_number or not bank_code:
        return jsonify({'success': False, 'error': 'account_number and bank_code required'}), 400

    res    = requests.get(
        f'{PAYSTACK_BASE}/bank/resolve',
        params={'account_number': account_number, 'bank_code': bank_code},
        headers=paystack_headers(),
    )
    result = res.json()
    if result.get('status'):
        return jsonify({
            'success':        True,
            'account_name':   result['data']['account_name'],
            'account_number': result['data']['account_number'],
        })
    return jsonify({'success': False, 'error': result.get('message', 'Could not verify account')}), 400


# ─── 2. Get list of banks ─────────────────────────────────────────────────────

@paystack_bp.route('/api/paystack/banks', methods=['GET'])
def get_banks():
    res    = requests.get(
        f'{PAYSTACK_BASE}/bank?currency=NGN&perPage=100',
        headers=paystack_headers(),
    )
    result = res.json()
    if result.get('status'):
        banks = [{'name': b['name'], 'code': b['code']} for b in result['data']]
        return jsonify({'success': True, 'banks': banks})
    return jsonify({'success': False, 'error': 'Could not fetch banks'}), 400


# ─── 3. Create subaccount ─────────────────────────────────────────────────────

@paystack_bp.route('/api/paystack/create-subaccount', methods=['POST'])
def create_subaccount():
    from models import User, Business
    data = request.get_json()

    user_id        = data.get('user_id')
    business_name  = data.get('business_name')
    account_number = data.get('account_number')
    bank_code      = data.get('bank_code')
    account_name   = data.get('account_name')
    business_id    = data.get('business_id')

    if not all([user_id, business_name, account_number, bank_code]):
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400

    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    user_data = user.data or {}
    existing  = user_data.get('paystack_subaccounts', [])

    if any(s.get('account_number') == account_number for s in existing):
        return jsonify({'success': False, 'error': 'This account number is already connected'}), 400

    res = requests.post(
        f'{PAYSTACK_BASE}/subaccount',
        headers=paystack_headers(),
        json={
            'business_name':     business_name,
            'settlement_bank':   bank_code,
            'account_number':    account_number,
            'percentage_charge': ENVOYCE_SPLIT_PERCENT,
            'description':       f'Envoyce subaccount for {business_name}',
        },
    )
    result = res.json()
    if not result.get('status'):
        return jsonify({'success': False, 'error': result.get('message', 'Failed to create subaccount')}), 400

    subaccount_code = result['data']['subaccount_code']

    new_entry = {
        'subaccount_code': subaccount_code,
        'account_number':  account_number,
        'bank_code':       bank_code,
        'account_name':    account_name or business_name,
        'business_name':   business_name,
        'created_at':      datetime.utcnow().isoformat(),
        'is_verified':     True,  # Mark as verified immediately
    }
    existing.append(new_entry)
    user_data['paystack_subaccounts'] = existing

    if len(existing) == 1:
        user_data['paystack_subaccount_code'] = subaccount_code
        user_data['paystack_account_number']  = account_number
        user_data['paystack_bank_code']       = bank_code
        user_data['paystack_account_name']    = account_name or business_name
        user_data['paystack_business_name']   = business_name
        user_data['paystack_setup_at']        = datetime.utcnow().isoformat()

    user.data = user_data
    flag_modified(user, 'data')
    if hasattr(user, 'updated_at'):
        user.updated_at = datetime.utcnow()
    db.session.commit()

    # ─── Set is_verified = TRUE on Business record immediately ───
    if business_id:
        biz = Business.query.filter_by(id=business_id).first()
        if biz:
            biz.paystack_subaccount_code = subaccount_code
            biz.is_verified = True  # ← FIX: Immediately mark as verified
            biz.updated_at = datetime.utcnow()
            db.session.commit()
            current_app.logger.info(
                f"[create_subaccount] Set is_verified=True for business {business_id}"
            )

    return jsonify({
        'success':         True,
        'subaccount_code': subaccount_code,
        'message':         'Payment account set up successfully',
    })


# ─── 4. Subaccount status ─────────────────────────────────────────────────────

@paystack_bp.route('/api/paystack/subaccount-status', methods=['GET'])
def subaccount_status():
    from models import User, Business
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'user_id required'}), 400

    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    user_data = user.data or {}
    stored    = user_data.get('paystack_subaccounts', [])

    # Migrate legacy single-account users
    if 'paystack_subaccounts' not in user_data and user_data.get('paystack_subaccount_code'):
        stored = [{
            'subaccount_code': user_data['paystack_subaccount_code'],
            'account_number':  user_data.get('paystack_account_number'),
            'bank_code':       user_data.get('paystack_bank_code'),
            'account_name':    user_data.get('paystack_account_name'),
            'business_name':   user_data.get('paystack_business_name'),
            'created_at':      user_data.get('paystack_setup_at'),
            'is_verified':     True,
        }]
        user_data['paystack_subaccounts'] = stored
        user.data = user_data
        flag_modified(user, 'data')
        db.session.commit()

    if not stored:
        return jsonify({'success': True, 'has_subaccount': False, 'subaccounts': []})

    paystack_lookup    = {}
    paystack_available = True

    for entry in stored:
        code = entry.get('subaccount_code')
        if not code:
            continue
        try:
            res    = requests.get(
                f'{PAYSTACK_BASE}/subaccount/{code}',
                headers=paystack_headers(),
                timeout=10,
            )
            result = res.json()
            if res.status_code == 200 and result.get('status'):
                paystack_lookup[code] = result['data']
            elif res.status_code == 404:
                pass
            else:
                paystack_available = False
        except Exception:
            paystack_available = False

    subaccounts = []
    pruned      = False

    for entry in stored:
        code = entry.get('subaccount_code')
        if not code:
            pruned = True
            continue

        if not paystack_available:
            subaccounts.append({
                'subaccount_code': code,
                'id':              None,
                'business_name':   entry.get('business_name'),
                'bank_name':       entry.get('bank_name'),
                'bank_code':       entry.get('bank_code'),
                'account_name':    entry.get('account_name'),
                'account_number':  entry.get('account_number'),
                'is_verified':     entry.get('is_verified', True),  # Default to True from stored
                'active':          False,
                'created_at':      entry.get('created_at'),
                'updated_at':      None,
                '_source':         'stored_fallback',
            })
            continue

        d = paystack_lookup.get(code)
        if d:
            biz = Business.query.filter_by(paystack_subaccount_code=code).first()
            # Prefer is_verified from business record if available
            db_verified = biz.is_verified if (biz and biz.is_verified is not None) else None
            resolved_verified = db_verified if db_verified is not None else entry.get('is_verified', True)

            subaccounts.append({
                'subaccount_code':   d.get('subaccount_code', code),
                'id':                d.get('id'),
                'business_name':     d.get('business_name') or entry.get('business_name'),
                'bank_name':         d.get('settlement_bank') or entry.get('bank_name'),
                'bank_code':         entry.get('bank_code'),
                'account_name':      d.get('account_name') or entry.get('account_name'),
                'account_number':    d.get('account_number') or entry.get('account_number'),
                'percentage_charge': d.get('percentage_charge'),
                'currency':          d.get('currency', 'NGN'),
                'is_verified':       resolved_verified,
                'active':            bool(d.get('active', False)),
                'created_at':        d.get('createdAt') or entry.get('created_at'),
                'updated_at':        d.get('updatedAt'),
            })
        else:
            pruned = True

    if pruned:
        surviving_codes = {s['subaccount_code'] for s in subaccounts}
        clean = [e for e in stored if e.get('subaccount_code') in surviving_codes]
        user_data['paystack_subaccounts'] = clean

        if clean:
            first = clean[0]
            user_data['paystack_subaccount_code'] = first['subaccount_code']
            user_data['paystack_account_number']  = first.get('account_number')
            user_data['paystack_bank_code']       = first.get('bank_code')
            user_data['paystack_account_name']    = first.get('account_name')
            user_data['paystack_business_name']   = first.get('business_name')
        else:
            for key in ['paystack_subaccount_code', 'paystack_account_number',
                        'paystack_bank_code', 'paystack_account_name',
                        'paystack_business_name', 'paystack_setup_at']:
                user_data.pop(key, None)

        user.data = user_data
        flag_modified(user, 'data')
        if hasattr(user, 'updated_at'):
            user.updated_at = datetime.utcnow()
        db.session.commit()

    return jsonify({
        'success':        True,
        'has_subaccount': len(subaccounts) > 0,
        'subaccounts':    subaccounts,
    })


# ─── 5. Initialize payment ────────────────────────────────────────────────────

@paystack_bp.route('/api/paystack/initialize', methods=['POST']) 
def initialize_payment():
    from models import Invoice, User
    data = request.get_json()

    invoice_id  = data.get('invoice_id')
    payer_email = data.get('email')

    if not invoice_id or not payer_email:
        return jsonify({'success': False, 'error': 'invoice_id and email required'}), 400

    invoice = Invoice.query.filter_by(id=invoice_id).first()
    if not invoice:
        return jsonify({'success': False, 'error': 'Invoice not found'}), 404
    if invoice.status == 'paid':
        return jsonify({'success': False, 'error': 'Invoice already paid'}), 400

    owner = User.query.filter_by(id=invoice.user_id).first()
    if not owner:
        return jsonify({'success': False, 'error': 'Invoice owner not found'}), 404

    owner_data      = owner.data or {}
    subaccounts     = owner_data.get('paystack_subaccounts', [])
    subaccount_code = (
        subaccounts[0].get('subaccount_code') if subaccounts
        else owner_data.get('paystack_subaccount_code')
    )

    invoice_data = invoice.data or {}
    items        = invoice_data.get('items', [])
    subtotal     = sum(i.get('quantity', 0) * i.get('unit_cost', 0) for i in items)

    discount = 0
    if invoice_data.get('show_discount') and invoice_data.get('discount_percent'):
        if invoice_data.get('discount_type') == 'percent':
            discount = (subtotal * invoice_data['discount_percent']) / 100
        else:
            discount = invoice_data['discount_percent']

    tax = 0
    if invoice_data.get('show_tax') and invoice_data.get('tax_percent'):
        base = subtotal - discount
        if invoice_data.get('tax_type') == 'percent':
            tax = (base * invoice_data['tax_percent']) / 100
        else:
            tax = invoice_data['tax_percent']

    shipping    = invoice_data.get('shipping_amount', 0) if invoice_data.get('show_shipping') else 0
    total_amount = max(0, subtotal - discount + tax + shipping)

    # Determine currency (prefer invoice.currency column, fallback to invoice.data)
    currency_code = (invoice.currency or invoice_data.get('currency') or 'NGN').upper()
    # Paystack expects amount in smallest unit (kobo/cents); JPY has no subunit
    divisor = 1 if currency_code == 'JPY' else 100
    amount_smallest = int(round(total_amount * divisor))

    invoice_number = invoice_data.get('invoice_number', str(invoice_id)[:8])
    business_name  = invoice_data.get('from', '').split('\n')[0] or 'Business'

    callback_url = f"{FRONTEND_URL}/pay/{invoice_id}"

    payload = {
        'email':        payer_email,
        'amount':       amount_smallest,
        'currency':     currency_code,
        'reference':    f'envoyce-{invoice_id}-{int(datetime.utcnow().timestamp())}',
        'callback_url': callback_url,
        'metadata': {
            'invoice_id':     str(invoice_id),
            'invoice_number': invoice_number,
            'business_name':  business_name,
            'cancel_action':  f"{FRONTEND_URL}/pay/{invoice_id}",
        },
    }

    if subaccount_code:
        payload['subaccount'] = subaccount_code
        payload['bearer'] = 'account'

    res    = requests.post(
        f'{PAYSTACK_BASE}/transaction/initialize',
        headers=paystack_headers(),
        json=payload,
    )
    result = res.json()
    if not result.get('status'):
        return jsonify({'success': False, 'error': result.get('message', 'Failed to initialize payment')}), 400

    return jsonify({
        'success':           True,
        'authorization_url': result['data']['authorization_url'],
        'reference':         result['data']['reference'],
        'access_code':       result['data']['access_code'],
        'amount':            total_amount,
        'currency':          currency_code,
        'has_split':         bool(subaccount_code),
    })


# ─── 6. Verify payment ────────────────────────────────────────────────────────

@paystack_bp.route('/api/paystack/verify/<reference>', methods=['GET'])
def verify_payment(reference):
    from models import Invoice

    current_app.logger.info(f"[verify] Called with reference={reference}")

    res = requests.get(
        f'{PAYSTACK_BASE}/transaction/verify/{reference}',
        headers=paystack_headers(),
    )
    result = res.json()

    current_app.logger.info(f"[verify] Paystack response status={result.get('status')}")

    if not result.get('status'):
        return jsonify({'success': False, 'error': 'Could not verify payment'}), 400

    tx = result['data']

    current_app.logger.info(f"[verify] TX status={tx['status']}, invoice_id={tx.get('metadata', {}).get('invoice_id')}")

    # Determine divisor for smallest unit normalization
    tx_currency = (tx.get('currency') or 'NGN').upper()
    divisor = 1 if tx_currency == 'JPY' else 100

    if tx['status'] != 'success':
        return jsonify({'success': False, 'error': f"Payment status: {tx['status']}"}), 400

    invoice_id = tx.get('metadata', {}).get('invoice_id')
    invoice = Invoice.query.filter_by(id=invoice_id).first()

    current_app.logger.info(f"[verify] Invoice found={invoice is not None}, current_status={invoice.status if invoice else 'N/A'}")

    if not invoice:
        return jsonify({'success': False, 'error': 'Invoice not found'}), 404

    payer_email = tx.get('customer', {}).get('email', '')

    already_paid = invoice.status == 'paid'

    if not already_paid:
        invoice.status = 'paid'
        inv_data = dict(invoice.data or {})
        inv_data['paid_at']            = datetime.utcnow().isoformat()
        inv_data['paystack_reference'] = reference
        # normalize amount according to currency (Paystack reports amount in smallest unit)
        tx_currency = (tx.get('currency') or 'NGN').upper()
        divisor = 1 if tx_currency == 'JPY' else 100
        inv_data['paystack_amount']    = tx['amount'] / divisor
        inv_data['payer_email']        = payer_email
        invoice.data = inv_data
        flag_modified(invoice, 'data')
        db.session.commit()
        current_app.logger.info(f"[verify] Committed status=paid for invoice {invoice_id}")
    else:
        current_app.logger.info(f"[verify] Invoice already paid, skipping write")

    _notify_from_invoice(invoice, tx['amount'], payer_email, currency=tx.get('currency', 'NGN'))

    return jsonify({
        'success':    True,
        'message':    'Payment verified and invoice marked as paid',
        'invoice_id': invoice_id,
        'amount':     tx['amount'] / divisor,
        'currency':   tx_currency,
        'reference':  reference,
    })


# ─── 7. Webhook ───────────────────────────────────────────────────────────────

@paystack_bp.route('/api/paystack/webhook', methods=['POST'])
def webhook():
    from models import Invoice, User, Business

    signature = request.headers.get('x-paystack-signature', '')
    body      = request.get_data()
    expected  = hmac.new(
        PAYSTACK_SECRET_KEY.encode('utf-8'),
        body,
        hashlib.sha512,
    ).hexdigest()

    if not hmac.compare_digest(signature, expected):
        return jsonify({'error': 'Invalid signature'}), 401

    event      = request.get_json()
    event_type = event.get('event')

    if event_type == 'charge.success':
        tx = event['data']
        metadata = tx.get('metadata', {})
        
        # Check if this is a subscription payment
        if metadata.get('type') == 'subscription':
            user_id = metadata.get('user_id')
            user = User.query.get(user_id)
            
            if user and user.plan != 'pro':
                # Activate pro plan if not already active
                user.plan = 'pro'
                user.updated_at = datetime.utcnow()
                
                # Get pro plan
                pro_plan = SubscriptionPlan.query.filter_by(name='pro').first()
                
                # Create or update subscription record
                subscription = UserSubscription.query.filter_by(user_id=user_id).first()
                if not subscription and pro_plan:
                    subscription = UserSubscription(
                        id=uuid.uuid4(),
                        user_id=user.id,
                        plan_id=pro_plan.id,
                        status='active',
                        current_period_start=datetime.utcnow(),
                        current_period_end=datetime.utcnow() + timedelta(days=30),
                        cancel_at_period_end=False
                    )
                    db.session.add(subscription)
                elif subscription:
                    # Renew existing subscription
                    subscription.current_period_start = datetime.utcnow()
                    subscription.current_period_end = datetime.utcnow() + timedelta(days=30)
                    subscription.status = 'active'
                    subscription.updated_at = datetime.utcnow()
                
                # Create transaction record
                transaction = BillingTransaction(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    subscription_id=subscription.id if subscription else None,
                    # normalize subscription amount by currency
                    amount=float(tx['amount']) / (1 if (tx.get('currency') or 'NGN').upper() == 'JPY' else 100),
                    currency=tx['currency'],
                    status='success',
                    description='Pro Plan - Monthly Subscription',
                    paystack_reference=tx.get('reference'),
                    paystack_transaction_id=str(tx.get('id'))
                )
                db.session.add(transaction)
                db.session.commit()
                current_app.logger.info(f"Subscription activated for user {user_id}")
        
        else:
            # Regular invoice payment
            invoice_id = metadata.get('invoice_id')
            if invoice_id:
                try:
                    invoice = Invoice.query.filter_by(id=invoice_id).first()
                    if not invoice:
                        current_app.logger.warning(f"[webhook] charge.success: invoice {invoice_id} not found")
                    else:
                        inv_data = dict(invoice.data or {})

                        # Normalize amount according to currency
                        tx_currency = (tx.get('currency') or 'NGN').upper()
                        divisor = 1 if tx_currency == 'JPY' else 100
                        paystack_amount = tx.get('amount', 0)  # amount in smallest unit
                        normalized_amount = paystack_amount / divisor

                        payer_email = tx.get('customer', {}).get('email', '')

                        if invoice.status != 'paid':
                            invoice.status = 'paid'
                            inv_data['paid_at'] = datetime.utcnow().isoformat()
                            inv_data['paystack_reference'] = tx.get('reference')
                            inv_data['paystack_amount'] = normalized_amount
                            inv_data['payer_email'] = payer_email
                            invoice.data = inv_data
                            flag_modified(invoice, 'data')
                            db.session.commit()
                            current_app.logger.info(f"[webhook] Marked invoice {invoice_id} as paid (webhook)")
                        else:
                            current_app.logger.info(f"[webhook] Invoice {invoice_id} already marked paid")

                        # Notify business/owner
                        _notify_from_invoice(
                            invoice,
                            paystack_amount,
                            payer_email,
                            currency=tx.get('currency', 'NGN'),
                        )

                        # If payout already initiated or if transaction used subaccount split, skip payout initiation
                        if inv_data.get('payout_initiated'):
                            current_app.logger.info(f"[webhook] Payout already initiated for invoice {invoice_id}")
                            return

                        if tx.get('subaccount'):
                            current_app.logger.info(f"[webhook] Transaction for invoice {invoice_id} used subaccount split; skipping payout initiation")
                            # mark as payout not required
                            inv_data['payout_initiated'] = True
                            invoice.data = inv_data
                            flag_modified(invoice, 'data')
                            db.session.commit()
                            return

                        # Resolve recipient account details (prefer business record)
                        recipient_name = None
                        account_number = None
                        bank_code = None
                        biz = None
                        if invoice.business_id:
                            biz = Business.query.filter_by(id=invoice.business_id).first()
                        if biz:
                            recipient_name = biz.name or getattr(biz, 'business_name', None) or inv_data.get('from', '').split('\n')[0]
                            account_number = getattr(biz, 'paystack_account_number', None) or (biz.data or {}).get('paystack_account_number')
                            bank_code = getattr(biz, 'paystack_bank_code', None) or (biz.data or {}).get('paystack_bank_code')

                        # Fallback to invoice owner user data
                        owner = None
                        if not account_number or not bank_code:
                            owner = User.query.filter_by(id=invoice.user_id).first()
                            if owner:
                                owner_data = owner.data or {}
                                account_number = account_number or owner_data.get('paystack_account_number')
                                bank_code = bank_code or owner_data.get('paystack_bank_code')
                                recipient_name = recipient_name or f"{owner.first_name or ''} {owner.last_name or ''}".strip() or recipient_name

                        if not account_number or not bank_code:
                            current_app.logger.info(f"[webhook] No payout bank details for invoice {invoice_id}; skipping payout")
                            # mark as payout not available
                            inv_data['payout_initiated'] = False
                            invoice.data = inv_data
                            flag_modified(invoice, 'data')
                            db.session.commit()
                            return

                        # Create transfer recipient if missing
                        recipient_code = None
                        try:
                            if biz:
                                biz_data = biz.data or {}
                                recipient_code = biz_data.get('paystack_transfer_recipient_code')
                            else:
                                owner_data = owner.data or {}
                                recipient_code = owner_data.get('paystack_transfer_recipient_code')

                            if not recipient_code:
                                r_payload = {
                                    'type': 'nuban',
                                    'name': recipient_name or 'Merchant',
                                    'account_number': account_number,
                                    'bank_code': bank_code,
                                    'currency': tx_currency,
                                }
                                r_res = requests.post(
                                    f'{PAYSTACK_BASE}/transferrecipient',
                                    headers=paystack_headers(),
                                    json=r_payload,
                                    timeout=10,
                                )
                                r_json = r_res.json()
                                if r_res.status_code == 201 and r_json.get('status'):
                                    recipient_code = r_json['data']['recipient_code']
                                    # Persist recipient code
                                    if biz:
                                        bd = biz.data or {}
                                        bd['paystack_transfer_recipient_code'] = recipient_code
                                        biz.data = bd
                                        flag_modified(biz, 'data')
                                        biz.updated_at = datetime.utcnow()
                                        db.session.commit()
                                    else:
                                        od = owner.data or {}
                                        od['paystack_transfer_recipient_code'] = recipient_code
                                        owner.data = od
                                        flag_modified(owner, 'data')
                                        owner.updated_at = datetime.utcnow()
                                        db.session.commit()
                                else:
                                    current_app.logger.warning(f"[paystack] Failed to create transfer recipient: {r_res.status_code} {r_res.text}")
                        except Exception as exc:
                            current_app.logger.error(f"[paystack] create recipient error: {exc}")

                        if not recipient_code:
                            current_app.logger.info(f"[webhook] No transfer recipient code for invoice {invoice_id}; skipping transfer")
                            inv_data['payout_initiated'] = False
                            invoice.data = inv_data
                            flag_modified(invoice, 'data')
                            db.session.commit()
                            return

                        # Initiate transfer from platform balance to recipient
                        try:
                            t_payload = {
                                'source': 'balance',
                                'amount': int(paystack_amount),
                                'recipient': recipient_code,
                                'reason': f'Payout for invoice {invoice_id}',
                                'currency': tx_currency,
                            }
                            t_res = requests.post(
                                f'{PAYSTACK_BASE}/transfer',
                                headers=paystack_headers(),
                                json=t_payload,
                                timeout=10,
                            )
                            t_json = t_res.json()
                            if t_res.status_code in (200, 201) and t_json.get('status'):
                                tr = t_json['data']
                                inv_data['payout_initiated'] = True
                                inv_data['payout'] = {
                                    'recipient': recipient_code,
                                    'transfer_code': tr.get('transfer_code'),
                                    'transfer_id': tr.get('id'),
                                    'transfer_status': tr.get('status'),
                                    'initiated_at': datetime.utcnow().isoformat(),
                                }
                                invoice.data = inv_data
                                flag_modified(invoice, 'data')
                                db.session.commit()
                                current_app.logger.info(f"[webhook] Transfer initiated for invoice {invoice_id}: {tr.get('transfer_code')}")
                            else:
                                current_app.logger.warning(f"[paystack] Transfer failed: {t_res.status_code} {t_res.text}")
                                inv_data['payout_initiated'] = False
                                invoice.data = inv_data
                                flag_modified(invoice, 'data')
                                db.session.commit()
                        except Exception as exc:
                            current_app.logger.error(f"[paystack] transfer error: {exc}")
                            inv_data['payout_initiated'] = False
                            invoice.data = inv_data
                            flag_modified(invoice, 'data')
                            db.session.commit()

                except Exception as exc:
                    current_app.logger.error(f"[webhook] Error handling invoice payout for {invoice_id}: {exc}")

    elif event_type == 'subaccount.approved':
        subaccount_code = event['data'].get('subaccount_code')
        current_app.logger.info(f"[webhook] subaccount.approved → {subaccount_code}")

        if subaccount_code:
            # Update User data (idempotent, won't break if already true)
            users = User.query.all()
            for user in users:
                user_data = user.data or {}
                subaccounts = user_data.get('paystack_subaccounts', [])
                matched = False

                for entry in subaccounts:
                    if entry.get('subaccount_code') == subaccount_code:
                        entry['is_verified'] = True
                        matched = True
                        break

                if matched:
                    user.data = user_data
                    flag_modified(user, 'data')
                    if hasattr(user, 'updated_at'):
                        user.updated_at = datetime.utcnow()
                    db.session.commit()
                    current_app.logger.info(f"[webhook] Updated is_verified on user {user.id}")
                    break

            # Update Business record (idempotent)
            biz = Business.query.filter_by(paystack_subaccount_code=subaccount_code).first()
            if biz:
                biz.is_verified = True
                biz.updated_at = datetime.utcnow()
                db.session.commit()
                current_app.logger.info(f"[webhook] Updated is_verified on business {biz.id}")
            else:
                current_app.logger.warning(f"[webhook] No Business found for subaccount_code={subaccount_code}")

    return jsonify({'status': 'ok'}), 200


# ─── 8. Remove subaccount ─────────────────────────────────────────────────────

@paystack_bp.route('/api/paystack/remove-subaccount', methods=['POST'])
def remove_subaccount():
    from models import User, Business
    data            = request.get_json()
    user_id         = data.get('user_id')
    subaccount_code = data.get('subaccount_code')

    if not user_id or not subaccount_code:
        return jsonify({'success': False, 'error': 'user_id and subaccount_code required'}), 400

    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    user_data   = user.data or {}
    subaccounts = user_data.get('paystack_subaccounts', [])
    updated     = [s for s in subaccounts if s.get('subaccount_code') != subaccount_code]
    user_data['paystack_subaccounts'] = updated

    try:
        requests.put(
            f'{PAYSTACK_BASE}/subaccount/{subaccount_code}',
            headers=paystack_headers(),
            json={'active': False},
            timeout=8,
        )
    except Exception:
        pass

    if updated:
        first = updated[0]
        user_data['paystack_subaccount_code'] = first['subaccount_code']
        user_data['paystack_account_number']  = first.get('account_number')
        user_data['paystack_bank_code']       = first.get('bank_code')
        user_data['paystack_account_name']    = first.get('account_name')
        user_data['paystack_business_name']   = first.get('business_name')
    else:
        for key in ['paystack_subaccount_code', 'paystack_account_number',
                    'paystack_bank_code', 'paystack_account_name',
                    'paystack_business_name', 'paystack_setup_at']:
            user_data.pop(key, None)

    user.data = user_data
    flag_modified(user, 'data')
    if hasattr(user, 'updated_at'):
        user.updated_at = datetime.utcnow()
    db.session.commit()

    biz = Business.query.filter_by(
        user_id=user_id,
        paystack_subaccount_code=subaccount_code
    ).first()
    if biz:
        biz.paystack_subaccount_code = None
        biz.is_verified = False
        biz.updated_at = datetime.utcnow()
        db.session.commit()

    return jsonify({'success': True, 'message': 'Subaccount removed'})


# ─── 9. Debug (remove before production) ─────────────────────────────────────

@paystack_bp.route('/api/paystack/debug-user', methods=['GET'])
def debug_user():
    from models import User
    user_id = request.args.get('user_id')
    user    = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'user_id':   user.id,
        'data_keys': list((user.data or {}).keys()),
        'raw_data':  user.data,
    })

# ─── 10. Initialize subscription (Pro plan signup) ───────────────────────────
@paystack_bp.route('/api/paystack/subscription/initialize', methods=['POST'])
@supabase_jwt_required 
def initialize_subscription():
    """Initialize Paystack subscription for Pro plan"""
    try:
        current_user_id = request.supabase_user_id  # ← was get_jwt_identity()
        data = request.get_json()
        user_id = data.get('user_id')
        
        if str(current_user_id) != str(user_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.plan == 'pro':
            return jsonify({'error': 'Already on Pro plan'}), 400
        
        # Get Pro plan details
        pro_plan = SubscriptionPlan.query.filter_by(name='pro', is_active=True).first()
        if not pro_plan:
            # Create default pro plan if not exists
            pro_plan = SubscriptionPlan(
                id=uuid.uuid4(),
                name='pro',
                price=2999,  # 29.99 in kobo
                currency='NGN',
                features={
                    'businesses': 'unlimited',
                    'invoices': 'unlimited',
                    'support': 'priority'
                },
                is_active=True
            )
            db.session.add(pro_plan)
            db.session.commit()
        
        # Initialize Paystack transaction
        amount_kobo = int(float(pro_plan.price) * 100)
        callback_url = f"{FRONTEND_URL}/settings?section=billing"
        
        payload = {
            'email': user.email,
            'amount': amount_kobo,
            'currency': 'NGN',
            'reference': f'subscription-{user_id}-{int(datetime.utcnow().timestamp())}',
            'callback_url': callback_url,
            'metadata': {
                'type': 'subscription',
                'user_id': str(user_id),
                'plan': 'pro'
            }
        }
        
        res = requests.post(
            f'{PAYSTACK_BASE}/transaction/initialize',
            headers=paystack_headers(),
            json=payload,
            timeout=10
        )
        result = res.json()
        
        if not result.get('status'):
            return jsonify({'error': result.get('message', 'Failed to initialize')}), 400
        
        return jsonify({
            'success': True,
            'authorization_url': result['data']['authorization_url'],
            'reference': result['data']['reference']
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Subscription init error: {str(e)}")
        return jsonify({'error': 'Failed to initialize subscription'}), 500


# ─── 11. Verify subscription payment ──────────────────────────────────────────
@paystack_bp.route('/api/paystack/subscription/verify/<reference>', methods=['GET'])
def verify_subscription(reference):
    """Verify subscription payment and activate Pro plan"""
    try:
        # Verify transaction
        res = requests.get(
            f'{PAYSTACK_BASE}/transaction/verify/{reference}',
            headers=paystack_headers(),
            timeout=10
        )
        result = res.json()
        
        if not result.get('status') or result['data']['status'] != 'success':
            return jsonify({'error': 'Payment verification failed'}), 400
        
        tx = result['data']
        metadata = tx.get('metadata', {})
        
        if metadata.get('type') != 'subscription':
            return jsonify({'error': 'Invalid transaction type'}), 400
        
        user_id = metadata.get('user_id')
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if already pro
        if user.plan == 'pro':
            return jsonify({'message': 'Already on Pro plan', 'plan': 'pro'}), 200
        
        # Get pro plan
        pro_plan = SubscriptionPlan.query.filter_by(name='pro').first()
        if not pro_plan:
            return jsonify({'error': 'Plan not found'}), 404
        
        # Create subscription record
        subscription = UserSubscription(
            id=uuid.uuid4(),
            user_id=user.id,
            plan_id=pro_plan.id,
            paystack_subscription_code=reference,
            status='active',
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow() + timedelta(days=30),
            cancel_at_period_end=False
        )
        
        # Create billing transaction record
        transaction = BillingTransaction(
            id=uuid.uuid4(),
            user_id=user.id,
            subscription_id=subscription.id,
            amount=float(tx['amount']) / 100,
            currency=tx['currency'],
            status='success',
            description='Pro Plan - Monthly Subscription',
            paystack_reference=reference,
            paystack_transaction_id=str(tx['id'])
        )
        
        # Update user plan
        user.plan = 'pro'
        user.updated_at = datetime.utcnow()
        
        db.session.add(subscription)
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Successfully upgraded to Pro plan',
            'plan': 'pro'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Subscription verify error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to verify subscription'}), 500


# ─── 12. Cancel subscription ──────────────────────────────────────────────────
@paystack_bp.route('/api/paystack/subscription/cancel', methods=['POST'])
@supabase_jwt_required 
def cancel_subscription():
    """Cancel user's subscription (will expire at period end)"""
    try:
        current_user_id = request.supabase_user_id  # ← was get_jwt_identity()
        data = request.get_json()
        user_id = data.get('user_id')
        
        if str(current_user_id) != str(user_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.plan != 'pro':
            return jsonify({'error': 'Not on Pro plan'}), 400
        
        subscription = UserSubscription.query.filter_by(
            user_id=user_id, 
            status='active'
        ).first()
        
        if subscription:
            subscription.cancel_at_period_end = True
            subscription.updated_at = datetime.utcnow()
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Subscription will be cancelled at period end',
            'cancel_at_period_end': True
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Cancel subscription error: {str(e)}")
        return jsonify({'error': 'Failed to cancel subscription'}), 500


# ─── 13. Get subscription details ─────────────────────────────────────────────
@paystack_bp.route('/api/paystack/subscription/status', methods=['GET'])
@supabase_jwt_required 
def get_subscription_status():
    """Get user's current subscription details"""
    try:
        current_user_id = request.supabase_user_id  # ← was get_jwt_identity()
        user_id = request.args.get('user_id')
        
        if str(current_user_id) != str(user_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        subscription = UserSubscription.query.filter_by(
            user_id=user_id,
            status='active'
        ).first()
        
        billing_transactions = BillingTransaction.query.filter_by(
            user_id=user_id,
            status='success'
        ).order_by(BillingTransaction.created_at.desc()).limit(10).all()
        
        transactions_data = []
        for tx in billing_transactions:
            transactions_data.append({
                'id': str(tx.id),
                'date': tx.created_at.isoformat(),
                'amount': float(tx.amount),
                'currency': tx.currency,
                'description': tx.description,
                'status': tx.status
            })
        
        subscription_data = {
            'plan': user.plan,
            'status': 'active' if user.plan == 'pro' else 'free',
            'current_period_start': subscription.current_period_start.isoformat() if subscription else None,
            'current_period_end': subscription.current_period_end.isoformat() if subscription else None,
            'cancel_at_period_end': subscription.cancel_at_period_end if subscription else False
        }
        
        return jsonify({
            'success': True,
            'subscription': subscription_data,
            'transactions': transactions_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get subscription error: {str(e)}")
        return jsonify({'error': 'Failed to get subscription details'}), 500