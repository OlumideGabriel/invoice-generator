import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, CircleAlert, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import LogoUpload from './LogoUpload';
import PartyField from './PartyField';
import InvoiceLine from './InvoiceLine';
import PaymentSection from './PaymentSection';
import TaxDiscountSection from './TaxDiscountSection';
import InvoiceSidebar from './InvoiceSidebar';
import ClientModal from './ClientModal';
import BusinessModal from './BusinessModal';
import MainMenu from './MainMenu';
import Navbar from './Navbar';
import CurrencySelector from './CurrencySelector';
import { DatePicker } from "@/components/date-picker";
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import useInvoice, { InvoiceItem } from '../hooks/useInvoice';
import { API_BASE_URL } from '../config/api';

// ==================== UTILITY FUNCTIONS ====================

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// ==================== MAIN COMPONENT ====================

const InvoiceEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const userId = user?.id || user?.user_id;
  const navigate = useNavigate();
  const { currency, setCurrency, currencyOptions } = useCurrency();

  // State management
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  // Invoice hook for all invoice-related state and functionality
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
    handleSubmit,
    previewInvoice,
    error, setError,
  } = useInvoice();

  // ==================== FETCH INVOICE DATA ====================

  useEffect(() => {
    if (!id || !userId) {
      setFetchingData(false);
      return;
    }

    const fetchInvoiceData = async () => {
      try {
        setFetchingData(true);
        console.log('📡 Fetching invoice data for editing:', id);

        const response = await fetch(
          `${API_BASE_URL}/api/invoices/${id}/edit?user_id=${userId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch invoice data');
        }

        const data = await response.json();

        if (data.success && data.editData) {
          console.log('✅ Invoice data loaded:', data.editData);
          populateFormWithData(data.editData);
        } else {
          throw new Error(data.error || 'Failed to load invoice data');
        }
      } catch (err) {
        console.error('❌ Error fetching invoice:', err);
        setError('Failed to load invoice for editing');
      } finally {
        setFetchingData(false);
      }
    };

    fetchInvoiceData();
  }, [id, userId]);

  const populateFormWithData = (editData: any) => {
    console.log('🔄 Populating form with data:', editData);

    const existingInvoiceNumber =
      editData.invoiceNumber ||
      editData.data?.invoice_number ||
      editData.invoice_number ||
      editData.data?.invoiceNumber ||
      '';

    if (existingInvoiceNumber) {
      const invoiceNumString = String(existingInvoiceNumber);
      setInvoiceNumber(invoiceNumString);
      console.log('✅ Invoice number set to:', invoiceNumString);
    }

    setFrom(editData.from || editData.data?.from || '');
    setTo(editData.to || editData.data?.to || '');

    const itemsWithIds = (editData.items || editData.data?.items || []).map((item: any) => ({
      ...item,
      id: item.id || generateId()
    }));
    setItems(itemsWithIds.length > 0 ? itemsWithIds : [
      { id: generateId(), name: '', description: '', quantity: 1, unit_cost: 0, showDesc: false }
    ]);

    setIssuedDate(editData.issuedDate || editData.data?.issued_date || '');
    setDueDate(editData.dueDate || editData.data?.due_date || '');
    setPaymentDetails(editData.paymentDetails || editData.data?.payment_details || '');
    setTerms(editData.terms || editData.data?.terms || '');
    setTaxPercent(editData.taxPercent ?? editData.data?.tax_percent ?? 0);
    setDiscountPercent(editData.discountPercent ?? editData.data?.discount_percent ?? 0);
    setShippingAmount(editData.shippingAmount ?? editData.data?.shipping_amount ?? 0);
    setTaxType(editData.taxType || editData.data?.tax_type || 'percent');
    setDiscountType(editData.discountType || editData.data?.discount_type || 'percent');
    setShowTax(editData.showTax ?? editData.data?.show_tax ?? true);
    setShowDiscount(editData.showDiscount ?? editData.data?.show_discount ?? false);
    setShowShipping(editData.showShipping ?? editData.data?.show_shipping ?? true);
    setLogoUrl(editData.logoUrl || editData.data?.logo_url || null);

    if (editData.clientId || editData.data?.client_id) {
      setClientId(editData.clientId || editData.data?.client_id);
    }
    if (editData.businessId || editData.data?.business_id) {
      setBusinessId(editData.businessId || editData.data?.business_id);
    }

    if (editData.currency || editData.data?.currency) {
      const code = editData.currency || editData.data?.currency;
      const currencyOption = currencyOptions.find((opt: any) => opt.code === code || opt === code);
      if (currencyOption) setCurrency(currencyOption);
    }

    console.log('✅ Form populated successfully');
  };

  // ==================== DATABASE OPERATIONS ====================

  const updateInvoiceInDatabase = async (): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const invoicePayload = {
        user_id: userId,
        client_id: clientId,
        business_id: businessId,
        data: {
          from, to, items,
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
          currency: typeof currency === 'string' ? currency : currency.code,
          currency_symbol: typeof currency === 'string' ? currency : currency.symbol,
          currency_label: typeof currency === 'string' ? currency : currency.label
        },
        issued_date: issuedDate,
        due_date: dueDate,
        status: "draft",
        currency: typeof currency === 'string' ? currency : currency.code,
        currency_symbol: typeof currency === 'string' ? currency : currency.symbol,
        currency_label: typeof currency === 'string' ? currency : currency.label
      };

      const hasRequiredFields =
        userId && invoiceNumber &&
        Array.isArray(items) && items.length > 0 &&
        from && to;

      if (!hasRequiredFields) {
        setError("Please fill in all required fields before saving.");
        throw new Error("Missing required fields");
      }

      console.log('Updating invoice:', id);
      const response = await fetch(`${API_BASE_URL}/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoicePayload)
      });

      const result = await response.json();
      console.log('Complete API response:', JSON.stringify(result, null, 2));

      if (result.success) {
        setIsSaved(true);
        console.log('✅ Invoice updated successfully');
        return String(id);
      } else {
        console.error('Update failed:', result);
        setError(result.error || result.message || "Failed to update invoice.");
        throw new Error(result.error || result.message || "Failed to update invoice");
      }
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.message || "An error occurred while updating the invoice.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ==================== EVENT HANDLERS ====================

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setItems(reordered);
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    handleChange(index, field as keyof InvoiceItem, value);
  };

  const handlePreview = async () => {
    setPreviewPdfUrl('');
    try {
      const url = await previewInvoice();
      setPreviewPdfUrl(url);
    } catch (err) {
      console.error('Preview failed', err);
      setPreviewPdfUrl(null);
    }
  };

  const handleSaveSuccess = (invoiceId?: string) => {
    console.log('Invoice updated successfully:', invoiceId);
    navigate('/invoices');
  };

  // ==================== RENDER ====================

  if (fetchingData) {
    return (
      <>
        <div className="md:block hidden sticky z-40 top-0 left-0 w-full">
          <MainMenu showLogo={false} />
        </div>
        <div className="md:hidden block">
          <MainMenu />
        </div>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading invoice data...</span>
          </div>
        </div>
        <Navbar />
      </>
    );
  }

  return (
    <>
      <div className="md:block hidden sticky z-40 top-0 left-0 w-full">
        <MainMenu showLogo={false} />
      </div>
      <div className="md:hidden block">
        <MainMenu />
      </div>

      <div className="py-6 flex flex-col md:flex-col-reverse xl:flex-row mb-40 lg:mb-20 w-full xl:max-w-7xl m-auto justify-center gap-4 xl:gap-8 p-0 sm:p-8 pb-20">
        {/* Main Invoice Form */}
        <div className="block flex-col w-full gap-4">
          {/* Error Alert */}
          {error && (
            <div className="sticky top-0 z-50 transform">
              <div className={`flex items-center max-w-full xl:max-w-7xl gap-3 text-amber-700 bg-amber-50 px-4 py-3 rounded-lg shadow-sm border border-amber-100 mb-4 mx-auto transition-all duration-300 ${error ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
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
            {/* Edit Mode Indicator */}
            <div className="mb-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-teal-700 text-teal-600 px-2 py-1 bg-teal-100 rounded-md font-medium">Editing Invoice: {invoiceNumber}</span>
                </div>
                <button
                  onClick={() => navigate('/new')}
                  className="text-teal-600 px-2 py-1 bg-teal-100 rounded-md hover:text-teal-800 text-sm font-medium"
                >
                  New Invoice
                </button>
              </div>
            </div>

            {/* Logo & Invoice Number Section */}
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
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="#"
                    className="w-full sm:w-36 md:w-40 px-3 py-2.5 rounded-md bg-neutral-700 text-neutral-100 border !border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                  <div className="mt-0 md:hidden flex-1">
                    <CurrencySelector currency={currency} setCurrency={setCurrency} currencyOptions={currencyOptions} />
                  </div>
                </div>
              </div>
            </div>

            {/* From/To & Dates Section */}
            <header className="flex flex-col lg:flex-row items-end md:flex-nowrap justify-between gap-6 mb-10">
              <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
                <PartyField
                  label="From"
                  value={from}
                  type="business"
                  placeholder="Sender's name..."
                  noResultsText="Business not found"
                  onChange={(e) => setFrom(e.target.value)}
                  onSelect={(business) => setBusinessId(business?.id || null)}
                  apiConfig={{
                    endpoint: '/api/businesses',
                    userId: userId
                  }}
                  addLabel="Add New Business"
                  ModalComponent={BusinessModal}
                  modalProps={{
                    someBusinessSpecificProp: 'value'
                  }}
                />
                <PartyField
                  label="To"
                  value={to}
                  type="client"
                  placeholder="Who is this invoice to?"
                  noResultsText="Client not found"
                  onChange={(e) => setTo(e.target.value)}
                  onSelect={(client) => setClientId(client?.id || null)}
                  apiConfig={{
                    endpoint: '/api/clients',
                    userId: userId
                  }}
                  addLabel="Add New Client"
                  ModalComponent={ClientModal}
                />
              </div>

              <div className="lg:items-end w-full rounded-lg flex flex-col md:flex-row lg:flex-col gap-4">
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
                  const droppableProps = {
                    ...provided.droppableProps,
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
              className="mb-10 mt-4 md:ml-[1.6rem] w-full md:w-auto px-3 py-3 md:py-2.5 md:bg-white bg-gray-200 md:bg-gray-100 hover:bg-gray-200 whitespace-nowrap text-black font-medium rounded-md flex items-center justify-center gap-2 border-2 md:border border-dashed md:border-solid border-black transition"
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
                <span className="text-lg font-medium text-neutral-500">{typeof currency === 'string' ? currency : currency.code}</span>
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
            onSave={updateInvoiceInDatabase}
            onDownload={handleSubmit}
            isSaved={isSaved}
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
            redirectAfterSave={true}
            onSaveSuccess={handleSaveSuccess}
          />
        </div>
      </div>
      <Navbar />
    </>
  );
};

export default InvoiceEdit;