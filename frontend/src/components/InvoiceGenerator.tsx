import React, { useState } from 'react';
import LogoUpload from './LogoUpload';
import PartyField from './PartyField';
import InvoiceLine from './InvoiceLine';
import PaymentSection from './PaymentSection';
import TaxDiscountSection from './TaxDiscountSection';
import InvoiceSidebar from './InvoiceSidebar';
import { Plus } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

// Add appropriate prop types as needed for your hooks and props
// For now, this assumes all state/handlers are managed here; you may need to adjust if using a container/hook
const InvoiceGenerator: React.FC = () => {
  // Example state hooks (replace with your actual state management or hooks)
  const [items, setItems] = useState<any[]>([
  { name: '', description: '', quantity: 1, unit_cost: 0, showDescription: false }
]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoStatus, setLogoStatus] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState('');
  const [terms, setTerms] = useState('');
  const [taxPercent, setTaxPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [showTax, setShowTax] = useState(true);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showShipping, setShowShipping] = useState(true);
  const [shippingAmount, setShippingAmount] = useState(0);
  const [taxType, setTaxType] = useState<'percent' | 'fixed'>('percent');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [loading, setLoading] = useState(false);
  const [previewInvoiceImage, setPreviewInvoiceImage] = useState<string | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  // Calculation helpers
  const getSubtotal = () => items.reduce((sum, item) => sum + (item.unit_cost * item.quantity), 0);
  const getTaxAmount = () => showTax ? (taxType === 'percent' ? getSubtotal() * (taxPercent / 100) : taxPercent) : 0;
  const getDiscountAmount = () => showDiscount ? (discountType === 'percent' ? getSubtotal() * (discountPercent / 100) : discountPercent) : 0;
  const getShippingAmount = () => showShipping ? shippingAmount : 0;
  const getTotal = () => getSubtotal() + getTaxAmount() - getDiscountAmount() + getShippingAmount();

  const handleLogoChange = (file: File | null, url: string | null) => {
    setLogoFile(file);
    setLogoUrl(url);
    setLogoStatus(file ? 'Logo uploaded' : '');
  };

  const handleChange = (index: number, field: string, value: any) => {
    setItems(items => items.map((item, i) => {
      if (i !== index) return item;
      let parsed = value;
      if (field === 'quantity' || field === 'unit_cost') {
        parsed = Math.max(0, parseFloat(value) || 0);
      }
      return { ...item, [field]: parsed };
    }));
  };

  const removeItem = (index: number) => setItems(items => items.filter((_, i) => i !== index));
  const addItem = () => setItems(items => [...items, { description: '', quantity: 1, unit_cost: 0 }]);
  const toggleDescription = (index: number) => {
    setItems(items => items.map((item, i) => i === index ? { ...item, showDescription: !item.showDescription } : item));
  };

  const handleSubmit = () => {
    setLoading(true);
    // TODO: Implement submit logic
    setTimeout(() => setLoading(false), 1000);
  };

  const { currency } = useCurrency();

  return (
    <div className="flex flex-row w-full m-auto content-center gap-8 main-container">
      {/* Left Panel (Main Invoice Form) */}
      <div className="basis-128 max-w-5xl w-full border-2 bg-neutral-900 rounded-3xl p-8 overflow-auto">
        <div className="flex items-start justify-between mb-6">
          <LogoUpload
            logoFile={logoFile}
            logoUrl={logoUrl}
            logoStatus={logoStatus}
            handleLogoChange={handleLogoChange}
          />
          <div className="mb-6 flex flex-col sm:items-end gap-4">
            <h1 className="text-7xl">Invoice</h1>
            <div className="flex items-center gap-2">
              <input
                id="invoice-number"
                type="text"
                value={invoiceNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceNumber(e.target.value) }
                placeholder="#"
                className="w-40 p-2 rounded-md bg-neutral-700 text-neutral-100 border border-neutral-600 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>
        </div>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        <header className="flex flex-row justify-between gap-6 mb-6">
          <div className="flex-1">
            <div className="flex flex-row gap-6 mb-6">
                <PartyField label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
                <PartyField label="To" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
          </div>
          <div className="flex-1 flex flex-col gap-4 justify-end self-start">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
              <label className="text-sm text-neutral-500">Issued Date</label>
              <input
                type="date"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
                className="w-full sm:w-40 p-2 rounded-md bg-neutral-700 text-neutral-100 border border-neutral-600"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
              <label className="text-sm text-neutral-500">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full sm:w-40 p-2 rounded-md bg-neutral-700 text-neutral-100 border border-neutral-600"
              />
            </div>
          </div>
        </header>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Items</h2>
        {items?.map((item, index) => (
          <InvoiceLine
            key={index}
            item={item}
            index={index}
            onChange={handleChange}
            onRemove={() => removeItem(index)}
            onToggleDescription={() => toggleDescription(index)}
            itemsLength={items.length}
          />
        ))}
        <button
          onClick={addItem}
          className="mb-10 mt-2 px-4 py-2 bg-green-600 whitespace-nowrap text-white font-semibold rounded-md flex items-center gap-2"
        >
          <Plus /> Add Item
        </button>
        <div className="w-full flex flex-col md:flex-row gap-6 mb-6 justify-between items-start">
          <div className="flex-1">
            <PaymentSection
              paymentDetails={paymentDetails}
              setPaymentDetails={setPaymentDetails}
              terms={terms}
              setTerms={setTerms}
            />
          </div>
          <div className="flex-1">
            {/* Subtotal Display */}
            <div className="mb-2 flex justify-end mb-5">
              <span className="text-gray-500 font-medium mr-2">Subtotal:</span>
              <span className="font-semibold">{getSubtotal().toLocaleString(undefined, { style: 'currency', currency: typeof currency === 'string' ? currency : currency.code })}</span>
            </div>
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
              setTaxType={setTaxType as (val: 'percent' | 'fixed') => void}
              discountType={discountType}
              setDiscountType={setDiscountType as (val: 'percent' | 'fixed') => void}
            />
          </div>


        </div>
        {/* Total Display at bottom right - styled to match screenshot */}
        <div className="flex justify-end relative">
          <div className="bg-neutral-950 rounded-md px-20 py-5 flex items-center gap-2" style={{minWidth:'350px'}}>
            <span className="text-lg font-medium text-gray-200 pr-7">Total</span>
            <span className="text-lg font-medium text-gray-400">{typeof currency === 'string' ? currency : currency.code}</span>
            <span className="text-2xl font-medium text-white">{getTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

      </div>

      {/* Right Sidebar */}
      <InvoiceSidebar
        loading={loading}
        onSubmit={handleSubmit}
        onPreview={() => setPreviewInvoiceImage('')}
        previewPdfUrl={previewPdfUrl}
        setPreviewPdfUrl={setPreviewPdfUrl}
        previewInvoiceImage={previewInvoiceImage}
      />
    </div>
  );
};

export default InvoiceGenerator;
