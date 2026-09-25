import React, { useState } from "react";
import {
  FileText,
  Eye,
  Mail,
  List,
  Copy,
  CreditCard,
  BookOpen,
  Play,
  KeyRound,
  Globe,
  Loader2,
} from "lucide-react";
import MainMenu from "../components/MainMenu";
import Navbar from "../components/Navbar";

// The deployed invoice API. Not VITE_API_BASE_URL — that points at the
// frontend's own backend in dev (127.0.0.1:5000); docs must always show the
// production service.
const PROD_BASE_URL = "https://invoice-generator-69nc.onrender.com";
const BASE_URL =
  (import.meta.env.VITE_INVOICE_API_URL as string | undefined) || PROD_BASE_URL;

// ── Side nav ─────────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "generate", label: "Generate PDF", icon: FileText },
  { id: "preview", label: "Preview PNG", icon: Eye },
  { id: "send", label: "Send by Email", icon: Mail },
  { id: "invoices", label: "Invoice CRUD", icon: List },
  { id: "pay", label: "Payment Page", icon: CreditCard },
];

// ── Building blocks ──────────────────────────────────────────────────────────

function MethodChip({ method }: { method: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-[#0e423e] px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#8eda91]">
      {method}
    </span>
  );
}

function EndpointBar({ method, path }: { method: string; path: string }) {
  return (
    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 mb-4 overflow-x-auto">
      <MethodChip method={method} />
      <code className="text-sm font-mono text-[#0e423e] whitespace-nowrap">{path}</code>
    </div>
  );
}

function Section({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-b border-gray-200 pb-12 mb-12 last:border-0">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="h-5 w-5 text-[#0e423e]" />
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ParamTable({
  rows,
}: {
  rows: [string, string, string, boolean?][];
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-6">
      <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-200">
        Parameters
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([field, type, desc, required]) => (
              <tr key={field} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 align-top whitespace-nowrap">
                  <span className="font-mono text-xs font-semibold text-gray-900">{field}</span>
                  {required && (
                    <span className="ml-2 text-[11px] font-medium text-red-500">Required</span>
                  )}
                </td>
                <td className="px-4 py-3 align-top text-xs text-gray-400 whitespace-nowrap">{type}</td>
                <td className="px-4 py-3 align-top text-sm text-gray-600 min-w-[12rem]">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Dark right-rail card. Uses the brand dark green via arbitrary values — the
 * stock neutral-900 background is force-overridden to white by theme.css.
 */
function DarkCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-[#0e423e] border border-[#0b332f] overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <span className="flex items-center gap-2 text-sm font-semibold text-[#CFF4D6]">
          <Icon className="h-4 w-4 text-[#8eda91]" />
          {title}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}

function InfoCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200">
        <Icon className="h-4 w-4 text-[#0e423e]" />
        <span className="text-sm font-semibold text-gray-900">{title}</span>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

// ── Code samples with language tabs ─────────────────────────────────────────

type Lang = "Shell" | "Python" | "JavaScript";
const LANGS: Lang[] = ["Shell", "Python", "JavaScript"];

function CodeSamples({
  endpoint,
  body,
}: {
  endpoint: string;
  body?: object;
}) {
  const [lang, setLang] = useState<Lang>("Shell");
  const [copied, setCopied] = useState(false);

  const payload = body ? JSON.stringify(body, null, 2) : null;
  const indent = (s: string, pad: string) => s.split("\n").join("\n" + pad);

  const code = payload
    ? {
        Shell: `curl -X POST ${BASE_URL}${endpoint} \\\n  -H "Content-Type: application/json" \\\n  -d '${payload.replace(/'/g, "'\\''")}'`,
        Python: `import requests\n\nresp = requests.post(\n    "${BASE_URL}${endpoint}",\n    json=${indent(payload, "    ")},\n)\nprint(resp.status_code)\nopen("invoice.pdf", "wb").write(resp.content)`,
        JavaScript: `const resp = await fetch("${BASE_URL}${endpoint}", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify(${indent(payload, "  ")}),\n});\nif (!resp.ok) throw new Error(await resp.text());\nconst blob = await resp.blob();`,
      }[lang]
    : {
        Shell: `curl ${BASE_URL}${endpoint}`,
        Python: `import requests\n\nresp = requests.get("${BASE_URL}${endpoint}")\nprint(resp.status_code)`,
        JavaScript: `const resp = await fetch("${BASE_URL}${endpoint}");\nconsole.log(resp.status);`,
      }[lang];

  const lines = code.split("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <DarkCard
      title="Code Samples"
      icon={FileText}
      action={
        <div className="flex items-center gap-2">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="rounded-md text-xs px-2 py-1 outline-none cursor-pointer border border-white/20 text-[#0e423e]"
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <button
            onClick={copy}
            title="Copy"
            className="text-[#8eda91] hover:text-white transition-colors"
          >
            {copied ? (
              <span className="text-[11px] font-medium">Copied</span>
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      }
    >
      <div className="flex font-mono text-xs leading-relaxed">
        <div className="select-none text-[#5d8a7f] py-3 pl-3 pr-3 text-right border-r border-white/10">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <pre className="flex-1 min-w-0 overflow-x-auto py-3 px-3 text-[#D2FEE1]">{code}</pre>
      </div>
    </DarkCard>
  );
}

// ── Response card ────────────────────────────────────────────────────────────

function StatusPill({ code, ok = true }: { code: number | string; ok?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-[#CFF4D6]">
      <span className={`h-2 w-2 rounded-full ${ok ? "bg-[#8eda91]" : "bg-red-400"}`} />
      {code}
    </span>
  );
}

function ResponseCard({
  statuses,
  children,
}: {
  statuses: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <DarkCard title="Response" icon={List}>
      <div className="flex items-center gap-2 px-4 pt-3">{statuses}</div>
      <div className="p-4 font-mono text-xs leading-relaxed text-[#D2FEE1] overflow-x-auto">
        {children}
      </div>
    </DarkCard>
  );
}

// ── Live "Try it" — renders the sample payload through the real endpoint ────

function TryIt() {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    try {
      const resp = await fetch(`${BASE_URL}/preview-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(GENERATE_PAYLOAD),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status} — ${await resp.text()}`);
      setPreview(URL.createObjectURL(await resp.blob()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DarkCard title="Try it" icon={Play}>
      <div className="p-4 space-y-3">
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-[#8eda91] hover:bg-[#6CDD82] px-4 py-2 text-sm font-semibold text-[#0e423e] disabled:opacity-60 transition-colors"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {loading ? "Rendering…" : "Render sample invoice"}
        </button>
        {error && (
          <p className="text-xs text-red-300 font-mono break-words">{error}</p>
        )}
        {preview && (
          <img
            src={preview}
            alt="Invoice preview"
            className="rounded-lg border border-white/10 bg-white w-full"
          />
        )}
      </div>
    </DarkCard>
  );
}

// ── Example payloads / responses ─────────────────────────────────────────────

const GENERATE_PAYLOAD = {
  from: "Acme Ltd — hello@acme.com",
  to: "Ada Obi — ada@example.com",
  items: [
    {
      name: "Design work",
      description: "Landing page redesign",
      showDesc: true,
      quantity: 2,
      unit_cost: 500,
    },
    {
      name: "Consulting",
      showDesc: false,
      quantity: 3,
      unit_cost: 120,
    },
  ],
  show_tax: true,
  tax_percent: 7.5,
  tax_type: "percent",
  show_discount: true,
  discount_percent: 10,
  discount_type: "percent",
  show_shipping: true,
  shipping_amount: 50,
  invoice_number: "INV-2026-0007",
  issued_date: "2026-09-25",
  due_date: "2026-10-09",
  payment_details: "Acme Ltd — 0123456789 — GTB",
  terms: "Payment due within 14 days.",
  currency: "NGN",
  currency_symbol: "₦",
};

const ERROR_RESPONSE = {
  error: "Failed to render invoice",
  details: "…server-side error details…",
};

const SEND_RESPONSE = {
  message: "Invoice sent to ada@example.com",
};

const SAVE_RESPONSE = {
  id: "00000000-0000-0000-0000-000000000000",
  status: "draft",
  data: { invoice_number: "INV-2026-0007" },
};

const SAMPLE_INVOICE_ID = "00000000-0000-0000-0000-000000000000";

// ── Page ─────────────────────────────────────────────────────────────────────

const ApiDocsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top menu with Profile / notifications — same as SettingsPage */}
      <div className="md:block hidden sticky top-0 left-0 w-full z-30">
        <MainMenu showLogo={false} />
      </div>
      <div className="md:hidden block">
        <MainMenu />
      </div>

      {/* Page header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-start gap-4 items-center py-4 md:py-6">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-5 w-5 text-[#0e423e]" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">
                Envoyce Invoice API
              </h1>
              <p className="mt-1 text-gray-600 text-sm md:text-base">
                HTTP API for rendering, saving, sending and taking payment for invoices.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Body: side nav + full-width content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 mb-20 md:mb-10">
        <div className="flex gap-8 items-start">
          {/* Side nav */}
          <aside className="hidden lg:block w-60 shrink-0 sticky top-32">
            <nav className="flex flex-col gap-1">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <Icon className="h-4 w-4 text-gray-500" />
                  {label}
                </a>
              ))}
            </nav>
            <div className="mt-6 mx-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                Base URL
              </p>
              <p className="font-mono text-xs text-gray-600 break-all leading-relaxed">{BASE_URL}</p>
            </div>
          </aside>

          {/* Main column — full width */}
          <div className="flex-1 min-w-0">
            {/* Mobile section tabs (SettingsPage-style pills) */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-6 -mx-2 px-2 scrollbar-hide">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </a>
              ))}
            </div>

            {/* Base URL / auth summary */}
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              <InfoCard title="Base URL" icon={Globe}>
                <p className="font-mono text-xs text-gray-600 break-all">{BASE_URL}</p>
              </InfoCard>
              <InfoCard title="Authentication" icon={KeyRound}>
                <p className="text-sm text-gray-600 leading-relaxed">
                  None for render endpoints. <span className="font-mono text-xs">/api/*</span>{" "}
                  routes are user-scoped.
                </p>
              </InfoCard>
            </div>

            {/* ── Generate ─────────────────────────────────────────────── */}
            <Section id="generate" title="Generate PDF" icon={FileText}>
              <div className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
                <div className="min-w-0">
                  <EndpointBar method="POST" path="/generate-invoice" />
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Renders the invoice payload to an A4 PDF and returns it as{" "}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">application/pdf</code>{" "}
                    with a download filename derived from the invoice number. Subtotals,
                    tax, discount, shipping and the grand total are all computed
                    server-side from the items.
                  </p>
                  <ParamTable
                    rows={[
                      ["from", "string", 'Issuer line — "Acme Ltd — hello@acme.com"', true],
                      ["to", "string", 'Recipient line — "Ada Obi — ada@example.com"', true],
                      ["items[]", "object[]", "Line items — see fields below", true],
                      ["items[].name", "string", "Item name"],
                      ["items[].description", "string", "Shown when showDesc is true"],
                      ["items[].quantity", "number", "Quantity (item subtotal = qty × unit_cost)"],
                      ["items[].unit_cost", "number", "Rate per unit"],
                      ["show_tax / tax_percent / tax_type", "bool / number / enum", "Tax section — percent of subtotal or a fixed amount"],
                      ["show_discount / discount_percent / discount_type", "bool / number / enum", "Discount section"],
                      ["show_shipping / shipping_amount", "bool / number", "Shipping section"],
                      ["invoice_number", "string", 'Defaults to "INV-<timestamp>"'],
                      ["issued_date / due_date", "date", 'Rendered as "Sep 25, 2026"'],
                      ["payment_details / payment_instructions", "string", "Bank / payment block on the invoice"],
                      ["terms", "string", "Terms line"],
                      ["logo_url", "url", "Fetched server-side and embedded in the PDF"],
                      ["currency / currency_symbol", "string", 'e.g. "NGN" / "₦"'],
                    ]}
                  />
                </div>
                <div className="space-y-4 min-w-0">
                  <CodeSamples endpoint="/generate-invoice" body={GENERATE_PAYLOAD} />
                  <ResponseCard
                    statuses={
                      <>
                        <StatusPill code={200} />
                        <StatusPill code={500} ok={false} />
                      </>
                    }
                  >
                    <p className="text-[#8eda91] mb-2">
                      <span className="font-semibold">200</span> — the PDF bytes themselves
                      (<span className="font-mono">application/pdf</span>).
                    </p>
                    <p className="text-[#8eda91] mb-2">
                      <span className="font-semibold">500</span> — JSON error:
                    </p>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(ERROR_RESPONSE, null, 2)}</pre>
                  </ResponseCard>
                </div>
              </div>
            </Section>

            {/* ── Preview ──────────────────────────────────────────────── */}
            <Section id="preview" title="Preview PNG" icon={Eye}>
              <div className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
                <div className="min-w-0">
                  <EndpointBar method="POST" path="/preview-invoice" />
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Same payload as{" "}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">/generate-invoice</code>{" "}
                    but returns a PNG of the first page (150 dpi) — the editor's live
                    preview uses this. Handy for embedding in an{" "}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">&lt;img&gt;</code>.
                  </p>
                  <ParamTable rows={[["body", "object", "Identical payload to /generate-invoice", true]]} />
                </div>
                <div className="space-y-4 min-w-0">
                  <TryIt />
                  <ResponseCard statuses={<StatusPill code={200} />}>
                    <p className="text-[#8eda91]">
                      First-page PNG (<span className="font-mono">image/png</span>).
                    </p>
                  </ResponseCard>
                </div>
              </div>
            </Section>

            {/* ── Send ─────────────────────────────────────────────────── */}
            <Section id="send" title="Send by Email" icon={Mail}>
              <div className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
                <div className="min-w-0">
                  <EndpointBar method="POST" path="/api/send-invoice" />
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Emails an invoice to a client via Brevo using the email HTML template.
                    Expects the saved invoice record (as returned by{" "}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">GET /api/invoices/&lt;id&gt;</code>)
                    plus client and business context.
                  </p>
                  <ParamTable
                    rows={[
                      ["email", "string", "Recipient address", true],
                      ["invoice", "object", "Saved invoice — must contain data (items, dates, totals)", true],
                      ["client", "object", "{ name } — greeting"],
                      ["business", "object", "{ name, email } — sender identity"],
                      ["message", "string", "Optional note shown above the totals in the email"],
                    ]}
                  />
                </div>
                <div className="space-y-4 min-w-0">
                  <CodeSamples
                    endpoint="/api/send-invoice"
                    body={{
                      email: "ada@example.com",
                      message: "Hi Ada, here is the invoice.",
                      invoice: { id: "…", data: { invoice_number: "INV-2026-0007" } },
                      client: { name: "Ada Obi" },
                      business: { name: "Acme Ltd", email: "hello@acme.com" },
                    }}
                  />
                  <ResponseCard statuses={<StatusPill code={200} />}>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(SEND_RESPONSE, null, 2)}</pre>
                  </ResponseCard>
                </div>
              </div>
            </Section>

            {/* ── CRUD ─────────────────────────────────────────────────── */}
            <Section id="invoices" title="Invoice CRUD" icon={List}>
              <div className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
                <div className="min-w-0">
                  <EndpointBar method="GET · POST · PUT · DELETE" path="/api/invoices" />
                  <ParamTable
                    rows={[
                      ["GET /api/invoices?user_id=", "JSON", "All invoices for a user (UUID required)"],
                      ["POST /api/invoices", "JSON", "Save a draft — {user_id, data, client_id?, business_id?, issued_date?, due_date?, status?, currency?}"],
                      ["GET /api/invoices/<id>", "JSON", "One invoice; ?include_client=true&include_business=true embeds related records"],
                      ["PUT /api/invoices/<id>", "JSON", "Full update — ownership checked against user_id"],
                      ["PUT /api/invoices/<id>/status", "JSON", "{status, user_id?} — paid | draft | sent | overdue | cancelled"],
                      ["DELETE /api/invoices/<id>", "JSON", "Delete one (user_id in query or body)"],
                      ["POST /api/invoices/bulk/delete", "JSON", "{invoice_ids: […], user_id?}"],
                      ["GET /api/invoices/statistics/<user_id>", "JSON", "Revenue / status statistics"],
                    ]}
                  />
                  <p className="text-gray-600 leading-relaxed">
                    All <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">&lt;id&gt;</code>{" "}
                    values are UUIDs. An invoice's payload is stored as a single JSON{" "}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">data</code> column —
                    the same shape{" "}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">/generate-invoice</code> accepts.
                  </p>
                </div>
                <div className="space-y-4 min-w-0">
                  <CodeSamples
                    endpoint="/api/invoices"
                    body={{ user_id: "0000-…-uuid", data: GENERATE_PAYLOAD, status: "draft" }}
                  />
                  <ResponseCard statuses={<StatusPill code={201} />}>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(SAVE_RESPONSE, null, 2)}</pre>
                  </ResponseCard>
                </div>
              </div>
            </Section>

            {/* ── Pay ──────────────────────────────────────────────────── */}
            <Section id="pay" title="Payment Page" icon={CreditCard}>
              <div className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
                <div className="min-w-0">
                  <EndpointBar method="GET" path="/pay/<id>" />
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Renders a saved invoice as a public page so customers can view and
                    pay it. Emails carry a shareable link of the form{" "}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm whitespace-nowrap">
                      {`${PROD_BASE_URL}/pay/${SAMPLE_INVOICE_ID}`}
                    </code>
                    .
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    A POST to the same URL records a payment (
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">payment_details</code> in
                    JSON) and marks the invoice <span className="font-medium">paid</span>.
                  </p>
                </div>
                <div className="space-y-4 min-w-0">
                  <InfoCard title="URL" icon={Globe}>
                    <p className="font-mono text-xs text-gray-600 break-all">
                      {`${PROD_BASE_URL}/pay/${SAMPLE_INVOICE_ID}`}
                    </p>
                  </InfoCard>
                  <ResponseCard statuses={<StatusPill code={200} />}>
                    <p className="text-[#8eda91]">Rendered HTML payment page.</p>
                  </ResponseCard>
                </div>
              </div>
            </Section>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav — same as SettingsPage */}
      <Navbar />
    </div>
  );
};

export default ApiDocsPage;