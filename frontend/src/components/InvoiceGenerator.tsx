
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
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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

    // State for date picker

const [date, setDate] = React.useState<Date | undefined>(
    new Date(2025, 5, 12)
  )


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


  // --- FETCH INVOICES FROM BACKEND ---
  const fetchInvoices = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/invoices?user_id=${userId}`);
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

  // All invoice-related state is now managed by useInvoice hook

  // All helper functions are now provided by useInvoice hook

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

      // Only save if user_id and required fields are present
      const hasRequiredFields =
        userId &&
        invoiceNumber &&
        Array.isArray(items) && items.length > 0 &&
        from &&
        to;

      if (hasRequiredFields) {
        const response = await fetch("http://localhost:5000/api/invoices", {
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
    <div className="flex flex-col md:flex-row w-full m-auto justify-center  gap-8 main-container ">
      {/* Left Panel (Main Invoice Form) */}
      <div className="basis-128 max-w-5xl w-full border-2 bg-neutral-900 rounded-3xl p-8">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-6">
          <LogoUpload
            logoFile={logoFile}
            logoUrl={logoUrl}
            logoStatus={logoStatus}
            handleLogoChange={handleLogoChange}
          />
          <div className="mb-6 w-full flex flex-col sm:items-end gap-4">
            <h1 className="text-7xl">Invoice</h1>
            <div className="flex items-center gap-2">
              <input
                id="invoice-number"
                type="text"
                value={invoiceNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceNumber(e.target.value) }
                placeholder="#"
                className="w-full md:w-40 p-3 rounded-md bg-neutral-700 text-neutral-100 border border-neutral-600 focus:outline-none
                focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>
        </div>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        <header className="flex flex-col md:flex-row flex-wrap justify-between gap-6 mb-6">

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <PartyField label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
                <PartyField label="To" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>

          <div className="flex-1 w-full flex flex-col gap-4 justify-end self-start">
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
          className="mb-10 mt-2 px-4 py-2 bg-green-600 whitespace-nowrap text-white font-semibold rounded-md flex items-center gap-2"
        >
          <Plus /> Add Item
        </button>
        <div className="w-full flex-1 md:flex flex-col md:flex-row gap-6 mb-6 justify-between items-start">
          <div className="flex-1 w-full">
            <PaymentSection
              paymentDetails={paymentDetails}
              setPaymentDetails={setPaymentDetails}
              terms={terms}
              setTerms={setTerms}
            />
          </div>
          <div className="flex flex-col justify-end ">
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
        <div className="flex justify-end flex-wrap md:w-lg w-full md:bg-transparent bg-neutral-950 rounded-md">
          <div className="bg-neutral-950 rounded-md px-10 md:px-20 py-5 flex justify-end items-center gap-2">
            <span className="text-lg font-medium text-gray-200 pr-7">Total</span>
            <span className="text-lg font-medium text-gray-400">{typeof currency === 'string' ? currency : currency.code}</span>
            <span className="text-2xl font-medium text-white">{getTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
      {/* Right Sidebar */}
      <InvoiceSidebar
        loading={loading}
        onSubmit={handleInvoiceSubmit}
        onPreview={handlePreview}
        previewPdfUrl={previewPdfUrl}
        setPreviewPdfUrl={setPreviewPdfUrl}
        previewInvoiceImage={previewInvoiceImage}
      />
    </div>
  );
};

export default InvoiceGenerator;
