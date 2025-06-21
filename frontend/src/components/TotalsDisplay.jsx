// components/TotalsDisplay.jsx
import React from 'react';

const TotalsDisplay = ({ subtotal, taxAmount, discountAmount, total }) => {
  return (
    <div className="mb-6 text-right text-lg font-semibold text-indigo-300">
      <div>Subtotal: ${subtotal.toFixed(2)}</div>
      <div>Tax: ${taxAmount.toFixed(2)}</div>
      <div>Discount: -${discountAmount.toFixed(2)}</div>
      <div>Total: ${total}</div>
    </div>
  );
};

export default TotalsDisplay;
