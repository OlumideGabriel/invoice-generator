import os
import hmac
import hashlib
import requests
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy.orm.attributes import flag_modified
from db import db
from datetime import datetime


paystack_bp = Blueprint('paystack', __name__)

PAYSTACK_SECRET_KEY = os.getenv('PAYSTACK_SECRET_KEY')
PAYSTACK_BASE = 'https://api.paystack.co'
ENVOYCE_SPLIT_PERCENT = 2
BREVO_API_KEY = os.getenv('BREVO_API_KEY')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://envoyce.xyz')


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


def _notify_from_invoice(invoice, tx_amount_kobo: int, payer_email: str):
    from models import User, Business

    inv_data       = invoice.data or {}
    currency_sym   = inv_data.get('currency_symbol', '₦')
    invoice_number = inv_data.get('invoice_number', str(invoice.id)[:8])
    amount         = tx_amount_kobo / 100

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
    total_ngn   = max(0, subtotal - discount + tax + shipping)
    amount_kobo = int(round(total_ngn * 100))

    invoice_number = invoice_data.get('invoice_number', str(invoice_id)[:8])
    business_name  = invoice_data.get('from', '').split('\n')[0] or 'Business'

    callback_url = f"{FRONTEND_URL}/pay/{invoice_id}"

    payload = {
        'email':        payer_email,
        'amount':       amount_kobo,
        'currency':     'NGN',
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
        'amount':            total_ngn,
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
        inv_data['paystack_amount']    = tx['amount'] / 100
        inv_data['payer_email']        = payer_email
        invoice.data = inv_data
        flag_modified(invoice, 'data')
        db.session.commit()
        current_app.logger.info(f"[verify] Committed status=paid for invoice {invoice_id}")
    else:
        current_app.logger.info(f"[verify] Invoice already paid, skipping write")

    _notify_from_invoice(invoice, tx['amount'], payer_email)

    return jsonify({
        'success':    True,
        'message':    'Payment verified and invoice marked as paid',
        'invoice_id': invoice_id,
        'amount':     tx['amount'] / 100,
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
        tx         = event['data']
        invoice_id = tx.get('metadata', {}).get('invoice_id')

        if invoice_id:
            invoice = Invoice.query.filter_by(id=invoice_id).first()

            if invoice and invoice.status != 'paid':
                invoice.status                 = 'paid'
                inv_data                       = invoice.data or {}
                inv_data['paid_at']            = datetime.utcnow().isoformat()
                inv_data['paystack_reference'] = tx.get('reference')
                inv_data['paystack_amount']    = tx.get('amount', 0) / 100
                inv_data['payer_email']        = tx.get('customer', {}).get('email', '')
                invoice.data = inv_data
                flag_modified(invoice, 'data')
                db.session.commit()

                _notify_from_invoice(
                    invoice,
                    tx.get('amount', 0),
                    tx.get('customer', {}).get('email', ''),
                )

    elif event_type == 'subaccount.approved':
        subaccount_code = event['data'].get('subaccount_code')
        current_app.logger.info(f"[webhook] subaccount.approved → {subaccount_code}")

        if subaccount_code:
            # Update User data (idempotent, won't break if already true)
            users = User.query.all()
            for user in users:
                user_data   = user.data or {}
                subaccounts = user_data.get('paystack_subaccounts', [])
                matched     = False

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
                    current_app.logger.info(
                        f"[webhook] Updated is_verified on user {user.id}"
                    )
                    break

            # Update Business record (idempotent)
            biz = Business.query.filter_by(
                paystack_subaccount_code=subaccount_code
            ).first()
            if biz:
                biz.is_verified = True
                biz.updated_at  = datetime.utcnow()
                db.session.commit()
                current_app.logger.info(
                    f"[webhook] Updated is_verified on business {biz.id}"
                )
            else:
                current_app.logger.warning(
                    f"[webhook] No Business found for subaccount_code={subaccount_code}"
                )

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