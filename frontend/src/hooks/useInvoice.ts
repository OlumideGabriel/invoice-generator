import { useState, useEffect } from 'react';
import { useCurrency as useCurrencyContext, CurrencyOption } from '../context/CurrencyContext';

// Generate unique ID for items
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export interface InvoiceItem {
  id: string; // Required ID for drag and drop functionality
  name: string;
  description?: string;
  quantity: number;
  unit_cost: number;
  showDesc?: boolean;
}

interface UseInvoiceOptions {
  currency?: CurrencyOption | string;
}

// Default currency object that matches CurrencyOption type
const defaultCurrency: CurrencyOption = {
  code: 'EUR',
  symbol: '€',
  label: 'Euro (€)'
};

// Helper function to safely use the currency context
const useSafeCurrency = () => {
  try {
    return useCurrencyContext?.();
  } catch (e) {
    return { currency: defaultCurrency };
  }
};

function useInvoice(options: UseInvoiceOptions = {}) {
  const [currency, setCurrency] = useState<CurrencyOption | string>(defaultCurrency);
  const currencyContext = useSafeCurrency();

  useEffect(() => {
    if (options.currency) {
      setCurrency(options.currency);
    } else if (currencyContext?.currency) {
      setCurrency(currencyContext.currency);
    } else {
      setCurrency(defaultCurrency);
    }
  }, [currencyContext, options.currency]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taxType, setTaxType] = useState<'percent' | 'fixed'>('percent');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: generateId(), name: '', description: '', quantity: 1, unit_cost: 0, showDesc: false },
  ]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentDetails, setPaymentDetails] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [terms, setTerms] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoStatus, setLogoStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [shippingAmount, setShippingAmount] = useState(0);
  const [showTax, setShowTax] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showShipping, setShowShipping] = useState(false);

  const handleChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems(items => items.map((item, i) => {
      if (i !== index) return item;
      let parsed = value;
      if (field === 'quantity' || field === 'unit_cost') {
        parsed = Math.max(0, parseFloat(value) || 0);
      }
      return { ...item, [field]: parsed };
    }));
  };

  const toggleDescription = (index: number) => {
    setItems(items => items.map((item, i) =>
      i === index ? { ...item, showDesc: !item.showDesc } : item
    ));
  };

  const addItem = () => {
    setItems(items => [
      ...items,
      { id: generateId(), name: '', description: '', quantity: 1, unit_cost: 0, showDesc: false },
    ]);
  };

  const removeItem = (idx: number) => setItems(items => items.filter((_, i) => i !== idx));

  const getSubtotal = () =>
    items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_cost || 0)), 0);

  const getTaxAmount = () => {
    if (!showTax) return 0;
    return taxType === 'percent'
      ? getSubtotal() * (taxPercent / 100)
      : taxPercent;
  };

  const getDiscountAmount = () => {
    if (!showDiscount) return 0;
    return discountType === 'percent'
      ? getSubtotal() * (discountPercent / 100)
      : discountPercent;
  };

  const getShippingAmount = () => {
    if (!showShipping) return 0;
    return shippingAmount;
  };



  const getTotal = () => {
    const subtotal = getSubtotal();
    const tax = getTaxAmount();
    const discount = getDiscountAmount();
    const shipping = getShippingAmount();
    return subtotal + tax - discount + shipping;
  };

  const handleLogoChange = (file: File | null, url: string | null) => {
    setLogoFile(file);
    setLogoUrl(url);
    setLogoStatus(url ? 'Logo uploaded successfully!' : 'Logo preview only (upload failed)');
  };


  const handleSubmit = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const filtered = items.filter((item) => item.name.trim());
      if (!from.trim() || !to.trim()) throw new Error('Fill "From" and "To" fields.');
      if (filtered.length === 0) throw new Error('Add at least one valid item.');

      const payload = {
        from,
        to,
        items: filtered,
        tax_percent: taxPercent,
        discount_percent: discountPercent,
        payment_details: paymentDetails,
        payment_instructions: paymentInstructions,
        terms,
        logo_url: logoUrl,
        invoice_number: invoiceNumber,
        issued_date: issuedDate,
        due_date: dueDate,
        tax_type: taxType,
        discount_type: discountType,
        shipping_amount: shippingAmount,
        show_tax: showTax,
        show_discount: showDiscount,
        show_shipping: showShipping,
        currency: typeof currency === 'string' ? currency : currency?.code || 'EUR',
        currency_symbol: typeof currency === 'string' ? currency : currency?.symbol || '€',
        currency_label: typeof currency === 'string' ? currency : currency?.label || 'Euro (€)'
      };

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/generate-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const isJson = res.headers.get('content-type')?.includes('application/json');
        const err = isJson ? await res.json() : { error: await res.text() };
        throw new Error(err.error || `FAIL: ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${to.toString().replace(/\s+/g, '_')}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const previewInvoice = async (): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const filtered = items.filter((item) => item.name.trim());
      if (!from.trim() || !to.trim()) throw new Error('Fill "From" and "To" fields.');
      if (filtered.length === 0) throw new Error('Add at least one valid item.');

      const payload = {
        from,
        to,
        items: filtered,
        tax_percent: taxPercent,
        discount_percent: discountPercent,
        payment_details: paymentDetails,
        payment_instructions: paymentInstructions,
        terms,
        logo_url: logoUrl,
        invoice_number: invoiceNumber,
        issued_date: issuedDate,
        due_date: dueDate,
        tax_type: taxType,
        discount_type: discountType,
        shipping_amount: shippingAmount,
        show_tax: showTax,
        show_discount: showDiscount,
        show_shipping: showShipping,
        currency: typeof currency === 'string' ? currency : currency?.code || 'EUR',
        currency_symbol: typeof currency === 'string' ? currency : currency?.symbol || '€',
        currency_label: typeof currency === 'string' ? currency : currency?.label || 'Euro (€)'
      };

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/preview-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to fetch preview image');

      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);
      return imageUrl;
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const previewInvoiceImage = async (): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const filtered = items.filter((item) => item.name.trim());
      if (!from.trim() || !to.trim()) throw new Error('Fill "From" and "To" fields.');
      if (filtered.length === 0) throw new Error('Add at least one valid item.');

      const payload = {
        from,
        to,
        items: filtered,
        tax_percent: taxPercent,
        discount_percent: discountPercent,
        payment_details: paymentDetails,
        payment_instructions: paymentInstructions,
        logo_url: logoUrl,
        invoice_number: invoiceNumber,
        issued_date: issuedDate,
        due_date: dueDate,
      };

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/preview-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to fetch preview image');

      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);
      return imageUrl;
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    from,
    setFrom,
    to,
    setTo,
    invoiceNumber,
    setInvoiceNumber,
    issuedDate,
    setIssuedDate,
    dueDate,
    setDueDate,
    items,
    setItems,
    handleChange,
    removeItem,
    toggleDescription,
    addItem,
    taxPercent,
    setTaxPercent,
    discountPercent,
    setDiscountPercent,
    paymentDetails,
    setPaymentDetails,
    paymentInstructions,
    setPaymentInstructions,
    terms,
    setTerms,
    logoFile,
    setLogoFile,
    logoUrl,
    setLogoUrl,
    logoStatus,
    setLogoStatus,
    handleLogoChange,
    getSubtotal,
    getTaxAmount,
    getDiscountAmount,
    getShippingAmount,
    getTotal,
    handleSubmit,
    previewInvoice,
    previewInvoiceImage,
    loading,
    setLoading,
    error,
    setError,
    showTax,
    setShowTax,
    showDiscount,
    setShowDiscount,
    showShipping,
    setShowShipping,
    shippingAmount,
    setShippingAmount,
    taxType,
    setTaxType,
    discountType,
    setDiscountType,
  };
}

export default useInvoice;