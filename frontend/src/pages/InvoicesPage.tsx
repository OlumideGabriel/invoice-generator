import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, DollarSign, User, FileText } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import Tooltip from '../components/Tooltip';

const InvoicesPage = () => {
  const [expandedInvoice, setExpandedInvoice] = useState(null);

  // Sample data - replace with your actual API response
  interface InvoiceItem {
  id: string;
  name: string;
  description?: string;
  showDesc?: boolean;
  quantity: number;
  unit_cost: number;
}

interface InvoiceData {
  invoice_number: string;
  from: string;
  to: string;
  due_date: string;
  issued_date?: string;
  items: InvoiceItem[];
  show_shipping?: boolean;
  shipping_amount?: number;
  show_tax?: boolean;
  tax_type?: string;
  tax_percent?: number;
  show_discount?: boolean;
  discount_type?: string;
  discount_percent?: number;
  payment_details?: string;
  terms?: string;
}

interface Invoice {
  id: string;
  status: string;
  data: InvoiceData;
}

interface InvoiceApiResponse {
  success: boolean;
  invoices: Invoice[];
}

const [invoices, setInvoices] = useState<InvoiceApiResponse | null>(null);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);

React.useEffect(() => {
  setLoading(true);
  fetch('/api/invoices')
    .then(res => res.json())
    .then(data => {
      setInvoices(data);
      setLoading(false);
    })
    .catch(err => {
      setError('Failed to load invoices' as string);
      setLoading(false);
    });
}, []);

  const calculateInvoiceTotal = (invoice) => {
    const itemsTotal = invoice.data.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
    let total = itemsTotal;

    if (invoice.data.show_shipping) {
      total += invoice.data.shipping_amount;
    }

    if (invoice.data.show_tax) {
      if (invoice.data.tax_type === 'fixed') {
        total += invoice.data.tax_percent;
      } else {
        total += (total * invoice.data.tax_percent) / 100;
      }
    }

    if (invoice.data.show_discount) {
      if (invoice.data.discount_type === 'fixed') {
        total -= invoice.data.discount_percent;
      } else {
        total -= (total * invoice.data.discount_percent) / 100;
      }
    }

    return total;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleExpand = (invoiceId) => {
    setExpandedInvoice(expandedInvoice === invoiceId ? null : invoiceId);
  };

  if (loading) {
    return (
      <div className="p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
        Loading invoices...
      </div>
    );
  }

  if (error || !invoices || invoices.success === false) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        {error || 'Failed to load invoices'}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoices</h1>
        <p className="text-gray-600">Total invoices: {invoices.invoices.length}</p>
      </div>

      <div className="space-y-4">
        {invoices.invoices.map((invoice) => (
          <div key={invoice.id} className="border border-gray-200 rounded-lg shadow-sm">
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpand(invoice.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-lg">#{invoice.data.invoice_number}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{invoice.data.from} → {invoice.data.to}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-600">
                      ${calculateInvoiceTotal(invoice).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status.toUpperCase()}
                  </span>

                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {formatDate(invoice.data.due_date)}</span>
                  </div>

                  {expandedInvoice === invoice.id ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {expandedInvoice === invoice.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                {/* Download Button for Invoice PDF */}
                <button
                  className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  onClick={async (e) => {
                    e.stopPropagation();
                    // TODO: Replace with useInvoice hook's handleSubmit or direct fetch to /generate-invoice
                    try {
                      const response = await fetch(`/generate-invoice?id=${invoice.id}`, {
                        method: 'GET',
                      });
                      if (!response.ok) throw new Error('Failed to generate PDF');
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `invoice_${invoice.data.invoice_number}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                    } catch (err) {
                      alert('PDF download failed');
                    }
                  }}
                >
                  Download PDF
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Invoice Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Invoice Details</h3>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Invoice ID:</span>
                        <p className="font-medium break-all">{invoice.id}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Issued Date:</span>
                        <p className="font-medium">{invoice.data.issued_date ? formatDate(invoice.data.issued_date) : ''}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Due Date:</span>
                        <p className="font-medium">{formatDate(invoice.data.due_date)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <p className="font-medium capitalize">{invoice.status}</p>
                      </div>
                    </div>

                    {invoice.data.terms && (
                      <div>
                        <span className="text-gray-500">Terms:</span>
                        <span className="ml-2">{invoice.data.terms}</span>
                      </div>
                    )}

                    {invoice.data.payment_details && (
                      <div>
                        <span className="text-gray-500 text-sm">Payment Details:</span>
                        <p className="font-medium whitespace-pre-line">{invoice.data.payment_details}</p>
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
                    <div className="space-y-2">
                      {invoice.data.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded border">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.description && item.showDesc && (
                              <p className="text-sm text-gray-600">{item.description}</p>
                            )}
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${(item.quantity * item.unit_cost).toFixed(2)}</p>
                            <p className="text-sm text-gray-500">${item.unit_cost}/unit</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>${invoice.data.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0).toFixed(2)}</span>
                        </div>

                        {invoice.data.show_shipping && (
                          <div className="flex justify-between">
                            <span>Shipping:</span>
                            <span>${(invoice.data.shipping_amount ?? 0).toFixed(2)}</span>
                          </div>
                        )}

                        {invoice.data.show_tax && (
                          <div className="flex justify-between">
                            <span>Tax ({invoice.data.tax_type === 'fixed' ? 'Fixed' : invoice.data.tax_percent + '%'}):</span>
                            <span>${invoice.data.tax_type === 'fixed' ? (invoice.data.tax_percent ?? 0).toFixed(2) : (((invoice.data.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0) + (invoice.data.show_shipping ? (invoice.data.shipping_amount ?? 0) : 0)) * (invoice.data.tax_percent ?? 0) / 100).toFixed(2))}</span>
                          </div>
                        )}

                        {invoice.data.show_discount && (
                          <div className="flex justify-between text-red-600">
                            <span>Discount ({invoice.data.discount_type === 'fixed' ? 'Fixed' : invoice.data.discount_percent + '%'}):</span>
                            <span>-${invoice.data.discount_type === 'fixed' ? (invoice.data.discount_percent ?? 0).toFixed(2) : 'calculated'}</span>
                          </div>
                        )}

                        <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-300">
                          <span>Total:</span>
                          <span>${calculateInvoiceTotal(invoice).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {invoices.invoices.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
          <p className="text-gray-500">Create your first invoice to get started.</p>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;