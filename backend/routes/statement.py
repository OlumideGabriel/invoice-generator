"""
routes/statement.py — POST /generate-statement

Stateless transaction-statement (receipt) renderer for completed transactions.
Same contract style as /generate-invoice in app.py: JSON payload in, PDF out,
nothing stored. Unlike the invoice, a statement is proof of what already
happened — it carries no due date and no payment demand.

Payload:
{
  "title": "Transaction Statement",     # optional document title
  "to": "Rada — Lagos",                 # required — recipient line
  "logo_url": "https://…",              # optional header logo
  "statement_number": "STMT-…",         # optional, auto-generated if absent
  "statement_date": "2026-09-25",       # optional ISO date, defaults to now
  "context": {                          # optional subject of the statement
      "event": "Wordpress in the Age of AI",
      "event_date": "2026-07-29"
  },
  "currency": "NGN",
  "currency_symbol": "₦",
  "transactions": [                     # required — one entry per transaction
    {
      "ref": "GTN-RXAIWV",
      "date": "2026-05-11",
      "customer": "Sound Huncho",
      "item": "General",
      "quantity": 1,
      "amount": 1870.0,                 # gross
      "fee": 130.0                      # platform fee — net is computed
    }
  ],
  "payment_details": "Acct 0123456789 — GTB",   # optional footer block
  "notes": "Payouts are processed within 14 days of the event."  # optional
}

Totals (gross, fees, net) are computed server-side from the transactions.
"""

import logging
import os
import ssl
import tempfile
from datetime import datetime
from urllib.parse import quote

import certifi
import requests
from flask import (
    Blueprint,
    jsonify,
    make_response,
    render_template,
    request,
)
from weasyprint import HTML

statement_bp = Blueprint("statement", __name__)
logger = logging.getLogger(__name__)


def _fmt_date(value, default=""):
    if not value:
        return default
    if isinstance(value, datetime):
        return value.strftime("%b %d, %Y")
    try:
        return datetime.fromisoformat(str(value)).strftime("%b %d, %Y")
    except (ValueError, TypeError):
        return str(value)


def _parse_statement(data):
    if not data:
        raise ValueError("Missing JSON payload.")
    if not data.get("transactions"):
        raise ValueError("Missing required field: transactions")

    transactions = []
    gross = fees = net_total = 0.0
    for tx in data["transactions"]:
        amount = float(tx.get("amount", 0) or 0)
        fee = float(tx.get("fee", 0) or 0)
        net = amount - fee
        transactions.append({
            "ref": tx.get("ref") or "",
            "date": _fmt_date(tx.get("date"), ""),
            "customer": tx.get("customer") or "",
            "item": tx.get("item") or "",
            "quantity": tx.get("quantity", 1) or "",
            "amount": amount,
            "fee": fee,
            "net": net,
        })
        gross += amount
        fees += fee
        net_total += net

    context = data.get("context") or {}
    return {
        "title": data.get("title") or "Transaction Statement",
        "from": data.get("from") or "Getn Live",
        "to": data.get("to") or "",
        "statement_number": data.get("statement_number")
        or f"STMT-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
        "statement_date": _fmt_date(
            data.get("statement_date"), datetime.now().strftime("%b %d, %Y")
        ),
        "event": context.get("event") or "",
        "event_date": _fmt_date(context.get("event_date"), ""),
        "transactions": transactions,
        "count": len(transactions),
        "gross": gross,
        "fees": fees,
        "net_total": net_total,
        "currency": data.get("currency") or "NGN",
        "currency_symbol": data.get("currency_symbol") or "",
        "logo_url": data.get("logo_url"),
        "payment_details": data.get("payment_details") or "",
        "notes": data.get("notes") or "",
    }


def _download_image(url, temp_files):
    """Fetch an external image to a temp file so WeasyPrint can embed it."""
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    lower = url.lower().split("?")[0]
    suffix = ".png"
    for ext in (".svg", ".jpg", ".jpeg", ".gif", ".webp"):
        if lower.endswith(ext):
            suffix = ext
            break
    fd, path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, "wb") as f:
        f.write(resp.content)
    temp_files.append(path)
    return path


@statement_bp.route("/generate-statement", methods=["POST"])
def generate_statement():
    temp_files = []
    try:
        data = request.get_json()
        tpl = _parse_statement(data)

        if tpl.get("logo_url"):
            try:
                tpl["logo_url"] = _download_image(tpl["logo_url"], temp_files)
            except Exception as e:
                logger.warning("statement logo download failed: %s", e)

        html = render_template("transaction_statement.html", **tpl)

        ssl_context = ssl.create_default_context(cafile=certifi.where())
        pdf = HTML(
            string=html,
            base_url=os.path.dirname(os.path.abspath(__file__)),
        ).write_pdf(ssl_context=ssl_context)

        for path in temp_files:
            try:
                os.unlink(path)
            except OSError:
                pass

        response = make_response(pdf)
        response.headers["Content-Type"] = "application/pdf"
        filename = f"statement_{tpl['statement_number']}.pdf"
        encoded = quote(filename, safe="")
        response.headers["Content-Disposition"] = (
            f"attachment; filename=\"{filename}\"; filename*=UTF-8''{encoded}"
        )
        response.headers["Content-Length"] = len(pdf)
        return response

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        for path in temp_files:
            try:
                os.unlink(path)
            except OSError:
                pass
        logging.exception("Error in generate_statement")
        return jsonify({"error": "Failed to render statement"}), 500
