from flask import Flask, render_template, request, jsonify, make_response
from flask_cors import CORS
from weasyprint import HTML
import os
from datetime import datetime

app = Flask(__name__)
# Instead of just CORS(app), configure it more specifically
CORS(app, resources={
    r"/generate-invoice": {
        "origins": "*",  # Or specify your frontend domains
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})


@app.route('/generate-invoice', methods=['POST', 'OPTIONS'])
def generate_invoice():
    if request.method == 'OPTIONS':
        response = jsonify()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    try:
        data = request.get_json()

        # Ensure data is not None
        if not data:
            return jsonify({'error': 'Request body is empty or invalid'}), 400

        # Calculate subtotals for each item
        items_with_totals = []
        for item in data['items']:
            item['subtotal'] = item['quantity'] * item['unit_cost']
            items_with_totals.append(item)

        # Prepare template data
        template_data = {
            'date': datetime.now().strftime('%B %d, %Y'),
            'from': data['from'],
            'to': data['to'],
            'items': items_with_totals,
            'total': data['total'],
            'invoice_number': f"INV-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        }

        # Render HTML
        html = render_template('invoice.html', **template_data)

        # Generate PDF
        pdf = HTML(string=html).write_pdf()

        # Create response
        response = make_response(pdf)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=invoice_{template_data["invoice_number"]}.pdf'

        return response

    except Exception as e:
        return jsonify({'error2': str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)

"""

curl -X POST http://localhost:5000/generate-invoice \
-H "Content-Type: application/json" \
-d '{"from":"Test","to":"Client","items":[{"name":"Item1","quantity":1,"unit_cost":10}]}', "total":10}' 

"""