import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ArrowUpDown,
  Filter,
  Upload,
  Plus,
  MoreVertical,
  Check,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { API_BASE_URL } from '../config/api';
import MainMenu from '../components/MainMenu';
import Navbar from '../components/Navbar';

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
  pagination?: {
    page: number;
    pages: number;
    per_page: number;
    total: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Status options for the filter buttons
const STATUS_OPTIONS = [
  { value: '', label: 'All', color: 'gray' },
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
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesData, setInvoicesData] = useState<InvoiceApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

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
    fetchInvoices();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchInvoices = () => {
    if (!user?.id) return;

    setLoading(true);
    const params = new URLSearchParams({
      user_id: user.id,
      page: currentPage.toString(),
      per_page: '10',
      ...(searchTerm && { search: searchTerm }),
      ...(statusFilter && { status: statusFilter })
    });

    fetch(`${API_BASE_URL}/api/invoices?${params}`)
      .then(res => res.json())
      .then((data: InvoiceApiResponse) => {
        if (data.success) {
          setInvoicesData(data);
        } else {
          setError('Failed to load invoices');
          showNotification('Failed to load invoices', 'error');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading invoices:', err);
        setError('Failed to load invoices');
        showNotification('Failed to load invoices', 'error');
        setLoading(false);
      });
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const deleteInvoice = async (invoiceId: string) => {
    setDeletingInvoice(invoiceId);

    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}?user_id=${user?.id}`, {
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

        showNotification('Invoice deleted successfully');
        setActiveDropdown(null);
        setShowDeleteConfirm(null);
      } else {
        const errorData = await response.json();
        showNotification('Failed to delete invoice', 'error');
        console.error('Failed to delete invoice:', errorData.error);
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      showNotification('Network error occurred', 'error');
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
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/status`, {
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

        showNotification(`Invoice status updated to ${newStatus}`);
        setActiveDropdown(null);
      } else {
        showNotification('Failed to update invoice status', 'error');
        console.error('Failed to update invoice status');
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
      showNotification('Network error occurred', 'error');
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

  const getStatusConfig = (status = '') => {
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

  const toggleDropdown = (invoiceId: string) => {
    setActiveDropdown(activeDropdown === invoiceId ? null : invoiceId);
  };

  const pagination = invoicesData?.pagination;

  return (
      <>
      <div className="md:block hidden sticky top-0 left-0 w-full z-30">
      <MainMenu showLogo={false} />
      </div>
      <div className="md:hidden block">
      <MainMenu />
      </div>

    <div className="">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">

            <div className="flex items-center space-x-3 gap-6">
            {/* Back button */}
           <div className="flex items-center space-x-3 gap-6">
                <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-3 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
                <p className="mt-2 text-gray-600 hidden">
                  Manage your invoices ({filteredInvoices.length} total)
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button className="inline-flex hidden items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </button>
              <button
                onClick={() => {
                  window.location.href = '/new';
                }}
                className="inline-flex items-center px-4 py-3 !bg-neutral-900 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5 mr-2" />
                New <span className="ml-1 hidden lg:inline">Invoice</span>
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* Dropdown Portals - Rendered outside table to avoid clipping */}
      {activeDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}>
          {(() => {
            const buttonElement = document.querySelector(`[data-dropdown-button="${activeDropdown}"]`);
            if (!buttonElement) return null;

            const rect = buttonElement.getBoundingClientRect();

            return (
              <div
                ref={(el) => {
                  dropdownRefs.current[activeDropdown] = el;
                }}
                className="absolute w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                style={{
                  top: rect.bottom + window.scrollY + 8,
                  left: rect.right + window.scrollX - 192, // 192px = w-48
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    Change Status
                  </div>
                  {STATUS_OPTIONS.filter(status => status.value !== '').map((status) => (
                    <button
                      key={status.value}
                      onClick={() => updateInvoiceStatus(activeDropdown, status.value)}
                      className="group flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <span>{status.label}</span>
                      {invoicesData?.invoices.find(inv => inv.id === activeDropdown)?.status === status.value && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => confirmDelete(activeDropdown)}
                      className="group flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                    >
                      <Trash2 className="h-4 w-4 mr-3 text-red-400 group-hover:text-red-500" />
                      Delete Invoice
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 mb-40 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="rounded-xl py-3 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Status Filter Buttons */}
            <div className="w-full">
              <nav className="flex flex-row h-9 overflow-x-auto gap-2.5">
                {STATUS_OPTIONS.map((status) => {
                  const isActive = statusFilter === status.value;

                  return (
                    <button
                      key={status.value}
                      onClick={() => handleStatusFilter(status.value)}
                      className={`flex items-center px-4 py-2.5 rounded-full transition-colors text-sm min-w-fit ${
                        isActive
                          ? 'bg-gray-900 text-neutral-50 font-medium'
                          : 'text-gray-700 hover:bg-white bg-transparent border'
                      }`}
                    >
                      <span className="truncate whitespace-nowrap">{status.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Search Bar */}
            <div className="relative w-full lg:w-auto lg:min-w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search"
                className="w-full !bg-gray-150 pl-10 pr-4 py-3 !rounded-xl border-2 !border-neutral-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-500">Loading invoices...</span>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter ? 'No invoices match your criteria.' : 'Get started by creating your first invoice.'}
              </p>
              <button
                onClick={() => window.location.href = '/new'}
                className="inline-flex hidden items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Invoice
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th className="px-0 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Issued
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => {
                    const statusConfig = getStatusConfig(invoice.status);
                    const totalAmount = calculateInvoiceTotal(invoice);
                    const customerName = invoice.data?.to || 'Unknown Customer';
                    const customerInitials = getCustomerInitials(customerName);
                    const isDropdownActive = activeDropdown === invoice.id;
                    const isUpdating = updatingStatus === invoice.id;

                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 w-2">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedInvoices.has(invoice.id)}
                            onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                          />
                        </td>
                        <td className="px-0 text-left py-4 text-sm text-gray-900">
                          {invoice.data?.invoice_number || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                        {customerInitials}
                                    </span>
                                </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{customerName}</div>
                              <div className="text-sm text-gray-500">{invoice.data?.from || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {formatAmount(totalAmount, invoice.data?.currency_symbol || invoice.currency?.symbol || '£')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {invoice.data?.currency || invoice.currency?.code || 'GBP'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig.className}`}>
                            {statusConfig.label}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(invoice.data?.issued_date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {invoice.data?.due_date ? formatDate(invoice.data.due_date) : 'N/A'}
                          </td>
                        <td className="px-6 py-4 text-right relative">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => toggleDropdown(invoice.id)}
                              disabled={isUpdating}
                              data-dropdown-button={invoice.id}
                              className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              {isUpdating ? (
                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * pagination.per_page) + 1} to {Math.min(currentPage * pagination.per_page, pagination.total)} of {pagination.total} invoices
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!pagination.has_prev}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {pagination.pages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                  disabled={!pagination.has_next}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Confirm Deletion
                  </h3>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this invoice? This action cannot be undone.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteInvoice(showDeleteConfirm)}
                  disabled={deletingInvoice === showDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingInvoice === showDeleteConfirm ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`flex items-center p-4 rounded-lg shadow-lg ${
            notification.type === 'success'
              ? 'bg-green-100 border border-green-200 text-green-800'
              : 'bg-red-100 border border-red-200 text-red-800'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 mr-3 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-3 text-red-600" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-3 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
    <Navbar />
    </>
  );
};

export default InvoicesPage;