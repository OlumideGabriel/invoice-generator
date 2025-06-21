// components/InvoiceLine.jsx
import React from 'react';
import ItemDescriptions from './ItemDescriptions';

const InvoiceLine = ({ item, index, onChange, onRemove, onToggleDescription }) => {
  return (
    <div className="flex flex-wrap md:flex-nowrap gap-4 items-center mb-4 bg-neutral-700 p-4 rounded-lg">
      <input
        type="text"
        placeholder="Item name"
        value={item.name}
        onChange={(e) => onChange(index, 'name', e.target.value)}
        className="flex-1 p-2 rounded-md bg-neutral-600 border border-neutral-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      <input
        type="number"
        placeholder="Qty"
        value={item.quantity}
        min="1"
        onChange={(e) => onChange(index, 'quantity', e.target.value)}
        className="w-20 p-2 rounded-md bg-neutral-600 border border-neutral-500 focus:outline-none"
      />
      <input
        type="number"
        placeholder="Unit Cost"
        value={item.unit_cost}
        min="0"
        step="0.01"
        onChange={(e) => onChange(index, 'unit_cost', e.target.value)}
        className="w-28 p-2 rounded-md bg-neutral-600 border border-neutral-500 focus:outline-none"
      />
      <span className="text-sm text-neutral-300">
        ${(item.quantity * item.unit_cost).toFixed(2)}
      </span>
      <button
        onClick={() => onRemove(index)}
        className="text-red-400 hover:text-red-300 text-sm"
      >
        Remove
      </button>
      <button
        onClick={() => onToggleDescription(index)}
        className="text-indigo-400 hover:text-indigo-300 text-sm ml-2"
        type="button"
      >
        {item.showDesc ? 'Hide Description' : 'Add Description'}
      </button>
    </div>
  );
};

export default InvoiceLine;
