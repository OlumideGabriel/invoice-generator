import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

import {
  ArrowLeft,
  Download,
  Mail,
  Edit,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Ellipsis,
  Loader2,
  ChevronDown,
  X,
  Building,
  MoreVertical,
  Check,
  XCircle,
  BadgeCheck,
  Copy,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { API_BASE_URL } from "../config/api";
import SendInvoice from "../components/SendInvoice";
import MainMenu from "../components/MainMenu";

// ─── Types ────────────────────────────────────────────────────────────────────
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

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  website: string;
  tax_number: string;
  notes: string;
  created_at: string;
  invoice_count?: number;
}

interface Business {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  tax_number?: string;
  logo_url?: string;
  created_at?: string;
  invoice_count?: number;
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
  // Paystack payment metadata — written by verify_payment / webhook
  paid_at?: string;
  paystack_reference?: string;
  paystack_amount?: number;
  payer_email?: string;
}

interface Invoice {
  client_id: string;
  business_id: string;
  currency: Currency;
  data: InvoiceData;
  due_date: string;
  id: string;
  issued_date: string;
  status: string;
  user_id: string;
  client?: Client;
  business?: Business;
}

// ─── Paid banner ──────────────────────────────────────────────────────────────
// Shown inside InvoicePage when status === 'paid'.
// Displays payment confirmation details written by Paystack verify/webhook.
function PaidBanner({
  data,
  invoiceId,
}: {
  data: InvoiceData;
  invoiceId: string;
}) {
  const [copied, setCopied] = useState(false);
  const ref = data.paystack_reference || "";
  const shortRef = ref ? ref.slice(-8).toUpperCase() : null;
  const paidDate = data.paid_at
    ? new Date(data.paid_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/pay/${invoiceId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <BadgeCheck className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-900">
            Payment received via Paystack
          </p>
          <div className="mt-2 space-y-1">
            {paidDate && (
              <p className="text-xs text-green-700">
                <span className="font-medium">Paid on:</span> {paidDate}
              </p>
            )}
            {data.payer_email && (
              <p className="text-xs text-green-700">
                <span className="font-medium">Paid by:</span> {data.payer_email}
              </p>
            )}
            {shortRef && (
              <p className="text-xs text-green-700 font-mono">
                <span className="font-sans font-medium">Ref:</span> {shortRef}
              </p>
            )}
          </div>
        </div>
        {/* Copy payment link — useful for sending again if needed */}
        <button
          onClick={copyLink}
          title="Copy payment link"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-green-200
                     text-green-700 text-xs font-medium rounded-lg hover:bg-green-50
                     transition-colors flex-shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy link
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
const InvoicePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currency: currentCurrency } = useCurrency();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fincraEnabled, setFincraEnabled] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [showSend, setShowSend] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [copyPayLink, setCopyPayLink] = useState(false);

  // ── Fetch invoice ───────────────────────────────────────────────────────────
  const fetchInvoice = useCallback(
    async (silent = false) => {
      if (!id || !user?.id) return;
      if (!silent) setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/invoices/${id}?user_id=${user.id}&include_client=true&include_business=true`,
        );
        const data = await response.json();

        if (data.success && data.invoice) {
          setInvoice(data.invoice);
          if (data.invoice.client) {
            setClient(data.invoice.client);
          } else if (data.invoice.client_id) {
            fetchClient(data.invoice.client_id);
          }
          if (data.invoice.business) {
            setBusiness(data.invoice.business);
          } else if (data.invoice.business_id) {
            fetchBusiness(data.invoice.business_id);
          }
        } else {
          setError("Invoice not found");
        }
      } catch (err) {
        setError("Failed to load invoice");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id, user?.id],
  );

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // ── Re-fetch on tab focus — catches status updates made on PaymentPage ─────
  // When a client pays and the business owner switches back to this tab,
  // the status will refresh automatically without a manual reload.
  useEffect(() => {
    const onFocus = () => fetchInvoice(true); // silent = no loading spinner
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchInvoice]);

  const fetchClient = async (clientId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}?user_id=${user?.id}`,
      );
      const data = await response.json();
      if (data.success && data.client) setClient(data.client);
    } catch (err) {
      console.error("Error fetching client:", err);
    }
  };

  const fetchBusiness = async (businessId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/businesses/${businessId}?user_id=${user?.id}`,
      );
      const data = await response.json();
      if (data.success && data.business) setBusiness(data.business);
    } catch (err) {
      console.error("Error fetching business:", err);
    }
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleEditInvoice = () =>
    invoice && navigate(`/invoice/edit/${invoice.id}`);
  const handleEditClient = () =>
    client && navigate(`/clients?edit=${client.id}`);
  const handleEditBusiness = () =>
    business
      ? navigate("/settings?section=business")
      : navigate("/businesses?create=true");

  const handlePreviewPDF = async () => {
    if (!invoice) return;
    try {
      setPreviewLoading(true);
      const response = await fetch(`${API_BASE_URL}/preview-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoice.data),
      });
      if (response.ok) {
        const blob = await response.blob();
        setPreviewUrl(window.URL.createObjectURL(blob));
      } else {
        throw new Error("Failed to generate preview");
      }
    } catch {
      setError("Failed to generate preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    try {
      setDownloading(true);
      const response = await fetch(`${API_BASE_URL}/generate-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoice.data),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `invoice-${invoice.data.invoice_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error("Failed to generate PDF");
      }
    } catch {
      setError("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!invoice || !user?.id) return;
    try {
      setUpdatingStatus(true);
      const response = await fetch(
        `${API_BASE_URL}/api/invoices/${invoice.id}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, user_id: user.id }),
        },
      );
      if (response.ok) {
        setInvoice((prev) => (prev ? { ...prev, status: newStatus } : null));
        setShowStatusDropdown(false);
        setShowMobileMenu(false);
      } else {
        throw new Error("Failed to update invoice status");
      }
    } catch {
      setError(`Failed to mark invoice as ${newStatus}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCopyPayLink = () => {
    if (!invoice) return;
    navigator.clipboard.writeText(
      `${window.location.origin}/pay/${invoice.id}`,
    );
    setCopyPayLink(true);
    setTimeout(() => setCopyPayLink(false), 2000);
  };

  const closePreview = () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  // ── Derived display values ───────────────────────────────────────────────────
  const getClientFromInvoiceData = (): Client | null => {
    if (!invoice?.data.to) return null;
    const lines = invoice.data.to.split("\n");
    return {
      id: invoice.client_id || "temp",
      name: lines[0],
      email: "",
      phone: "",
      company: "",
      address: invoice.data.to,
      website: "",
      tax_number: "",
      notes: "",
      created_at: invoice.issued_date,
      invoice_count: 1,
    };
  };

  const getBusinessFromInvoiceData = (): Business | null => {
    if (!invoice?.data.from) return null;
    const lines = invoice.data.from.split("\n");
    return {
      id: invoice.business_id || "temp-business",
      name: lines[0],
      email: "",
      phone: "",
      address: invoice.data.from,
      website: "",
      tax_number: "",
      logo_url: invoice.data.logo_url,
      created_at: invoice.issued_date,
      invoice_count: 1,
    };
  };

  const displayClient = client || getClientFromInvoiceData();
  const displayBusiness = business || getBusinessFromInvoiceData();

  const getBusinessName = (): string => {
    if (business?.name) return business.name;
    if (invoice?.data.from)
      return invoice.data.from.split("\n")[0] || "Unknown Business";
    return "Unknown Business";
  };

  // ── Calculations ─────────────────────────────────────────────────────────────
  const calculateSubtotal = (items: InvoiceItem[]) =>
    items.reduce((t, i) => t + i.quantity * i.unit_cost, 0);

  const calculateDiscountAmount = (): number => {
    if (!invoice?.data?.show_discount || !invoice.data.discount_percent)
      return 0;
    const sub = calculateSubtotal(invoice.data.items || []);
    return invoice.data.discount_type === "percent"
      ? (sub * invoice.data.discount_percent) / 100
      : invoice.data.discount_percent;
  };

  const calculateTaxAmount = (): number => {
    if (!invoice?.data?.show_tax || !invoice.data.tax_percent) return 0;
    const base =
      calculateSubtotal(invoice.data.items || []) - calculateDiscountAmount();
    return invoice.data.tax_type === "percent"
      ? (base * invoice.data.tax_percent) / 100
      : invoice.data.tax_percent;
  };

  const calculateShippingAmount = (): number =>
    invoice?.data?.show_shipping ? invoice.data.shipping_amount || 0 : 0;

  const calculateTotal = (): number =>
    Math.max(
      0,
      calculateSubtotal(invoice?.data?.items || []) -
        calculateDiscountAmount() +
        calculateTaxAmount() +
        calculateShippingAmount(),
    );

  const formatAmount = (amount: number): string => {
    // FIX: default to ₦ not £
    const symbol =
      invoice?.data?.currency_symbol || invoice?.currency?.symbol || "₦";
    return `${symbol}${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft":
        return {
          label: "Draft",
          className: "bg-gray-100 text-gray-800",
          icon: Clock,
          canMarkPaid: true,
          canMarkUnpaid: false,
        };
      case "sent":
        return {
          label: "Sent",
          className: "bg-blue-100 text-blue-800",
          icon: CheckCircle2,
          canMarkPaid: true,
          canMarkUnpaid: true,
        };
      case "paid":
        return {
          label: "Paid",
          className: "bg-green-100 text-green-800",
          icon: CheckCircle2,
          canMarkPaid: false,
          canMarkUnpaid: true,
        };
      case "overdue":
        return {
          label: "Overdue",
          className: "bg-red-100 text-red-800",
          icon: AlertCircle,
          canMarkPaid: true,
          canMarkUnpaid: true,
        };
      default:
        return {
          label: status,
          className: "bg-gray-100 text-gray-800",
          icon: Clock,
          canMarkPaid: true,
          canMarkUnpaid: true,
        };
    }
  };

  const statusConfig = getStatusConfig(invoice?.status || "draft");
  const StatusIcon = statusConfig.icon;

  if (loading) {
    return (
      <>
        <MainMenu showLogo={false} />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </>
    );
  }

  if (error || !invoice) {
    return (
      <>
        <MainMenu showLogo={false} />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Invoice Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              {error || "The requested invoice could not be found."}
            </p>
            <button
              onClick={() => navigate("/invoices")}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Invoices
            </button>
          </div>
        </div>
      </>
    );
  }

  const subtotal = calculateSubtotal(invoice.data.items || []);
  const discountAmount = calculateDiscountAmount();
  const taxAmount = calculateTaxAmount();
  const shippingAmount = calculateShippingAmount();
  const total = calculateTotal();
  const isPaid = invoice.status === "paid";

  return (
    <>
      <div className="md:block hidden sticky top-0 left-0 w-full z-30">
        <MainMenu showLogo={false} />
      </div>
      <div className="md:hidden block">
        <MainMenu />
      </div>

      <div className="min-h-screen bg-gray-100">
        {/* ── Mobile Header ─────────────────────────────────────────────────── */}
        <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.history.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div className="flex gap-2">
                  <h1 className="text-lg font-bold text-gray-900 truncate max-w-[150px]">
                    {invoice.data.invoice_number}
                  </h1>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}
                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </span>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 bg-neutral-50 text-neutral-500 rounded-md border border-neutral-300 hover:bg-neutral-100 transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {showMobileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMobileMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      {statusConfig.canMarkPaid && (
                        <button
                          onClick={() => handleUpdateStatus("paid")}
                          disabled={updatingStatus}
                          className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 disabled:opacity-50 text-sm"
                        >
                          {updatingStatus ? (
                            <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                          <span className="font-medium text-gray-900">
                            Mark as Paid
                          </span>
                        </button>
                      )}
                      {statusConfig.canMarkUnpaid &&
                        invoice.status !== "draft" && (
                          <button
                            onClick={() => handleUpdateStatus("sent")}
                            disabled={updatingStatus}
                            className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 disabled:opacity-50 text-sm"
                          >
                            {updatingStatus ? (
                              <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-orange-600" />
                            )}
                            <span className="font-medium text-gray-900">
                              Mark as Unpaid
                            </span>
                          </button>
                        )}
                      {!isPaid && (
                        <button
                          onClick={() => {
                            setShowSend(true);
                            setShowMobileMenu(false);
                          }}
                          className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 text-sm"
                        >
                          <Mail className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-gray-900">
                            Send Invoice
                          </span>
                        </button>
                      )}
                      {/* Copy payment link — always available */}
                      <button
                        onClick={() => {
                          handleCopyPayLink();
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 text-sm"
                      >
                        <Copy className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900">
                          {copyPayLink ? "Copied!" : "Copy payment link"}
                        </span>
                      </button>
                      <div className="border-t border-gray-200 my-1" />
                      <button
                        onClick={() => {
                          handleEditInvoice();
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 text-sm"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900">
                          Edit Invoice
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          handlePreviewPDF();
                          setShowMobileMenu(false);
                        }}
                        disabled={previewLoading}
                        className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 disabled:opacity-50 text-sm"
                      >
                        {previewLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-600" />
                        )}
                        <span className="font-medium text-gray-900">
                          Preview PDF
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          handleDownloadPDF();
                          setShowMobileMenu(false);
                        }}
                        disabled={downloading}
                        className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 disabled:opacity-50 text-sm"
                      >
                        {downloading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                        ) : (
                          <Download className="h-4 w-4 text-gray-600" />
                        )}
                        <span className="font-medium text-gray-900">
                          Download PDF
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Desktop Header ────────────────────────────────────────────────── */}
        <div className="hidden bg-white md:block border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => window.history.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {invoice.data.invoice_number}
                  </h1>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.className}`}
                  >
                    <StatusIcon className="h-4 w-4 mr-1" />
                    {statusConfig.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleEditInvoice}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors md:px-3"
                >
                  <Edit className="h-4 w-4 md:mr-0 xl:mr-2" />
                  <span className="hidden xl:inline">Edit Invoice</span>
                </button>

                <button
                  onClick={handlePreviewPDF}
                  disabled={previewLoading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors md:px-3"
                >
                  {previewLoading ? (
                    <Loader2 className="h-4 w-4 md:mr-0 lg:mr-2 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 md:mr-0 xl:mr-2" />
                  )}
                  <span className="hidden xl:inline">Preview</span>
                </button>

                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors md:px-3"
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 md:mr-0 lg:mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 md:mr-0 xl:mr-2" />
                  )}
                  <span className="hidden xl:inline">Download</span>
                </button>

                {/* Copy payment link */}
                <button
                  onClick={handleCopyPayLink}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors md:px-3"
                >
                  {copyPayLink ? (
                    <>
                      <Check className="h-4 w-4 text-green-600 md:mr-0 xl:mr-2" />
                      <span className="hidden xl:inline text-green-600">
                        Copied!
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 md:mr-0 xl:mr-2" />
                      <span className="hidden xl:inline">Payment link</span>
                    </>
                  )}
                </button>

                {/* Status dropdown */}
                <div className="relative">
                  {isPaid ? (
                    <button
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Paid Invoice
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      disabled={updatingStatus}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {updatingStatus ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Update Status
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </button>
                  )}

                  {showStatusDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowStatusDropdown(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        {statusConfig.canMarkPaid && (
                          <button
                            onClick={() => handleUpdateStatus("paid")}
                            disabled={updatingStatus}
                            className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 disabled:opacity-50 text-sm"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-gray-900">
                              Mark as Paid
                            </span>
                          </button>
                        )}
                        {statusConfig.canMarkUnpaid &&
                          invoice.status !== "draft" && (
                            <button
                              onClick={() => handleUpdateStatus("sent")}
                              disabled={updatingStatus}
                              className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 disabled:opacity-50 text-sm"
                            >
                              <XCircle className="h-4 w-4 text-orange-600" />
                              <span className="font-medium text-gray-900">
                                Mark as Unpaid
                              </span>
                            </button>
                          )}
                        {invoice.status === "draft" && (
                          <button
                            onClick={() => handleUpdateStatus("sent")}
                            disabled={updatingStatus}
                            className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 disabled:opacity-50 text-sm"
                          >
                            <Mail className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-gray-900">
                              Mark as Sent
                            </span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {!isPaid && (
                  <button
                    onClick={() => setShowSend(true)}
                    className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Main content ──────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* ── Left Sidebar ─────────────────────────────────────────────── */}
            <div className="lg:col-span-4 lg:order-1 order-2 space-y-4 sm:space-y-6">
              {/* Paid banner — shown when invoice.status === 'paid' */}
              {isPaid && (
                <PaidBanner data={invoice.data} invoiceId={invoice.id} />
              )}

              {/* Client Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    Client
                  </h3>
                  <button
                    onClick={handleEditClient}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Ellipsis className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium text-sm">
                      {displayClient?.name.charAt(0).toUpperCase() || "C"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {displayClient?.name || "Unknown Client"}
                    </h4>
                    <p className="text-sm text-gray-500 truncate">
                      {displayClient?.email || ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
                  Total
                </h3>
                <div
                  className={`text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 ${isPaid ? "text-green-600" : "text-gray-900"}`}
                >
                  {formatAmount(total)}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      {formatAmount(subtotal)}
                    </span>
                  </div>
                  {invoice.data.show_discount && discountAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Discount
                        {invoice.data.discount_type === "percent" &&
                          invoice.data.discount_percent > 0 && (
                            <span className="text-gray-400 ml-1">
                              ({invoice.data.discount_percent}%)
                            </span>
                          )}
                      </span>
                      <span className="font-medium text-red-600">
                        -{formatAmount(discountAmount)}
                      </span>
                    </div>
                  )}
                  {invoice.data.show_tax && taxAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Tax
                        {invoice.data.tax_type === "percent" &&
                          invoice.data.tax_percent > 0 && (
                            <span className="text-gray-400 ml-1">
                              ({invoice.data.tax_percent}%)
                            </span>
                          )}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatAmount(taxAmount)}
                      </span>
                    </div>
                  )}
                  {invoice.data.show_shipping && shippingAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium text-gray-900">
                        {formatAmount(shippingAmount)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">
                        {isPaid ? "Total Paid" : "Total"}
                      </span>
                      <span
                        className={`font-bold ${isPaid ? "text-green-600" : "text-gray-900"}`}
                      >
                        {formatAmount(total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Integrations Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Integrations
                  </h3>
                  <span className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded-full font-medium">
                    coming soon
                  </span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded flex items-center justify-center">
                      <img
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrB39JdXFkO2oKNih-Zz56pHvkOa8I-hBXHw&s"
                        alt="Fincra"
                        className="rounded w-6 h-6"
                      />
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      Accept payments via <strong>Fincra</strong>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-not-allowed">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={fincraEnabled}
                      disabled
                    />
                    <div
                      className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full
                                    peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px]
                                    after:left-[2px] after:bg-white after:border-gray-300 after:border
                                    after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-400"
                    />
                  </label>
                </div>
                <Link to="/settings?section=integrations">
                  <button className="w-full px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                    Manage integrations
                  </button>
                </Link>
              </div>
            </div>

            {/* ── Main content area ─────────────────────────────────────────── */}
            <div className="lg:col-span-8 lg:order-2 order-1 space-y-4 sm:space-y-6">
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Invoice Details
                  </h3>
                  {isPaid && (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100
                                     text-green-800 text-xs font-semibold rounded-full"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> PAID
                    </span>
                  )}
                </div>

                <div className="p-4 sm:p-6">
                  {/* Dates + Business */}
                  <div className="rounded-lg mb-6 sm:mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-gray-50 px-4 py-2 rounded-lg">
                          <span className="text-sm text-gray-500 block">
                            Issued Date
                          </span>
                          <span className="text-base font-medium text-gray-900">
                            {formatDate(invoice.data.issued_date)}
                          </span>
                        </div>
                        <div className="bg-gray-50 px-4 py-2 rounded-lg">
                          <span className="text-sm text-gray-500 block">
                            Due Date
                          </span>
                          <span className="text-base font-medium text-gray-900">
                            {formatDate(invoice.data.due_date)}
                          </span>
                        </div>
                        {/* Payment date row — only visible when paid */}
                        {isPaid && invoice.data.paid_at && (
                          <div className="bg-green-50 border border-green-100 px-4 py-2 rounded-lg">
                            <span className="text-sm text-green-600 block">
                              Paid Date
                            </span>
                            <span className="text-base font-medium text-green-800">
                              {formatDate(invoice.data.paid_at)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center mb-6 justify-between">
                          <span className="text-sm text-gray-500">
                            Business
                          </span>
                          <button
                            onClick={handleEditBusiness}
                            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                          >
                            <Ellipsis className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center space-x-3">
                          {displayBusiness?.logo_url ? (
                            <img
                              src={displayBusiness.logo_url}
                              alt={displayBusiness.name}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <Building className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {getBusinessName()}
                            </h4>
                            <p className="text-sm text-gray-500 truncate">
                              {displayBusiness?.email || ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">
                            Product/Service
                          </th>
                          <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">
                            Quantity
                          </th>
                          <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">
                            Rate
                          </th>
                          <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invoice.data.items?.map((item, index) => (
                          <tr key={item.id || index}>
                            <td className="py-4 px-2">
                              <div className="font-medium text-gray-900">
                                {item.name}
                              </div>
                              {item.showDesc && item.description && (
                                <div className="text-sm text-gray-500 mt-1">
                                  {item.description}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-2 text-right text-gray-900">
                              {item.quantity}
                            </td>
                            <td className="py-4 px-2 text-right text-gray-900">
                              {formatAmount(item.unit_cost)}
                            </td>
                            <td className="py-4 px-2 text-right font-medium text-gray-900">
                              {formatAmount(item.quantity * item.unit_cost)}
                            </td>
                          </tr>
                        ))}

                        <tr className="border-t-2 border-gray-200">
                          <td
                            className="py-4 px-2 font-semibold text-gray-900"
                            colSpan={3}
                          >
                            Subtotal
                          </td>
                          <td className="py-4 px-2 text-right font-semibold text-gray-900">
                            {formatAmount(subtotal)}
                          </td>
                        </tr>
                        {invoice.data.show_discount && discountAmount > 0 && (
                          <tr>
                            <td className="py-2 px-2 text-gray-600" colSpan={3}>
                              Discount
                              {invoice.data.discount_type === "percent" &&
                                invoice.data.discount_percent > 0 && (
                                  <span className="text-gray-400 ml-1">
                                    ({invoice.data.discount_percent}%)
                                  </span>
                                )}
                            </td>
                            <td className="py-2 px-2 text-right font-medium text-red-600">
                              -{formatAmount(discountAmount)}
                            </td>
                          </tr>
                        )}
                        {invoice.data.show_tax && taxAmount > 0 && (
                          <tr>
                            <td className="py-2 px-2 text-gray-600" colSpan={3}>
                              Tax
                              {invoice.data.tax_type === "percent" &&
                                invoice.data.tax_percent > 0 && (
                                  <span className="text-gray-400 ml-1">
                                    ({invoice.data.tax_percent}%)
                                  </span>
                                )}
                            </td>
                            <td className="py-2 px-2 text-right font-medium text-gray-900">
                              {formatAmount(taxAmount)}
                            </td>
                          </tr>
                        )}
                        {invoice.data.show_shipping && shippingAmount > 0 && (
                          <tr>
                            <td className="py-2 px-2 text-gray-600" colSpan={3}>
                              Shipping
                            </td>
                            <td className="py-2 px-2 text-right font-medium text-gray-900">
                              {formatAmount(shippingAmount)}
                            </td>
                          </tr>
                        )}
                        <tr className="border-t-2 border-gray-200">
                          <td
                            className={`py-4 px-2 font-bold ${isPaid ? "text-green-700" : "text-gray-900"}`}
                            colSpan={3}
                          >
                            {isPaid ? "Total Paid" : "Total"}
                          </td>
                          <td
                            className={`py-4 px-2 text-right font-bold ${isPaid ? "text-green-700" : "text-gray-900"}`}
                          >
                            {formatAmount(total)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewUrl !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-2"
          onClick={() => {
            URL.revokeObjectURL(previewUrl);
            closePreview();
          }}
        >
          <div
            className="bg-white rounded-xl shadow-lg md:min-w-[600px] sm:min-w-[500px] min-w-full h-auto relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                URL.revokeObjectURL(previewUrl);
                closePreview();
              }}
              className="absolute top-2 right-2 md:top-3 md:right-3 text-black/60 hover:text-black/90 bg-black/5 p-1 hover:bg-black/10 rounded-lg z-10"
            >
              <X size={18} />
            </button>
            <div className="flex justify-center items-center w-full overflow-hidden min-h-[400px]">
              {previewUrl === "" ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              ) : (
                <img
                  src={previewUrl}
                  alt="Invoice Preview"
                  className="aspect-[85/110] w-full max-w-2xl rounded-lg bg-neutral-800 p-2 object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {showSend && invoice && (
        <SendInvoice
          invoice={invoice}
          client={displayClient}
          business={displayBusiness}
          onClose={() => setShowSend(false)}
        />
      )}
    </>
  );
};

export default InvoicePage;
