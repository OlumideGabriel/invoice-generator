import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_test_12345"); // Publishable key

function SubscribeButton() {
  const handleCheckout = async () => {
    const res = await fetch("http://localhost:5000/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    window.location.href = data.url; // Redirect to Stripe Checkout
  };

  return <button onClick={handleCheckout}>Subscribe for $2.99/month</button>;
}

export default SubscribeButton;
