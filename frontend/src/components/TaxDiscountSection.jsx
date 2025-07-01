// components/TaxDiscountSection.jsx
import React from 'react';

const TaxDiscountSection = ({ taxPercent, setTaxPercent, discountPercent, setDiscountPercent }) => {
  return (
    <div className="flex gap-6 mb-6">
      <div className="flex-1">
        <label className="block text-sm font-medium mb-2">Tax %</label>
        <input
          type="number"
          value={taxPercent}
          min="0"
          max="100"
          onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
          className="w-full p-3 rounded-md bg-neutral-700 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex-1">
        <label className="block text-sm font-medium mb-2">Discount %</label>
        <input
          type="number"
          value={discountPercent}
          min="0"
          max="100"
          onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
          className="w-full p-3 rounded-md bg-neutral-700 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
};

export default TaxDiscountSection;