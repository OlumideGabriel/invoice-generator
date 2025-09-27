import requests
from dotenv import load_dotenv
import os

load_dotenv()

API_KEY = os.getenv("CURRENCY_FREAKS")


def get_total_revenue(invoices, api_key, target_currency):
    """
    Super simple one-function solution
    """
    # Get rates once
    response = requests.get(
        "https://api.currencyfreaks.com/v2.0/rates/latest",
        params={'apikey': API_KEY}
    )
    rates = response.json()['rates']

    total = 0

    for invoice in invoices:
        amount = invoice['amount']
        currency = invoice['currency']

        if currency == target_currency:
            total += amount
        else:
            # Convert via USD
            # Step 1: Convert to USD
            usd_amount = amount / float(rates[currency])
            # Step 2: Convert USD to target currency
            if not target_currency:
                total += usd_amount
            else:
                target_amount = usd_amount * float(rates[target_currency])
                total += target_amount

    return round(total, 2)


# Usage
invoices = [
    {'amount': 100, 'currency': 'GBP'},
    {'amount': 5000, 'currency': 'NGN'},
    {'amount': 100, 'currency': 'CAD'}
]

total = get_total_revenue(invoices, API_KEY, 'GBP')
print(f"Total: {total}")
