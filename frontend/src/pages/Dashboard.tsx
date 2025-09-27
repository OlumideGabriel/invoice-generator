import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    User, Mail, Lock, Save, Camera, ArrowLeft, Edit2, Check, X, CreditCard,
    Trash2, FileText, Bell, DollarSign, Users, Calendar, TrendingUp, Clock,
    AlertCircle, Plus, ChevronDown
} from 'lucide-react';
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
    const { currency, currencyOptions } = useCurrency();

    // State
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    const [availableCurrencies, setAvailableCurrencies] = useState([]);
    const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
    const [currencyTotals, setCurrencyTotals] = useState({});
    const [currencyLoading, setCurrencyLoading] = useState(false);

    // Local storage keys
    const CURRENCY_PREFERENCE_KEY = 'dashboard_currency_preference';

    // Utility functions
    const formatCurrency = useCallback((amount, currencyCode = 'USD') => {
        if (amount === null || amount === undefined || isNaN(amount)) {
            amount = 0;
        }

        const currencyOption = currencyOptions.find(option => option.code === currencyCode);
        const symbol = currencyOption?.symbol || '$';

        return `${symbol}${amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }, [currencyOptions]);

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

    // Local storage functions
    const getStoredCurrencyPreference = useCallback(() => {
        try {
            const stored = localStorage.getItem(CURRENCY_PREFERENCE_KEY);
            return stored || null;
        } catch (error) {
            console.error('Error reading currency preference from localStorage:', error);
            return null;
        }
    }, []);

    const setStoredCurrencyPreference = useCallback((currencyCode) => {
        try {
            localStorage.setItem(CURRENCY_PREFERENCE_KEY, currencyCode);
        } catch (error) {
            console.error('Error saving currency preference to localStorage:', error);
        }
    }, []);

    // Data fetching
    const fetchAvailableCurrencies = useCallback(async () => {
        try {
            setCurrencyLoading(true);
            const availableCodes = currencyOptions.map(option => option.code);
            setAvailableCurrencies(availableCodes);
        } catch (error) {
            console.error('Error fetching currencies:', error);
            // Fallback to major currencies
            const majorCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'NGN'];
            setAvailableCurrencies(majorCurrencies);
        } finally {
            setCurrencyLoading(false);
        }
    }, [currencyOptions]);

    const fetchDashboardData = useCallback(async (currencyCode = selectedCurrency) => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const response = await fetch(
                `${API_BASE_URL}api/dashboard/summary?user_id=${user.id}&currency=${currencyCode}`
            );
            if (!response.ok) throw new Error('Failed to fetch dashboard data');

            const data = await response.json();
            if (data.success) {
                setDashboardData(data);
                setError(null);

                // Calculate currency totals from all invoices
                if (data.invoices && Array.isArray(data.invoices)) {
                    const totals = {};
                    data.invoices.forEach(invoice => {
                        const currencyCode = invoice.currency || 'USD';
                        const amount = invoice.total_amount || 0;

                        if (!totals[currencyCode]) {
                            totals[currencyCode] = 0;
                        }
                        totals[currencyCode] += amount;
                    });
                    setCurrencyTotals(totals);
                }
            } else {
                throw new Error(data.error || 'API returned unsuccessful response');
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user?.id, selectedCurrency]);

    // Memoized data
    const dashboardMetrics = useMemo(() => {
        if (!dashboardData) {
            return {
                totalRevenue: 0,
                totalOutstanding: 0,
                totalInvoices: 0,
                draftInvoices: 0,
                overdueInvoices: 0,
                paidInvoices: 0,
                unpaidInvoices: 0,
                uniqueClients: 0,
                recentInvoices: [],
                currency: selectedCurrency
            };
        }

        const recentInvoices = (dashboardData.invoices || [])
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 4);

        return {
            totalRevenue: dashboardData.total_revenue || 0,
            totalOutstanding: dashboardData.total_outstanding || 0,
            totalInvoices: dashboardData.total_invoices || 0,
            draftInvoices: dashboardData.draft_invoices || 0,
            overdueInvoices: dashboardData.overdue_invoices || 0,
            paidInvoices: dashboardData.paid_invoices || 0,
            unpaidInvoices: dashboardData.unpaid_invoices || 0,
            uniqueClients: dashboardData.unique_clients || 0,
            recentInvoices: recentInvoices,
            currency: dashboardData.currency || selectedCurrency
        };
    }, [dashboardData, selectedCurrency]);

    // Currency dropdown component with skeleton loader
    const CurrencyDropdown = useCallback(({ isOpen, onClose, currencies, selectedCurrency, onSelect, loading }) => {
        if (!isOpen) return null;

        return (
            <div className="absolute right-0 top-full mt-1 w-24 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                {loading ? (
                    // Skeleton loader for currencies
                    [...Array(5)].map((_, i) => (
                        <div key={i} className="w-full px-3 py-2 text-left">
                            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    ))
                ) : (
                    currencies.map(curr => (
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
                    ))
                )}
            </div>
        );
    }, []);

    // Currency selector button with skeleton
    const CurrencySelector = useCallback(({
        currencies,
        selectedCurrency,
        onSelect,
        loading,
        showDropdown,
        onToggleDropdown
    }) => {
        return (
            <div className="relative">
                <button
                    onClick={onToggleDropdown}
                    disabled={loading}
                    className="flex items-center space-x-1 text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <div className="flex items-center space-x-1">
                            <div className="h-3 w-6 bg-gray-300 rounded animate-pulse"></div>
                            <div className="h-3 w-3 bg-gray-300 rounded animate-pulse"></div>
                        </div>
                    ) : (
                        <>
                            <span>{selectedCurrency}</span>
                            <ChevronDown className="h-3 w-3" />
                        </>
                    )}
                </button>
                <CurrencyDropdown
                    isOpen={showDropdown}
                    onClose={() => onToggleDropdown(false)}
                    currencies={currencies}
                    selectedCurrency={selectedCurrency}
                    onSelect={onSelect}
                    loading={loading}
                />
            </div>
        );
    }, [CurrencyDropdown]);

    // Handle currency selection
    const handleCurrencySelect = useCallback((currencyCode) => {
        setSelectedCurrency(currencyCode);
        setStoredCurrencyPreference(currencyCode);
        setShowCurrencyDropdown(false);
        // Refetch dashboard data with the new currency
        fetchDashboardData(currencyCode);
    }, [setStoredCurrencyPreference, fetchDashboardData]);

    const SkeletonLoader = () => (
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
                        <div className="flex justify-between items-center py-4 sm:py-6">
                            <div className="flex items-center space-x-2 sm:space-x-4">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900">Dashboard</h1>
                                <div className="h-6 w-12 sm:h-8 sm:w-16 bg-gray-200 rounded-lg animate-pulse"></div>
                            </div>

                            <button className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium text-sm sm:text-base">
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                <span className="hidden xs:inline">New Invoice</span>
                                <span className="xs:hidden">New</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 mb-32 sm:mb-40">
                    <div className="h-4 w-32 sm:h-6 sm:w-48 bg-gray-200 rounded animate-pulse mb-6 sm:mb-8"></div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg sm:rounded-xl border border-gray-300 p-3 sm:p-4 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="w-full">
                                        <div className="h-3 w-16 sm:h-4 sm:w-24 bg-gray-200 rounded animate-pulse mb-2 sm:mb-3"></div>
                                        <div className="h-5 w-20 sm:h-7 sm:w-32 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 bg-gray-200 rounded-lg animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg sm:rounded-xl border border-gray-300 p-4 sm:p-6">
                                <div className="h-4 w-32 sm:h-6 sm:w-40 bg-gray-200 rounded animate-pulse mb-4 sm:mb-6"></div>
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between py-3 sm:py-4 border-t border-gray-200 first:border-t-0">
                                        <div className="flex items-center space-x-3 sm:space-x-4">
                                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-200 rounded-full animate-pulse"></div>
                                            <div>
                                                <div className="h-3 w-24 sm:h-4 sm:w-32 bg-gray-200 rounded animate-pulse mb-1 sm:mb-2"></div>
                                                <div className="h-2 w-16 sm:h-3 sm:w-24 bg-gray-200 rounded animate-pulse"></div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="h-3 w-16 sm:h-4 sm:w-20 bg-gray-200 rounded animate-pulse mb-1 sm:mb-2"></div>
                                            <div className="h-2 w-12 sm:h-3 sm:w-16 bg-gray-200 rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="bg-white rounded-lg sm:rounded-xl border border-gray-300 p-4 sm:p-6">
                                    <div className="h-4 w-28 sm:h-6 sm:w-40 bg-gray-200 rounded animate-pulse mb-3 sm:mb-4"></div>
                                    <div className="space-y-2 sm:space-y-3">
                                        {[...Array(3)].map((_, j) => (
                                            <div key={j} className="flex items-center justify-between">
                                                <div className="h-3 w-16 sm:h-4 sm:w-24 bg-gray-200 rounded animate-pulse"></div>
                                                <div className="h-3 w-8 sm:h-4 sm:w-12 bg-gray-200 rounded animate-pulse"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <Navbar />
            </div>
        </>
    );

    // Effects
    useEffect(() => {
        fetchAvailableCurrencies();
    }, [fetchAvailableCurrencies]);

    useEffect(() => {
        // Load currency preference from localStorage on component mount
        const storedCurrency = getStoredCurrencyPreference();
        if (storedCurrency && availableCurrencies.includes(storedCurrency)) {
            setSelectedCurrency(storedCurrency);
            // Fetch data with the stored currency
            fetchDashboardData(storedCurrency);
        } else if (currency?.code && availableCurrencies.includes(currency.code)) {
            setSelectedCurrency(currency.code);
            // Fetch data with the context currency
            fetchDashboardData(currency.code);
        } else {
            // Fetch data with default currency
            fetchDashboardData();
        }
    }, [currency, availableCurrencies, getStoredCurrencyPreference]);

    // Early returns
    if (loading) return <SkeletonLoader />;

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center max-w-sm">
                    <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mx-auto mb-3 sm:mb-4" />
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
                    <p className="text-gray-600 mb-4 text-sm sm:text-base">{error}</p>
                    <button
                        onClick={() => fetchDashboardData(selectedCurrency)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Main render
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
                    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                        <div className="flex justify-between items-center py-4 sm:py-6">
                            <div className="flex items-center space-x-2 sm:space-x-4">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900">Dashboard</h1>
                                {availableCurrencies.length > 1 && (
                                    <CurrencySelector
                                        currencies={availableCurrencies}
                                        selectedCurrency={selectedCurrency}
                                        onSelect={handleCurrencySelect}
                                        loading={currencyLoading}
                                        showDropdown={showCurrencyDropdown}
                                        onToggleDropdown={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                                    />
                                )}
                            </div>

                            <button
                                onClick={() => navigate('/new')}
                                className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium text-sm sm:text-base"
                            >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                <span className="hidden xs:inline">New Invoice</span>
                                <span className="xs:hidden">New</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 mb-32 sm:mb-40">
                    <div className="text-gray-600 text-sm sm:text-lg mb-4 sm:mb-6 lg:mb-8">
                        Welcome back, {user?.first_name || 'Guest'}! 👋
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                        <MetricCard
                            title="Total Revenue"
                            value={formatCurrency(dashboardMetrics.totalRevenue, dashboardMetrics.currency)}
                            useCurrencySymbol={true}
                            currencyCode={dashboardMetrics.currency}
                            iconBg="bg-green-100"
                            iconColor="text-green-600"
                        />
                        <MetricCard
                            title="Outstanding"
                            value={formatCurrency(dashboardMetrics.totalOutstanding, dashboardMetrics.currency)}
                            icon={Clock}
                            iconBg="bg-orange-100"
                            iconColor="text-orange-600"
                        />
                        <MetricCard
                            title="Total Invoices"
                            value={dashboardMetrics.totalInvoices}
                            icon={FileText}
                            iconBg="bg-blue-100"
                            iconColor="text-blue-600"
                        />
                        <MetricCard
                            title="Clients"
                            value={dashboardMetrics.uniqueClients}
                            icon={Users}
                            iconBg="bg-purple-100"
                            iconColor="text-purple-600"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        <RecentInvoices
                            invoices={dashboardMetrics.recentInvoices}
                            onViewAll={() => navigate('/invoices')}
                            onCreateNew={() => navigate('/new')}
                            formatCurrency={formatCurrency}
                            formatDate={formatDate}
                            getStatusConfig={getStatusConfig}
                            getCustomerInitials={getCustomerInitials}
                        />

                        <Sidebar
                            metrics={dashboardMetrics}
                            currencyTotals={currencyTotals}
                            formatCurrency={formatCurrency}
                            onNavigate={navigate}
                        />
                    </div>
                </div>
                <Navbar />
            </div>
        </>
    );
};

const MetricCard = ({ title, value, icon: Icon, iconBg, iconColor, useCurrencySymbol = false, currencyCode = 'USD' }) => {
    const { currencyOptions } = useCurrency();

    const getCurrencySymbol = () => {
        if (!useCurrencySymbol) return <Icon className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-1 rounded-sm p-1 bg-gray-100 text-gray-600`} />;

        const currencyOption = currencyOptions.find(option => option.code === currencyCode);
        const symbol = currencyOption?.symbol || '$';

        return (
            <div className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-1 rounded-sm p-1 bg-gray-100 text-gray-600 flex items-center justify-center text-xs sm:text-sm font-medium`}>
                {symbol}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-300 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center mb-3 sm:mb-4 lg:mb-6">
                        {getCurrencySymbol()}
                        <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
                    </div>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{value}</p>
                </div>
            </div>
        </div>
    );
};

const RecentInvoices = ({
    invoices,
    onViewAll,
    onCreateNew,
    formatCurrency,
    formatDate,
    getStatusConfig,
    getCustomerInitials
}) => (
    <div className="lg:col-span-2">
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-300 overflow-hidden">
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-300">
                <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">Recent Invoices</h3>
                    <button
                        onClick={onViewAll}
                        className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                        View all
                    </button>
                </div>
            </div>
            <div className="divide-y divide-gray-200">
                {invoices.length > 0 ? (
                    invoices.map((invoice) => {
                        const statusConfig = getStatusConfig(invoice.status);
                        const customerName = invoice.data?.to || 'Unknown Customer';
                        const customerInitials = getCustomerInitials(customerName);

                        return (
                            <div key={invoice.id} className="px-3 py-3 sm:px-4 sm:py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 min-w-0 flex-1">
                                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-xs sm:text-sm font-medium">
                                                {customerInitials}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {customerName}
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-500 truncate">
                                                #{invoice.data?.invoice_number || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right ml-2 sm:ml-4 flex-shrink-0">
                                        <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
                                            {formatCurrency(invoice.total_amount, invoice.currency)}
                                        </p>
                                        <div className="flex items-center space-x-1 sm:space-x-2 mt-1 justify-end flex-wrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusConfig.className}`}>
                                                {statusConfig.label}
                                            </span>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                {formatDate(invoice.issued_date || invoice.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <EmptyInvoicesState onCreateNew={onCreateNew} />
                )}
            </div>
        </div>
    </div>
);

const EmptyInvoicesState = ({ onCreateNew }) => (
    <div className="px-4 py-6 sm:px-6 sm:py-8 text-center">
        <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
        <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">Get started by creating your first invoice.</p>
        <button
            onClick={onCreateNew}
            className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Create First Invoice
        </button>
    </div>
);

const Sidebar = ({ metrics, currencyTotals, formatCurrency, onNavigate }) => (
    <div className="space-y-4 sm:space-y-6">
        <StatusSummary metrics={metrics} />
        <CurrencyTotals currencyTotals={currencyTotals} formatCurrency={formatCurrency} />
        <QuickActions onNavigate={onNavigate} />
    </div>
);

const StatusSummary = ({ metrics }) => (
    <div className="bg-white rounded-lg sm:rounded-xl border border-gray-300 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Invoice Status</h3>
        <div className="space-y-3 sm:space-y-4">
            <StatusItem color="bg-green-500" label="Paid" value={metrics.paidInvoices} />
            <StatusItem color="bg-blue-500" label="Unpaid" value={metrics.unpaidInvoices} />
            <StatusItem color="bg-yellow-500" label="Draft" value={metrics.draftInvoices} />
            <StatusItem color="bg-red-500" label="Overdue" value={metrics.overdueInvoices} />
        </div>
    </div>
);

const StatusItem = ({ color, label, value }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
            <div className={`h-2 w-2 sm:h-3 sm:w-3 ${color} rounded-full`}></div>
            <span className="text-xs sm:text-sm text-gray-600">{label}</span>
        </div>
        <span className="text-xs sm:text-sm font-medium text-gray-900">{value}</span>
    </div>
);

const CurrencyTotals = ({ currencyTotals, formatCurrency }) => {
    const currencies = Object.keys(currencyTotals).sort();

    if (currencies.length === 0) return null;

    return (
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-300 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Currency Totals</h3>
            <div className="space-y-2 sm:space-y-3">
                {currencies.map(currencyCode => (
                    <div key={currencyCode} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="h-2 w-2 sm:h-3 sm:w-3 bg-gray-400 rounded-full"></div>
                            <span className="text-xs sm:text-sm text-gray-600">{currencyCode}</span>
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-900 truncate ml-2">
                            {formatCurrency(currencyTotals[currencyCode], currencyCode)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const QuickActions = ({ onNavigate }) => (
    <div className="bg-white rounded-lg sm:rounded-xl border border-gray-300 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
        <div className="space-y-2 sm:space-y-3">
            <QuickActionItem
                icon={FileText}
                iconColor="text-blue-600"
                label="Create Invoice"
                onClick={() => onNavigate('/new')}
            />
            <QuickActionItem
                icon={Users}
                iconColor="text-green-600"
                label="Manage Clients"
                onClick={() => onNavigate('/clients')}
            />
            <QuickActionItem
                icon={User}
                iconColor="text-purple-600"
                label="Settings"
                onClick={() => onNavigate('/settings')}
            />
        </div>
    </div>
);

const QuickActionItem = ({ icon: Icon, iconColor, label, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center space-x-2 sm:space-x-3 px-2 py-2 sm:px-3 sm:py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
    >
        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor} flex-shrink-0`} />
        <span className="text-xs sm:text-sm font-medium">{label}</span>
    </button>
);

export default Dashboard;