import React from 'react';
import { ArrowRightLeft, X, Plus, Minus, SquareMinus } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface TaxDiscountSectionProps {
  taxPercent: number;
  setTaxPercent: (val: number) => void;
  discountPercent: number;
  setDiscountPercent: (val: number) => void;
  shippingAmount: number;
  setShippingAmount: (val: number) => void;
  showTax: boolean;
  setShowTax: (val: boolean) => void;
  showDiscount: boolean;
  setShowDiscount: (val: boolean) => void;
  showShipping: boolean;
  setShowShipping: (val: boolean) => void;
  taxType: 'percent' | 'fixed';
  setTaxType: (val: 'percent' | 'fixed') => void;
  discountType: 'percent' | 'fixed';
  setDiscountType: (val: 'percent' | 'fixed') => void;
}

const TaxDiscountSection: React.FC<TaxDiscountSectionProps> = ({
  taxPercent,
  setTaxPercent,
  discountPercent,
  setDiscountPercent,
  shippingAmount,
  setShippingAmount,
  showTax,
  setShowTax,
  showDiscount,
  setShowDiscount,
  showShipping,
  setShowShipping,
  taxType,
  setTaxType,
  discountType,
  setDiscountType,
}) => {
  const [prevTaxPercent, setPrevTaxPercent] = React.useState(taxPercent);
  const [prevDiscountPercent, setPrevDiscountPercent] = React.useState(discountPercent);
  const [prevShippingAmount, setPrevShippingAmount] = React.useState(shippingAmount);
  const { currency } = useCurrency();

  const handleToggleTax = () => {
    if (showTax) {
      setPrevTaxPercent(taxPercent);
      setTaxPercent(0);
    } else {
      setTaxPercent(prevTaxPercent);
    }
    setShowTax(!showTax);
  };

  const handleToggleDiscount = () => {
    if (showDiscount) {
      setPrevDiscountPercent(discountPercent);
      setDiscountPercent(0);
    } else {
      setDiscountPercent(prevDiscountPercent);
    }
    setShowDiscount(!showDiscount);
  };

  const handleToggleShipping = () => {
    if (showShipping) {
      setPrevShippingAmount(shippingAmount);
      setShippingAmount(0);
    } else {
      setShippingAmount(prevShippingAmount);
    }
    setShowShipping(!showShipping);
  };

  const toggleTaxType = () => {
    const newType = taxType === 'percent' ? 'fixed' : 'percent';
    setTaxType(newType);
    setTaxPercent(0);
  };

  const toggleDiscountType = () => {
    const newType = discountType === 'percent' ? 'fixed' : 'percent';
    setDiscountType(newType);
    setDiscountPercent(0);
  };

  const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setTaxPercent(taxType === 'percent' ? Math.min(value, 100) : value);
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setDiscountPercent(discountType === 'percent' ? Math.min(value, 100) : value);
  };

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingAmount(parseFloat(e.target.value) || 0);
  };


  // Store previous values when closing a section
  // (preserve advanced logic from user's working version)
  return (
    <div className="mb-6 ">
      {/* Toggle Buttons */}
      <div className="flex justify-end gap-3 mb-4">
        <a
          role="button"
          tabIndex={0}
          onClick={handleToggleTax}
          className={`flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium transition-colors ${
            showTax ? 'label-2' : 'label-1'
          }`}
        >
          <div className={` text-lg transition-transform duration-200 ease-in-out ${showTax ? 'rotate-45' : 'rotate-0'}`}>
               <Plus size={18} />
            </div> Tax
        </a>

        <a
          role="button"
          tabIndex={0}
          onClick={handleToggleDiscount}
          className={`flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium transition-colors ${
            showDiscount ? 'label-2' : 'label-1'
          }`}
        >

          <div className={` text-lg transition-transform duration-200 ease-in-out ${showDiscount ? 'rotate-45' : 'rotate-0'}`}>
               <Plus size={18} />
            </div> Discount
        </a>

        <a
          role="button"
          tabIndex={0}
          onClick={handleToggleShipping}
          className={`flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium transition-colors ${
            showShipping ? 'label-2' : 'label-1'
          }`}
        >
          <div className={` text-lg transition-transform duration-200 ease-in-out ${showShipping ? 'rotate-45' : 'rotate-0'}`}>
               <Plus size={18} />
            </div> Shipping
        </a>
      </div>

      {/* Input Fields */}
      <div className="flex flex-col gap-4">
        {/* Tax Input */}
        {showTax && (
          <div className="flex justify-end  items-center gap-4 ">
            <label className="text-md font-medium text-gray-600">Tax</label>
            <div className="flex items-stretch border border-gray-300 rounded-lg bg-white w-full max-w-xs">
                {taxType === 'fixed' && (
                <span className="px-4 py-3 text-gray-400 font-medium text-lg">{currency.symbol}</span>
              )}
              <input
                type="number"
                value={taxPercent}
                min="0"
                max={taxType === 'percent' ? '100' : undefined}
                step={taxType === 'percent' ? '1' : '0.01'}
                onChange={handleTaxChange}
                className="px-4 py-3 flex-1 text-center text-lg border-none outline-none bg-transparent"
                placeholder="Value"
              />
              {taxType === 'percent' && (
                <span className="px-4 py-3 text-gray-400 font-medium text-lg">%</span>
              )}
              <span
                role="button"
                tabIndex={0}
                onClick={toggleTaxType}
                className="small-icon rounded-r-[5px] p-3 border-l border-gray-300 transition-colors
                duration-200 cursor-pointer flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </span>
            </div>
            <button
              role="button"
              tabIndex={0}
              onClick={handleToggleTax}
              className={`small-icon inline-flex items-center rounded-md bg-indigo-900 px-1 py-1 text-xs font-medium
               transition-colors duration-200`}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Discount Input */}
        {showDiscount && (
          <div className="flex justify-end items-center gap-4">
            <label className="text-md font-medium text-gray-600">Discount</label>
            <div className="flex items-stretch border border-gray-300 rounded-lg bg-white w-full max-w-xs">
              {discountType === 'fixed' && (
                <span className="px-4 py-3 text-gray-400 font-medium text-lg">{currency.symbol}</span>
              )}
              <input
                type="number"
                value={discountPercent}
                min="0"
                max={discountType === 'percent' ? '100' : undefined}
                step={discountType === 'percent' ? '1' : '0.01'}
                onChange={handleDiscountChange}
                className="px-4 py-3 flex-1 text-center text-lg border-none outline-none bg-transparent"
                placeholder="Value"
              />
              {discountType === 'percent' && (
                <span className="px-4 py-3 text-gray-400 font-medium text-lg">%</span>
              )}
              <span
                role="button"
                tabIndex={0}
                onClick={toggleDiscountType}
                className="small-icon rounded-r-[5px] p-3 border-l border-gray-300 transition-colors
                duration-200 cursor-pointer flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </span>
            </div>
            <a
              role="button"
              tabIndex={0}
              onClick={handleToggleDiscount}
              className={`small-icon inline-flex items-center rounded-md bg-indigo-900 px-1 py-1 text-xs font-medium
               transition-colors duration-200`}
            >
              <X size={18} />
            </a>
          </div>
        )}

        {/* Shipping Input */}
        {showShipping && (
          <div className="flex justify-end items-center gap-4">
            <label className="text-md font-medium labels">Shipping</label>
            <div className="flex items-stretch border border-gray-300 rounded-lg bg-white w-full max-w-xs">
              <span className="px-4 py-3 text-gray-400 font-medium text-lg">{currency.symbol}</span>
              <input
                type="number"
                value={shippingAmount}
                min="0"
                step="0.01"
                onChange={handleShippingChange}
                className="px-4 py-3 flex-1 text-center text-lg border-none outline-none bg-transparent"
                placeholder="Value"
              />
              <span
                className="rounded-r-lg px-4 py-4 text-gray-700 border-l opacity-0 flex items-center justify-center"
                aria-hidden="true"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </span>

            </div>

            <a
              role="button"
              tabIndex={0}
              onClick={handleToggleShipping}
              className={`small-icon inline-flex items-center rounded-md bg-indigo-900 px-1 py-1 text-xs font-medium
               transition-colors duration-200`}
            >
              <X size={18} />
            </a>
          </div>
        )}
      </div>


    </div>

  );
};

export default TaxDiscountSection;
