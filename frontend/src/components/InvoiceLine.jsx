// components/InvoiceLine.jsx
import React from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const InvoiceLine = ({ item, index, onChange, onRemove, onToggleDescription, itemsLength }) => {
  const { currency } = useCurrency();

  return (
    <div className="flex group  rounded-xl
     transition-all duration-300 mb-4 items-start">
      {/* Main content area */}
      <div className="p-4 flex w-full bg-gray-50 hover:bg-gray-200  group flex-row  gap-2 relative rounded-xl">
        <div className="flex w-full flex-wrap md:flex-nowrap gap-4 self-start">

          {/* Item name and description section */}
          <div className="relative flex-1 max-w-lg">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter item name"
                value={item.name}
                onChange={(e) => onChange(index, 'name', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg
                         text-gray-900 placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                         transition-all duration-200 text-md font-medium"
              />

              {/* Toggle description button */}
              <a
                type="button"
                onClick={() => onToggleDescription(index)}
                className="absolute right-3 top-1/2 -translate-y-1/2
                         opacity-0 group-hover:opacity-80 transition-all duration-200 bg-green-50
                         hover:text-green-800 hover:bg-green-100 hover:border-neutral-300 text-green-600
                         rounded-full p-0.5"
                aria-label={item.showDesc ? 'Hide description' : 'Show description'}
              >
                {item.showDesc ? (
                  <ChevronUp size={25} />
                ) : (
                  <ChevronDown size={25} />
                )}
              </a>
            </div>

            {/* Description textarea */}
            {item.showDesc && (
              <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                <textarea
                  placeholder="Add item description or notes..."
                  value={item.description || ''}
                  onChange={(e) => onChange(index, 'description', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg
                           text-gray-700 placeholder-gray-500 text-md
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                           transition-all duration-200 resize-none"
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Quantity input */}
          <div className="flex flex-col">
            <input
              type="number"
              placeholder="1"
              value={item.quantity}
              min="1"
              onChange={(e) => onChange(index, 'quantity', e.target.value)}
              className="w-20 px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg
                       text-gray-900 text-center text-md font-medium
                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                       transition-all duration-200"
            />
          </div>

          {/* Unit cost and amount section */}
          <div className="flex flex-col sm:flex-row items-start  gap-4">

            {/* Unit cost input */}
            <div className="flex flex-col">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                  {currency.symbol}
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={item.unit_cost}
                  min="0"
                  step="0.01"
                  onChange={(e) => onChange(index, 'unit_cost', e.target.value)}
                  className="w-32 pl-8 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-lg
                           text-gray-900 text-md font-medium
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                           transition-all duration-200"
                />
              </div>
            </div>

            {/* Amount display */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between min-w-32 px-4 py-3 rounded-lg">
                <span className="text-md font-bold text-emerald-900">
                    <span className="text-sm mr-2 text-gray-600 font-medium">
                  {currency.code}
                </span>
                  {(item.quantity * item.unit_cost).toFixed(2)}
                </span>

              </div>
            </div>

          </div>

        </div>

      </div>
      {/* Remove button */}
      <div className="flex flex-col justify-end self-start py-6">
              <button
                onClick={() => onRemove(index)}
                className={` p-1 rounded-lg transition-all duration-200 ease-in-out ml-4
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1
                         ${itemsLength > 1
                           ? 'small-icon transition-colors'
                           : 'hidden'
                         }`}
                aria-label="Remove item"
              >
                <X size={18} />
              </button>
            </div>

    </div>


  );

};

export default InvoiceLine;