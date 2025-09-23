import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Mail, Lock, Save, Camera, ArrowLeft, Edit2, Check, X, CreditCard,
    Trash2, FileText, Bell, DollarSign, Users, Calendar, TrendingUp, Clock, AlertCircle, Plus, ChevronDown } from 'lucide-react';
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
    const [forexRates, setForexRates] = useState(null);
    const [selectedBaseCurrency, setSelectedBaseCurrency] = useState('USD');
    const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
    const [showRevenueCurrencyDropdown, setShowRevenueCurrencyDropdown] = useState(false);
    const [forexLoading, setForexLoading] = useState(false);

    // Memoized helper functions
    const getInitials = useCallback((u) => {
        if (!u) return '';
        const first = u.first_name ? u.first_name[0].toUpperCase() : '';
        const last = u.last_name ? u.last_name[0].toUpperCase() : '';
        if (first || last) return `${first}${last}`;
        if (u.email) return u.email[0].toUpperCase();
        return '';
    }, []);

    const formatCurrency = useCallback((amount, currencySymbol = null) => {
        if (amount === null || amount === undefined || isNaN(amount)) {
            amount = 0;
        }
        const symbol = currencySymbol || currency?.symbol || '£';
        return `${symbol}${amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }, [currency]);

    const getInvoiceCurrency = useCallback((invoice) => {
        return invoice?.data?.currency_symbol ||
               invoice?.currency?.symbol ||
               currency?.symbol ||
               '£';
    }, [currency]);

    const calculateInvoiceTotal = useCallback((invoice) => {
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

        return Math.max(0, total);
    }, []);

    // Fetch forex rates
    const fetchForexRates = useCallback(async () => {
        try {
            setForexLoading(true);
            const response = await fetch('https://api.exchangerate.host/latest?base=USD');
            if (!response.ok) throw new Error('Failed to fetch exchange rates');
            const data = await response.json();
            setForexRates(data.rates);
        } catch (err) {
            console.error('Error fetching forex rates:', err);
            setForexRates({
                'USD': 1, 'EUR': 0.85, 'GBP': 0.73, '£': 0.73, '$': 1, '€': 0.85
            });
        } finally {
            setForexLoading(false);
        }
    }, []);

    // Convert currency to base currency
    const convertToBaseCurrency = useCallback((amount, fromCurrency, toCurrency) => {
        if (!forexRates || fromCurrency === toCurrency) return amount;

        const currencyMap = { '$': 'USD', '£': 'GBP', '€': 'EUR', 'USD': 'USD', 'GBP': 'GBP', 'EUR': 'EUR' };
        const fromCode = currencyMap[fromCurrency] || fromCurrency;
        const toCode = currencyMap[toCurrency] || toCurrency;

        if (fromCode === toCode) return amount;

        const fromRate = forexRates[fromCode] || 1;
        const toRate = forexRates[toCode] || 1;

        return (amount / fromRate) * toRate;
    }, [forexRates]);

    // Memoized dashboard metrics
    const dashboardMetrics = useMemo(() => {
        const invoices = dashboardData?.invoices || [];

        if (!Array.isArray(invoices) || invoices.length === 0) {
            return {
                totalRevenue: 0,
                totalInvoices: 0,
                draftInvoices: 0,
                overdueInvoices: 0,
                recentInvoices: [],
                uniqueClients: 0,
                avgInvoiceValue: 0,
                currencyBreakdown: {}
            };
        }

        const today = new Date();
        let totalRevenue = 0;
        const currencyBreakdown = {};
        const uniqueClients = new Set();
        let paidInvoicesCount = 0;

        invoices.forEach(inv => {
            if (inv?.status === 'paid') {
                const invoiceTotal = calculateInvoiceTotal(inv);
                const invoiceCurrency = getInvoiceCurrency(inv);
                totalRevenue += invoiceTotal;
                paidInvoicesCount++;

                if (!currencyBreakdown[invoiceCurrency]) {
                    currencyBreakdown[invoiceCurrency] = 0;
                }
                currencyBreakdown[invoiceCurrency] += invoiceTotal;
            }

            if (inv?.data?.to && inv.data.to !== 'None' && inv.data.to.trim() !== '') {
                uniqueClients.add(inv.data.to);
            }
        });

        const draftInvoices = invoices.filter(inv => inv?.status === 'draft').length;
        const overdueInvoices = invoices.filter(inv => {
            if (!inv?.data?.due_date) return false;
            const dueDate = new Date(inv.data.due_date);
            return inv.status !== 'paid' && dueDate < today;
        }).length;

        const recentInvoices = invoices
            .filter(inv => inv?.data?.issued_date)
            .sort((a, b) => new Date(b.data.issued_date) - new Date(a.data.issued_date))
            .slice(0, 4);

        return {
            totalRevenue,
            totalInvoices: invoices.length,
            draftInvoices,
            overdueInvoices,
            recentInvoices,
            uniqueClients: uniqueClients.size,
            avgInvoiceValue: paidInvoicesCount > 0 ? totalRevenue / paidInvoicesCount : 0,
            currencyBreakdown
        };
    }, [dashboardData, calculateInvoiceTotal, getInvoiceCurrency]);

    // Format total revenue with mixed currencies
    const formatTotalRevenue = useCallback((metrics) => {
        const currencies = Object.keys(metrics.currencyBreakdown);
        if (currencies.length === 0) return formatCurrency(0);
        if (currencies.length === 1) {
            return formatCurrency(metrics.currencyBreakdown[currencies[0]], currencies[0]);
        }

        const dominantCurrency = currencies.reduce((a, b) =>
            metrics.currencyBreakdown[a] > metrics.currencyBreakdown[b] ? a : b
        );
        return `${formatCurrency(metrics.totalRevenue, dominantCurrency)} *`;
    }, [formatCurrency]);

    // Calculate converted average invoice value
    const getConvertedAverageInvoiceValue = useCallback((metrics) => {
        if (!metrics || !forexRates || Object.keys(metrics.currencyBreakdown).length === 0) {
            return { amount: 0, currency: selectedBaseCurrency };
        }

        const totalConverted = Object.entries(metrics.currencyBreakdown).reduce((total, [currency, amount]) => {
            return total + convertToBaseCurrency(amount, currency, selectedBaseCurrency);
        }, 0);

        const totalInvoices = metrics.totalInvoices || 1;

        return {
            amount: totalConverted / totalInvoices,
            currency: selectedBaseCurrency
        };
    }, [forexRates, selectedBaseCurrency, convertToBaseCurrency]);

    const formatDate = useCallback((dateString) => {
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
    }, []);

    const getStatusConfig = useCallback((status = '') => {
        const statusConfigs = {
            'draft': { label: 'Draft', className: 'bg-[#e6e6e6]/70 text-[#404040]' },
            'sent': { label: 'Sent', className: 'bg-[#dce7ff]/70 text-[#2323ff]' },
            'in progress': { label: 'Sent', className: 'bg-[#dce7ff]/70 text-[#2323ff]' },
            'paid': { label: 'Paid', className: 'bg-[#d4edbc]/70 text-[#2e7230]' },
            'overdue': { label: 'Overdue', className: 'bg-[#ffcfc9]/70 text-[#bc2d20]' }
        };
        return statusConfigs[status.toLowerCase()] || {
            label: status.charAt(0).toUpperCase() + status.slice(1),
            className: 'bg-[#e6e6e6] text-[#404040]'
        };
    }, []);

    const getCustomerInitials = useCallback((customerName) => {
        if (!customerName || customerName === 'Unknown Customer') return 'UC';
        return customerName
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }, []);

    // Currency dropdown component
    const CurrencyDropdown = useCallback(({ isOpen, onClose, currencies, selectedCurrency, onSelect }) => {
        const allCurrencies = [...new Set([...currencies, 'USD', 'EUR', 'GBP'])];

        return isOpen ? (
            <div className="absolute right-0 top-full mt-1 w-20 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                {allCurrencies.map(curr => (
                    <button
                        key={curr}
                        onClick={() => {
                            onSelect(curr);
                            onClose();
                        }}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-100 transition-colors ${
                            selectedCurrency === curr ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                    >
                        {curr}
                    </button>
                ))}
            </div>
        ) : null;
    }, []);

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.id) return;

            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}api/invoices?user_id=${user.id}`);
                if (!response.ok) throw new Error('Failed to fetch dashboard data');
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

    // Fetch forex rates on component mount
    useEffect(() => {
        fetchForexRates();
    }, [fetchForexRates]);

    // Set default base currency when currencies are detected
    useEffect(() => {
        if (dashboardData && !loading) {
            const currencies = Object.keys(dashboardMetrics.currencyBreakdown);
            if (currencies.length > 0 && !selectedBaseCurrency) {
                setSelectedBaseCurrency(currencies[0]);
            }
        }
    }, [dashboardData, loading, dashboardMetrics.currencyBreakdown, selectedBaseCurrency]);

    // Derived values
    const currencies = useMemo(() => Object.keys(dashboardMetrics.currencyBreakdown), [dashboardMetrics.currencyBreakdown]);
    const hasMultipleCurrencies = currencies.length > 1;
    const convertedAvg = getConvertedAverageInvoiceValue(dashboardMetrics);

    // Skeleton Loading Component
    const SkeletonLoader = () => (
        <>
            <div className="md:block hidden sticky top-0 left-0 w-full z-30">
                <MainMenu showLogo={false} />
            </div>
            <div className="md:hidden block">
                <MainMenu />
            </div>

            <div className="bg-white border-b border-gray-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center gap-6">
                            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-40">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-8"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-300 p-6">
                            <div className="flex items-center justify-between">
                                <div className="w-full">
                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3"></div>
                                    <div className="h-7 w-32 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                                <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-gray-300 p-6">
                            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-6"></div>
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between py-4 border-t border-gray-200 first:border-t-0">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                                        <div>
                                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                                            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                                        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-300 p-6">
                                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, j) => (
                                        <div key={j} className="flex items-center justify-between">
                                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                                            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <Navbar />
        </>
    );

    if (loading) return <SkeletonLoader />;
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="md:block hidden sticky top-0 left-0 w-full z-30">
                <MainMenu showLogo={false} />
            </div>
            <div className="md:hidden block">
                <MainMenu />
            </div>

            <div className="min-h-screen bg-gray-100">
                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-6">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Dashboard</h1>
                            </div>

                            <button
                                onClick={() => navigate('/new')}
                                className="inline-flex items-center px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">New Invoice</span>
                                <span className="sm:hidden">New</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-40">
                    <div className="text-gray-600 text-lg mb-8">Welcome back, {user?.first_name || 'Guest'}! 👋</div>

                    {/* Forex Status Banner */}
                    {hasMultipleCurrencies && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center space-x-3">
                                <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-blue-800">Multi-Currency Analysis Active</p>
                                    <p className="text-xs text-blue-600 mt-1">
                                        {forexLoading ? 'Loading exchange rates...' :
                                         forexRates ? 'Live forex rates applied for accurate conversions' :
                                         'Using fallback exchange rates'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total Revenue Card */}
                        <div className="bg-white rounded-xl border border-gray-300 p-6 relative">
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                {hasMultipleCurrencies && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowRevenueCurrencyDropdown(!showRevenueCurrencyDropdown)}
                                            className="flex items-center space-x-1 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                        >
                                            <span>{selectedBaseCurrency}</span>
                                            <ChevronDown className="h-3 w-3" />
                                        </button>
                                        <CurrencyDropdown
                                            isOpen={showRevenueCurrencyDropdown}
                                            onClose={() => setShowRevenueCurrencyDropdown(false)}
                                            currencies={currencies}
                                            selectedCurrency={selectedBaseCurrency}
                                            onSelect={setSelectedBaseCurrency}
                                        />
                                    </div>
                                )}
                            </div>
                            <p className="text-2xl font-bold text-gray-900 mb-1">
                                {hasMultipleCurrencies && forexRates ?
                                    formatCurrency(
                                        Object.entries(dashboardMetrics.currencyBreakdown).reduce((total, [currency, amount]) => {
                                            return total + convertToBaseCurrency(amount, currency, selectedBaseCurrency);
                                        }, 0),
                                        selectedBaseCurrency
                                    ) :
                                    formatTotalRevenue(dashboardMetrics)
                                }
                            </p>
                            {hasMultipleCurrencies && (
                                <p className="text-xs text-gray-500">
                                    {forexRates ? '* Forex converted' : '* Mixed currencies'}
                                </p>
                            )}
                        </div>

                        {/* Individual Currency Cards */}
                        {hasMultipleCurrencies ? (
                            currencies.slice(0, 2).map((currencySymbol, index) => (
                                <div key={currencySymbol} className="bg-white rounded-xl border border-gray-300 p-6">
                                    <p className="text-sm font-medium text-gray-600 mb-3">
                                        Revenue ({currencySymbol})
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(dashboardMetrics.currencyBreakdown[currencySymbol], currencySymbol)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="bg-white rounded-xl border border-gray-300 p-6">
                                    <p className="text-sm font-medium text-gray-600 mb-3">Total Invoices</p>
                                    <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.totalInvoices}</p>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-300 p-6">
                                    <p className="text-sm font-medium text-gray-600 mb-3">Unique Clients</p>
                                    <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.uniqueClients}</p>
                                </div>
                            </>
                        )}

                        {/* Average Invoice Value */}
                        <div className="bg-white rounded-xl border border-gray-300 p-6">
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-sm font-medium text-gray-600">Avg Invoice Value</p>
                                {hasMultipleCurrencies && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                                            className="flex items-center space-x-1 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                        >
                                            <span>{selectedBaseCurrency}</span>
                                            <ChevronDown className="h-3 w-3" />
                                        </button>
                                        <CurrencyDropdown
                                            isOpen={showCurrencyDropdown}
                                            onClose={() => setShowCurrencyDropdown(false)}
                                            currencies={currencies}
                                            selectedCurrency={selectedBaseCurrency}
                                            onSelect={setSelectedBaseCurrency}
                                        />
                                    </div>
                                )}
                            </div>
                            <p className="text-2xl font-bold text-gray-900 mb-1">
                                {formatCurrency(convertedAvg.amount, convertedAvg.currency)}
                            </p>
                            {hasMultipleCurrencies && forexRates && (
                                <p className="text-xs text-gray-500">* Forex converted</p>
                            )}
                        </div>
                    </div>

                    {/* Secondary Metrics */}
                    {hasMultipleCurrencies && currencies.length > 2 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white rounded-xl border border-gray-300 p-6">
                                <p className="text-sm font-medium text-gray-600 mb-3">Total Invoices</p>
                                <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.totalInvoices}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-300 p-6">
                                <p className="text-sm font-medium text-gray-600 mb-3">Unique Clients</p>
                                <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.uniqueClients}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-300 p-6">
                                <p className="text-sm font-medium text-gray-600 mb-3">Conversion Rate</p>
                                <p className="text-sm text-gray-600">
                                    {forexRates ? `1 ${currencies[0]} = ${(forexRates[selectedBaseCurrency] || 1).toFixed(4)} ${selectedBaseCurrency}` : 'Loading...'}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recent Invoices */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl border border-gray-300 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-300">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium text-gray-900">Recent Invoices</h3>
                                        <button
                                            onClick={() => navigate('/invoices')}
                                            className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                                        >
                                            View all
                                        </button>
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-200">
                                    {dashboardMetrics.recentInvoices.length > 0 ? (
                                        dashboardMetrics.recentInvoices.map((invoice) => {
                                            const statusConfig = getStatusConfig(invoice.status);
                                            const totalAmount = calculateInvoiceTotal(invoice);
                                            const customerName = invoice.data?.to || 'Unknown Customer';
                                            const customerInitials = getCustomerInitials(customerName);
                                            const invoiceCurrency = getInvoiceCurrency(invoice);

                                            return (
                                                <div key={invoice.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                                                                <span className="text-white text-sm font-medium">
                                                                    {customerInitials}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                                                    {customerName}
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    #{invoice.data?.invoice_number || 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {formatCurrency(totalAmount, invoiceCurrency)}
                                                            </p>
                                                            <div className="flex items-center space-x-2 mt-1 justify-end">
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
                                        <div className="px-6 py-8 text-center">
                                            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
                                            <p className="text-gray-500 mb-4">Get started by creating your first invoice.</p>
                                            <button
                                                onClick={() => navigate('/new')}
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

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Currency Breakdown */}
                            {hasMultipleCurrencies && (
                                <div className="bg-white rounded-xl border border-gray-300 p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Currency Breakdown</h3>
                                    <div className="space-y-4">
                                        {Object.entries(dashboardMetrics.currencyBreakdown).map(([currency, amount]) => (
                                            <div key={currency} className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-3 w-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                                                    <span className="text-sm font-medium text-gray-700">{currency}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {formatCurrency(amount, currency)}
                                                    </div>
                                                    {forexRates && (
                                                        <div className="text-xs text-gray-500">
                                                            ≈ {formatCurrency(
                                                                convertToBaseCurrency(amount, currency, selectedBaseCurrency),
                                                                selectedBaseCurrency
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Status Summary */}
                            <div className="bg-white rounded-xl border border-gray-300 p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Status</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Clock className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                                            <span className="text-sm text-gray-600">Draft</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{dashboardMetrics.draftInvoices}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                            <span className="text-sm text-gray-600">Overdue</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{dashboardMetrics.overdueInvoices}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white rounded-xl border border-gray-300 p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => navigate('/new')}
                                        className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                        <span className="text-sm font-medium">Create Invoice</span>
                                    </button>
                                    <button
                                        onClick={() => navigate('/clients')}
                                        className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <Users className="h-5 w-5 text-green-600 flex-shrink-0" />
                                        <span className="text-sm font-medium">Manage Clients</span>
                                    </button>
                                    <button
                                        onClick={() => navigate('/settings')}
                                        className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <User className="h-5 w-5 text-purple-600 flex-shrink-0" />
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