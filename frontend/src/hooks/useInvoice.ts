import { useState } from 'react';

export interface InvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  unit_cost: number;
  showDescription?: boolean;
}

const useInvoice = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taxType, setTaxType] = useState<'percent' | 'fixed'>('percent');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [items, setItems] = useState<InvoiceItem[]>([
    { name: '', description: '', quantity: 1, unit_cost: 0, showDescription: false },
  ]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentDetails, setPaymentDetails] = useState('');
  const [terms, setTerms] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoStatus, setLogoStatus] = useState('');
  const [loading, setLoading] = useState(false);
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
    setItems(items => items.map((item, i) => i === index ? { ...item, showDescription: !item.showDescription } : item));
  };

  const addItem = () => {
    setItems(items => [
      ...items,
      { name: '', description: '', quantity: 1, unit_cost: 0, showDescription: false },
    ]);
  };

  const removeItem = (idx: number) => setItems(items => items.filter((_, i) => i !== idx));

  const getSubtotal = () => items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_cost || 0)), 0);
  const getTaxAmount = () => {
    if (!showTax) return 0;
    return taxType === 'percent' ? getSubtotal() * (taxPercent / 100) : taxPercent;
  };
  const getDiscountAmount = () => {
    if (!showDiscount) return 0;
    return discountType === 'percent' ? getSubtotal() * (discountPercent / 100) : discountPercent;
  };
  const getShippingAmount = () => {
    if (!showShipping) return 0;
    return shippingAmount;
  };
  const getTotal = () => getSubtotal() + getTaxAmount() - getDiscountAmount() + getShippingAmount();

  const handleLogoChange = (file: File | null, url: string | null) => {
    setLogoFile(file);
    setLogoUrl(url);
    setLogoStatus(url ? 'Logo uploaded successfully!' : 'Logo preview only (upload failed)');
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
};

export default useInvoice;
