// components/PaymentSection.jsx
import React from 'react';

const PaymentSection = ({ paymentDetails, setPaymentDetails, paymentInstructions, setPaymentInstructions }) => {
  return (
    <>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Payment Details</label>
        <textarea
          value={paymentDetails}
          onChange={(e) => setPaymentDetails(e.target.value)}
          rows="3"
          className="w-2/3 p-3 rounded-md bg-neutral-700 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Payment Instructions</label>
        <textarea
          value={paymentInstructions}
          onChange={(e) => setPaymentInstructions(e.target.value)}
          rows="3"
          className="w-2/3 p-3 rounded-md bg-neutral-700 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </>
  );
};

export default PaymentSection;
