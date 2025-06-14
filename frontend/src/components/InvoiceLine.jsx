import React, { useState } from 'react';

export default function InvoiceLine({ index, onChange, onRemove, data }) {
  const handleChange = (e) => {
    onChange(index, { ...data, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex space-x-2 mb-2">
      <input
        type="text"
        name="description"
        placeholder="Description"
        value={data.description}
        onChange={handleChange}
        className="border rounded px-2 py-1 flex-grow"
      />
      <input
        type="number"
        name="quantity"
        placeholder="Qty"
        value={data.quantity}
        onChange={handleChange}
        className="border rounded px-2 py-1 w-20"
      />
      <input
        type="number"
        name="price"
        placeholder="Price"
        value={data.price}
        onChange={handleChange}
        className="border rounded px-2 py-1 w-24"
      />
      <button
        onClick={() => onRemove(index)}
        className="bg-red-500 text-white px-3 rounded"
      >
        X
      </button>
    </div>
  );
}
