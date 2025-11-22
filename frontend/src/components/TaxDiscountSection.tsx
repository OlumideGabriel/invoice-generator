import React from 'react';
import { ArrowRightLeft, X, Plus, Minus, SquareMinus } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import Tooltip from './Tooltip';

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
    <div className="mb-6">
      {/* Toggle Buttons */}
      <div className="flex justify-end gap-2 mb-4">

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
      <div className="flex flex-col gap-2">
        {/* Tax Input */}
        {showTax && (
          <div className="flex text-box justify-end items-center gap-2 ">
            <label className="text-sm font-medium labels">Tax</label>
            <div className="flex relative items-stretch border border-gray-300 rounded-lg bg-white w-64 max-w-xs">
                {taxType === 'fixed' && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-md font-medium">
                  {currency.symbol}
                </span>
              )}
              <input
                type="number"
                value={taxPercent}
                min="0"
                max={taxType === 'percent' ? '100' : undefined}
                step={taxType === 'percent' ? '1' : '0.01'}
                onChange={handleTaxChange}
                className="px-4 py-3 flex-1 text-center text-md border-none outline-none bg-transparent"
                placeholder="Value"
              />
              {taxType === 'percent' && (
                <span className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-500 text-md font-medium">
                  %
                </span>
              )}

              <a
                role="button"
                tabIndex={0}
                onClick={toggleTaxType}
                className="small-icon absolute right-0 top-1/2 -translate-y-1/2 rounded-r-[7px] p-2
                items-stretch border-3 border-green-300 transition-colors
                duration-200 cursor-pointer flex items-center self-stretch justify-center"
              >
                <svg className="w-6 h-[1.66rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </a>

            </div>
            <button
              role="button"
              tabIndex={0}
              onClick={handleToggleTax}
              className={`remove inline-flex items-center rounded-md bg-indigo-900 px-1 py-1 text-xs font-medium
               transition-colors duration-200`}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Discount Input */}
        {showDiscount && (
          <div className="flex text-box justify-end items-center gap-2">
            <label className="text-sm font-medium labels">Discount</label>
            <div className="flex relative  border border-gray-300 rounded-lg bg-white w-64 max-w-xs">
              {discountType === 'fixed' && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-md font-medium">
                  {currency.symbol}
                </span>
              )}
              <input
                type="number"
                value={discountPercent}
                min="0"
                max={discountType === 'percent' ? '100' : undefined}
                step={discountType === 'percent' ? '1' : '0.01'}
                onChange={handleDiscountChange}
                className="px-4 py-3 flex-1 text-center text-md border-none outline-none bg-transparent"
                placeholder="Value"
              />
              {discountType === 'percent' && (
                <span className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-500 text-md font-medium">
                  %
                </span>
              )}
              <span
                role="button"
                tabIndex={0}
                onClick={toggleDiscountType}
                className="small-icon absolute right-0 top-1/2 -translate-y-1/2 rounded-r-[7px] p-2
                 transition-colors
                duration-200 cursor-pointer flex items-center self-stretch justify-center"
              >
                <svg className="w-6 h-[1.66rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </span>
            </div>
            <a
              role="button"
              tabIndex={0}
              onClick={handleToggleDiscount}
              className={`remove inline-flex items-center rounded-md bg-indigo-900 px-1 py-1 text-xs font-medium
               transition-colors duration-200`}
            >
              <X size={18} />
            </a>
          </div>
        )}

        {/* Shipping Input */}
        {showShipping && (
          <div className="flex justify-end items-center gap-2">
            <label className="text-sm font-medium labels">Shipping</label>
            <div className=" relative flex items-stretch border border-gray-300 rounded-lg bg-white w-64 max-w-xs">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-md font-medium">
                  {currency.symbol}
                </span>
              <input
                type="number"
                value={shippingAmount}
                min="0"
                step="0.01"
                onChange={handleShippingChange}
                className="px-4 py-3 flex-1 text-center text-md border-none outline-none bg-transparent"
                placeholder="Value"
              />
              <span
                tabIndex={0}
                className="absolute right-0 top-1/2 -translate-y-1/2 rounded-r-[7px] p-2
                 transition-colors
                duration-200 flex items-center opacity-0 self-stretch justify-center"
              >
                <svg className="w-6 h-[1.66rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </span>

            </div>

            <a
              role="button"
              tabIndex={0}
              onClick={handleToggleShipping}
              className={`remove inline-flex items-center rounded-md bg-indigo-900 px-1 py-1 text-xs font-medium
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
