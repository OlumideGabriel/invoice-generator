import { useEffect, useState } from "react";

function ProFeature({ userId }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    fetch(`http://localhost:5000/api/subscription-status/${userId}`)
      .then(res => res.json())
      .then(data => setStatus(data.subscription_status));
  }, [userId]);

  if (status === "loading") return <p>Loading...</p>;

  if (status !== "active") {
    return (
      <div>
        <p>🚫 This is a Pro feature. Subscribe to unlock.</p>
        <a href="/subscribe">Upgrade</a>
      </div>
    );
  }

  return (
    <div>
      <h2>🔥 Pro Feature</h2>
      <p>You now have access!</p>
    </div>
  );
}

export default ProFeature;
