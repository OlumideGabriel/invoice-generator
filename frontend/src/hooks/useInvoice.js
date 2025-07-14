import { useState } from 'react';

export default function useInvoice() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taxType, setTaxType] = useState('percent'); // or 'fixed'
const [discountType, setDiscountType] = useState('percent'); // or 'fixed'

  const [items, setItems] = useState([
    { name: '', description: '', quantity: 1, unit_cost: 0, showDesc: false },
  ]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentDetails, setPaymentDetails] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoStatus, setLogoStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
 
  const [shippingAmount, setShippingAmount] = useState(0);
  const [showTax, setShowTax] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showShipping, setShowShipping] = useState(false);



  const handleChange = (index, field, value) => {
    const updated = [...items];
    const parsed =
      field === 'quantity' || field === 'unit_cost'
        ? Math.max(0, parseFloat(value) || 0)
        : value;
    updated[index][field] = parsed;
    setItems(updated);
  };

  const toggleDescription = (index) => {
    const updated = [...items];
    updated[index].showDesc = !updated[index].showDesc;
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      { name: '', description: '', quantity: 1, unit_cost: 0, showDesc: false },
    ]);
  };

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const getSubtotal = () =>
    items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);

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

  const handleLogoChange = (file, url) => {
    setLogoFile(file);
    setLogoUrl(url);
    setLogoStatus(url ? 'Logo uploaded successfully!' : 'Logo preview only (upload failed)');
  };

  const handleSubmit = async () => {
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
        total: parseFloat(getTotal()),
      };

      const res = await fetch('http://localhost:5000/generate-invoice', {
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
      link.download = `invoice-${to.replace(/\s+/g, '_')}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const previewInvoice = async () => {
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

    const res = await fetch('http://localhost:5000/preview-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const isJson = res.headers.get('content-type')?.includes('application/json');
      const err = isJson ? await res.json() : { error: await res.text() };
      throw new Error(err.error || `Preview failed: ${res.status}`);
    }

    const html = await res.text();
    return html; // ⬅️ return HTML content
  } catch (err) {
    setError(err.message);
    return null;
  } finally {
    setLoading(false);
  }
  };


const previewInvoiceImage = async () => {
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
      total: parseFloat(getTotal()),
    };

    const res = await fetch('http://localhost:5000/preview-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Failed to fetch preview image');

    const blob = await res.blob();
    const imageUrl = URL.createObjectURL(blob);
    return imageUrl;
  } catch (err) {
    setError(err.message);
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
    logoFile,
    logoUrl,
    logoStatus,
    handleLogoChange,
    getSubtotal,
    getTaxAmount,
    getDiscountAmount,
    getTotal,
    handleSubmit,
    previewInvoice,
    error,
    loading,
    previewInvoiceImage,
    showTax,
    setShowTax,
    showDiscount,
    setShowDiscount,
    showShipping,
    setShowShipping,
    shippingAmount,
    setShippingAmount,
    taxType,        // Add these new props
    setTaxType,
    discountType,
    setDiscountType,
    getShippingAmount,
  };
}
