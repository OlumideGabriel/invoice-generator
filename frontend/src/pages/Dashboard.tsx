import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Save, Camera, ArrowLeft, Edit2, Check, X, CreditCard,
    Trash2, FileText, Bell, DollarSign, Users, Calendar, TrendingUp, Clock, AlertCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import Tooltip from '../components/Tooltip';

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

    // Format currency
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined || isNaN(amount)) {
            amount = 0;
        }

        let currencyCode = 'USD';
        if (typeof currency === 'string') {
            currencyCode = currency;
        } else if (currency && typeof currency === 'object' && currency.code) {
            currencyCode = currency.code;
        }

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
        }).format(amount);
    };

    // Calculate invoice totals - matching InvoicesPage logic
    const calculateInvoiceTotal = (invoice) => {
        if (!invoice || !invoice.data) return 0;

        // First check if amount is directly available
        if (invoice.data.amount !== undefined) {
            return invoice.data.amount;
        }

        // Fallback calculation if amount is not provided
        if (Array.isArray(invoice.data.items)) {
            const itemsTotal = invoice.data.items.reduce((sum, item) => {
                const quantity = Number(item.quantity) || 0;
                const unitCost = Number(item.unit_cost) || 0;
                return sum + (quantity * unitCost);
            }, 0);

            let total = itemsTotal;

            // Add shipping
            if (invoice.data.show_shipping && invoice.data.shipping_amount) {
                total += parseFloat(invoice.data.shipping_amount) || 0;
            }

            // Add tax
            if (invoice.data.show_tax && invoice.data.tax_percent) {
                const taxPercent = parseFloat(invoice.data.tax_percent) || 0;
                if (invoice.data.tax_type === 'percent') {
                    total += (itemsTotal * taxPercent) / 100;
                } else {
                    total += taxPercent;
                }
            }

            // Apply discount
            if (invoice.data.show_discount && invoice.data.discount_percent && invoice.data.discount_percent > 0) {
                const discountPercent = parseFloat(invoice.data.discount_percent) || 0;
                if (invoice.data.discount_type === 'percent') {
                    total -= (total * discountPercent) / 100;
                } else {
                    total -= discountPercent;
                }
            }

            return total;
        }

        return 0;
    };

    // Get dashboard metrics - using correct data structure
    const getDashboardMetrics = (invoices) => {
        if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
            return {
                totalRevenue: 0,
                totalInvoices: 0,
                draftInvoices: 0,
                overdueInvoices: 0,
                recentInvoices: [],
                uniqueClients: 0,
                avgInvoiceValue: 0
            };
        }

        const today = new Date();
        const totalRevenue = invoices.reduce((sum, inv) => {
            const invoiceTotal = calculateInvoiceTotal(inv);
            return sum + invoiceTotal;
        }, 0);

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
            .slice(0, 5);

        return {
            totalRevenue,
            totalInvoices: invoices.length,
            draftInvoices,
            overdueInvoices,
            recentInvoices,
            uniqueClients: uniqueClients.size,
            avgInvoiceValue: totalRevenue / invoices.length || 0
        };
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    // Get status badge color
    const getStatusColor = (status) => {
        switch (status) {
            case 'draft': return 'bg-yellow-100 text-yellow-800';
            case 'sent': return 'bg-blue-100 text-blue-800';
            case 'paid': return 'bg-green-100 text-green-800';
            case 'overdue': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Fetch dashboard data - using same API endpoint as InvoicesPage
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.id) return;

            try {
                setLoading(true);
                const response = await fetch(`/api/invoices?user_id=${user.id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }
                const data = await response.json();
                setDashboardData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
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
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                            <p className="mt-2 text-gray-600">Welcome back, {user?.first_name || 'User'}!</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/create-invoice')}
                                className="label-1 px-4 py-2 rounded-lg flex items-center space-x-2"
                            >
                                <Plus className="h-5 w-5" />
                                <span>New Invoice</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                                <p className="text-2xl font-bold text-gray-900">{metrics.totalInvoices}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Unique Clients</p>
                                <p className="text-2xl font-bold text-gray-900">{metrics.uniqueClients}</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-full">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg Invoice Value</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.avgInvoiceValue)}</p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-full">
                                <TrendingUp className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Invoices */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-200">
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
                            <div className="divide-y divide-gray-200">
                                {metrics.recentInvoices.length > 0 ? (
                                    metrics.recentInvoices.map((invoice) => (
                                        <div key={invoice.id} className="px-6 py-4 hover:bg-gray-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="bg-blue-100 p-2 rounded-full">
                                                        <FileText className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            Invoice #{invoice.data?.invoice_number || 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            To: {invoice.data?.to || 'Unknown Client'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {formatCurrency(calculateInvoiceTotal(invoice))}
                                                    </p>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(invoice.status || 'draft')}`}>
                                                            {invoice.status || 'draft'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {formatDate(invoice.data?.issued_date)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-6 py-8 text-center">
                                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">No invoices yet</p>
                                        <button
                                            onClick={() => navigate('/create-invoice')}
                                            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                            </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats & Actions */}
                    <div className="space-y-6">
                        {/* Status Summary */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
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
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/create-invoice')}
                                    className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 rounded-lg"
                                >
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    <span className="text-sm font-medium">Create Invoice</span>
                                </button>
                                <button
                                    onClick={() => navigate('/clients')}
                                    className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 rounded-lg"
                                >
                                    <Users className="h-5 w-5 text-green-600" />
                                    <span className="text-sm font-medium">Manage Clients</span>
                                </button>
                                <button
                                    onClick={() => navigate('/settings')}
                                    className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 rounded-lg"
                                >
                                    <User className="h-5 w-5 text-purple-600" />
                                    <span className="text-sm font-medium">Settings</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;