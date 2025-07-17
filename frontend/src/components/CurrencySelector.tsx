import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { CurrencyOption } from '../context/CurrencyContext';

interface CurrencySelectorProps {
  currency: CurrencyOption;
  setCurrency: (option: CurrencyOption) => void;
  currencyOptions: CurrencyOption[];
}

export default function CurrencySelector({ currency, setCurrency, currencyOptions }: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: CurrencyOption) => {
    setCurrency(option);
    setIsOpen(false);
  };

  return (
    <div className="mt-8 relative">
      <label className="block text-md text-gray-600 mb-5">Change currency</label>
      <div className="relative label-3">
        {/* Trigger Button */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full py-3 px-6 pr-16"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {currency.code}
        </div>
        {/* Chevron Icon */}
        <ChevronDown 
          size={24} 
          className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-black pointer-events-none transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-2xs p-0.5 shadow-lg z-10">
            <div className="max-h-60 overflow-y-auto">
              {currencyOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`label-1 w-full px-6 py-2 text-left text-lg hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                    currency.code === option.code ? 'bg-gray-100 font-medium label-2' : ''
                  }`}
                >
                  {option.code} {option.symbol}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
