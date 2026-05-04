import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  ChevronRight,
  Mail,
  BadgeCheck,
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
  paid_at?: string;
  paystack_reference?: string;
  payer_email?: string;
}
interface InvoiceClient {
  id: string;
  name: string;
  email: string;
}
interface InvoiceBusiness {
  id: string;
  name: string;
  email?: string;
}
interface Invoice {
  id: string;
  status: string;
  data: InvoiceData;
  user_id: string;
  client?: InvoiceClient;
  business?: InvoiceBusiness;
}

type Screen = "summary" | "email-input" | "processing" | "already-paid";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (sym: string, n: number) =>
  `${sym}${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

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

// ─── Paid Invoice Card ────────────────────────────────────────────────────────
function PaidInvoiceCard({
  invoice,
  justPaid,
}: {
  invoice: Invoice;
  justPaid: boolean;
}) {
  const data = invoice.data;
  const { subtotal, discount, tax, shipping, total } = calcTotals(data);
  const sym = data.currency_symbol || "₦";
  const businessName = data.from?.split("\n")[0] || "Business";
  const paidAt = data.paid_at
    ? fmtDate(data.paid_at)
    : fmtDate(new Date().toISOString());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Banner */}
      <div
        style={{
          background: justPaid ? "#dcfce7" : "#f0fdf4",
          border: `1px solid ${justPaid ? "#86efac" : "#bbf7d0"}`,
          borderRadius: 16,
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "#16a34a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <BadgeCheck size={28} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#14532d" }}>
            {justPaid ? "Payment Successful!" : "Invoice Already Paid"}
          </div>
          <div style={{ fontSize: 13, color: "#166534", marginTop: 2 }}>
            {justPaid
              ? `Paid on ${paidAt} · ${businessName} has been notified.`
              : `This invoice was settled on ${paidAt}.`}
          </div>
          {data.payer_email && (
            <div style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>
              Paid by: {data.payer_email}
            </div>
          )}
        </div>
      </div>

      {/* Invoice card with PAID stamp */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Watermark */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-25deg)",
            border: "4px solid rgba(22,163,74,0.15)",
            borderRadius: 8,
            padding: "6px 18px",
            color: "rgba(22,163,74,0.15)",
            fontSize: 52,
            fontWeight: 900,
            letterSpacing: 6,
            pointerEvents: "none",
            userSelect: "none",
            whiteSpace: "nowrap",
            zIndex: 1,
          }}
        >
          PAID
        </div>

        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #f3f4f6",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {data.logo_url ? (
            <img
              src={data.logo_url}
              alt={businessName}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#0f766e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
                {businessName.charAt(0)}
              </span>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
              {businessName}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Invoice #{data.invoice_number}
            </div>
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "#dcfce7",
              color: "#15803d",
              border: "1px solid #86efac",
              borderRadius: 99,
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            <CheckCircle2 size={12} /> PAID
          </span>
        </div>

        {/* Dates */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          {[
            ["Issued", data.issued_date],
            ["Due", data.due_date],
          ].map(([label, date], i) => (
            <div
              key={label}
              style={{
                padding: "12px 20px",
                borderRight: i === 0 ? "1px solid #f3f4f6" : "none",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 2,
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                {fmtDate(date as string)}
              </div>
            </div>
          ))}
        </div>

        {/* Items */}
        {(data.items || []).map((item, i) => (
          <div
            key={item.id || i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "11px 20px",
              borderBottom: "1px solid #f9fafb",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                {item.name}
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                {item.quantity} × {fmt(sym, item.unit_cost)}
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
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
            gap: 7,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            <span>Subtotal</span>
            <span style={{ color: "#374151", fontWeight: 500 }}>
              {fmt(sym, subtotal)}
            </span>
          </div>
          {discount > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
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
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              <span>
                Tax
                {data.tax_type === "percent" ? ` (${data.tax_percent}%)` : ""}
              </span>
              <span style={{ color: "#374151", fontWeight: 500 }}>
                {fmt(sym, tax)}
              </span>
            </div>
          )}
          {shipping > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              <span>Shipping</span>
              <span style={{ color: "#374151", fontWeight: 500 }}>
                {fmt(sym, shipping)}
              </span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid #e5e7eb",
              paddingTop: 10,
              marginTop: 2,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
              Total Paid
            </span>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}>
              {fmt(sym, total)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            background: "#f0fdf4",
            borderTop: "1px solid #dcfce7",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <CheckCircle2 size={13} color="#16a34a" />
          <span style={{ fontSize: 12, color: "#15803d" }}>
            Payment confirmed · {paidAt}
          </span>
          {data.paystack_reference && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: 11,
                color: "#9ca3af",
                fontFamily: "monospace",
              }}
            >
              Ref: {data.paystack_reference.slice(-8).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Branding */}
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>Secured by </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0f766e" }}>
          Paystack
        </span>
        <span style={{ fontSize: 12, color: "#9ca3af" }}> · Powered by </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0f766e" }}>
          envoyce
        </span>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("summary");
  const [justPaid, setJustPaid] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // ── Step 1: Fetch invoice ─────────────────────────────────────────────────
  // FIX: isRedirect now only checks for trxref/reference — Paystack does NOT
  // send ?status=success in the callback URL, only trxref and reference.
  useEffect(() => {
    if (!id) return;

    const isRedirect = !!(
      searchParams.get("trxref") || searchParams.get("reference")
    );

    fetch(
      `${base}/api/invoices/${id}?include_client=true&include_business=true`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.invoice) {
          setInvoice(d.invoice);
          // Only set already-paid screen if this is NOT a redirect.
          // If it IS a redirect, Step 2 will handle the screen after verifying.
          if (!isRedirect && d.invoice.status === "paid") {
            setJustPaid(false);
            setScreen("already-paid");
          }
          if (d.invoice.client?.email) setEmail(d.invoice.client.email);
        } else {
          setError("Invoice not found");
        }
      })
      .catch(() => setError("Failed to load invoice"))
      .finally(() => {
        // If this is a redirect, keep showing the processing spinner until
        // Step 2 completes verification and sets the screen itself.
        if (!isRedirect) setLoading(false);
      });
  }, [id]); // intentionally omit searchParams — Step 2 owns the redirect case

  // ── Step 2: Handle Paystack redirect ─────────────────────────────────────
  // FIX: Paystack does NOT append ?status=success to the callback URL.
  // It only appends ?trxref=...&reference=...
  // The old check `status !== "success"` was blocking verify every time.
  useEffect(() => {
    const reference =
      searchParams.get("trxref") || searchParams.get("reference");

    if (!reference || !id) return;

    setScreen("processing");

    verifyPayment(reference).then(async (result) => {
      if (result.success) {
        // Re-fetch the invoice — backend verify_payment already set status=paid.
        // This gives us the real DB state including paid_at, payer_email, etc.
        try {
          const res = await fetch(
            `${base}/api/invoices/${id}?include_client=true&include_business=true`,
          );
          const d = await res.json();
          if (d.success && d.invoice) {
            setInvoice(d.invoice);
          }
        } catch {
          // Non-fatal fallback — merge payment data locally
          setInvoice((prev) =>
            prev
              ? {
                  ...prev,
                  status: "paid",
                  data: {
                    ...prev.data,
                    paid_at: new Date().toISOString(),
                    paystack_reference: reference,
                    payer_email: email || prev.client?.email || "",
                  },
                }
              : null,
          );
        }

        setLoading(false);
        setJustPaid(true);
        setScreen("already-paid");
      } else {
        setError(result.error || "Payment verification failed");
        setLoading(false);
        setScreen("summary");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, id]);

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
      window.location.href = result.authorization_url;
    } else {
      setEmailError(result.error || "Failed to initialize payment. Try again.");
      setVerifying(false);
    }
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const wrap: React.CSSProperties = {
    minHeight: "100vh",
    background: "#f3f4f6",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "32px 16px 64px",
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  };
  const cardWrap: React.CSSProperties = { width: "100%", maxWidth: 440 };

  // ── Loading / processing ──────────────────────────────────────────────────
  if (loading || screen === "processing")
    return (
      <div style={wrap}>
        <div
          style={{
            ...cardWrap,
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
              ? "Verifying your payment…"
              : "Loading invoice…"}
          </p>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error && !invoice)
    return (
      <div style={wrap}>
        <div
          style={{
            ...cardWrap,
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

  // ── Already paid ──────────────────────────────────────────────────────────
  if (screen === "already-paid")
    return (
      <div style={wrap}>
        <div style={cardWrap}>
          <PaidInvoiceCard invoice={invoice} justPaid={justPaid} />
        </div>
      </div>
    );

  // ── Email input ───────────────────────────────────────────────────────────
  if (screen === "email-input")
    return (
      <div style={wrap}>
        <div style={cardWrap}>
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

            {/* Amount summary */}
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

            {/* Email field */}
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
                {email
                  ? "Confirm your email — your receipt will be sent here."
                  : "We'll send your payment receipt here."}
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
                    Redirecting to Paystack…
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

  // ── Summary (default) ─────────────────────────────────────────────────────
  return (
    <div style={wrap}>
      <div style={cardWrap}>
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
              <AlertCircle size={16} /> {error}
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
            Pay {fmt(sym, total)} <ChevronRight size={18} />
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
