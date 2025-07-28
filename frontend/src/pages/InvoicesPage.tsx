import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowUpDown, Filter, Upload, Plus, MoreHorizontal, Check, Trash2 } from 'lucide-react';
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

// Status options for the dropdown
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'sent', label: 'Sent', color: 'blue' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'overdue', label: 'Overdue', color: 'red' }
];

// Helper functions
const calculateInvoiceTotal = (invoice: Invoice): number => {
  let total = 0;

  if (Array.isArray(invoice.data?.items)) {
    total = invoice.data.items.reduce((sum: number, item: InvoiceItem) => {
      const quantity = Number(item.quantity) || 0;
      const unitCost = Number(item.unit_cost) || 0;
      return sum + quantity * unitCost;
    }, 0);
  }

  if (invoice.data?.show_shipping && invoice.data?.shipping_amount) {
    total += Number(invoice.data.shipping_amount) || 0;
  }

  if (invoice.data?.show_discount && invoice.data?.discount_percent) {
    const discountAmount =
      invoice.data.discount_type === 'percent'
        ? (total * invoice.data.discount_percent) / 100
        : invoice.data.discount_percent;
    total -= discountAmount;
  }

  if (invoice.data?.show_tax && invoice.data?.tax_percent) {
    const taxAmount =
      invoice.data.tax_type === 'percent'
        ? (total * invoice.data.tax_percent) / 100
        : invoice.data.tax_percent;
    total += taxAmount;
  }

  return Math.max(0, total);
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

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && dropdownRefs.current[activeDropdown]) {
        const dropdownElement = dropdownRefs.current[activeDropdown];
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setActiveDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    fetch(`${API_BASE_URL}api/invoices?user_id=${user.id}`)
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

  const deleteInvoice = async (invoiceId: string) => {
    setDeletingInvoice(invoiceId);

    try {
      const response = await fetch(`${API_BASE_URL}api/invoices/${invoiceId}?user_id=${user?.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setInvoicesData(prevData => {
          if (!prevData) return prevData;

          return {
            ...prevData,
            invoices: prevData.invoices.filter(invoice => invoice.id !== invoiceId)
          };
        });

        setActiveDropdown(null);
        setShowDeleteConfirm(null);
      } else {
        const errorData = await response.json();
        console.error('Failed to delete invoice:', errorData.error);
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
    } finally {
      setDeletingInvoice(null);
    }
  };

  const confirmDelete = (invoiceId: string) => {
    setShowDeleteConfirm(invoiceId);
    setActiveDropdown(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const updateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    setUpdatingStatus(invoiceId);

    try {
      const response = await fetch(`${API_BASE_URL}api/invoices/${invoiceId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          user_id: user?.id
        }),
      });

      if (response.ok) {
        setInvoicesData(prevData => {
          if (!prevData) return prevData;

          return {
            ...prevData,
            invoices: prevData.invoices.map(invoice =>
              invoice.id === invoiceId
                ? { ...invoice, status: newStatus }
                : invoice
            )
          };
        });

        setActiveDropdown(null);
      } else {
        console.error('Failed to update invoice status');
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const processedInvoices = invoicesData?.invoices || [];

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
        return { label: 'Draft', className: 'bg-gray-100 text-gray-700 border border-gray-200' };
      case 'sent':
      case 'in progress':
        return { label: 'Sent', className: 'bg-blue-50 text-blue-600 border border-blue-200' };
      case 'paid':
        return { label: 'Paid', className: 'bg-green-50 text-green-600 border border-green-200' };
      case 'overdue':
        return { label: 'Overdue', className: 'bg-red-50 text-red-600 border border-red-200' };
      default:
        return { label: status.charAt(0).toUpperCase() + status.slice(1), className: 'bg-gray-100 text-gray-700 border border-gray-200' };
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

  const toggleDropdown = (invoiceId: string) => {
    setActiveDropdown(activeDropdown === invoiceId ? null : invoiceId);
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
              {/* Table headers and rows go here */}
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

                 {/* Ivoices table body */}
                 <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoices.map((invoice) => {
                      const statusConfig = getStatusConfig(invoice.status);
                      const totalAmount = calculateInvoiceTotal(invoice);
                      const customerName = invoice.data.to || 'Unknown Customer';
                      const customerInitials = getCustomerInitials(customerName);
                      const isDropdownActive = activeDropdown === invoice.id;
                      const isUpdating = updatingStatus === invoice.id;

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
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                            <div
                              ref={(el) => {
                                dropdownRefs.current[invoice.id] = el;
                              }}
                            >
                              <button
                                onClick={() => toggleDropdown(invoice.id)}
                                disabled={isUpdating}
                                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                              >
                                {isUpdating ? (
                                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                                ) : (
                                  <MoreHorizontal className="w-4 h-4" />
                                )}
                              </button>

                                {isDropdownActive && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 ">
                                  <div className="py-1">
                                    <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b z-50 border-gray-100">
                                      Change Status
                                    </div>
                                    {STATUS_OPTIONS.map((status) => (
                                      <button
                                        key={status.value}
                                        onClick={() => updateInvoiceStatus(invoice.id, status.value)}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                                      >
                                        <span>{status.label}</span>
                                        {invoice.status === status.value && (
                                          <Check className="w-4 h-4 text-green-600" />
                                        )}
                                      </button>
                                    ))}
                                    <div className="border-t border-gray-100 mt-1 pt-1">
                                      <button
                                        onClick={() => deleteInvoice(invoice.id)}
                                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Invoice
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                    )}


                            </div>
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
