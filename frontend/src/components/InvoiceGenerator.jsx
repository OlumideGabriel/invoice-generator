import React, { useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import LogoUpload from './LogoUpload';
import PartyField from './PartyField';
import InvoiceLine from './InvoiceLine';
import TaxDiscountSection from './TaxDiscountSection';
import PaymentSection from './PaymentSection';
import TotalsDisplay from './TotalsDisplay';
import InvoiceButton from './InvoiceButton';
import { Plus, X } from 'lucide-react';
import useInvoice from '../hooks/useInvoice';

const InvoiceGenerator = ({
  from,
  to,
  setFrom,
  setTo,
  items,
  handleChange,
  removeItem,
  toggleDescription,
  addItem,
  taxPercent = 0,
  setTaxPercent,
  discountPercent = 0,
  setDiscountPercent,
  paymentDetails,
  setPaymentDetails,
  paymentInstructions,
  setPaymentInstructions,
  logoFile,
  logoUrl,
  logoStatus,
  handleLogoChange,
  getSubtotal,
  getTaxAmount,
  getDiscountAmount,
  getShippingAmount,
  getTotal,
  handleSubmit,
  previewInvoice,
  invoiceNumber = '',
  setInvoiceNumber,
  issuedDate = '',
  setIssuedDate,
  dueDate = '',
  setDueDate,
  loading,
  error,
  previewInvoiceImage,
  previewPdfUrl,
  setPreviewPdfUrl,
  showTax = false,
  setShowTax,
  showDiscount = false,
  setShowDiscount,
  showShipping = false,
  setShowShipping,
  shippingAmount = 0,
  setShippingAmount,
  taxType: propTaxType = 'percent',
  setTaxType: propSetTaxType,
  discountType: propDiscountType = 'percent',
  setDiscountType: propSetDiscountType,
}) => {
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  // Local state fallbacks if props aren't provided
  const [localTaxType, setLocalTaxType] = useState(propTaxType);
  const [localDiscountType, setLocalDiscountType] = useState(propDiscountType);

  // Use props if available, otherwise use local state
  const taxType = propSetTaxType ? propTaxType : localTaxType;
  const setTaxType = propSetTaxType || setLocalTaxType;
  const discountType = propSetDiscountType ? propDiscountType : localDiscountType;
  const setDiscountType = propSetDiscountType || setLocalDiscountType;

  // Error-proof calculation functions
  const safeGetSubtotal = () => {
    try {
      return getSubtotal ? getSubtotal() : items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    } catch (e) {
      console.error("Error calculating subtotal:", e);
      return 0;
    }
  };

  const safeGetTaxAmount = () => {
    if (!showTax) return 0;
    try {
      if (taxType === 'percent') {
        return safeGetSubtotal() * (Math.min(100, Math.max(0, taxPercent || 0)) / 100);
      }
      return Math.max(0, taxPercent || 0);
    } catch (e) {
      console.error("Error calculating tax:", e);
      return 0;
    }
  };

  const safeGetDiscountAmount = () => {
    if (!showDiscount) return 0;
    try {
      if (discountType === 'percent') {
        return safeGetSubtotal() * (Math.min(100, Math.max(0, discountPercent || 0)) / 100);
      }
      return Math.max(0, discountPercent || 0);
    } catch (e) {
      console.error("Error calculating discount:", e);
      return 0;
    }
  };

  const safeGetTotal = () => {
    try {
      const subtotal = safeGetSubtotal();
      const tax = safeGetTaxAmount();
      const discount = safeGetDiscountAmount();
      const shipping = showShipping ? Math.max(0, shippingAmount || 0) : 0;
      return subtotal + tax - discount + shipping;
    } catch (e) {
      console.error("Error calculating total:", e);
      return 0;
    }
  };

  const safeGetShippingAmount = () => {
    try {
      return showShipping ? Math.max(0, shippingAmount || 0) : 0;
    } catch (e) {
      console.error("Error calculating shipping:", e);
      return 0;
    }
  };

  const { currency } = useCurrency();

  return (
    <div className="flex flex-row w-full m-auto items-start gap-8 min-h-screen">
      {/* Left Panel (Main Invoice Form) */}
      <div className="basis-128 max-w-5xl w-full bg-neutral-800 shadow-xl rounded-2xl p-8 overflow-auto">
        <div className="flex items-start justify-between mb-6">
          <LogoUpload
            logoFile={logoFile}
            logoUrl={logoUrl}
            logoStatus={logoStatus}
            handleLogoChange={handleLogoChange}
          />
          <div className="mb-6 flex flex-col sm:items-end gap-4">
            <h1 className="text-7xl text-indigo-400">Invoice</h1>
            <div className="flex items-center gap-2">
              <input
                id="invoice-number"
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="#"
                className="w-40 p-2 rounded-md bg-neutral-700 text-neutral-100 border border-neutral-600
                focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>
        </div>

        {error && <div className="text-red-400 mb-4">{error}</div>}

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex-1">
            <div className="from-to-group">
              <PartyField label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
              <PartyField label="To" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
              <label className="text-sm text-neutral-300">Issued Date</label>
              <input
                type="date"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
                className="w-full sm:w-40 p-2 rounded-md bg-neutral-700 text-neutral-100 border border-neutral-600"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
              <label className="text-sm text-neutral-300">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full sm:w-40 p-2 rounded-md bg-neutral-700 text-neutral-100 border border-neutral-600"
              />
            </div>
          </div>
        </header>

        <h2 className="text-xl font-semibold mb-4 text-indigo-300">Items</h2>
        {items?.map((item, index) => (
          <InvoiceLine
            key={index}
            item={item}
            index={index}
            onChange={handleChange}
            onRemove={removeItem}
            onToggleDescription={toggleDescription}
            itemsLength={items.length}
          />
        ))}

        <button
          onClick={addItem}
          className="mb-6 px-4 py-2 bg-indigo-500 whitespace-nowrap hover:bg-indigo-400
            text-white font-semibold rounded-md flex items-center gap-2"
        >
          <Plus /> Add Item
        </button>

        <div className="w-full flex flex-col md:flex-row gap-6 mb-6 justify-between items-start">
          <div className="flex-1">
            <PaymentSection
              paymentDetails={paymentDetails}
              setPaymentDetails={setPaymentDetails}
              paymentInstructions={paymentInstructions}
              setPaymentInstructions={setPaymentInstructions}
            />
          </div>
          <div className="flex-1">
            <TaxDiscountSection
              taxPercent={taxPercent}
              setTaxPercent={setTaxPercent}
              discountPercent={discountPercent}
              setDiscountPercent={setDiscountPercent}
              shippingAmount={shippingAmount}
              setShippingAmount={setShippingAmount}
              showTax={showTax}
              setShowTax={setShowTax}
              showDiscount={showDiscount}
              setShowDiscount={setShowDiscount}
              showShipping={showShipping}
              setShowShipping={setShowShipping}
              taxType={taxType}
              setTaxType={setTaxType}
              discountType={discountType}
              setDiscountType={setDiscountType}
            />
          </div>
        </div>

        <TotalsDisplay
          subtotal={safeGetSubtotal()}
          taxAmount={safeGetTaxAmount()}
          discountAmount={safeGetDiscountAmount()}
          shippingAmount={safeGetShippingAmount()}
          total={safeGetTotal()}
          currency={currency}
        />
      </div>

      {/* Right Sidebar */}
      <div className="w-64 hidden md:flex flex-col sticky top-0 right-4 z-50 self-start space-y-4">
        <InvoiceButton loading={loading} onClick={handleSubmit} />

        <button
          onClick={async () => {
            const url = await previewInvoiceImage();
            if (url) setPreviewImageUrl(url);
          }}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md"
        >
          Preview Invoice
        </button>

        {previewPdfUrl && (
          <div className="mt-10 border border-neutral-700 rounded-md overflow-hidden bg-white">
            <div className="flex justify-between items-center p-4 bg-neutral-900">
              <h3 className="text-lg font-semibold text-indigo-300">Preview</h3>
              <button
                onClick={() => {
                  URL.revokeObjectURL(previewPdfUrl);
                  setPreviewPdfUrl(null);
                }}
                className="text-sm text-red-400 hover:underline"
              >
                <X size={18} />
              </button>
            </div>
            <object
              data={previewPdfUrl}
              type="application/pdf"
              className="w-full h-[90vh]"
            >
              <p className="text-sm text-neutral-800 p-4">
                Your browser doesn't support PDF preview.{' '}
                <a
                  href={previewPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-500 underline"
                >
                  Download instead
                </a>
              </p>
            </object>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceGenerator;