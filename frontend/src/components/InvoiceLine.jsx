// components/InvoiceLine.jsx
import React from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';


const InvoiceLine = ({ item, index, onChange, onRemove, onToggleDescription, itemsLength }) => {
  const { currency } = useCurrency();
  return (
    <div className="flex flex-col gap-2 mb-4 bg-neutral-700 p-4 rounded-lg shadow-md">
      <div className="flex flex-wrap md:flex-nowrap gap-4 items-start justify-left">

        <div className="relative group w-3/5">
          <input
            type="text"
            placeholder="Item name"
            value={item.name}
            onChange={(e) => onChange(index, 'name', e.target.value)}
            className="flex-3 w-full p-2 pr-10 rounded-md bg-neutral-600 border border-neutral-500
            text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"

          />
          {item.showDesc && (
        <textarea
          placeholder="Add a description..."
          value={item.description || ''}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          className="mt-2 w-full p-2 rounded-md bg-neutral-600 border border-neutral-500 text-sm
          text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          rows={3}
        />
      )}

          <a
            type="button"
            onClick={() => onToggleDescription(index)}
            className="absolute right-2 top-5 -translate-y-1/2 opacity-0 group-hover:opacity-100
            transition-opacity duration-200 text-indigo-400 hover:text-indigo-300"
          >
            {item.showDesc ? (
              <ChevronUp size={30} />
            ) : (
              <ChevronDown size={30} />
            )}
          </a>
        </div>


        <input
          type="number"
          placeholder="Qty"
          value={item.quantity}
          min="1"
          onChange={(e) => onChange(index, 'quantity', e.target.value)}
          className="w-20 flex-3 p-2 rounded-md bg-neutral-600 border border-neutral-500 focus:outline-none"
        />

        <div className="flex items-center gap-5 w-full md:w-auto">
            <input
              type="number"
              placeholder={`Unit Cost (${currency.symbol})`}
              value={item.unit_cost}
              min="0"
              step="0.01"
              onChange={(e) => onChange(index, 'unit_cost', e.target.value)}
              className="w-28 flex-3 p-2 rounded-md bg-neutral-600 border border-neutral-500 focus:outline-none"
            />
            <span className="w-28 text-sm text-neutral-300">
              {currency.symbol}{(item.quantity * item.unit_cost).toFixed(2)} <span className="text-xs text-neutral-400">{currency.code}</span>
            </span>

            <button
              onClick={() => onRemove(index)}
              className={`inline-flex items-center rounded-md bg-indigo-900 px-1 py-1 text-xs font-medium
              text-indigo-400 ring-1 ring-red-600/10 ring-inset ${itemsLength > 1 ? '' : 'invisible'}`}
            >
              <X size={18} />
            </button>

        </div>


      </div>

    </div>

  );
};

export default InvoiceLine;
