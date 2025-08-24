import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronDownIcon } from 'lucide-react';
import LogoUpload from './LogoUpload';
import PartyField from './PartyField';
import InvoiceLine from './InvoiceLine';
import PaymentSection from './PaymentSection';
import TaxDiscountSection from './TaxDiscountSection';
import InvoiceSidebar from './InvoiceSidebar';
import { Plus } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import useInvoice, { InvoiceItem } from '../hooks/useInvoice';
import { useAuth } from '../context/AuthContext';
import { Calendar } from "@/components/ui/calendar"
// Import the DatePicker component instead of DatePicker from calendar-22
import { DatePicker } from "@/components/date-picker"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { API_BASE_URL } from '../config/api';
import CurrencySelector from './CurrencySelector';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Generate unique ID for items (same as in useInvoice hook)
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// For now, this assumes all state/handlers are managed here; you may need to adjust if using a container/hook
const InvoiceGenerator: React.FC = () => {

  // --- NEW STATE FOR USER/CLIENT/INVOICES ---
  const { user } = useAuth();
  const userId = user?.id || user?.user_id;
  const [clientId, setClientId] = useState<string | null>(null); // Optional
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  // Use the invoice hook for all invoice-related state and functionality
  const {
    from, setFrom,
    to, setTo,
    invoiceNumber, setInvoiceNumber,
    issuedDate, setIssuedDate,
    dueDate, setDueDate,
    items, setItems,
    handleChange,
    removeItem,
    toggleDescription,
    addItem,
    taxPercent, setTaxPercent,
    discountPercent, setDiscountPercent,
    paymentDetails, setPaymentDetails,
    terms, setTerms,
    logoFile, setLogoFile,
    logoUrl, setLogoUrl,
    logoStatus, setLogoStatus,
    taxType, setTaxType,
    discountType, setDiscountType,
    showTax, setShowTax,
    showDiscount, setShowDiscount,
    showShipping, setShowShipping,
    shippingAmount, setShippingAmount,
    handleLogoChange,
    getSubtotal,
    getTaxAmount,
    getDiscountAmount,
    getShippingAmount,
    getTotal,
    handleSubmit, // This is the PDF generation function
    previewInvoice,
    previewInvoiceImage,
    loading, setLoading,
    error, setError,
  } = useInvoice();

  // Helper functions are now moved to the DatePicker component
  // Remove these helper functions as they're handled in the DatePicker

  // --- FETCH INVOICES FROM BACKEND ---
  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}api/invoices?user_id=${userId}`);
      const data = await res.json();
      if (Array.isArray(data.invoices)) {
        setInvoices(data.invoices);
      }
    } catch (e) { /* ignore for now */ }
  };
  useEffect(() => { fetchInvoices(); }, [userId]);

  // --- LOAD SELECTED INVOICE INTO FORM ---
    const loadInvoice = (invoice: any) => {
      setSelectedInvoiceId(invoice.id);
      const d = invoice.data || {};
      setFrom(d.from || "");
      setTo(d.to || "");
      // Ensure loaded items have IDs, add them if missing
      const itemsWithIds = (d.items || []).map((item: any) => ({
        ...item,
        id: item.id || generateId() // Add ID if missing
      }));
      setItems(itemsWithIds.length > 0 ? itemsWithIds : [{ id: generateId(), name: '', description: '', quantity: 1, unit_cost: 0, showDesc: false }]);
      setInvoiceNumber(d.invoice_number || "");
      setIssuedDate(d.issued_date || "");
      setDueDate(d.due_date || "");
      setPaymentDetails(d.payment_details || "");
      setTerms(d.terms || "");
      setTaxPercent(d.tax_percent || 0);
      setDiscountPercent(d.discount_percent || 0);
      setShippingAmount(d.shipping_amount || 0);
      setTaxType(d.tax_type || 'percent');
      setDiscountType(d.discount_type || 'percent');
      setShowTax(d.show_tax ?? true);
      setShowDiscount(d.show_discount ?? false);
      setShowShipping(d.show_shipping ?? true);
      setLogoUrl(d.logo_url || null);
  };

  // --- RESET FORM FOR NEW INVOICE ---
  const resetForm = () => {
    setSelectedInvoiceId(null);
    setFrom("");
    setTo("");
    setItems([{ id: generateId(), name: '', description: '', quantity: 1, unit_cost: 0, showDesc: false }]);
    setInvoiceNumber("");
    setIssuedDate("");
    setDueDate("");
    setPaymentDetails("");
    setTerms("");
    setTaxPercent(0);
    setDiscountPercent(0);
    setShippingAmount(0);
    setTaxType('percent');
    setDiscountType('percent');
    setShowTax(true);
    setShowDiscount(false);
    setShowShipping(true);
    setLogoUrl(null);
    // Optionally: setLogoFile(null);
  };

  // Handler for drag end
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setItems(reordered);
  };

  // Type-safe wrapper for handleChange to work with DraggableInvoiceItem
  const handleItemChange = (index: number, field: string, value: string | number) => {
    // Type assertion to handle the field parameter type difference
    handleChange(index, field as keyof InvoiceItem, value);
  };

  const saveInvoiceToDatabase = async () => {
    setLoading(true);
    setError(null);
    try {
      // Compose invoice data
      const invoicePayload = {
        user_id: userId,
        client_id: clientId,
        data: {
          from,
          to,
          items,
          invoice_number: invoiceNumber,
          issued_date: issuedDate,
          due_date: dueDate,
          payment_details: paymentDetails,
          terms,
          tax_percent: taxPercent,
          discount_percent: discountPercent,
          shipping_amount: shippingAmount,
          tax_type: taxType,
          discount_type: discountType,
          show_tax: showTax,
          show_discount: showDiscount,
          show_shipping: showShipping,
          logo_url: logoUrl,
          // Include all currency variants in the data object
          currency: typeof currency === 'string' ? currency : currency.code,
          currency_symbol: typeof currency === 'string' ? currency : currency.symbol,
          currency_label: typeof currency === 'string' ? currency : currency.label
        },
        issued_date: issuedDate,
        due_date: dueDate,
        status: "draft",
        // Include currency in the root object for backward compatibility
        currency: typeof currency === 'string' ? currency : currency.code,
        currency_symbol: typeof currency === 'string' ? currency : currency.symbol,
        currency_label: typeof currency === 'string' ? currency : currency.label
      };

    // Helper functions for generating default dates
    const getTodayString = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const getSevenDaysFromNowString = () => {
      const today = new Date();
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(today.getDate() + 7);
      const year = sevenDaysLater.getFullYear();
      const month = String(sevenDaysLater.getMonth() + 1).padStart(2, '0');
      const day = String(sevenDaysLater.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const getTodayFormatted = () => {
      const today = new Date();
      return today.toLocaleDateString();
    };

    const getSevenDaysFromNowFormatted = () => {
      const today = new Date();
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(today.getDate() + 7);
      return sevenDaysLater.toLocaleDateString();
    };


      // Only save if user_id and required fields are present
      const hasRequiredFields =
        userId &&
        invoiceNumber &&
        Array.isArray(items) && items.length > 0 &&
        from &&
        to;

      if (hasRequiredFields) {
        const response = await fetch(`${API_BASE_URL}api/invoices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invoicePayload)
        });
        const result = await response.json();
        if (result.success) {
          // Don't show alert here, we'll show it after PDF generation
          fetchInvoices(); // Refresh invoice list
          return true;
        } else {
          setError(result.error || "Failed to save invoice.");
          return false;
        }
      }
      return false;
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the invoice.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceSubmit = async () => {
    // First save to database
    const saved = await saveInvoiceToDatabase();

    // Then generate and download PDF
    await handleSubmit();

    // Show success message if saved successfully
    if (saved) {
      alert("Invoice saved and downloaded successfully!");
    } else {
      alert("Invoice downloaded (not saved to database). Please check required fields and try again to save.");
    }
  };

  const handlePreview = async () => {
    try {
      const previewUrl = await previewInvoiceImage();
      if (previewUrl) {
        setPreviewPdfUrl(previewUrl);
      }
    } catch (err) {
      console.error('Error generating preview:', err);
    }
  };

  const { currency } = useCurrency();

  const handleSelectInvoice = (invoice: any) => {
    if (invoice.id === 'new') {
      resetForm();
    } else {
      loadInvoice(invoice);
    }
    setDropdownOpen(false);
  };

  return (
    <div className="py-6 flex flex-col md:flex-row w-full m-auto justify-center gap-4 lg:gap-8  p-2 sm:p-8 mb-20">
      {/* Left Panel (Main Invoice Form) */}
      <div className="basis-full xl:basis-128 max-w-full xl:max-w-5xl border !border-gray-200 w-full bg-neutral-900 rounded-2xl p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
          <div className="w-full sm:w-auto">
            <LogoUpload
              logoFile={logoFile}
              logoUrl={logoUrl}
              logoStatus={logoStatus}
              handleLogoChange={handleLogoChange}
            />
          </div>
          <div className="mb-6 w-full sm:w-auto flex flex-col sm:items-end gap-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl">Invoice</h1>
            <div className="flex sm:flex-col items-end justify-between gap-2">
              <input
                id="invoice-number"
                type="text"
                value={invoiceNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceNumber(e.target.value) }
                placeholder="#"
                className="w-full sm:w-36 md:w-40 px-3 py-2.5 rounded-md bg-neutral-700 text-neutral-100 border !border-gray-300 focus:outline-none
                focus:ring-1 focus:ring-indigo-400"
              />

              {/* Currency Selector beside invoice number */}
              <div className="mt-0 md:hidden flex-1">
                {(() => {
                  const { currency, setCurrency, currencyOptions } = useCurrency();
                  return <CurrencySelector currency={currency} setCurrency={setCurrency} currencyOptions={currencyOptions} />;
                })()}
              </div>
            </div>


          </div>
        </div>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        <header className="flex flex-col lg:flex-row items-start md:flex-wrap justify-between gap-6 mb-6">

            <div className="flex flex-col lg:flex-row gap-4 mb-6 w-full lg:w-auto">
                <div className="w-full lg:w-auto">
                  <PartyField label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div className="w-full lg:w-auto">
                  <PartyField label="To" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
              </div>

          <div className=" flex flex-col gap-4 justify-end  lg:self-auto">
            {/* Updated Issued Date with DatePicker */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
              <DatePicker
                label="Issued Date"
                placeholder="Select issued date"
                value={issuedDate}
                onChange={setIssuedDate}
                id="issued-date"
                className="w-full sm:w-40 [&_.px-1]:text-neutral-500 [&_.px-1]:text-sm [&_.px-1]:sm:min-w-fit"

              />
            </div>

            {/* Updated Due Date with DatePicker */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
              <DatePicker
                label="Due Date"
                placeholder="Select due date"
                value={dueDate}
                onChange={setDueDate}
                id="due-date"
                className="w-full sm:w-40 [&_.px-1]:text-neutral-500 [&_.px-1]:text-sm [&_.px-1]:sm:min-w-fit"

              />
            </div>
          </div>
        </header>

<div className="bg-gray-900 text-white px-4 py-2.5 rounded-lg mb-4">
  <div className="grid grid-cols-12 gap-4 items-center">
    <div className="col-span-6">
      <span className="text-md lg:ml-5 font-medium">Item</span>
    </div>
    <div className="col-span-2 text-center">
      <span className="text-md hidden lg:ml-10 lg:inline font-medium">Qty</span>
    </div>
    <div className="col-span-2 text-center">
      <span className="text-md hidden lg:inline lg:mr-10 font-medium">Rate</span>
    </div>
    <div className="col-span-2 text-right">
      <span className="text-md hidden lg:inline lg:mr-6 font-medium">Amount</span>
    </div>
  </div>
</div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="invoice-lines-droppable" type="CARD">
            {(provided: any) => {
              // Handle the Droppable props manually to avoid defaultProps warning
              const droppableProps = {
                ...provided.droppableProps,
                // Add any default props you need here
              };

              return (
                <div ref={provided.innerRef} {...droppableProps}>
                  {items?.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided) => (
                        <InvoiceLine
                          provided={provided}
                          snapshot={provided.draggableProps}
                          item={item}
                          index={index}
                          draggableId={item.id}
                          onChange={handleItemChange}
                          onRemove={() => removeItem(index)}
                          onToggleDescription={() => toggleDescription(index)}
                          itemsLength={items.length}
                        />
                      )}
                    </Draggable>
                ))}
                  {provided.placeholder}
                </div>
              );
            }}
          </Droppable>
        </DragDropContext>
        <button
          onClick={addItem}
          className="mb-10 mt-2 lg:ml-[1.6rem] px-4 py-3 bg-[#6CDD82] hover:bg-[#39C454] whitespace-nowrap
          text-black font-medium rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Add Item
        </button>
        <div className="w-full flex-1 flex flex-col lg:flex-row gap-6 mb-6 justify-between items-start">
          <div className="flex-1 w-full">
            <PaymentSection
              paymentDetails={paymentDetails}
              setPaymentDetails={setPaymentDetails}
              terms={terms}
              setTerms={setTerms}
            />
          </div>
          <div className="flex flex-col justify-end w-full lg:w-auto">
            {/* Subtotal Display */}
            <div className="mb-2 flex justify-between lg:justify-end mb-5">
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
        <div className="flex justify-end flex-wrap w-full">
          <div className="bg-neutral-950 rounded-md px-6 sm:px-10 lg:px-20 py-5 flex justify-end items-center gap-2 w-full sm:w-auto">
            <span className="text-lg font-medium text-gray-200 pr-3 sm:pr-7">Total</span>
            <span className="text-lg font-medium text-gray-400">{typeof currency === 'string' ? currency : currency.code}</span>
            <span className="text-xl sm:text-2xl font-medium text-white">{getTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
      {/* Right Sidebar */}
      <div className="w-full sm:w-auto md:flex-shrink-0">
        <InvoiceSidebar
          loading={loading}
          onSubmit={handleInvoiceSubmit}
          onPreview={handlePreview}
          previewPdfUrl={previewPdfUrl}
          setPreviewPdfUrl={setPreviewPdfUrl}
          previewInvoiceImage={previewInvoiceImage}
        />
      </div>
    </div>
  );
};

export default InvoiceGenerator;