import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  Mail,
  Edit,
  Printer,
  FileText,
  Calendar,
  User,
  MapPin,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import MainMenu from '../components/MainMenu';
import Navbar from '../components/Navbar';

// Reuse your existing types
interface Currency {
  code: string;
  label: string;
  symbol: string;
}

interface InvoiceItem {
  id: string;
  name: string;
  description: string;
  showDesc: boolean;
  quantity: number;
  unit_cost: number;
}

interface InvoiceData {
  currency: Currency;
  currency_symbol: string;
  discount_percent: number;
  discount_type: string;
  due_date: string;
  from: string;
  invoice_number: string;
  issued_date: string;
  items: InvoiceItem[];
  logo_url: string;
  payment_details: string;
  shipping_amount: number;
  show_discount: boolean;
  show_shipping: boolean;
  show_tax: boolean;
  tax_percent: number;
  tax_type: string;
  terms: string;
  to: string;
}

interface Invoice {
  client_id: string;
  currency: Currency;
  data: InvoiceData;
  due_date: string;
  id: string;
  issued_date: string;
  status: string;
  user_id: string;
}

const InvoicePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (id && user?.id) {
      fetchInvoice();
    }
  }, [id, user]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/invoices/${id}?user_id=${user?.id}`
      );

      const data = await response.json();

      if (data.success && data.invoice) {
        setInvoice(data.invoice);
      } else {
        setError('Invoice not found');
      }
    } catch (err) {
      setError('Failed to load invoice');
      console.error('Error loading invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = (items: InvoiceItem[]): number => {
    return items.reduce((total, item) => {
      return total + (item.quantity * item.unit_cost);
    }, 0);
  };

  const calculateTotal = (): number => {
    if (!invoice?.data) return 0;

    const subtotal = calculateSubtotal(invoice.data.items || []);
    let total = subtotal;

    // Apply discount
    if (invoice.data.show_discount && invoice.data.discount_percent) {
      const discountAmount = invoice.data.discount_type === 'percent'
        ? (subtotal * invoice.data.discount_percent) / 100
        : invoice.data.discount_percent;
      total -= discountAmount;
    }

    // Apply shipping
    if (invoice.data.show_shipping && invoice.data.shipping_amount) {
      total += invoice.data.shipping_amount;
    }

    // Apply tax
    if (invoice.data.show_tax && invoice.data.tax_percent) {
      const taxAmount = invoice.data.tax_type === 'percent'
        ? (total * invoice.data.tax_percent) / 100
        : invoice.data.tax_percent;
      total += taxAmount;
    }

    return Math.max(0, total);
  };

  const formatAmount = (amount: number): string => {
    const symbol = invoice?.data?.currency_symbol || invoice?.currency?.symbol || '£';
    return `${symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return {
          label: 'Draft',
          className: 'bg-gray-100 text-gray-800',
          icon: Clock,
          color: 'text-gray-600'
        };
      case 'sent':
        return {
          label: 'Sent',
          className: 'bg-blue-100 text-blue-800',
          icon: CheckCircle2,
          color: 'text-blue-600'
        };
      case 'paid':
        return {
          label: 'Paid',
          className: 'bg-green-100 text-green-800',
          icon: CheckCircle2,
          color: 'text-green-600'
        };
      case 'overdue':
        return {
          label: 'Overdue',
          className: 'bg-red-100 text-red-800',
          icon: AlertCircle,
          color: 'text-red-600'
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800',
          icon: Clock,
          color: 'text-gray-600'
        };
    }
  };

  const handleCopyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Implement PDF download functionality
    console.log('Download PDF functionality to be implemented');
  };

  const handleSendEmail = () => {
    // Implement email sending functionality
    console.log('Send email functionality to be implemented');
  };

  if (loading) {
    return (
      <>
        <MainMenu />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Navbar />
      </>
    );
  }

  if (error || !invoice) {
    return (
      <>
        <MainMenu />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The requested invoice could not be found.'}</p>
            <button
              onClick={() => navigate('/invoices')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </button>
          </div>
        </div>
        <Navbar />
      </>
    );
  }

  const statusConfig = getStatusConfig(invoice.status);
  const StatusIcon = statusConfig.icon;
  const subtotal = calculateSubtotal(invoice.data.items || []);
  const total = calculateTotal();

  return (
    <>
      <MainMenu />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                <button
                  onClick={() => navigate('/invoices')}
                  className="inline-flex items-center p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Invoice #{invoice.data.invoice_number}
                  </h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.className}`}>
                      <StatusIcon className={`h-4 w-4 mr-1 ${statusConfig.color}`} />
                      {statusConfig.label}
                    </span>
                    <span className="text-sm text-gray-500">
                      Issued {formatDate(invoice.data.issued_date)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </button>
                <button
                  onClick={handleSendEmail}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </button>
                <button
                  onClick={() => navigate(`/edit-invoice/${invoice.id}`)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Invoice
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Invoice Header */}
            <div className="p-8 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row justify-between">
                <div className="mb-6 lg:mb-0">
                  {invoice.data.logo_url && (
                    <img
                      src={invoice.data.logo_url}
                      alt="Company Logo"
                      className="h-12 mb-4"
                    />
                  )}
                  <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                  <p className="text-gray-600">#{invoice.data.invoice_number}</p>
                </div>

                <div className="text-right">
                  <div className="bg-gray-50 rounded-lg p-4 inline-block">
                    <p className="text-2xl font-bold text-gray-900">{formatAmount(total)}</p>
                    <p className="text-sm text-gray-600">
                      {invoice.status === 'paid' ? 'Paid' : 'Due'} {formatDate(invoice.data.due_date)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* From and To Sections */}
            <div className="p-8 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* From */}
                <div>
                  <div className="flex items-center mb-3">
                    <User className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="font-semibold text-gray-900">From</h3>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900">{invoice.data.from}</p>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>Invoice Date: {formatDate(invoice.data.issued_date)}</p>
                      <p>Due Date: {formatDate(invoice.data.due_date)}</p>
                    </div>
                  </div>
                </div>

                {/* To */}
                <div>
                  <div className="flex items-center mb-3">
                    <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="font-semibold text-gray-900">Bill To</h3>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900">{invoice.data.to}</p>
                    <button
                      onClick={() => handleCopyToClipboard(invoice.data.to, 'to')}
                      className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {copiedField === 'to' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="p-8 border-b border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 font-semibold text-gray-900">Item</th>
                      <th className="text-right py-3 font-semibold text-gray-900">Quantity</th>
                      <th className="text-right py-3 font-semibold text-gray-900">Rate</th>
                      <th className="text-right py-3 font-semibold text-gray-900">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.data.items?.map((item, index) => (
                      <tr key={item.id || index} className="border-b border-gray-100">
                        <td className="py-4">
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            {item.showDesc && item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-right text-gray-900">{item.quantity}</td>
                        <td className="py-4 text-right text-gray-900">{formatAmount(item.unit_cost)}</td>
                        <td className="py-4 text-right font-medium text-gray-900">
                          {formatAmount(item.quantity * item.unit_cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="p-8">
              <div className="flex justify-end">
                <div className="w-full md:w-64">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatAmount(subtotal)}</span>
                    </div>

                    {invoice.data.show_discount && invoice.data.discount_percent > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Discount {invoice.data.discount_type === 'percent' ? `(${invoice.data.discount_percent}%)` : ''}
                        </span>
                        <span className="font-medium text-red-600">
                          -{formatAmount(
                            invoice.data.discount_type === 'percent'
                              ? (subtotal * invoice.data.discount_percent) / 100
                              : invoice.data.discount_percent
                          )}
                        </span>
                      </div>
                    )}

                    {invoice.data.show_shipping && invoice.data.shipping_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">{formatAmount(invoice.data.shipping_amount)}</span>
                      </div>
                    )}

                    {invoice.data.show_tax && invoice.data.tax_percent > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Tax {invoice.data.tax_type === 'percent' ? `(${invoice.data.tax_percent}%)` : ''}
                        </span>
                        <span className="font-medium">
                          {formatAmount(
                            invoice.data.tax_type === 'percent'
                              ? (subtotal * invoice.data.tax_percent) / 100
                              : invoice.data.tax_percent
                          )}
                        </span>
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatAmount(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details and Terms */}
            <div className="p-8 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {invoice.data.payment_details && (
                  <div>
                    <div className="flex items-center mb-3">
                      <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                      <h4 className="font-semibold text-gray-900">Payment Details</h4>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.data.payment_details}</p>
                  </div>
                )}

                {invoice.data.terms && (
                  <div>
                    <div className="flex items-center mb-3">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      <h4 className="font-semibold text-gray-900">Terms & Conditions</h4>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.data.terms}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Navbar />
    </>
  );
};

export default InvoicePage;