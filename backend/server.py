import os
from flask import Flask, request, jsonify
import stripe
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Set up Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

YOUR_DOMAIN = "https://envoyce.xyz"

@app.route("/create-checkout-session", methods=["POST"])
def create_checkout_session():
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[
                {
                    "price": os.getenv("STRIPE_PRICE_ID"),  # $2.99/month Price ID
                    "quantity": 1,
                },
            ],
            success_url=f"{YOUR_DOMAIN}/success",
            cancel_url=f"{YOUR_DOMAIN}/cancel",
        )
        return jsonify({"url": session.url})
    except Exception as e:
        return jsonify(error=str(e)), 400

# Webhook to handle subscription events
@app.route("/webhook", methods=["POST"])
def webhook():
    payload = request.data
    sig_header = request.headers.get("Stripe-Signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except stripe.error.SignatureVerificationError:
        return "⚠️ Invalid signature", 400

    # Handle subscription events
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        print("✅ Subscription started:", session)

    elif event["type"] == "invoice.paid":
        invoice = event["data"]["object"]
        print("💰 Invoice paid:", invoice)

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        print("❌ Subscription canceled:", subscription)

    return "✅ Success", 200


if __name__ == "__main__":
    app.run(port=5000, debug=True)
