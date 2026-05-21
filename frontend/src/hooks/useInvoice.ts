import { useState, useEffect } from 'react';
import { useCurrency as useCurrencyContext, CurrencyOption } from '../context/CurrencyContext';
import { API_BASE_URL } from '../config/api';

// Generate unique ID for items
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export interface InvoiceItem {
  id: string;
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

// Safari detection helper
const isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
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

  // Safari-compatible download function
  const downloadFileSafari = (blob: Blob, filename: string) => {
    const blobUrl = URL.createObjectURL(blob);
    
    if (isSafari()) {
      // Safari requires special handling
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      
      // Use setTimeout to ensure Safari processes the click
      setTimeout(() => {
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      }, 0);
    } else {
      // Chrome/Firefox/Edge approach
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }
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
        invoice_number: invoiceNumber || `INV-${Date.now()}`,
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

      const res = await fetch(`${API_BASE_URL}/generate-invoice`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/pdf'
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const isJson = res.headers.get('content-type')?.includes('application/json');
        const err = isJson ? await res.json() : { error: await res.text() };
        throw new Error(err.error || `FAIL: ${res.status}`);
      }

      const blob = await res.blob();
      const filename = `invoice-${invoiceNumber || Date.now()}.pdf`;
      
      // Get filename from Content-Disposition header if available
      const contentDisposition = res.headers.get('Content-Disposition');
      let finalFilename = filename;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          finalFilename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Use Safari-compatible download
      downloadFileSafari(blob, finalFilename);
      
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
      const filteredItems = items.filter(item => item.name.trim());
      if (!from.trim() || !to.trim()) throw new Error('Please fill in both "From" and "To" fields.');
      if (filteredItems.length === 0) throw new Error('Please add at least one valid item.');

      const payload = {
        from,
        to,
        items: filteredItems,
        tax_percent: taxPercent,
        discount_percent: discountPercent,
        payment_details: paymentDetails,
        payment_instructions: paymentInstructions,
        terms,
        logo_url: logoUrl,
        invoice_number: invoiceNumber || `INV-${Date.now()}`,
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
        currency_label: typeof currency === 'string' ? currency : currency?.label || 'Euro (€)',
      };

      const response = await fetch(`${API_BASE_URL}/preview-invoice`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/pdf, image/png'
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch invoice preview (${response.status})`);
      }

      const blob = await response.blob();
      
      // For Safari, if we get an image/png (fallback), handle appropriately
      const contentType = response.headers.get('Content-Type');
      if (contentType?.includes('image/png')) {
        console.log('Received PNG preview (Safari fallback)');
      }
      
      const url = URL.createObjectURL(blob);
      
      // For Safari, we need to keep the URL alive longer
      if (isSafari()) {
        // Store the URL for later cleanup
        setTimeout(() => {
          // Don't revoke immediately for Safari
          console.log('Safari preview URL created:', url);
        }, 1000);
      }
      
      return url;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error occurred';
      setError(message);
      return null;

    } finally {
      setLoading(false);
    }
  };

  // Cleanup function for preview URLs (call this when closing preview modal)
  const cleanupPreviewUrl = (url: string | null) => {
    if (url && !isSafari()) {
      // Only revoke immediately for non-Safari browsers
      URL.revokeObjectURL(url);
    }
    // For Safari, let the browser handle cleanup naturally
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
    cleanupPreviewUrl, // Export this for use in components
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