import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronDownIcon, Plus } from 'lucide-react';
import LogoUpload from './LogoUpload';
import PartyField from './PartyField';
import InvoiceLine from './InvoiceLine';
import PaymentSection from './PaymentSection';
import TaxDiscountSection from './TaxDiscountSection';
import InvoiceSidebar from './InvoiceSidebar';
import { useCurrency } from '../context/CurrencyContext';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import useInvoice, { InvoiceItem } from '../hooks/useInvoice';
import { useAuth } from '../context/AuthContext';
import { DatePicker } from "@/components/date-picker"
import { API_BASE_URL } from '../config/api';
import CurrencySelector from './CurrencySelector';
import Footer from './Footer';
import { CircleAlert, X } from 'lucide-react';
import Home from '../pages/Home';

// Generate unique ID for items (same as in useInvoice hook)
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

// localStorage utility functions
const localStorageKeys = {
  INVOICE_DATA: 'invoiceData',
  LAST_SAVED: 'lastSavedInvoice'
};

const saveInvoiceToLocalStorage = (invoiceData: any) => {
  try {
    localStorage.setItem(localStorageKeys.INVOICE_DATA, JSON.stringify(invoiceData));
    localStorage.setItem(localStorageKeys.LAST_SAVED, new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

const loadInvoiceFromLocalStorage = () => {
  try {
    const data = localStorage.getItem(localStorageKeys.INVOICE_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

const clearInvoiceFromLocalStorage = () => {
  try {
    localStorage.removeItem(localStorageKeys.INVOICE_DATA);
    localStorage.removeItem(localStorageKeys.LAST_SAVED);
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};

// For now, this assumes all state/handlers are managed here; you may need to adjust if using a container/hook
const InvoiceGenerator: React.FC = () => {
  // --- NEW STATE FOR USER/CLIENT/INVOICES ---
  const { user } = useAuth();
  const userId = user?.id || user?.user_id;
  const [clientId, setClientId] = useState<string | null>(null); // Optional
  const [businessId, setBusinessId] = useState<string | null>(null); // Optional
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // For download
  const [previewLoading, setPreviewLoading] = useState(false); // For preview
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

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
    error, setError,
  } = useInvoice();

  const { currency, setCurrency, currencyOptions } = useCurrency();

  // --- FETCH INVOICES FROM BACKEND ---
  const fetchInvoices = async () => {
      if (!userId) return;

      try {
        const res = await fetch(`${API_BASE_URL}api/invoices?user_id=${userId}`);
        const data = await res.json();
        if (Array.isArray(data.invoices)) {
          setInvoices(data.invoices);

          // Find max invoice number
          const numbers = data.invoices
            .map((inv: any) => {
              const raw = inv.data?.invoice_number || "";
              const num = raw.replace("", ""); // strip prefix
              return parseInt(num, 10);
            })
            .filter((n: number) => !isNaN(n));

          if (numbers.length > 0) {
            const next = Math.max(...numbers) + 1;
            setInvoiceNumber(`${next.toString().padStart(4, "0")}`);
          } else {
            setInvoiceNumber("0001");
          }
        }
      } catch (e) {
        // ignore for now
      }
    };

  // Load from localStorage on component mount
  useEffect(() => {
    const savedInvoice = loadInvoiceFromLocalStorage();
    if (savedInvoice) {
      // Only load if we don't have a selected invoice from the backend
      if (!selectedInvoiceId) {
        loadInvoiceFromLocalData(savedInvoice);
      }
    }

    // Load last saved time
    const lastSaved = localStorage.getItem(localStorageKeys.LAST_SAVED);
    if (lastSaved) {
      setLastSavedTime(new Date(lastSaved).toLocaleString());
    }
  }, []);

  // Save to localStorage whenever invoice data changes
  useEffect(() => {
    const invoiceData = {
      from,
      to,
      items,
      invoiceNumber,
      issuedDate,
      dueDate,
      paymentDetails,
      terms,
      taxPercent,
      discountPercent,
      shippingAmount,
      taxType,
      discountType,
      showTax,
      showDiscount,
      showShipping,
      logoUrl,
      currency: typeof currency === 'string' ? currency : currency.code
    };

    // Debounce the save to prevent too frequent writes
    const timeoutId = setTimeout(() => {
      saveInvoiceToLocalStorage(invoiceData);
      setLastSavedTime(new Date().toLocaleString());
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    from, to, items, invoiceNumber, issuedDate, dueDate,
    paymentDetails, terms, taxPercent, discountPercent,
    shippingAmount, taxType, discountType, showTax,
    showDiscount, showShipping, logoUrl, currency
  ]);

  useEffect(() => {
    fetchInvoices();
  }, [userId]);

  // Function to load data from localStorage
  const loadInvoiceFromLocalData = (data: any) => {
    setFrom(data.from || "");
    setTo(data.to || "");

    // Ensure items have IDs
    const itemsWithIds = (data.items || []).map((item: any) => ({
      ...item,
      id: item.id || generateId()
    }));

    setItems(itemsWithIds.length > 0 ? itemsWithIds : [
      { id: generateId(), name: '', description: '', quantity: 1, unit_cost: 0, showDesc: false }
    ]);

    setInvoiceNumber(data.invoiceNumber || "0001");
    setIssuedDate(data.issuedDate || getTodayString());
    setDueDate(data.dueDate || getSevenDaysFromNowString());
    setPaymentDetails(data.paymentDetails || "");
    setTerms(data.terms || "");
    setTaxPercent(data.taxPercent || 0);
    setDiscountPercent(data.discountPercent || 0);
    setShippingAmount(data.shippingAmount || 0);
    setTaxType(data.taxType || 'percent');
    setDiscountType(data.discountType || 'percent');
    setShowTax(data.showTax ?? true);
    setShowDiscount(data.showDiscount ?? false);
    setShowShipping(data.showShipping ?? true);
    setLogoUrl(data.logoUrl || null);

    // Set currency if it exists in saved data
    if (data.currency) {
      const currencyOption = currencyOptions.find(
        (opt: any) => opt.code === data.currency || opt === data.currency
      );
      if (currencyOption) {
        setCurrency(currencyOption);
      }
    }
  };

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

      setInvoiceNumber((prev) => {
        const num = parseInt(prev?.replace("", ""), 10);
        const next = isNaN(num) ? 1 : num + 1;
        return `${next.toString().padStart(4, "0")}`;
      });

      setIssuedDate(getTodayString());
      setDueDate(getSevenDaysFromNowString());
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

      // Clear localStorage when resetting form
      clearInvoiceFromLocalStorage();
      setLastSavedTime(null);
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
        business_id: businessId,
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
  setLoading(true);
  try {
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
  } catch (error) {
    console.error("Error in invoice submission:", error);
    alert("An error occurred while processing your invoice.");
  } finally {
    setLoading(false);
  }
};

const handlePreview = async () => {
  setPreviewLoading(true);
  try {
    // Your existing preview logic
    const pdfUrl = await previewInvoice();
    if (pdfUrl) {
      setPreviewPdfUrl(pdfUrl);
    }
  } catch (error) {
    console.error("Error generating preview:", error);
  } finally {
    setPreviewLoading(false);
  }
};

  const handleSelectInvoice = (invoice: any) => {
    if (invoice.id === 'new') {
      resetForm();
    } else {
      loadInvoice(invoice);
    }
    setDropdownOpen(false);
  };

  // Manual save to localStorage function
  const manualSaveToLocalStorage = () => {
    const invoiceData = {
      from, to, items, invoiceNumber, issuedDate, dueDate,
      paymentDetails, terms, taxPercent, discountPercent,
      shippingAmount, taxType, discountType, showTax,
      showDiscount, showShipping, logoUrl,
      currency: typeof currency === 'string' ? currency : currency.code
    };
    saveInvoiceToLocalStorage(invoiceData);
    setLastSavedTime(new Date().toLocaleString());
    alert('Invoice saved to browser storage!');
  };

  // Manual load from localStorage function
  const manualLoadFromLocalStorage = () => {
    const saved = loadInvoiceFromLocalStorage();
    if (saved) {
      loadInvoiceFromLocalData(saved);
      alert('Invoice loaded from browser storage!');
    } else {
      alert('No invoice found in browser storage.');
    }
  };

  // Manual clear localStorage function
  const manualClearLocalStorage = () => {
    clearInvoiceFromLocalStorage();
    setLastSavedTime(null);
    alert('Browser storage cleared!');
  };

  return (

    <div className="py-6 flex flex-col md:flex-row w-full xl:max-w-7xl m-auto justify-center gap-4 lg:gap-8 p-0 sm:p-8 pb-20">
      {/* Left Panel (Main Invoice Form) */}
      <div className="block flex-col w-full gap-4">
        {error && (
  <div className="sticky top-0 z-50">
    <div className="flex items-center max-w-full xl:max-w-7xl gap-3 text-amber-700 bg-amber-50 px-4 py-3 rounded-lg shadow-sm border  border-amber-100 mb-4 mx-auto">
      <CircleAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
      <span className="flex-1">{error}</span>
      <button
        onClick={() => setError('')}
        className="text-amber-500 hover:text-amber-700 transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
)}
      <div className="basis-full xl:basis-128 max-w-full xl:max-w-5xl border-none sm:border border-gray-200 w-full bg-transparent sm:bg-white rounded-2xl p-4 sm:p-6 lg:p-8">

        {/* Auto-save indicator */}
        {lastSavedTime && (
          <div className="text-xs hidden text-gray-500 mb-2 text-right">
            Auto-saved: {lastSavedTime}
          </div>
        )}

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
                <CurrencySelector currency={currency} setCurrency={setCurrency} currencyOptions={currencyOptions} />
              </div>
            </div>
          </div>
        </div>
        <header className="flex flex-col lg:flex-row items-end md:flex-nowrap justify-between gap-6 mb-10">
          <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
            <div className="w-full lg:w-auto">
              <PartyField
                label="From"
                value={from}
                placeholder="Sender's name..."
                noResultsText="Business not found"
                onChange={(e) => setFrom(e.target.value)}
                apiConfig={{
                  endpoint: '/api/businesses',
                  userId: userId
                }}
              />
            </div>
            <div className="w-full lg:w-auto">
              <PartyField
                label="To"
                value={to}
                placeholder="Who is this invoice to?"
                noResultsText="Client not found"
                onChange={(e) => setTo(e.target.value)}
                onSelect={(client) => setClientId(client?.id || null)}
                apiConfig={{
                  endpoint: "/api/clients",
                  userId: userId
                }}
              />
            </div>
          </div>

          <div className="lg:items-end w-full rounded-lg flex flex-col md:flex-row lg:flex-col gap-4">
            {/* Updated Issued Date with DatePicker */}
            <div className="">
              <DatePicker
                label="Issued Date"
                placeholder="Select issued date"
                value={issuedDate}
                onChange={setIssuedDate}
                id="issued-date"
                className="w-full"
              />
            </div>

            {/* Updated Due Date with DatePicker */}
            <div className="">
              <DatePicker
                label="Due Date"
                placeholder="Select due date"
                value={dueDate}
                onChange={setDueDate}
                id="due-date"
                className="w-full"
              />
            </div>
          </div>
        </header>

        <div className="bg-gray-900 text-white px-4 py-2.5 rounded-lg mb-4">
          <div className="col-span-6">
            <span className="text-md lg:hidden lg:ml-5 font-medium">Items & Description</span>
          </div>
          <div className="lg:grid hidden grid-cols-12 gap-4 items-center">
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
          className="mb-10 mt-4 lg:ml-[1.6rem] w-full lg:w-auto px-3 py-2.5 lg:bg-white bg-gray-100 hover:bg-gray-200 whitespace-nowrap
          text-black font-medium rounded-md flex items-center justify-center gap-2 border border-black transition"
        >
          <Plus size={18} /> Add Item
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
        {/* Total Display at bottom right */}
        <div className="flex justify-end flex-wrap w-full">
          <div className="bg-gray-100 px-10 rounded-md py-5 flex justify-end items-center gap-2 w-full sm:w-auto">
            <span className="text-lg font-medium text-gray-700 pr-3 sm:pr-7">Total:</span>
            <span className="text-lg== font-medium text-neutral-500">{typeof currency === 'string' ? currency : currency.code}</span>
            <span className="text-2xl sm:text-3xl font-medium !text-[#000]">{getTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>


      </div>
      </div>
      {/* Right Sidebar */}
      <div className="w-full sm:w-auto md:flex-shrink-0">
        <InvoiceSidebar
          loading={loading}
          previewLoading={previewLoading}
          onSubmit={handleInvoiceSubmit}
          onPreview={handlePreview}
          previewPdfUrl={previewPdfUrl}
          setPreviewPdfUrl={setPreviewPdfUrl}
          previewInvoice={previewInvoice}
          getTotal={getTotal}
          getSubtotal={getSubtotal}
          getTaxAmount={getTaxAmount}
          getDiscountAmount={getDiscountAmount}
          getShippingAmount={getShippingAmount}
          dueDate={dueDate}
          showTax={showTax}
          showDiscount={showDiscount}
          showShipping={showShipping}
          taxPercent={taxPercent}
          discountPercent={discountPercent}
          shippingAmount={shippingAmount}
          taxType={taxType}
          discountType={discountType}
          // Add localStorage management functions as props
          onSaveToLocalStorage={manualSaveToLocalStorage}
          onLoadFromLocalStorage={manualLoadFromLocalStorage}
          onClearLocalStorage={manualClearLocalStorage}
          lastSavedTime={lastSavedTime}
        />
      </div>
    </div>
  );
};

export default InvoiceGenerator;