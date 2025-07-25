import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, Filter, Upload, Plus, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { API_BASE_URL } from '../config/api';

// Define types based on your actual data structure
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

interface InvoiceApiResponse {
  invoices: Invoice[];
  success: boolean;
}

// Helper functions
const calculateInvoiceTotal = (invoice: Invoice): number => {
  let total = 0;

  // Calculate items total
  if (Array.isArray(invoice.data?.items)) {
    total = invoice.data.items.reduce((sum: number, item: InvoiceItem) => {
      const quantity = Number(item.quantity) || 0;
      const unitCost = Number(item.unit_cost) || 0;
      return sum + (quantity * unitCost);
    }, 0);
  }

  // Add shipping if enabled
  if (invoice.data?.show_shipping && invoice.data?.shipping_amount) {
    total += Number(invoice.data.shipping_amount) || 0;
  }

  // Apply discount if enabled
  if (invoice.data?.show_discount && invoice.data?.discount_percent) {
    const discountAmount = invoice.data.discount_type === 'percent'
      ? (total * invoice.data.discount_percent) / 100
      : invoice.data.discount_percent;
    total -= discountAmount;
  }

  // Apply tax if enabled
  if (invoice.data?.show_tax && invoice.data?.tax_percent) {
    const taxAmount = invoice.data.tax_type === 'percent'
      ? (total * invoice.data.tax_percent) / 100
      : invoice.data.tax_percent;
    total += taxAmount;
  }

  return Math.max(0, total); // Ensure total is never negative
};

const getBillingPeriod = (issuedDate?: string, dueDate?: string): string => {
  if (!issuedDate) return 'N/A';

  const format = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (dueDate) {
    return `${format(issuedDate)} - ${format(dueDate)}`;
  }
  return `Issued: ${format(issuedDate)}`;
};

const InvoicesPage = () => {
  const { user } = useAuth();
  const { currency } = useCurrency();

  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [invoicesData, setInvoicesData] = useState<InvoiceApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // API call effect
  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    fetch(`${API_BASE_URL}/api/invoices?user_id=${user.id}`)
      .then(res => res.json())
      .then((data: InvoiceApiResponse) => {
        if (data.success) {
          setInvoicesData(data);
        } else {
          setError('Failed to load invoices');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading invoices:', err);
        setError('Failed to load invoices');
        setLoading(false);
      });
  }, [user?.id]);

  // Process invoices for display
  const processedInvoices = invoicesData?.invoices || [];

  // Filter invoices based on search and status
  const filteredInvoices = processedInvoices.filter(invoice => {
    const customerName = invoice.data?.to || 'Unknown Customer';
    const invoiceNumber = invoice.data?.invoice_number || '';
    const fromName = invoice.data?.from || '';

    const matchesSearch = !searchTerm ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fromName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatAmount = (amount: number = 0, currencySymbol: string = '£') => {
    return `${currencySymbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusConfig = (status: string = '') => {
    switch (status.toLowerCase()) {
      case 'draft':
        return {
          label: 'Draft',
          className: 'bg-gray-100 text-gray-700 border border-gray-200'
        };
      case 'sent':
      case 'in progress':
        return {
          label: 'Sent',
          className: 'bg-blue-50 text-blue-600 border border-blue-200'
        };
      case 'paid':
        return {
          label: 'Paid',
          className: 'bg-green-50 text-green-600 border border-green-200'
        };
      case 'overdue':
        return {
          label: 'Overdue',
          className: 'bg-red-50 text-red-600 border border-red-200'
        };
      default:
        return {
          label: status.charAt(0).toUpperCase() + status.slice(1),
          className: 'bg-gray-100 text-gray-700 border border-gray-200'
        };
    }
  };

  const getCustomerInitials = (customerName: string): string => {
    return customerName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(new Set(filteredInvoices.map(invoice => invoice.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    const newSelected = new Set(selectedInvoices);
    if (checked) {
      newSelected.add(invoiceId);
    } else {
      newSelected.delete(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  if (loading && !invoicesData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !invoicesData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600 text-center">
          <p className="text-xl font-semibold mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
              <p className="text-gray-600 mt-1">
                Manage your invoices ({filteredInvoices.length} total)
              </p>
            </div>
            <div className="flex space-x-3">
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </button>
              <button
                onClick={() => {
                  window.location.href = '/create-invoice';
                }}
                className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search customers, invoice numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Sort order
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm || statusFilter ? 'No invoices match your criteria' : 'No invoices found'}
              </p>
              <p className="text-gray-400 mt-2">
                {!searchTerm && !statusFilter && 'Create your first invoice to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="w-12 px-6 py-3">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Currency
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Billing period
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th scope="col" className="w-12 px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => {
                    const statusConfig = getStatusConfig(invoice.status);
                    const totalAmount = calculateInvoiceTotal(invoice);
                    const customerName = invoice.data.to || 'Unknown Customer';
                    const customerInitials = getCustomerInitials(customerName);

                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.has(invoice.id)}
                            onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {customerInitials}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {customerName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatAmount(totalAmount, invoice.data?.currency_symbol || invoice.currency?.symbol || '£')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invoice.data?.currency || invoice.currency?.currency || 'GBP'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${statusConfig.className}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invoice.data?.invoice_number || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getBillingPeriod(invoice.data?.issued_date, invoice.data?.due_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(invoice.data?.issued_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(invoice.data?.due_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;