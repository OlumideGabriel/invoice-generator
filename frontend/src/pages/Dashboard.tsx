import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    User, Plus, FileText, Users, Clock, AlertCircle, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { API_BASE_URL } from '../config/api';
import MainMenu from '../components/MainMenu';
import Navbar from '../components/Navbar';

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

const StatusItem = ({ color, label, value }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
            <div className={`h-2 w-2 sm:h-3 sm:w-3 ${color} rounded-full`}></div>
            <span className="text-xs sm:text-sm text-gray-600">{label}</span>
        </div>
        <span className="text-xs sm:text-sm font-medium text-gray-900">{value}</span>
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

const Sidebar = ({ metrics, onNavigate }) => (
    <div className="space-y-4 sm:space-y-6">
        <StatusSummary metrics={metrics} />
        <QuickActions onNavigate={onNavigate} />
    </div>
);

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

const RevenueCarouselCard = ({ sortedCurrencies, currencyMetrics, formatCurrency, currentCurrencyIndex, onNext, onDotClick }) => {
    if (sortedCurrencies.length === 0) {
        return (
            <div className="bg-teal-700 rounded-lg sm:rounded-xl border border-teal-700 p-4 sm:p-5 lg:p-6">
                <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-teal-100" />
                    <p className="text-xs sm:text-sm font-medium text-teal-100">Total Revenue</p>
                </div>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">€0.00</p>
            </div>
        );
    }

    const currencyCode = sortedCurrencies[currentCurrencyIndex];
    const metrics = currencyMetrics[currencyCode];

    return (
        <div className="bg-teal-900 rounded-lg sm:rounded-xl border border-teal-700 p-4 sm:p-5 lg:p-6 relative">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-teal-100" />
                        <p className="text-xs sm:text-sm font-medium text-teal-100">Total Revenue</p>
                    </div>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                        {formatCurrency(metrics.total_revenue || 0, currencyCode)}
                    </p>

                    {/* Carousel indicator dots */}
                    {sortedCurrencies.length > 1 && (
                        <div className="mt-3 sm:mt-4 flex gap-1">
                            {sortedCurrencies.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onDotClick(idx)}
                                    className={`h-1.5 rounded-full transition-all ${
                                        idx === currentCurrencyIndex
                                            ? 'bg-white w-4'
                                            : 'bg-teal-500 w-1.5'
                                    }`}
                                    aria-label={`Currency ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
                {sortedCurrencies.length > 1 && (
                    <button
                        onClick={onNext}
                        className="p-2 hover:bg-teal-800 rounded-lg transition-colors flex-shrink-0"
                        aria-label="Next currency"
                    >
                        <ChevronRight className="h-5 w-5 text-white" />
                    </button>
                )}
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, icon: Icon, isTeal = false }) => {
    return (
        <div className={`rounded-lg sm:rounded-xl border p-4 sm:p-5 lg:p-6 ${
            isTeal
                ? 'bg-teal-700 border-teal-700'
                : 'bg-white border-gray-300'
        }`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                        {Icon && <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${isTeal ? 'text-teal-100' : 'text-gray-600'}`} />}
                        <p className={`text-xs sm:text-sm font-medium ${isTeal ? 'text-teal-100' : 'text-gray-600'}`}>
                            {title}
                        </p>
                    </div>
                    <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${isTeal ? 'text-white' : 'text-gray-900'}`}>
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
};

const MetricsRow = ({ sortedCurrencies, currencyMetrics, formatCurrency, totalInvoices, uniqueClients, currentCurrencyIndex, onCurrencyChange }) => {
    const handleNext = () => {
        if (sortedCurrencies.length > 0) {
            onCurrencyChange((currentCurrencyIndex + 1) % sortedCurrencies.length);
        }
    };

    if (sortedCurrencies.length === 0) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                <MetricCard title="Total Revenue" value="€0.00" icon={Clock} isTeal={true} />
                <MetricCard title="Outstanding" value="€0.00" icon={Clock} />
                <MetricCard title="Total Invoices" value={0} icon={FileText} />
                <MetricCard title="Clients" value={0} icon={Users} />
            </div>
        );
    }

    const currencyCode = sortedCurrencies[currentCurrencyIndex];
    const metrics = currencyMetrics[currencyCode];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <RevenueCarouselCard
                sortedCurrencies={sortedCurrencies}
                currencyMetrics={currencyMetrics}
                formatCurrency={formatCurrency}
                currentCurrencyIndex={currentCurrencyIndex}
                onNext={handleNext}
                onDotClick={onCurrencyChange}
            />
            <MetricCard
                title="Outstanding"
                value={formatCurrency(metrics.total_outstanding || 0, currencyCode)}
                icon={Clock}
            />
            <MetricCard
                title="Clients"
                value={uniqueClients}
                icon={Users}
            />
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { currencyOptions } = useCurrency();

    // State
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentCurrencyIndex, setCurrentCurrencyIndex] = useState(0);

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

    // Data fetching
    const fetchDashboardData = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const response = await fetch(
                `${API_BASE_URL}api/dashboard/summary?user_id=${user.id}`
            );
            if (!response.ok) throw new Error('Failed to fetch dashboard data');

            const data = await response.json();
            if (data.success) {
                setDashboardData(data);
                setError(null);
            } else {
                throw new Error(data.error || 'API returned unsuccessful response');
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // Memoized data with paid invoices counted in revenue
    const dashboardMetrics = useMemo(() => {
        if (!dashboardData) {
            return {
                totalInvoices: 0,
                draftInvoices: 0,
                overdueInvoices: 0,
                paidInvoices: 0,
                unpaidInvoices: 0,
                uniqueClients: 0,
                recentInvoices: [],
                currencyMetrics: {}
            };
        }

        // Calculate metrics by currency, including only paid invoices in revenue
        const currencyMetrics = {};

        if (dashboardData.invoices && Array.isArray(dashboardData.invoices)) {
            dashboardData.invoices.forEach(invoice => {
                const currencyCode = invoice.currency || 'USD';

                if (!currencyMetrics[currencyCode]) {
                    currencyMetrics[currencyCode] = {
                        total_revenue: 0,
                        total_outstanding: 0
                    };
                }

                // Only add to revenue if invoice is paid
                if (invoice.status?.toLowerCase() === 'paid') {
                    currencyMetrics[currencyCode].total_revenue += invoice.total_amount || 0;
                } else if (invoice.status?.toLowerCase() === 'unpaid' || invoice.status?.toLowerCase() === 'overdue' || invoice.status?.toLowerCase() === 'sent' || invoice.status?.toLowerCase() === 'in progress') {
                    // Outstanding invoices (unpaid, overdue, sent, in progress)
                    currencyMetrics[currencyCode].total_outstanding += invoice.total_amount || 0;
                }
            });
        }

        const recentInvoices = (dashboardData.invoices || [])
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        return {
            totalInvoices: dashboardData.total_invoices || 0,
            draftInvoices: dashboardData.draft_invoices || 0,
            overdueInvoices: dashboardData.overdue_invoices || 0,
            paidInvoices: dashboardData.paid_invoices || 0,
            unpaidInvoices: dashboardData.unpaid_invoices || 0,
            uniqueClients: dashboardData.unique_clients || 0,
            recentInvoices: recentInvoices,
            currencyMetrics: currencyMetrics
        };
    }, [dashboardData]);

    const SkeletonLoader = () => (
        <>
            <div className="md:block hidden sticky top-0 left-0 w-full z-30">
                <MainMenu showLogo={false} />
            </div>
            <div className="md:hidden block">
                <MainMenu />
            </div>

            <div className="min-h-screen bg-gray-100">
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4 sm:py-6">
                            <div className="flex items-center space-x-2 sm:space-x-4">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900">Dashboard</h1>
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
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <Navbar />
            </div>
        </>
    );

    // Effects
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

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
                        onClick={() => fetchDashboardData()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Get sorted currency codes
    const sortedCurrencies = Object.keys(dashboardMetrics.currencyMetrics).sort();

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

                    {/* Metrics Row */}
                    <MetricsRow
                        sortedCurrencies={sortedCurrencies}
                        currencyMetrics={dashboardMetrics.currencyMetrics}
                        formatCurrency={formatCurrency}
                        totalInvoices={dashboardMetrics.totalInvoices}
                        uniqueClients={dashboardMetrics.uniqueClients}
                        onCurrencyChange={setCurrentCurrencyIndex}
                        currentCurrencyIndex={currentCurrencyIndex}
                    />

                    {/* Overall Metrics */}
                    <div className="mb-3">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Overall Metrics</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                        <MetricCard
                            title="Total Invoices"
                            value={dashboardMetrics.totalInvoices}
                            icon={FileText}
                        />
                        <MetricCard
                            title="Draft"
                            value={dashboardMetrics.draftInvoices}
                            icon={FileText}
                        />
                        <MetricCard
                            title="Paid"
                            value={dashboardMetrics.paidInvoices}
                            icon={FileText}
                        />
                        <MetricCard
                            title="Unpaid"
                            value={dashboardMetrics.unpaidInvoices}
                            icon={AlertCircle}
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
                            onNavigate={navigate}
                        />
                    </div>
                </div>
                <Navbar />
            </div>
        </>
    );
};

export default Dashboard;