import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  Loader2,
  ChevronRight,
  Mail,
} from "lucide-react";
import { initializePayment, verifyPayment } from "../hooks/usePaystack";

// ─── Types ────────────────────────────────────────────────────────────────────
interface InvoiceItem {
  id: string;
  name: string;
  description: string;
  showDesc: boolean;
  quantity: number;
  unit_cost: number;
}
interface InvoiceData {
  invoice_number: string;
  issued_date: string;
  due_date: string;
  currency_symbol: string;
  items: InvoiceItem[];
  show_discount: boolean;
  discount_percent: number;
  discount_type: string;
  show_tax: boolean;
  tax_percent: number;
  tax_type: string;
  show_shipping: boolean;
  shipping_amount: number;
  from: string;
  logo_url?: string;
  payment_details?: string;
}
interface Invoice {
  id: string;
  status: string;
  data: InvoiceData;
  user_id: string;
}
type Screen =
  | "summary"
  | "email-input"
  | "processing"
  | "success"
  | "already-paid";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (sym: string, n: number) =>
  `${sym}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (s: string) => {
  try {
    return new Date(s).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return s;
  }
};

const calcTotals = (data: InvoiceData) => {
  const subtotal = (data.items || []).reduce(
    (s, i) => s + i.quantity * i.unit_cost,
    0,
  );
  let discount = 0;
  if (data.show_discount && data.discount_percent)
    discount =
      data.discount_type === "percent"
        ? (subtotal * data.discount_percent) / 100
        : data.discount_percent;
  let tax = 0;
  if (data.show_tax && data.tax_percent) {
    const base = subtotal - discount;
    tax =
      data.tax_type === "percent"
        ? (base * data.tax_percent) / 100
        : data.tax_percent;
  }
  const shipping = data.show_shipping ? data.shipping_amount || 0 : 0;
  return {
    subtotal,
    discount,
    tax,
    shipping,
    total: Math.max(0, subtotal - discount + tax + shipping),
  };
};

const base = API_BASE_URL || "http://127.0.0.1:5000";

// ─── Component ────────────────────────────────────────────────────────────────
export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("summary");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Check if returning from Paystack redirect
  useEffect(() => {
    const status = searchParams.get("status");
    const reference =
      searchParams.get("trxref") || searchParams.get("reference");

    if (status === "success" && reference) {
      setScreen("processing");
      verifyPayment(reference).then((result) => {
        if (result.success) {
          setScreen("success");
          // Update invoice status locally
          setInvoice((prev) => (prev ? { ...prev, status: "paid" } : null));
        } else {
          setError(result.error || "Payment verification failed");
          setScreen("summary");
        }
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!id) return;
    fetch(`${base}/api/invoices/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.invoice) {
          setInvoice(d.invoice);
          if (d.invoice.status === "paid") setScreen("already-paid");
        } else {
          setError("Invoice not found");
        }
      })
      .catch(() => setError("Failed to load invoice"))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePay = async () => {
    if (!email || !email.includes("@")) {
      setEmailError("Enter a valid email address");
      return;
    }
    if (!id) return;

    setEmailError("");
    setVerifying(true);

    const result = await initializePayment(id, email);

    if (result.success && result.authorization_url) {
      // Redirect to Paystack hosted payment page
      window.location.href = result.authorization_url;
    } else {
      setEmailError(result.error || "Failed to initialize payment. Try again.");
      setVerifying(false);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const wrap: React.CSSProperties = {
    minHeight: "100vh",
    background: "#f3f4f6",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "32px 16px 64px",
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  };
  const card: React.CSSProperties = { width: "100%", maxWidth: 440 };

  if (loading || screen === "processing")
    return (
      <div style={wrap}>
        <div
          style={{
            ...card,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 80,
            gap: 12,
          }}
        >
          <Loader2
            size={32}
            color="#0f766e"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p style={{ fontSize: 14, color: "#6b7280" }}>
            {screen === "processing"
              ? "Verifying your payment..."
              : "Loading invoice..."}
          </p>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );

  if (error && !invoice)
    return (
      <div style={wrap}>
        <div
          style={{
            ...card,
            background: "#fff",
            borderRadius: 20,
            padding: "48px 32px",
            textAlign: "center",
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>📄</div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 8,
            }}
          >
            Invoice Not Found
          </div>
          <div style={{ fontSize: 14, color: "#6b7280" }}>{error}</div>
        </div>
      </div>
    );

  if (!invoice) return null;

  const data = invoice.data;
  const { subtotal, discount, tax, shipping, total } = calcTotals(data);
  const sym = data.currency_symbol || "₦";
  const businessName = data.from?.split("\n")[0] || "Business";

  // ── Success screen ───────────────────────────────────────────────────────────
  if (screen === "success")
    return (
      <div style={wrap}>
        <div style={card}>
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: "48px 32px",
              textAlign: "center",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <CheckCircle2 size={36} color="#16a34a" />
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#111827",
                marginBottom: 8,
              }}
            >
              Payment Successful!
            </div>
            <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
              Invoice #{data.invoice_number} has been paid. {businessName} will
              be notified.
            </div>
            <div
              style={{
                background: "#f9fafb",
                borderRadius: 12,
                padding: "16px 20px",
              }}
            >
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>
                Amount Paid
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#111827" }}>
                {fmt(sym, total)}
              </div>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Secured by </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0f766e" }}>
              Paystack
            </span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              {" "}
              · Powered by{" "}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0f766e" }}>
              envoyce
            </span>
          </div>
        </div>
      </div>
    );

  // ── Already paid ─────────────────────────────────────────────────────────────
  if (screen === "already-paid")
    return (
      <div style={wrap}>
        <div style={card}>
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: "40px 32px",
              textAlign: "center",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <CheckCircle2 size={30} color="#16a34a" />
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#111827",
                marginBottom: 6,
              }}
            >
              Already Paid
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
              Invoice #{data.invoice_number} has been settled.
            </div>
            <div
              style={{
                background: "#f9fafb",
                borderRadius: 10,
                padding: "12px 16px",
              }}
            >
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>
                Total
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>
                {fmt(sym, total)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  // ── Email input screen ───────────────────────────────────────────────────────
  if (screen === "email-input")
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <button
              onClick={() => setScreen("summary")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6b7280",
                fontSize: 14,
                padding: 0,
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>

            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "24px",
                border: "1px solid #e5e7eb",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Paying
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: "#111827",
                  letterSpacing: "-0.03em",
                  marginBottom: 4,
                }}
              >
                {fmt(sym, total)}
              </div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                Invoice #{data.invoice_number} · {businessName}
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "24px",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: 6,
                }}
              >
                Your email address
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
                We'll send your payment receipt here.
              </div>

              <div style={{ position: "relative", marginBottom: 8 }}>
                <Mail
                  size={16}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handlePay()}
                  placeholder="you@example.com"
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "12px 12px 12px 38px",
                    fontSize: 14,
                    border: `1px solid ${emailError ? "#fca5a5" : "#e5e7eb"}`,
                    borderRadius: 10,
                    outline: "none",
                    boxSizing: "border-box",
                    background: emailError ? "#fef2f2" : "#fff",
                  }}
                />
              </div>

              {emailError && (
                <div
                  style={{ fontSize: 12, color: "#dc2626", marginBottom: 12 }}
                >
                  {emailError}
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={verifying}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: verifying ? "#6b7280" : "#111827",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: verifying ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {verifying ? (
                  <>
                    <Loader2
                      size={18}
                      style={{ animation: "spin 1s linear infinite" }}
                    />{" "}
                    Redirecting to Paystack...
                  </>
                ) : (
                  `Pay ${fmt(sym, total)}`
                )}
              </button>
            </div>

            <div
              style={{
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <img
                src="https://website-v3-assets.s3.amazonaws.com/assets/img/hero/Paystack-mark-white-twitter.png"
                alt="Paystack"
                style={{
                  height: 16,
                  borderRadius: 3,
                  background: "#0ba4db",
                  padding: "2px 4px",
                }}
              />
              <span style={{ fontSize: 12, color: "#9ca3af" }}>
                Secured by Paystack
              </span>
            </div>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          </div>
        </div>
      </div>
    );

  // ── Summary screen ───────────────────────────────────────────────────────────
  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Header */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "20px 24px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              {data.logo_url ? (
                <img
                  src={data.logo_url}
                  alt={businessName}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "#0f766e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}
                  >
                    {businessName.charAt(0)}
                  </span>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}
                >
                  {businessName}
                </div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  Invoice #{data.invoice_number}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}
                >
                  Total Due
                </div>
                <div
                  style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}
                >
                  {fmt(sym, total)}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {[
                ["Issued", data.issued_date],
                ["Due", data.due_date],
              ].map(([label, date]) => (
                <div
                  key={label}
                  style={{
                    background: "#f9fafb",
                    borderRadius: 10,
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      marginBottom: 2,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}
                  >
                    {fmtDate(date as string)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                Items
              </span>
            </div>
            {(data.items || []).map((item, i) => (
              <div
                key={item.id || i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 20px",
                  borderBottom:
                    i < data.items.length - 1 ? "1px solid #f9fafb" : "none",
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}
                  >
                    {item.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                    Qty: {item.quantity} × {fmt(sym, item.unit_cost)}
                  </div>
                </div>
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}
                >
                  {fmt(sym, item.quantity * item.unit_cost)}
                </div>
              </div>
            ))}

            {/* Totals */}
            <div
              style={{
                borderTop: "2px solid #f3f4f6",
                padding: "12px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: "#6b7280",
                }}
              >
                <span>Subtotal</span>
                <span style={{ fontWeight: 500, color: "#111827" }}>
                  {fmt(sym, subtotal)}
                </span>
              </div>
              {discount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  <span>
                    Discount
                    {data.discount_type === "percent"
                      ? ` (${data.discount_percent}%)`
                      : ""}
                  </span>
                  <span style={{ color: "#dc2626", fontWeight: 500 }}>
                    -{fmt(sym, discount)}
                  </span>
                </div>
              )}
              {tax > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  <span>
                    Tax
                    {data.tax_type === "percent"
                      ? ` (${data.tax_percent}%)`
                      : ""}
                  </span>
                  <span style={{ fontWeight: 500, color: "#111827" }}>
                    {fmt(sym, tax)}
                  </span>
                </div>
              )}
              {shipping > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  <span>Shipping</span>
                  <span style={{ fontWeight: 500, color: "#111827" }}>
                    {fmt(sym, shipping)}
                  </span>
                </div>
              )}
              <div
                style={{
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: 8,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}
                >
                  Total
                </span>
                <span
                  style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}
                >
                  {fmt(sym, total)}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 16px",
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: 12,
                fontSize: 13,
                color: "#dc2626",
              }}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Pay button */}
          <button
            onClick={() => setScreen("email-input")}
            style={{
              width: "100%",
              padding: "16px",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            Pay {fmt(sym, total)}
            <ChevronRight size={18} />
          </button>

          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              🔒 Secured by Paystack · Powered by{" "}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0f766e" }}>
              envoyce
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
