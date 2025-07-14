// TotalsDisplay.jsx (updated)
import React from 'react';

const TotalsDisplay = ({
  subtotal,
  taxAmount,
  discountAmount,
  shippingAmount,
  total,
  currency
}) => {
  const formatCurrency = (amount) => `${currency.symbol}${amount.toFixed(2)}`;

  return (
    <div className="mb-6 text-right space-y-2">
      <div className="flex justify-between">
        <span className="text-gray-400">Subtotal:</span>
        <span className="font-medium">{formatCurrency(subtotal)} <span className="text-xs text-gray-400">{currency.code}</span></span>
      </div>

      {taxAmount > 0 && (
        <div className="flex justify-between">
          <span className="text-gray-400">Tax:</span>
          <span>{formatCurrency(taxAmount)} <span className="text-xs text-gray-400">{currency.code}</span></span>
        </div>
      )}

      {discountAmount > 0 && (
        <div className="flex justify-between">
          <span className="text-gray-400">Discount:</span>
          <span className="text-red-500">-{formatCurrency(discountAmount)} <span className="text-xs text-gray-400">{currency.code}</span></span>
        </div>
      )}

      {shippingAmount > 0 && (
        <div className="flex justify-between">
          <span className="text-gray-400">Shipping:</span>
          <span>{formatCurrency(shippingAmount)} <span className="text-xs text-gray-400">{currency.code}</span></span>
        </div>
      )}

      <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
        <span className="font-semibold">Total:</span>
        <span className="font-bold text-indigo-500">{formatCurrency(total)} <span className="text-xs text-gray-400">{currency.code}</span></span>
      </div>
    </div>
  );
};

export default TotalsDisplay;