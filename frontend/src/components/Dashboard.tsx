import React, { useState, useEffect } from 'react';
import {
  Plus,
  FileText,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Loader2
} from 'lucide-react';

// Types for your data structure
interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  created_date: string;
  due_date: string;
  description?: string;
}

interface DashboardStats {
  total_revenue: number;
  pending_amount: number;
  total_invoices: number;
  total_clients: number;
  paid_invoices: number;
  overdue_invoices: number;
  monthly_growth: number;
}

interface DashboardData {
  stats: DashboardStats;
  recent_invoices: Invoice[];
}

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch dashboard data from your Flask backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard'); // Adjust endpoint as needed

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Filter invoices based on search term
  const filteredInvoices = dashboardData?.recent_invoices?.filter(invoice =>
    invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle size={14} />;
      case 'sent': return <Clock size={14} />;
      case 'overdue': return <AlertCircle size={14} />;
      case 'draft': return <Edit size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    trend?: string;
    color?: string;
  }> = ({ title, value, icon: Icon, trend, color = "from-blue-500 to-blue-600" }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp size={16} className="text-green-500 mr-1" />
              <span className="text-sm text-green-600">{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-r ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-lg font-medium text-gray-700">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <AlertCircle size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Invoice Generator</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => window.location.href = '/create-invoice'}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>New Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(dashboardData.stats.total_revenue)}
            icon={DollarSign}
            trend={`+${dashboardData.stats.monthly_growth}% from last month`}
            color="from-green-500 to-green-600"
          />
          <StatCard
            title="Pending Amount"
            value={formatCurrency(dashboardData.stats.pending_amount)}
            icon={Clock}
            color="from-yellow-500 to-yellow-600"
          />
          <StatCard
            title="Total Invoices"
            value={dashboardData.stats.total_invoices.toString()}
            icon={FileText}
            color="from-blue-500 to-blue-600"
          />
          <StatCard
            title="Active Clients"
            value={dashboardData.stats.total_clients.toString()}
            icon={Users}
            color="from-purple-500 to-purple-600"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
                <p className="text-3xl font-bold text-green-600">{dashboardData.stats.paid_invoices}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {Math.round((dashboardData.stats.paid_invoices / dashboardData.stats.total_invoices) * 100)}% of total
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {dashboardData.stats.total_invoices - dashboardData.stats.paid_invoices - dashboardData.stats.overdue_invoices}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {Math.round(((dashboardData.stats.total_invoices - dashboardData.stats.paid_invoices - dashboardData.stats.overdue_invoices) / dashboardData.stats.total_invoices) * 100)}% of total
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-3xl font-bold text-red-600">{dashboardData.stats.overdue_invoices}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {Math.round((dashboardData.stats.overdue_invoices / dashboardData.stats.total_invoices) * 100)}% of total
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Filter size={20} className="text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Download size={20} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Invoice</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Client</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Due Date</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{invoice.invoice_number}</div>
                      <div className="text-sm text-gray-500">{formatDate(invoice.created_date)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{invoice.client_name}</div>
                      <div className="text-sm text-gray-500">{invoice.client_email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{formatCurrency(invoice.amount)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        <span className="ml-1 capitalize">{invoice.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">{formatDate(invoice.due_date)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.location.href = `/invoice/${invoice.id}`}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Eye size={16} className="text-gray-400" />
                        </button>
                        <button
                          onClick={() => window.location.href = `/edit-invoice/${invoice.id}`}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Edit size={16} className="text-gray-400" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                          <Send size={16} className="text-gray-400" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                          <MoreVertical size={16} className="text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => window.location.href = '/create-invoice'}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-3"
          >
            <Plus size={20} />
            <span>Create Invoice</span>
          </button>
          <button
            onClick={() => window.location.href = '/clients'}
            className="bg-white text-gray-700 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all flex items-center space-x-3"
          >
            <Users size={20} />
            <span>Manage Clients</span>
          </button>
          <button className="bg-white text-gray-700 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all flex items-center space-x-3">
            <Calendar size={20} />
            <span>Schedule Reminder</span>
          </button>
          <button
            onClick={() => window.location.href = '/reports'}
            className="bg-white text-gray-700 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all flex items-center space-x-3"
          >
            <TrendingUp size={20} />
            <span>View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;