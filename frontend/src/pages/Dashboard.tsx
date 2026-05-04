import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  User,
  Plus,
  FileText,
  Users,
  Clock,
  AlertCircle,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { API_BASE_URL } from "../config/api";
import MainMenu from "../components/MainMenu";
import Navbar from "../components/Navbar";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const calculateInvoiceTotal = (invoice: any): number => {
  const data = invoice.data || {};
  const items = data.items || [];
  let subtotal = items.reduce(
    (sum: number, item: any) =>
      sum + (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0),
    0,
  );

  if (data.show_discount && data.discount_percent) {
    const d =
      data.discount_type === "percent"
        ? (subtotal * data.discount_percent) / 100
        : data.discount_percent;
    subtotal -= d;
  }
  if (data.show_tax && data.tax_percent) {
    const t =
      data.tax_type === "percent"
        ? (subtotal * data.tax_percent) / 100
        : data.tax_percent;
    subtotal += t;
  }
  if (data.show_shipping && data.shipping_amount) {
    subtotal += Number(data.shipping_amount) || 0;
  }
  return Math.max(0, subtotal);
};

const getCurrencySymbol = (invoice: any, currencyOptions: any[]): string => {
  const sym =
    invoice.data?.currency_symbol ||
    (typeof invoice.currency === "object" ? invoice.currency?.symbol : null);
  if (sym) return sym;
  const code =
    invoice.data?.currency?.code ||
    (typeof invoice.currency === "string" ? invoice.currency : null);
  if (code) {
    const opt = currencyOptions.find((o) => o.code === code);
    if (opt) return opt.symbol;
  }
  return "₦";
};

const getCurrencyCode = (invoice: any): string =>
  invoice.data?.currency?.code ||
  (typeof invoice.currency === "string" ? invoice.currency : null) ||
  (typeof invoice.currency === "object" ? invoice.currency?.code : null) ||
  "NGN";

// ─── Sub-components ───────────────────────────────────────────────────────────

const EmptyInvoicesState = ({ onCreateNew }: { onCreateNew: () => void }) => (
  <div className="px-4 py-12 text-center">
    <FileText className="h-12 w-12 text-gray-200 mx-auto mb-3" />
    <h3 className="text-base font-medium text-gray-900 mb-1">
      No invoices yet
    </h3>
    <p className="text-gray-400 mb-4 text-sm">
      Get started by creating your first invoice.
    </p>
    <button
      onClick={onCreateNew}
      className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
    >
      <Plus className="h-4 w-4 mr-1.5" />
      Create Invoice
    </button>
  </div>
);

const StatusDot = ({ color }: { color: string }) => (
  <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${color}`} />
);

const StatusSummary = ({ metrics }: { metrics: any }) => (
  <div className="bg-white rounded-xl border border-gray-300 p-5">
    <h3 className="text-base font-semibold text-gray-900 mb-4">
      Invoice Status
    </h3>
    <div className="space-y-3">
      {[
        { color: "bg-green-500", label: "Paid", value: metrics.paidInvoices },
        { color: "bg-blue-500", label: "Sent", value: metrics.unpaidInvoices },
        { color: "bg-amber-400", label: "Draft", value: metrics.draftInvoices },
        {
          color: "bg-red-400",
          label: "Overdue",
          value: metrics.overdueInvoices,
        },
      ].map(({ color, label, value }) => (
        <div key={label} className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <StatusDot color={color} />
            <span className="text-sm text-gray-500">{label}</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{value}</span>
        </div>
      ))}
    </div>
  </div>
);

const QuickActions = ({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) => (
  <div className="bg-white rounded-xl border border-gray-300 p-5">
    <h3 className="text-base font-semibold text-gray-900 mb-4">
      Quick Actions
    </h3>
    <div className="space-y-1">
      {[
        {
          icon: FileText,
          color: "text-blue-600 bg-blue-50",
          label: "Create Invoice",
          path: "/new",
        },
        {
          icon: Users,
          color: "text-green-600 bg-green-50",
          label: "Manage Clients",
          path: "/clients",
        },
        {
          icon: User,
          color: "text-purple-600 bg-purple-50",
          label: "Settings",
          path: "/settings",
        },
      ].map(({ icon: Icon, color, label, path }) => (
        <button
          key={path}
          onClick={() => onNavigate(path)}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors group"
        >
          <div
            className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${color}`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
            {label}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-gray-300 ml-auto group-hover:text-gray-500 transition-colors" />
        </button>
      ))}
    </div>
  </div>
);

const RecentInvoices = ({
  invoices,
  onViewAll,
  onCreateNew,
  formatCurrency,
  formatDate,
  getStatusConfig,
  getInitials,
  currencyOptions,
}: any) => (
  <div className="lg:col-span-2">
    <div className="bg-white rounded-xl border border-gray-300 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">
          Recent Invoices
        </h3>
        <button
          onClick={onViewAll}
          className="text-sm text-gray-400 hover:text-gray-700 font-medium transition-colors"
        >
          View all →
        </button>
      </div>
      <div className="divide-y divide-gray-50">
        {invoices.length > 0 ? (
          invoices.map((invoice: any) => {
            const statusConfig = getStatusConfig(invoice.status);
            const customerName = invoice.data?.to?.split("\n")[0] || "Unknown";
            const initials = getInitials(customerName);
            const total = calculateInvoiceTotal(invoice);
            const sym = getCurrencySymbol(invoice, currencyOptions);

            return (
              <div
                key={invoice.id}
                className="px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-semibold">
                      {initials}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-900 truncate">
                      {customerName}
                    </p>
                    <p className="text-sm text-gray-400">
                      #{invoice.data?.invoice_number || "—"} ·{" "}
                      {formatDate(invoice.issued_date || invoice.created_at)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-semibold text-gray-900">
                      {sym}
                      {total.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.className}`}
                    >
                      {statusConfig.label}
                    </span>
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

const RevenueCard = ({
  sortedCurrencies,
  currencyMetrics,
  currentIndex,
  onNext,
  onDotClick,
  currencyOptions,
}: any) => {
  if (sortedCurrencies.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-5 lg:p-6">
        <p className="text-sm font-medium text-gray-400 mb-1">Total Revenue</p>
        <p className="text-4xl font-bold text-white">₦0.00</p>
      </div>
    );
  }

  const code = sortedCurrencies[currentIndex];
  const metrics = currencyMetrics[code];
  const opt = currencyOptions.find((o: any) => o.code === code);
  const sym = opt?.symbol || "₦";
  const revenue = metrics?.total_revenue || 0;

  return (
    <div className="bg-gray-900 rounded-xl p-5 lg:p-6 relative overflow-hidden">
      {/* subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full border-4 border-white" />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full border-2 border-white" />
      </div>
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-gray-400">Total Revenue</p>
          {sortedCurrencies.length > 1 && (
            <button
              onClick={onNext}
              className="p-1 hover:bg-gray-700 rounded-md transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
        <p className="text-4xl font-bold text-white mb-3">
          {sym}
          {revenue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
          {code}
        </span>
        {sortedCurrencies.length > 1 && (
          <div className="mt-3 flex gap-1">
            {sortedCurrencies.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => onDotClick(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex ? "bg-white w-4" : "bg-gray-600 w-1.5"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({
  title,
  value,
  icon: Icon,
  accent = false,
}: {
  title: string;
  value: string | number;
  icon?: any;
  accent?: boolean;
}) => (
  <div
    className={`rounded-xl border p-5 ${accent ? "bg-teal-700 border-teal-600" : "bg-white border-gray-300"}`}
  >
    <div className="flex items-center gap-2 mb-3">
      {Icon && (
        <Icon
          className={`h-4 w-4 ${accent ? "text-teal-200" : "text-gray-400"}`}
        />
      )}
      <p
        className={`text-sm font-medium ${accent ? "text-teal-100" : "text-gray-500"}`}
      >
        {title}
      </p>
    </div>
    <p
      className={`text-3xl lg:text-4xl font-bold ${accent ? "text-white" : "text-gray-900"}`}
    >
      {value}
    </p>
  </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
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
          <div className="flex justify-between items-center py-4 sm:py-5">
            <div className="h-8 w-36 bg-gray-200 rounded animate-pulse" />
            <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-5 sm:py-6 lg:py-8 mb-32 sm:mb-40">
        {/* Welcome line */}
        <div className="h-5 w-52 bg-gray-200 rounded animate-pulse mb-5" />

        {/* Top metrics row — 3 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {/* Revenue card (dark) */}
          <div className="bg-gray-800 rounded-xl p-5 lg:p-6">
            <div className="h-3 w-24 bg-gray-700 rounded animate-pulse mb-3" />
            <div className="h-10 w-40 bg-gray-700 rounded animate-pulse mb-3" />
            <div className="h-5 w-12 bg-gray-700 rounded-full animate-pulse" />
          </div>
          {/* Outstanding */}
          <div className="bg-white rounded-xl border border-gray-300 p-5">
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          {/* Total Clients */}
          <div className="bg-white rounded-xl border border-gray-300 p-5">
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="h-10 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Overview label */}
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-3" />

        {/* Overview grid — 4 cols */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`rounded-xl border p-5 ${i === 2 ? "bg-teal-700 border-teal-600" : "bg-white border-gray-300"}`}
            >
              <div
                className={`h-3 w-16 rounded animate-pulse mb-3 ${i === 2 ? "bg-teal-600" : "bg-gray-200"}`}
              />
              <div
                className={`h-10 w-12 rounded animate-pulse ${i === 2 ? "bg-teal-600" : "bg-gray-200"}`}
              />
            </div>
          ))}
        </div>

        {/* Bottom grid: recent invoices + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Recent Invoices — 2/3 width */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-300 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-14 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="divide-y divide-gray-50">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="text-right space-y-2 flex-shrink-0">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-12 bg-gray-100 rounded-full animate-pulse ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar — 1/3 width */}
          <div className="space-y-4">
            {/* Status Summary */}
            <div className="bg-white rounded-xl border border-gray-300 p-5">
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-gray-200 animate-pulse" />
                      <div className="h-3 w-14 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="h-3 w-6 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-300 p-5">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="h-8 w-8 rounded-md bg-gray-200 animate-pulse flex-shrink-0" />
                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Navbar />
    </div>
  </>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currencyOptions } = useCurrency();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCurrencyIndex, setCurrentCurrencyIndex] = useState(0);

  // ── Formatters ──────────────────────────────────────────────────────────────
  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  }, []);

  const getStatusConfig = useCallback((status = "") => {
    const map: Record<string, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-600" },
      sent: { label: "Sent", className: "bg-blue-50 text-blue-600" },
      "in progress": { label: "Sent", className: "bg-blue-50 text-blue-600" },
      paid: { label: "Paid", className: "bg-green-50 text-green-700" },
      overdue: { label: "Overdue", className: "bg-red-50 text-red-600" },
    };
    return (
      map[status.toLowerCase()] || {
        label: status.charAt(0).toUpperCase() + status.slice(1),
        className: "bg-gray-100 text-gray-600",
      }
    );
  }, []);

  const getInitials = useCallback((name: string) => {
    if (!name || name === "Unknown") return "?";
    return name
      .split(" ")
      .map((w) => w.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }, []);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/summary?user_id=${user.id}`,
      );
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      const data = await response.json();
      if (data.success) {
        setDashboardData(data);
        setError(null);
      } else {
        throw new Error(data.error || "Unsuccessful response");
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ── Metrics ─────────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    if (!dashboardData) {
      return {
        totalInvoices: 0,
        draftInvoices: 0,
        overdueInvoices: 0,
        paidInvoices: 0,
        unpaidInvoices: 0,
        uniqueClients: 0,
        recentInvoices: [],
        currencyMetrics: {} as Record<
          string,
          { total_revenue: number; total_outstanding: number }
        >,
      };
    }

    const invoices: any[] = dashboardData.invoices || [];

    const currencyMetrics: Record<
      string,
      { total_revenue: number; total_outstanding: number }
    > = {};

    invoices.forEach((invoice) => {
      const code = getCurrencyCode(invoice);
      if (!currencyMetrics[code]) {
        currencyMetrics[code] = { total_revenue: 0, total_outstanding: 0 };
      }
      const total = calculateInvoiceTotal(invoice);
      const status = (invoice.status || "").toLowerCase();
      if (status === "paid") {
        currencyMetrics[code].total_revenue += total;
      } else if (
        ["sent", "overdue", "in progress", "unpaid"].includes(status)
      ) {
        currencyMetrics[code].total_outstanding += total;
      }
    });

    const recentInvoices = [...invoices]
      .sort(
        (a, b) =>
          new Date(b.created_at || b.issued_date || 0).getTime() -
          new Date(a.created_at || a.issued_date || 0).getTime(),
      )
      .slice(0, 5);

    return {
      totalInvoices: dashboardData.total_invoices ?? invoices.length,
      draftInvoices:
        dashboardData.draft_invoices ??
        invoices.filter((i) => i.status === "draft").length,
      overdueInvoices:
        dashboardData.overdue_invoices ??
        invoices.filter((i) => i.status === "overdue").length,
      paidInvoices:
        dashboardData.paid_invoices ??
        invoices.filter((i) => i.status === "paid").length,
      unpaidInvoices:
        dashboardData.unpaid_invoices ??
        invoices.filter((i) => ["sent", "in progress"].includes(i.status || ""))
          .length,
      uniqueClients:
        dashboardData.unique_clients ??
        new Set(invoices.map((i) => i.client_id).filter(Boolean)).size,
      recentInvoices,
      currencyMetrics,
    };
  }, [dashboardData]);

  const sortedCurrencies = useMemo(
    () => Object.keys(metrics.currencyMetrics).sort(),
    [metrics.currencyMetrics],
  );

  // ── Early returns ───────────────────────────────────────────────────────────
  if (loading) return <SkeletonLoader />;

  if (error) {
    return (
      <>
        <div className="md:block hidden sticky top-0 left-0 w-full z-30">
          <MainMenu showLogo={false} />
        </div>
        <div className="md:hidden block">
          <MainMenu />
        </div>
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
          <div className="text-center max-w-sm bg-white rounded-xl border border-gray-300 p-8">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Couldn't load dashboard
            </h2>
            <p className="text-gray-500 mb-5 text-sm">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Try again
            </button>
          </div>
        </div>
        <Navbar />
      </>
    );
  }

  const currentCode = sortedCurrencies[currentCurrencyIndex];
  const currentMetrics = currentCode
    ? metrics.currencyMetrics[currentCode]
    : null;
  const currentOpt = currencyOptions.find((o) => o.code === currentCode);
  const currentSym = currentOpt?.symbol || "₦";

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
            <div className="flex justify-between items-center py-4 sm:py-5">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Dashboard
              </h1>
              <button
                onClick={() => navigate("/new")}
                className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Invoice
              </button>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-5 sm:py-6 lg:py-8 mb-32 sm:mb-40">
          {/* Welcome */}
          <p className="text-base text-gray-500 mb-5">
            Welcome back,{" "}
            <span className="font-medium text-gray-800">
              {user?.first_name || "there"}
            </span>{" "}
            👋
          </p>

          {/* Top metrics row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <RevenueCard
              sortedCurrencies={sortedCurrencies}
              currencyMetrics={metrics.currencyMetrics}
              currentIndex={currentCurrencyIndex}
              onNext={() =>
                setCurrentCurrencyIndex(
                  (i) => (i + 1) % Math.max(1, sortedCurrencies.length),
                )
              }
              onDotClick={setCurrentCurrencyIndex}
              currencyOptions={currencyOptions}
            />
            <MetricCard
              title="Outstanding"
              value={
                currentMetrics
                  ? `${currentSym}${(currentMetrics.total_outstanding || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `${currentSym}0.00`
              }
              icon={Clock}
            />
            <MetricCard
              title="Total Clients"
              value={metrics.uniqueClients}
              icon={Users}
            />
          </div>

          {/* Overview section */}
          <h2 className="text-base font-semibold text-gray-700 mb-3">
            Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <MetricCard
              title="Total Invoices"
              value={metrics.totalInvoices}
              icon={FileText}
            />
            <MetricCard
              title="Draft"
              value={metrics.draftInvoices}
              icon={FileText}
            />
            <MetricCard
              title="Paid"
              value={metrics.paidInvoices}
              icon={TrendingUp}
              accent
            />
            <MetricCard
              title="Unpaid"
              value={metrics.unpaidInvoices}
              icon={AlertCircle}
            />
          </div>

          {/* Bottom grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            <RecentInvoices
              invoices={metrics.recentInvoices}
              onViewAll={() => navigate("/invoices")}
              onCreateNew={() => navigate("/new")}
              formatDate={formatDate}
              getStatusConfig={getStatusConfig}
              getInitials={getInitials}
              currencyOptions={currencyOptions}
            />
            <div className="space-y-4">
              <StatusSummary metrics={metrics} />
              <QuickActions onNavigate={navigate} />
            </div>
          </div>
        </div>

        <Navbar />
      </div>
    </>
  );
};

export default Dashboard;
