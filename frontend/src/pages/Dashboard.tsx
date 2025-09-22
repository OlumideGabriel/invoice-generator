import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Save, Camera, ArrowLeft, Edit2, Check, X, CreditCard,
    Trash2, FileText, Bell, DollarSign, Users, Calendar, TrendingUp, Clock, AlertCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import Tooltip from '../components/Tooltip';
import { API_BASE_URL } from '../config/api';
import MainMenu from '../components/MainMenu';
import Navbar from '../components/Navbar';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { currency } = useCurrency();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper for avatar initials
    const getInitials = (u) => {
        if (!u) return '';
        const first = u.first_name ? u.first_name[0].toUpperCase() : '';
        const last = u.last_name ? u.last_name[0].toUpperCase() : '';
        if (first || last) return `${first}${last}`;
        if (u.email) return u.email[0].toUpperCase();
        return '';
    };

    // Format currency - updated to use dynamic currency or fallback to user's currency preference
    const formatCurrency = (amount, currencySymbol = null) => {
        if (amount === null || amount === undefined || isNaN(amount)) {
            amount = 0;
        }

        // Use provided currency symbol, or fallback to user's currency context, or default to £
        const symbol = currencySymbol || currency?.symbol || '£';

        return `${symbol}${amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    // Get currency symbol from invoice data
    const getInvoiceCurrency = (invoice) => {
        return invoice?.data?.currency_symbol ||
               invoice?.currency?.symbol ||
               currency?.symbol ||
               '£';
    };

    // Calculate invoice totals - matching InvoicesPage logic exactly
    const calculateInvoiceTotal = (invoice) => {
        if (!invoice || !invoice.data) return 0;

        let total = 0;

        // Calculate items total
        if (Array.isArray(invoice.data.items)) {
            total = invoice.data.items.reduce((sum, item) => {
                const quantity = Number(item.quantity) || 0;
                const unitCost = Number(item.unit_cost) || 0;
                return sum + (quantity * unitCost);
            }, 0);
        }

        // Add shipping if enabled
        if (invoice.data.show_shipping && invoice.data.shipping_amount) {
            total += Number(invoice.data.shipping_amount) || 0;
        }

        // Apply discount if enabled
        if (invoice.data.show_discount && invoice.data.discount_percent) {
            const discountAmount = invoice.data.discount_type === 'percent'
                ? (total * invoice.data.discount_percent) / 100
                : invoice.data.discount_percent;
            total -= discountAmount;
        }

        // Apply tax if enabled
        if (invoice.data.show_tax && invoice.data.tax_percent) {
            const taxAmount = invoice.data.tax_type === 'percent'
                ? (total * invoice.data.tax_percent) / 100
                : invoice.data.tax_percent;
            total += taxAmount;
        }

        return Math.max(0, total); // Ensure total is never negative
    };

    // Get dashboard metrics - updated to handle mixed currencies properly
    const getDashboardMetrics = (invoices) => {
        if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
            return {
                totalRevenue: 0,
                totalInvoices: 0,
                draftInvoices: 0,
                overdueInvoices: 0,
                recentInvoices: [],
                uniqueClients: 0,
                avgInvoiceValue: 0,
                currencyBreakdown: {} // Track revenue by currency
            };
        }

        const today = new Date();
        let totalRevenue = 0;
        const currencyBreakdown = {};

        // Calculate revenue and track by currency
        invoices.forEach(inv => {
            if (inv.status === 'paid') {
                const invoiceTotal = calculateInvoiceTotal(inv);
                const invoiceCurrency = getInvoiceCurrency(inv);

                totalRevenue += invoiceTotal;

                if (!currencyBreakdown[invoiceCurrency]) {
                    currencyBreakdown[invoiceCurrency] = 0;
                }
                currencyBreakdown[invoiceCurrency] += invoiceTotal;
            }
        });

        const draftInvoices = invoices.filter(inv => inv && inv.status === 'draft').length;

        const overdueInvoices = invoices.filter(inv => {
            if (!inv || !inv.data || !inv.data.due_date) return false;
            const dueDate = new Date(inv.data.due_date);
            return inv.status !== 'paid' && dueDate < today;
        }).length;

        const uniqueClients = new Set();
        invoices.forEach(inv => {
            if (inv && inv.data && inv.data.to && inv.data.to !== 'None' && inv.data.to.trim() !== '') {
                uniqueClients.add(inv.data.to);
            }
        });

        const recentInvoices = invoices
            .filter(inv => inv && inv.data && inv.data.issued_date)
            .sort((a, b) => new Date(b.data.issued_date) - new Date(a.data.issued_date))
            .slice(0, 4);

        return {
            totalRevenue,
            totalInvoices: invoices.length,
            draftInvoices,
            overdueInvoices,
            recentInvoices,
            uniqueClients: uniqueClients.size,
            avgInvoiceValue: totalRevenue / invoices.length || 0,
            currencyBreakdown
        };
    };

    // Format total revenue with mixed currencies
    const formatTotalRevenue = (metrics) => {
        const currencies = Object.keys(metrics.currencyBreakdown);

        if (currencies.length === 0) {
            return formatCurrency(0);
        }

        if (currencies.length === 1) {
            const currency = currencies[0];
            return formatCurrency(metrics.currencyBreakdown[currency], currency);
        }

        // Multiple currencies - show dominant currency with indication of mixed
        const dominantCurrency = currencies.reduce((a, b) =>
            metrics.currencyBreakdown[a] > metrics.currencyBreakdown[b] ? a : b
        );

        return `${formatCurrency(metrics.totalRevenue, dominantCurrency)} *`;
    };

    // Format average invoice value using the dominant currency from actual revenue
    const formatAverageInvoiceValue = (metrics) => {
        if (!metrics || metrics.avgInvoiceValue === null || metrics.avgInvoiceValue === undefined) {
            return formatCurrency(0, currency?.symbol);
        }

        if (metrics.avgInvoiceValue === 0) {
            return formatCurrency(0, currency?.symbol);
        }

        const currencies = Object.keys(metrics.currencyBreakdown || {});

        if (currencies.length === 0) {
            return formatCurrency(metrics.avgInvoiceValue, currency?.symbol);
        }

        // Use the dominant currency from the actual revenue data
        const dominantCurrency = currencies.reduce((a, b) =>
            metrics.currencyBreakdown[a] > metrics.currencyBreakdown[b] ? a : b
        );

        return formatCurrency(metrics.avgInvoiceValue, dominantCurrency);
    };


    // Format date - updated to match InvoicesPage
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    // Get status badge color - updated to match InvoicesPage
    const getStatusConfig = (status = '') => {
        switch (status.toLowerCase()) {
            case 'draft':
                return {
                    label: 'Draft',
                    className: 'bg-[#e6e6e6]/70 text-[#404040]'
                };
            case 'sent':
            case 'in progress':
                return {
                    label: 'Sent',
                    className: 'bg-[#dce7ff]/70 text-[#2323ff]'
                };
            case 'paid':
                return {
                    label: 'Paid',
                    className: 'bg-[#d4edbc]/70 text-[#2e7230]'
                };
            case 'overdue':
                return {
                    label: 'Overdue',
                    className: 'bg-[#ffcfc9]/70 text-[#bc2d20]'
                };
            default:
                return {
                    label: status.charAt(0).toUpperCase() + status.slice(1),
                    className: 'bg-[#e6e6e6] text-[#404040]'
                };
        }
    };

    // Get customer initials - matching InvoicesPage
    const getCustomerInitials = (customerName) => {
        if (!customerName || customerName === 'Unknown Customer') return 'UC';
        return customerName
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Fetch dashboard data - using same API endpoint as InvoicesPage
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.id) return;

            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}api/invoices?user_id=${user.id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }
                const data = await response.json();
                if (data.success) {
                    setDashboardData(data);
                } else {
                    throw new Error('API returned unsuccessful response');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    // Skeleton Loading Component
    const SkeletonLoader = () => {
        return (
            <>
                <div className="md:block hidden sticky top-0 left-0 w-full z-30">
                    <MainMenu showLogo={false} />
                </div>
                <div className="md:hidden block">
                    <MainMenu />
                </div>
                {/* Header */}
                <div className="bg-white border-b border-gray-300">
                    <div className="max-w-7xl mx-auto px-8">
                        <div className="flex justify-between items-center py-6">
                            {/* Back button and title */}
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => window.history.back()}
                                    className="inline-flex hidden items-center px-3 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg
                                    text-gray-400 hover:text-gray-800 transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>

                                <div>
                                    <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
                                    <p className="text-gray-600 hidden">Welcome back, {user?.first_name || 'Guest'}!</p>
                                </div>
                            </div>

                            {/* New Invoice Button */}
                            <button
                                onClick={() => navigate('/new')}
                                className="lg:inline-flex hidden items-center px-4 py-3 bg-black/90 text-white rounded-lg
                                 hover:bg-neutral-800 transition-colors duration-200"
                            >
                                <Plus className="mr-2" size={19} />
                                New Invoice
                            </button>

                            {/* Mobile floating button */}
                            <button
                                onClick={() => navigate('/new')}
                                className="inline-flex lg:hidden items-center gap-2 px-4 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors duration-200"
                            >
                                <Plus size={20} />
                                 New Invoice
                            </button>
                        </div>
                    </div>
                </div>

                <div className="">
                    {/* Main Content Skeleton */}
                    <div className="max-w-7xl mx-auto px-8 py-8">
                        {/* Metrics Cards Skeleton */}
                        <div className="h-6 w-64 bg-gray-200 rounded-md animate-pulse mb-6"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white rounded-xl border border-gray-300 p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="w-full">
                                            <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse mb-2"></div>
                                            <div className="h-8 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                                        </div>
                                        <div className="h-10 w-12 bg-gray-200 rounded-lg animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Recent Invoices Skeleton */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-xl border border-gray-300 overflow-hidden">
                                    <div className="px-8 py-4 border-b border-gray-300">
                                        <div className="flex items-center justify-between">
                                            <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse"></div>
                                            <div className="h-6 w-16 bg-gray-200 rounded-md animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-gray-300">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="px-8 py-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                                                        <div>
                                                            <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse mb-2"></div>
                                                            <div className="h-3 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end self-end justify-end">
                                                        <div className="h-4 w-14 bg-gray-200 rounded-md animate-pulse"></div>
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            <div className="h-4 w-6 bg-gray-200 rounded-md animate-pulse"></div>
                                                            <div className="h-4 w-16 bg-gray-200 rounded-md animate-pulse"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats & Actions Skeleton */}
                            <div className="space-y-6">
                                {/* Status Summary Skeleton */}
                                <div className="bg-white rounded-xl border border-gray-300 p-6">
                                    <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse mb-4"></div>
                                    <div className="space-y-3">
                                        {[...Array(2)].map((_, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
                                                    <div className="h-4 w-16 bg-gray-200 rounded-md animate-pulse"></div>
                                                </div>
                                                <div className="h-4 w-8 bg-gray-200 rounded-md animate-pulse"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Actions Skeleton */}
                                <div className="bg-white rounded-xl border border-gray-300 p-6">
                                    <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse mb-4"></div>
                                    <div className="space-y-3">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="flex items-center space-x-3 px-4 py-2">
                                                <div className="h-5 w-5 bg-gray-200 rounded-md animate-pulse"></div>
                                                <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    if (loading) {
        return <SkeletonLoader />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center">
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
                <p className="text-gray-600">{error}</p>
            </div>
        );
    }

    // Use the same data structure as InvoicesPage
    const invoices = dashboardData?.invoices || [];
    const metrics = getDashboardMetrics(invoices);

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
                <div className="bg-white border-b border-gray-300">
                    <div className="max-w-7xl mx-auto px-8">
                        <div className="flex justify-between items-center py-6">
                            {/* Back button and title */}
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => window.history.back()}
                                    className="inline-flex hidden items-center px-3 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg
                                    text-gray-400 hover:text-gray-800 transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>

                                <div>
                                    <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
                                    <p className="text-gray-600 hidden">Welcome back, {user?.first_name || 'Guest'}!</p>
                                </div>
                            </div>

                            {/* New Invoice Button */}
                            <button
                                onClick={() => navigate('/new')}
                                className="lg:inline-flex hidden items-center px-4 py-3 bg-black/90 text-white rounded-lg
                                 hover:bg-neutral-800 transition-colors duration-200"
                            >
                                <Plus className="mr-2" size={19} />
                                New Invoice
                            </button>

                            {/* Mobile floating button */}
                            <button
                                onClick={() => navigate('/new')}
                                className="inline-flex lg:hidden items-center gap-2 px-4 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors duration-200"
                            >
                                <Plus size={20} />
                                 New Invoice
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-8 mb-40 py-8">
                    <div className="text-gray-600 text-xl mb-6">Welcome back, {user?.first_name || 'Guest'}!</div>
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl border border-gray-300 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatTotalRevenue(metrics)}
                                    </p>
                                    {Object.keys(metrics.currencyBreakdown).length > 1 && (
                                        <p className="text-xs text-gray-500 mt-1">* Mixed currencies</p>
                                    )}
                                </div>
                                <div className="bg-green-100 p-3 hidden rounded-lg">
                                    <DollarSign className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-300 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                                    <p className="text-2xl font-bold text-gray-900">{metrics.totalInvoices}</p>
                                </div>
                                <div className="bg-blue-100 p-3 hidden rounded-lg">
                                    <FileText className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-300 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Unique Clients</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {metrics.uniqueClients}
                                    </p>
                                </div>
                                <div className="bg-green-100 p-3 hidden rounded-lg">
                                    <DollarSign className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-300 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Avg Invoice Value</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatAverageInvoiceValue(metrics)}
                                    </p>
                                    {Object.keys(metrics.currencyBreakdown).length > 1 && (
                                        <p className="text-xs text-gray-500 mt-1">* Based on dominant currency</p>
                                    )}
                                </div>
                                <div className="bg-orange-100 p-3 hidden rounded-lg">
                                    <TrendingUp className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recent Invoices */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl border border-gray-300 overflow-hidden">
                                <div className="px-8 py-4 border-b border-gray-300">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium text-gray-900">Recent Invoices</h3>
                                        <button
                                            onClick={() => navigate('/invoices')}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            View all
                                        </button>
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-300">
                                    {metrics.recentInvoices.length > 0 ? (
                                        metrics.recentInvoices.map((invoice) => {
                                            const statusConfig = getStatusConfig(invoice.status);
                                            const totalAmount = calculateInvoiceTotal(invoice);
                                            const customerName = invoice.data?.to || 'Unknown Customer';
                                            const customerInitials = getCustomerInitials(customerName);
                                            const invoiceCurrency = getInvoiceCurrency(invoice);

                                            return (
                                                <div key={invoice.id} className="px-8 py-4 hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="flex-shrink-0 h-8 w-8">
                                                                <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center">
                                                                    <span className="text-white text-sm font-medium">
                                                                        {customerInitials}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {customerName}
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    Invoice #{invoice.data?.invoice_number || 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {formatCurrency(totalAmount, invoiceCurrency)}
                                                            </p>
                                                            <div className="flex items-center space-x-2 mt-1">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusConfig.className}`}>
                                                                    {statusConfig.label}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {formatDate(invoice.data?.issued_date)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="px-8 py-8 text-center">
                                            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
                                            <p className="text-gray-500 mb-4">Get started by creating your first invoice.</p>
                                            <button
                                                onClick={() => navigate('/')}
                                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create First Invoice
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats & Actions */}
                        <div className="space-y-6">
                            {/* Status Summary */}
                            <div className="bg-white rounded-xl border border-gray-300 p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Status</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Clock className="h-4 w-4 text-yellow-500" />
                                            <span className="text-sm text-gray-600">Draft</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{metrics.draftInvoices}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                            <span className="text-sm text-gray-600">Overdue</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{metrics.overdueInvoices}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white rounded-xl border border-gray-300 p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => navigate('/')}
                                        className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        <span className="text-sm font-medium">Create Invoice</span>
                                    </button>
                                    <button
                                        onClick={() => navigate('/clients')}
                                        className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <Users className="h-5 w-5 text-green-600" />
                                        <span className="text-sm font-medium">Manage Clients</span>
                                    </button>
                                    <button
                                        onClick={() => navigate('/settings')}
                                        className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <User className="h-5 w-5 text-purple-600" />
                                        <span className="text-sm font-medium">Settings</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Navbar />
            </div>
        </>
    );
};

export default Dashboard;