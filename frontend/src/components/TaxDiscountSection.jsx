import React from 'react';
import { ArrowRightLeft, X, Plus } from 'lucide-react';


const TaxDiscountSection = ({
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
  setDiscountType
}) => {
  // Store previous values when closing a section
  const [prevTaxPercent, setPrevTaxPercent] = React.useState(taxPercent);
  const [prevDiscountPercent, setPrevDiscountPercent] = React.useState(discountPercent);
  const [prevShippingAmount, setPrevShippingAmount] = React.useState(shippingAmount);

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
    // Reset to 0 when switching types to avoid confusion
    setTaxPercent(0);
  };

  const toggleDiscountType = () => {
    const newType = discountType === 'percent' ? 'fixed' : 'percent';
    setDiscountType(newType);
    // Reset to 0 when switching types to avoid confusion
    setDiscountPercent(0);
  };

  const handleTaxChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setTaxPercent(taxType === 'percent' ? Math.min(value, 100) : value);
  };

  const handleDiscountChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setDiscountPercent(discountType === 'percent' ? Math.min(value, 100) : value);
  };

  const handleShippingChange = (e) => {
    setShippingAmount(parseFloat(e.target.value) || 0);
  };

  return (
    <div className="mb-6 ">
      {/* Toggle Buttons */}
      <div className="flex justify-end gap-3 mb-4">
        <button
          type="button"
          onClick={handleToggleTax}
          className={`flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium transition-colors ${
            showTax
              ? 'bg-green-500 text-white'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          <span className="text-lg"><Plus size={18} /></span> Tax
        </button>

        <button
          type="button"
          onClick={handleToggleDiscount}
          className={`flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium transition-colors ${
            showDiscount
              ? 'bg-green-500 text-white'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          <span className="text-lg"><Plus size={18} /></span> Discount
        </button>

        <button
          type="button"
          onClick={handleToggleShipping}
          className={`flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium transition-colors ${
            showShipping
              ? 'bg-green-500 text-white'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          <span className="text-lg"><Plus size={18} /></span> Shipping
        </button>
      </div>

      {/* Input Fields */}
      <div className="flex flex-col gap-4">
        {/* Tax Input */}
        {showTax && (
          <div className="flex justify-end  items-center gap-4 ">
            <label className="text-sm font-medium text-white-600">Tax</label>
            <div className="flex items-center border-neutral-500 rounded-lg bg-neutral-600 w-full max-w-xs">
                {taxType === 'fixed' && (
                <span className="px-4 py-3 text-gray-400 font-medium text-lg">$</span>
              )}
              <input
                type="number"
                value={taxPercent}
                min="0"
                max={taxType === 'percent' ? '100' : undefined}
                step={taxType === 'percent' ? '1' : '0.01'}
                onChange={handleTaxChange}
                className="px-4 py-3 flex-1 text-center border-none outline-none bg-transparent"
                placeholder="Value"
              />
              {taxType === 'percent' && (
                <span className="px-4 py-3 text-gray-400 font-medium text-lg">%</span>
              )}
              <span
                type="button"
                onClick={toggleTaxType}
                className="bg-green-100 rounded-r-lg hover:bg-green-200 px-4 py-4 text-gray-700 border-l border-gray-300 transition-colors duration-200 cursor-pointer flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleTax}
              className={`inline-flex items-center rounded-md bg-indigo-900 px-1 py-1 text-xs font-medium
              text-indigo-400 hover:text-indigo-300 transition-colors duration-200`}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Discount Input */}
        {showDiscount && (
          <div className="flex justify-end items-center gap-4">
            <label className="text-sm font-medium text-white-600">Discount</label>
            <div className="flex items-center border-neutral-500 rounded-lg overflow-hidden bg-neutral-600 w-full max-w-xs">
              {discountType === 'fixed' && (
                <span className="px-4 py-3 text-gray-400 font-medium text-lg">$</span>
              )}
              <input
                type="number"
                value={discountPercent}
                min="0"
                max={discountType === 'percent' ? '100' : undefined}
                step={discountType === 'percent' ? '1' : '0.01'}
                onChange={handleDiscountChange}
                className="px-4 py-3 flex-1 text-center border-none outline-none bg-transparent"
                placeholder="Value"
              />
              {discountType === 'percent' && (
                <span className="px-4 py-3 text-gray-400 font-medium text-lg">%</span>
              )}
              <span
                type="button"
                onClick={toggleDiscountType}
                className="bg-green-100 rounded-r-lg hover:bg-green-200 px-4 py-4 text-gray-700 border-l border-gray-300 transition-colors duration-200 cursor-pointer flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleDiscount}
              className={`inline-flex items-center rounded-md bg-indigo-900 px-1 py-1 text-xs font-medium
              text-indigo-400 hover:text-indigo-300 transition-colors duration-200`}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Shipping Input */}
        {showShipping && (
          <div className="flex justify-end items-center gap-4">
            <label className="text-sm font-medium text-white-600">Shipping</label>
            <div className="flex items-center border  border-neutral-500 rounded-lg overflow-hidden bg-neutral-600 w-full max-w-xs">
              <span className="px-4 py-3 text-gray-400 font-medium text-lg">$</span>
              <input
                type="number"
                value={shippingAmount}
                min="0"
                step="0.01"
                onChange={handleShippingChange}
                className="px-4 py-3 flex-1 text-center border-none outline-none bg-transparent"
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

            <button
              type="button"
              onClick={handleToggleShipping}
              className={`inline-flex items-center rounded-md bg-indigo-900 px-1 py-1 text-xs font-medium
              text-indigo-400 hover:text-indigo-300 transition-colors duration-200`}
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>


    </div>

  );
};

export default TaxDiscountSection;