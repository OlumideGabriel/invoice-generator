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
    <div className="md:mt-8 mt-0 relative">
      <label className="md:block hidden text-md text-gray-600 mb-5">Change currency</label>
      <div className="md:relative bg-neutral-800 border border-gray-200 shadow-sm rounded-md lg:w-full w-[9rem] cursor-pointer select-none">
        {/* Trigger Button */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full lg:py-3 py-3 px-6 pr-16 text-gray-400 rounded-md bg-white md:bg-transparent md:hover:bg-gray-200 "
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {currency.code}
        </div>
        {/* Chevron Icon */}
        <ChevronDown 
          size={21}
          className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-500 pointer-events-none transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg p-1 shadow-md lg:shadow-sm z-10">
            <div className="max-h-60 overflow-y-auto">
              {currencyOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`bg-white text-gray-600 w-full px-6 py-2.5 mb-1 text-left text-md hover:bg-gray-100 rounded-lg
                      first:rounded-t-lg last:rounded-b-lg transition-colors ${
                    currency.code === option.code ? 'bg-neutral-100 font-medium' : ''
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
