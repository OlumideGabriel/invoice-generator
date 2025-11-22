import { useState, useEffect } from 'react';
import { X, Plus, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface SendInvoiceProps {
  invoice: any;
  client: any;
  business: any;
  onClose: () => void;
}

export default function SendInvoice({ invoice, client, business, onClose }: SendInvoiceProps) {
  const clientEmail = client?.email || '';
  const clientName = client?.name || '';

  const [recipients, setRecipients] = useState<Array<{ email: string; name: string }>>([]);
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (clientEmail) {
      setRecipients([{ email: clientEmail, name: clientName }]);
    }
  }, [clientEmail, clientName]);

  const handleAddEmail = () => {
    if (newEmail && newEmail.includes('@')) {
      setRecipients([...recipients, { email: newEmail, name: newEmail }]);
      setNewEmail('');
      setShowAddEmail(false);
    }
  };

  const handleRemoveRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  // Helper functions for calculations
  const calculateSubtotal = (items: any[]) => {
    return items.reduce((total: number, item: any) => {
      return total + (item.quantity * item.unit_cost);
    }, 0);
  };

  const calculateDiscountAmount = (invoiceData: any) => {
    if (!invoiceData.show_discount || !invoiceData.discount_percent) return 0;

    const subtotal = calculateSubtotal(invoiceData.items || []);

    if (invoiceData.discount_type === 'percent') {
      return (subtotal * invoiceData.discount_percent) / 100;
    } else {
      return invoiceData.discount_percent;
    }
  };

  const calculateTaxAmount = (invoiceData: any, subtotal: number, discountAmount: number) => {
    if (!invoiceData.show_tax || !invoiceData.tax_percent) return 0;

    const amountAfterDiscount = subtotal - discountAmount;

    if (invoiceData.tax_type === 'percent') {
      return (amountAfterDiscount * invoiceData.tax_percent) / 100;
    } else {
      return invoiceData.tax_percent;
    }
  };

  const calculateShippingAmount = (invoiceData: any) => {
    if (!invoiceData.show_shipping || !invoiceData.shipping_amount) return 0;
    return invoiceData.shipping_amount;
  };

  const calculateTotal = (invoiceData: any, subtotal: number, discountAmount: number, taxAmount: number, shippingAmount: number) => {
    let total = subtotal - discountAmount + taxAmount + shippingAmount;
    return Math.max(0, total);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const generateEmailTemplate = () => {
    const invoiceData = invoice.data;
    const subtotal = calculateSubtotal(invoiceData.items || []);
    const discountAmount = calculateDiscountAmount(invoiceData);
    const taxAmount = calculateTaxAmount(invoiceData, subtotal, discountAmount);
    const shippingAmount = calculateShippingAmount(invoiceData);
    const total = calculateTotal(invoiceData, subtotal, discountAmount, taxAmount, shippingAmount);

    const currencySymbol = invoiceData.currency_symbol || invoice.currency?.symbol || '£';

    // Generate line items HTML
    const lineItemsHTML = invoiceData.items?.map((item: any) => `
      <tr>
        <td>
          <div class="item-name">${escapeHtml(item.name)}</div>
          ${item.showDesc && item.description ? `<div class="item-description">${escapeHtml(item.description)}</div>` : ''}
        </td>
        <td class="item-qty">${item.quantity}</td>
        <td class="item-rate">${currencySymbol}${item.unit_cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="item-amount">${currencySymbol}${(item.quantity * item.unit_cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `).join('') || '';

    // Generate discount section if applicable
    const discountSection = invoiceData.show_discount && discountAmount > 0 ? `
      <div class="calculation-row">
        <span class="calculation-label">
          Discount
          ${invoiceData.discount_type === 'percent' && invoiceData.discount_percent > 0 ?
            `(${invoiceData.discount_percent}%)` : ''}
        </span>
        <span class="discount-amount">-${currencySymbol}${discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    ` : '';

    // Generate tax section if applicable
    const taxSection = invoiceData.show_tax && taxAmount > 0 ? `
      <div class="calculation-row">
        <span class="calculation-label">
          Tax
          ${invoiceData.tax_type === 'percent' && invoiceData.tax_percent > 0 ?
            `(${invoiceData.tax_percent}%)` : ''}
        </span>
        <span class="calculation-amount">${currencySymbol}${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    ` : '';

    // Generate shipping section if applicable
    const shippingSection = invoiceData.show_shipping && shippingAmount > 0 ? `
      <div class="calculation-row">
        <span class="calculation-label">Shipping</span>
        <span class="calculation-amount">${currencySymbol}${shippingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    ` : '';

    const businessName = business?.name || 'Your Business';
    const businessEmail = business?.email || 'business@example.com';
    const companyInitial = businessName.charAt(0).toUpperCase();


  };

  const handleSend = async () => {
    if (recipients.length === 0) {
      setResult({ success: false, error: 'Please add at least one recipient' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Generate the enhanced email template
      const emailTemplate = generateEmailTemplate();

      // Send complete invoice data with business and client info
      const res = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recipients[0].email,
          message: message.trim(),
          invoice: invoice, // Complete invoice object
          client: client, // Complete client object
          business: business, // Complete business object
          emailTemplate: emailTemplate // Send the enhanced template
        }),
      });

      const data = await res.json();
      setResult(data);

      if (data.success) {
        setTimeout(() => onClose(), 2500);
      }
    } catch (err) {
      setResult({
        success: false,
        error: 'Unable to connect. Please check your network.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between py-5 px-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Send Invoice</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-neutral-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Result Message */}
          {result && (
            <div className={`flex items-start gap-3 p-4 rounded-xl border-2 ${
              result.success
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className={`mt-0.5 ${result.success ? 'text-emerald-600' : 'text-red-600'}`}>
                {result.success ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${result.success ? 'text-emerald-900' : 'text-red-900'}`}>
                  {result.success ? 'Email Sent Successfully!' : 'Failed to Send'}
                </p>
                <p className={`text-sm mt-1 ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
                  {result.message || result.error}
                </p>
              </div>
            </div>
          )}

{/* Recipients Section */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {recipients.map((recipient, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-teal-100 text-teal-700 rounded-full"
                >
                  <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {getInitials(recipient.name)}
                  </div>
                  <span className="text-sm font-medium">{recipient.name}</span>
                  <button
                    onClick={() => handleRemoveRecipient(index)}
                    className="text-teal-600 hover:text-teal-800 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}

              {/* Add Button - Only show if no recipients */}
              {recipients.length === 0 && (
                <>
                  {showAddEmail ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                        placeholder="email@example.com"
                        className="px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        autoFocus
                      />
                      <button
                        onClick={handleAddEmail}
                        className="p-2 hidden bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setShowAddEmail(false);
                          setNewEmail('');
                        }}
                        className="p-1 rounded-full hover:bg-neutral-100 text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddEmail(true)}
                      className="w-10 h-10 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-full text-gray-400 hover:border-teal-500 hover:text-teal-500 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personal Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal note to your invoice..."
              rows={5}
              className="w-full input px-4 py-3 bg-gray-50 text-gray-700 placeholder-gray-400 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 p-6 pt-0 border-t pt-4 border-gray-100">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex px-8 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || recipients.length === 0}
            className="flex items-center justify-center gap-2 px-8 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending...
              </>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}