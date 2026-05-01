import os
import hmac
import hashlib
import requests
from flask import Blueprint, request, jsonify
from sqlalchemy.orm.attributes import flag_modified
from db import db
from datetime import datetime


paystack_bp = Blueprint('paystack', __name__)

PAYSTACK_SECRET_KEY = os.getenv('PAYSTACK_SECRET_KEY')
PAYSTACK_BASE = 'https://api.paystack.co'
ENVOYCE_SPLIT_PERCENT = 2


def paystack_headers():
    return {
        'Authorization': f'Bearer {PAYSTACK_SECRET_KEY}',
        'Content-Type': 'application/json'
    }


# ─── 1. Verify bank account ───────────────────────────────────────────────────

@paystack_bp.route('/api/paystack/verify-account', methods=['POST'])
def verify_account():
    data = request.get_json()
    account_number = data.get('account_number')
    bank_code      = data.get('bank_code')

    if not account_number or not bank_code:
        return jsonify({'success': False, 'error': 'account_number and bank_code required'}), 400

    res = requests.get(
        f'{PAYSTACK_BASE}/bank/resolve',
        params={'account_number': account_number, 'bank_code': bank_code},
        headers=paystack_headers()
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
    res = requests.get(
        f'{PAYSTACK_BASE}/bank?currency=NGN&perPage=100',
        headers=paystack_headers()
    )
    result = res.json()
    if result.get('status'):
        banks = [{'name': b['name'], 'code': b['code']} for b in result['data']]
        return jsonify({'success': True, 'banks': banks})
    return jsonify({'success': False, 'error': 'Could not fetch banks'}), 400


# ─── 3. Create subaccount ─────────────────────────────────────────────────────

@paystack_bp.route('/api/paystack/create-subaccount', methods=['POST'])
def create_subaccount():
    from models import User
    data = request.get_json()

    user_id        = data.get('user_id')
    business_name  = data.get('business_name')
    account_number = data.get('account_number')
    bank_code      = data.get('bank_code')
    account_name   = data.get('account_name')

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
            'business_name':    business_name,
            'settlement_bank':  bank_code,
            'account_number':   account_number,
            'percentage_charge': ENVOYCE_SPLIT_PERCENT,
            'description':      f'Envoyce subaccount for {business_name}',
        }
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
    }
    existing.append(new_entry)
    user_data['paystack_subaccounts'] = existing

    # Keep legacy single-account keys in sync for backwards compatibility
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

    return jsonify({
        'success':         True,
        'subaccount_code': subaccount_code,
        'message':         'Payment account set up successfully',
    })


# ─── 4. Subaccount status ─────────────────────────────────────────────────────
#
# Uses GET /subaccount (list endpoint) instead of making one request per code.
# The list returns all subaccounts on this Paystack integration, so we:
#   1. Fetch once from Paystack
#   2. Build a lookup by subaccount_code
#   3. Match against our stored codes — any stored code absent from Paystack is pruned
#
# Paystack list response shape per item:
#   id, subaccount_code, business_name, description, settlement_bank,
#   account_number, currency, active (integer 0/1), percentage_charge,
#   bank_id, metadata, primary_contact_*
#
# NOTE: active is returned as an integer (1/0) in the list endpoint,
# unlike the single-fetch endpoint which returns a boolean.
# We normalise it to bool with bool(d.get('active', 0)).
# ─────────────────────────────────────────────────────────────────────────────

# @paystack_bp.route('/api/paystack/subaccount-status', methods=['GET'])
# def subaccount_status():
#     from models import User
#     user_id = request.args.get('user_id')
#     if not user_id:
#         return jsonify({'success': False, 'error': 'user_id required'}), 400

#     user = User.query.filter_by(id=user_id).first()
#     if not user:
#         return jsonify({'success': False, 'error': 'User not found'}), 404

#     user_data = user.data or {}
#     stored    = user_data.get('paystack_subaccounts', [])

#     # ── Migrate legacy single-account users ONCE ──────────────────────────────
#     if 'paystack_subaccounts' not in user_data and user_data.get('paystack_subaccount_code'):
#         stored = [{
#             'subaccount_code': user_data['paystack_subaccount_code'],
#             'account_number':  user_data.get('paystack_account_number'),
#             'bank_code':       user_data.get('paystack_bank_code'),
#             'account_name':    user_data.get('paystack_account_name'),
#             'business_name':   user_data.get('paystack_business_name'),
#             'created_at':      user_data.get('paystack_setup_at'),
#         }]
#         user_data['paystack_subaccounts'] = stored
#         user.data = user_data
#         flag_modified(user, 'data')
#         db.session.commit()

#     if not stored:
#         return jsonify({'success': True, 'has_subaccount': False, 'subaccounts': []})

#     # ── Fetch all subaccounts from Paystack in ONE request ────────────────────
#     # GET /subaccount returns up to perPage=100 per page. For most users this
#     # is more than enough. Add pagination here if you ever need >100.
#     paystack_lookup = {}  # subaccount_code -> Paystack data dict
#     paystack_available = True

#     try:
#         res = requests.get(
#             f'{PAYSTACK_BASE}/subaccount?perPage=100&page=1',
#             headers=paystack_headers(),
#             timeout=10,
#         )
#         result = res.json()
#         if res.status_code == 200 and result.get('status'):
#             for item in result.get('data', []):
#                 code = item.get('subaccount_code')
#                 if code:
#                     paystack_lookup[code] = item
#         else:
#             # Paystack returned an error — don't prune, return stored data
#             paystack_available = False
#     except Exception:
#         paystack_available = False

#     # ── Match stored entries against live Paystack data ───────────────────────
#     subaccounts = []
#     pruned      = False

#     for entry in stored:
#         code = entry.get('subaccount_code')
#         if not code:
#             pruned = True  # corrupt entry — drop it
#             continue

#         if not paystack_available:
#             # Network failure — return stored data as-is, don't prune anything
#             subaccounts.append({
#                 'subaccount_code': code,
#                 'id':              None,
#                 'business_name':   entry.get('business_name'),
#                 'bank_name':       entry.get('bank_name'),
#                 'bank_code':       entry.get('bank_code'),
#                 'account_name':    entry.get('account_name'),
#                 'account_number':  entry.get('account_number'),
#                 'is_verified':     False,
#                 'active':          False,
#                 'created_at':      entry.get('created_at'),
#                 'updated_at':      None,
#                 '_source':         'stored_fallback',
#             })
#             continue

#         d = paystack_lookup.get(code)

#         if d:
#             # Subaccount exists on Paystack — use live data.
#             # active comes back as integer 1/0 from list endpoint → normalise to bool.
#             subaccounts.append({
#                 'subaccount_code': d.get('subaccount_code', code),
#                 'id':              d.get('id'),
#                 'business_name':   d.get('business_name') or entry.get('business_name'),
#                 'bank_name':       d.get('settlement_bank') or entry.get('bank_name'),
#                 'bank_code':       entry.get('bank_code'),          # not in list response
#                 'account_name':    entry.get('account_name'),       # not in list response
#                 'account_number':  d.get('account_number') or entry.get('account_number'),
#                 'percentage_charge': d.get('percentage_charge'),
#                 'currency':        d.get('currency', 'NGN'),
#                 'is_verified':     False,                           # not in list response
#                 'active':          bool(d.get('active', 0)),        # integer in list endpoint
#                 'created_at':      entry.get('created_at'),         # not in list response
#                 'updated_at':      None,                            # not in list response
#             })
#         else:
#             # Code not found in Paystack's list — it was deleted from the dashboard.
#             # Prune it from our DB and exclude from response.
#             pruned = True

#     # ── Persist pruned list back to DB if anything was removed ───────────────
#     if pruned:
#         surviving_codes = {s['subaccount_code'] for s in subaccounts}
#         clean = [e for e in stored if e.get('subaccount_code') in surviving_codes]
#         user_data['paystack_subaccounts'] = clean

#         if clean:
#             first = clean[0]
#             user_data['paystack_subaccount_code'] = first['subaccount_code']
#             user_data['paystack_account_number']  = first.get('account_number')
#             user_data['paystack_bank_code']       = first.get('bank_code')
#             user_data['paystack_account_name']    = first.get('account_name')
#             user_data['paystack_business_name']   = first.get('business_name')
#         else:
#             for key in ['paystack_subaccount_code', 'paystack_account_number',
#                         'paystack_bank_code', 'paystack_account_name',
#                         'paystack_business_name', 'paystack_setup_at']:
#                 user_data.pop(key, None)

#         user.data = user_data
#         flag_modified(user, 'data')
#         if hasattr(user, 'updated_at'):
#             user.updated_at = datetime.utcnow()
#         db.session.commit()

#     return jsonify({
#         'success':        True,
#         'has_subaccount': len(subaccounts) > 0,
#         'subaccounts':    subaccounts,
#     })


@paystack_bp.route('/api/paystack/subaccount-status', methods=['GET'])
def subaccount_status():
    from models import User
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'user_id required'}), 400

    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    user_data = user.data or {}
    stored    = user_data.get('paystack_subaccounts', [])

    # ── Migrate legacy single-account users ONCE ──────────────────────────────
    if 'paystack_subaccounts' not in user_data and user_data.get('paystack_subaccount_code'):
        stored = [{
            'subaccount_code': user_data['paystack_subaccount_code'],
            'account_number':  user_data.get('paystack_account_number'),
            'bank_code':       user_data.get('paystack_bank_code'),
            'account_name':    user_data.get('paystack_account_name'),
            'business_name':   user_data.get('paystack_business_name'),
            'created_at':      user_data.get('paystack_setup_at'),
        }]
        user_data['paystack_subaccounts'] = stored
        user.data = user_data
        flag_modified(user, 'data')
        db.session.commit()

    if not stored:
        return jsonify({'success': True, 'has_subaccount': False, 'subaccounts': []})

    # ── Fetch each subaccount individually from Paystack ─────────────────────
    # GET /subaccount/:code returns is_verified (boolean).
    # The list endpoint (GET /subaccount) does NOT include is_verified.
    # Most users have 1-3 accounts so the extra round-trips are negligible.
    paystack_lookup    = {}   # subaccount_code -> Paystack data dict
    paystack_available = True

    for entry in stored:
        code = entry.get('subaccount_code')
        if not code:
            continue
        try:
            res = requests.get(
                f'{PAYSTACK_BASE}/subaccount/{code}',
                headers=paystack_headers(),
                timeout=10,
            )
            result = res.json()
            if res.status_code == 200 and result.get('status'):
                paystack_lookup[code] = result['data']
            elif res.status_code == 404:
                # Deleted from Paystack dashboard — will be pruned below.
                pass
            else:
                # Any other Paystack error — don't prune, return stored data.
                paystack_available = False
        except Exception:
            paystack_available = False

    # ── Match stored entries against live Paystack data ───────────────────────
    subaccounts = []
    pruned      = False

    for entry in stored:
        code = entry.get('subaccount_code')
        if not code:
            pruned = True  # corrupt entry — drop it
            continue

        if not paystack_available:
            # Network/API failure — return stored data as-is, don't prune.
            subaccounts.append({
                'subaccount_code': code,
                'id':              None,
                'business_name':   entry.get('business_name'),
                'bank_name':       entry.get('bank_name'),
                'bank_code':       entry.get('bank_code'),
                'account_name':    entry.get('account_name'),
                'account_number':  entry.get('account_number'),
                'is_verified':     None,   # unknown — API unavailable
                'active':          False,
                'created_at':      entry.get('created_at'),
                'updated_at':      None,
                '_source':         'stored_fallback',
            })
            continue

        d = paystack_lookup.get(code)

        if d:
            # Subaccount exists on Paystack — use live data.
            # Single-fetch endpoint returns is_verified as a proper boolean
            # and active as a boolean (unlike the list endpoint which uses 0/1).
            subaccounts.append({
                'subaccount_code':   d.get('subaccount_code', code),
                'id':                d.get('id'),
                'business_name':     d.get('business_name') or entry.get('business_name'),
                'bank_name':         d.get('settlement_bank') or entry.get('bank_name'),
                'bank_code':         entry.get('bank_code'),        # not in single response
                'account_name':      d.get('account_name') or entry.get('account_name'),
                'account_number':    d.get('account_number') or entry.get('account_number'),
                'percentage_charge': d.get('percentage_charge'),
                'currency':          d.get('currency', 'NGN'),
                'is_verified':       bool(d.get('is_verified', False)),
                'active':            bool(d.get('active', False)),
                'created_at':        d.get('createdAt') or entry.get('created_at'),
                'updated_at':        d.get('updatedAt'),
            })
        else:
            # Code not found (404 earlier) — deleted from Paystack dashboard.
            # Prune it from our DB and exclude from response.
            pruned = True

    # ── Persist pruned list back to DB if anything was removed ───────────────
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
    total_ngn   = subtotal - discount + tax + shipping
    amount_kobo = int(total_ngn * 100)

    invoice_number = invoice_data.get('invoice_number', str(invoice_id)[:8])
    business_name  = invoice_data.get('from', '').split('\n')[0] or 'Business'
    callback_url   = f"{os.getenv('FRONTEND_URL', 'https://envoyce.xyz')}/pay/{invoice_id}?status=success"

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
            'cancel_action':  f"{os.getenv('FRONTEND_URL', 'https://envoyce.xyz')}/pay/{invoice_id}",
        },
    }

    if subaccount_code:
        payload['subaccount']         = subaccount_code
        payload['transaction_charge'] = 0
        payload['bearer']             = 'subaccount'

    res = requests.post(
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

    res = requests.get(
        f'{PAYSTACK_BASE}/transaction/verify/{reference}',
        headers=paystack_headers(),
    )
    result = res.json()
    if not result.get('status'):
        return jsonify({'success': False, 'error': 'Could not verify payment'}), 400

    tx = result['data']
    if tx['status'] != 'success':
        return jsonify({'success': False, 'error': f"Payment status: {tx['status']}"}), 400

    invoice_id = tx.get('metadata', {}).get('invoice_id')
    if not invoice_id:
        return jsonify({'success': False, 'error': 'Invoice ID missing from transaction'}), 400

    invoice = Invoice.query.filter_by(id=invoice_id).first()
    if not invoice:
        return jsonify({'success': False, 'error': 'Invoice not found'}), 404

    invoice.status = 'paid'
    inv_data = invoice.data or {}
    inv_data['paid_at']            = datetime.utcnow().isoformat()
    inv_data['paystack_reference'] = reference
    inv_data['paystack_amount']    = tx['amount'] / 100
    invoice.data = inv_data
    db.session.commit()

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
    from models import Invoice

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
                invoice.status = 'paid'
                inv_data = invoice.data or {}
                inv_data['paid_at']            = datetime.utcnow().isoformat()
                inv_data['paystack_reference'] = tx.get('reference')
                inv_data['paystack_amount']    = tx.get('amount', 0) / 100
                invoice.data = inv_data
                db.session.commit()

    return jsonify({'status': 'ok'}), 200


# ─── 8. Remove subaccount ─────────────────────────────────────────────────────

@paystack_bp.route('/api/paystack/remove-subaccount', methods=['POST'])
def remove_subaccount():
    from models import User
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

    # Best-effort deactivation on Paystack (no DELETE endpoint exists).
    # Ignore errors — the subaccount may already be gone from their dashboard.
    try:
        requests.put(
            f'{PAYSTACK_BASE}/subaccount/{subaccount_code}',
            headers=paystack_headers(),
            json={'active': False},
            timeout=8,
        )
    except Exception:
        pass

    # Re-sync legacy keys
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

    return jsonify({'success': True, 'message': 'Subaccount removed'})


@paystack_bp.route('/api/paystack/debug-user', methods=['GET'])
def debug_user():
    from models import User
    user_id = request.args.get('user_id')
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'user_id':    user.id,
        'data_keys':  list((user.data or {}).keys()),
        'raw_data':   user.data,
    })