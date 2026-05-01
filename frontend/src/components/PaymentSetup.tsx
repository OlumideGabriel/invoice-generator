import React, { useState, useCallback, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  CreditCard,
  ChevronDown,
  Search,
  X,
  Info,
  Building,
  Plus,
  Clock,
  BadgeCheck,
  Trash2,
} from "lucide-react";
import { API_BASE_URL } from "../config/api";
import {
  verifyAccount,
  createSubaccount,
  removeSubaccount,
  useSubaccountStatus,
} from "../hooks/usePaystack";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SubaccountRecord {
  id: string;
  business_name: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_code: string;
  status: "pending" | "approved";
  created_at: string;
  is_verified: boolean | null;
}

interface BankInfo {
  name: string;
  code: string;
  short: string;
  bg: string;
  color: string;
}

interface Business {
  id: string;
  name: string;
  email?: string;
}

interface PaymentSetupProps {
  userId: string;
  showNotification?: (message: string, type?: "success" | "error") => void;
}

interface FormState {
  business_name: string;
  account_number: string;
  bank_code: string;
  bank_name: string;
}

// ── Nigerian banks ────────────────────────────────────────────────────────────
const NIGERIAN_BANKS: BankInfo[] = [
  {
    name: "Access Bank",
    code: "044",
    short: "ACC",
    bg: "#E8F0FC",
    color: "#1E3A8A",
  },
  {
    name: "Access Bank (Diamond)",
    code: "063",
    short: "DMD",
    bg: "#FDE8F0",
    color: "#9D174D",
  },
  {
    name: "ALAT by WEMA",
    code: "035A",
    short: "WMA",
    bg: "#FEF3C7",
    color: "#92400E",
  },
  {
    name: "Carbon (Paylater)",
    code: "565",
    short: "CBN",
    bg: "#E6F4EA",
    color: "#14532D",
  },
  {
    name: "Citibank Nigeria",
    code: "023",
    short: "CITI",
    bg: "#DBEAFE",
    color: "#1E3A8A",
  },
  {
    name: "Ecobank Nigeria",
    code: "050",
    short: "ECO",
    bg: "#E8F5E9",
    color: "#1B5E20",
  },
  {
    name: "Fidelity Bank",
    code: "070",
    short: "FID",
    bg: "#E0E7FF",
    color: "#312E81",
  },
  {
    name: "First Bank of Nigeria",
    code: "011",
    short: "FBN",
    bg: "#FFF7ED",
    color: "#92400E",
  },
  {
    name: "First City Monument Bank",
    code: "214",
    short: "FCMB",
    bg: "#FEF2F2",
    color: "#991B1B",
  },
  {
    name: "Globus Bank",
    code: "00103",
    short: "GLB",
    bg: "#F0FDF4",
    color: "#14532D",
  },
  {
    name: "GoMoney",
    code: "100022",
    short: "GO",
    bg: "#ECFDF5",
    color: "#065F46",
  },
  {
    name: "Guaranty Trust Bank",
    code: "058",
    short: "GTB",
    bg: "#FFF7ED",
    color: "#C2410C",
  },
  {
    name: "Heritage Bank",
    code: "030",
    short: "HTG",
    bg: "#F5F3FF",
    color: "#4C1D95",
  },
  {
    name: "Jaiz Bank",
    code: "301",
    short: "JAZ",
    bg: "#FFF1F2",
    color: "#9F1239",
  },
  {
    name: "Keystone Bank",
    code: "082",
    short: "KEY",
    bg: "#EFF6FF",
    color: "#1D4ED8",
  },
  {
    name: "Kuda Bank",
    code: "090267",
    short: "KDA",
    bg: "#F5F3FF",
    color: "#6D28D9",
  },
  {
    name: "Lotus Bank",
    code: "303",
    short: "LTS",
    bg: "#E6F4EA",
    color: "#14532D",
  },
  {
    name: "Moniepoint",
    code: "50515",
    short: "MNP",
    bg: "#FFFBEB",
    color: "#92400E",
  },
  {
    name: "OPay",
    code: "100004",
    short: "OPY",
    bg: "#F0FDF4",
    color: "#14532D",
  },
  {
    name: "Palmpay",
    code: "100033",
    short: "PLM",
    bg: "#FFF1F2",
    color: "#9F1239",
  },
  {
    name: "Parallex Bank",
    code: "526",
    short: "PLX",
    bg: "#EFF6FF",
    color: "#1E40AF",
  },
  {
    name: "Polaris Bank",
    code: "076",
    short: "POL",
    bg: "#FFF7ED",
    color: "#B45309",
  },
  {
    name: "Providus Bank",
    code: "101",
    short: "PRV",
    bg: "#EDE9FE",
    color: "#5B21B6",
  },
  {
    name: "Rubies Bank",
    code: "125",
    short: "RUB",
    bg: "#FEF2F2",
    color: "#B91C1C",
  },
  {
    name: "Stanbic IBTC Bank",
    code: "221",
    short: "SIB",
    bg: "#F0F9FF",
    color: "#075985",
  },
  {
    name: "Standard Chartered Bank",
    code: "068",
    short: "SCB",
    bg: "#F0FDF4",
    color: "#166534",
  },
  {
    name: "Sterling Bank",
    code: "232",
    short: "STL",
    bg: "#FFF7ED",
    color: "#9A3412",
  },
  {
    name: "SunTrust Bank",
    code: "100",
    short: "SUN",
    bg: "#FFFBEB",
    color: "#78350F",
  },
  {
    name: "TAJBank",
    code: "302",
    short: "TAJ",
    bg: "#E8F0FC",
    color: "#1E40AF",
  },
  {
    name: "Titan Bank",
    code: "102",
    short: "TTN",
    bg: "#FEF3C7",
    color: "#78350F",
  },
  {
    name: "Union Bank",
    code: "032",
    short: "UBN",
    bg: "#EFF6FF",
    color: "#1D4ED8",
  },
  {
    name: "United Bank for Africa",
    code: "033",
    short: "UBA",
    bg: "#FEF2F2",
    color: "#DC2626",
  },
  {
    name: "Unity Bank",
    code: "215",
    short: "UNT",
    bg: "#ECFDF5",
    color: "#047857",
  },
  {
    name: "VFD Microfinance Bank",
    code: "566",
    short: "VFD",
    bg: "#F5F3FF",
    color: "#6D28D9",
  },
  {
    name: "Wema Bank",
    code: "035",
    short: "WEM",
    bg: "#FDF2F8",
    color: "#86198F",
  },
  {
    name: "Zenith Bank",
    code: "057",
    short: "ZEN",
    bg: "#EFF6FF",
    color: "#1E3A8A",
  },
];

// ── Shimmer skeleton ──────────────────────────────────────────────────────────
const shimmerCSS = `
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.skeleton-shimmer {
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
}
`;

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer ${className}`} />;
}

function PaymentSetupSkeleton() {
  return (
    <>
      <style>{shimmerCSS}</style>
      <div className="space-y-3 mb-4">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            {[
              { lw: "w-24", vw: "w-40" },
              { lw: "w-28", vw: "w-32" },
              { lw: "w-16", vw: "w-28" },
            ].map((row, j) => (
              <div
                key={j}
                className="flex items-center justify-between px-5 py-3 border-b border-gray-100 last:border-b-0"
              >
                <Skeleton className={`h-3 ${row.lw}`} />
                <Skeleton className={`h-4 ${row.vw}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <Skeleton className="h-9 w-44 rounded-lg" />
    </>
  );
}

// ── Bank avatar ───────────────────────────────────────────────────────────────
function BankAvatar({ bank, size = 28 }: { bank: BankInfo; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        background: bank.bg,
        color: bank.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size <= 28 ? 10 : 11,
        fontWeight: 600,
        letterSpacing: "-0.3px",
        flexShrink: 0,
      }}
    >
      {bank.short}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({
  status,
  isVerified,
}: {
  status: "pending" | "approved";
  isVerified: boolean | null;
}) {
  if (isVerified === true) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
        <BadgeCheck className="h-3.5 w-3.5" /> Verified
      </span>
    );
  }
  if (isVerified === false) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="h-3.5 w-3.5" /> Unverified
      </span>
    );
  }
  // null = API was unreachable
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
      <AlertCircle className="h-3.5 w-3.5" /> Unknown
    </span>
  );
}

// ── Subaccount card ───────────────────────────────────────────────────────────
function SubaccountCard({
  account,
  onRemove,
}: {
  account: SubaccountRecord;
  onRemove: (id: string) => void;
}) {
  const bank = NIGERIAN_BANKS.find((b) => b.code === account.bank_code);
  const [confirming, setConfirming] = React.useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          {bank && <BankAvatar bank={bank} size={24} />}
          <span className="text-sm font-medium text-gray-800">
            {account.business_name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge
            status={account.status}
            isVerified={account.is_verified}
          />
          {confirming ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Remove?</span>
              <button
                onClick={() => {
                  setConfirming(false);
                  onRemove(account.id);
                }}
                className="px-2 py-1 rounded-md text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Remove account"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-xs text-gray-500">Account name</span>
          <span className="text-sm text-gray-900 font-medium">
            {account.account_name}
          </span>
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-xs text-gray-500">Account number</span>
          <span className="text-sm text-gray-900 font-mono">
            {account.account_number}
          </span>
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-xs text-gray-500">Bank</span>
          <span className="text-sm text-gray-900">{account.bank_name}</span>
        </div>
      </div>

      {account.is_verified === false ? (
        <div className="flex items-start gap-2 px-5 py-3 bg-amber-50 border-t border-amber-100">
          <Clock className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Awaiting Paystack verification. Usually completed within 24 hours.
          </p>
        </div>
      ) : account.is_verified === true ? (
        <div className="flex items-center gap-2 px-5 py-3 bg-teal-50 border-t border-teal-100">
          <CheckCircle2 className="h-3.5 w-3.5 text-teal-500 flex-shrink-0" />
          <p className="text-xs text-teal-700">
            Verified — clients can pay invoices to this account.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ── ConnectModal ──────────────────────────────────────────────────────────────
interface ConnectModalProps {
  step: "form" | "verifying" | "confirmed" | "saving";
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  verified: { account_name: string } | null;
  setVerified: React.Dispatch<
    React.SetStateAction<{ account_name: string } | null>
  >;
  error: string | null;
  businesses: Business[];
  businessesLoading: boolean;
  showBusinessList: boolean;
  setShowBusinessList: React.Dispatch<React.SetStateAction<boolean>>;
  bankSearch: string;
  setBankSearch: React.Dispatch<React.SetStateAction<string>>;
  showBankList: boolean;
  setShowBankList: React.Dispatch<React.SetStateAction<boolean>>;
  filteredBanks: BankInfo[];
  selectedBank: BankInfo | undefined;
  onClose: () => void;
  onVerify: () => void;
  onSave: () => void;
}

function ConnectModal({
  step,
  form,
  setForm,
  verified,
  setVerified,
  error,
  businesses,
  businessesLoading,
  showBusinessList,
  setShowBusinessList,
  bankSearch,
  setBankSearch,
  showBankList,
  setShowBankList,
  filteredBanks,
  selectedBank,
  onClose,
  onVerify,
  onSave,
}: ConnectModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between py-5 px-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            Connect bank account
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Business name */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business name
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.business_name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, business_name: e.target.value }));
                  setShowBusinessList(true);
                }}
                onFocus={() => setShowBusinessList(true)}
                placeholder="Select or type your business name"
                className="w-full px-4 py-3 bg-gray-50 text-gray-700 placeholder-gray-400 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {businessesLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
            {showBusinessList && businesses.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {businesses
                  .filter((b) =>
                    b.name
                      .toLowerCase()
                      .includes(form.business_name.toLowerCase()),
                  )
                  .map((b) => (
                    <button
                      key={b.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setForm((f) => ({ ...f, business_name: b.name }));
                        setShowBusinessList(false);
                      }}
                      className="w-full px-4 py-2.5 text-sm text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-teal-100 flex items-center justify-center flex-shrink-0">
                        <Building className="h-3.5 w-3.5 text-teal-600" />
                      </div>
                      <span className="text-gray-900">{b.name}</span>
                    </button>
                  ))}
                {businesses.filter((b) =>
                  b.name
                    .toLowerCase()
                    .includes(form.business_name.toLowerCase()),
                ).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No match — name will be used as entered
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Bank selector */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank
            </label>
            <button
              onClick={() => {
                setShowBankList(!showBankList);
                setShowBusinessList(false);
              }}
              className="w-full px-4 py-3 bg-gray-50 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-left flex items-center justify-between"
            >
              <span className="flex items-center gap-2.5">
                {selectedBank ? (
                  <>
                    <BankAvatar bank={selectedBank} size={24} />
                    <span className="text-gray-900">{selectedBank.name}</span>
                  </>
                ) : (
                  <span className="text-gray-400">Select bank</span>
                )}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </button>
            {showBankList && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-gray-100 flex-shrink-0">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 rounded-lg">
                    <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      placeholder="Search banks…"
                      className="flex-1 text-sm bg-transparent focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="overflow-y-auto">
                  {filteredBanks.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">
                      No banks found
                    </p>
                  ) : (
                    filteredBanks.map((bank) => (
                      <button
                        key={bank.code}
                        onClick={() => {
                          setForm((f) => ({
                            ...f,
                            bank_code: bank.code,
                            bank_name: bank.name,
                          }));
                          setShowBankList(false);
                          setBankSearch("");
                          setVerified(null);
                        }}
                        className={`w-full px-3 py-2.5 text-sm text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors ${form.bank_code === bank.code ? "bg-teal-50" : ""}`}
                      >
                        <BankAvatar bank={bank} size={28} />
                        <span
                          className={
                            form.bank_code === bank.code
                              ? "text-teal-700 font-medium"
                              : "text-gray-900"
                          }
                        >
                          {bank.name}
                        </span>
                        {form.bank_code === bank.code && (
                          <CheckCircle2 className="h-4 w-4 text-teal-600 ml-auto flex-shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Account number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account number
            </label>
            <input
              type="text"
              maxLength={10}
              value={form.account_number}
              onChange={(e) => {
                setForm((f) => ({
                  ...f,
                  account_number: e.target.value.replace(/\D/g, ""),
                }));
                setVerified(null);
              }}
              placeholder="10-digit account number"
              className="w-full px-4 py-3 bg-gray-50 text-gray-700 placeholder-gray-400 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-sm"
            />
          </div>

          {/* Verified confirmation — fixed: was "p3" (no padding), now "p-3" */}
          {verified && (
            <div className="flex items-center gap-2.5 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-green-600 font-medium">
                  Account verified
                </p>
                <p className="text-sm font-semibold text-green-900">
                  {verified.account_name}
                </p>
              </div>
            </div>
          )}

          {/* Info notice */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">
                Account details are verified via Paystack. Envoyce never stores
                sensitive banking data. A{" "}
                <strong className="text-gray-600">2% fee</strong> applies per
                transaction. Paystack typically approves new subaccounts within
                24 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-6 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
          {!verified ? (
            <button
              onClick={onVerify}
              disabled={
                step === "verifying" || !form.account_number || !form.bank_code
              }
              className="px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors text-sm"
            >
              {step === "verifying" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
                </>
              ) : (
                "Verify account"
              )}
            </button>
          ) : (
            <button
              onClick={onSave}
              disabled={step === "saving" || !form.business_name.trim()}
              className="px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors text-sm"
            >
              {step === "saving" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                "Connect account"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PaymentSetup({
  userId,
  showNotification,
}: PaymentSetupProps) {
  const {
    status,
    loading: statusLoading,
    refetch,
  } = useSubaccountStatus(userId);

  const [accounts, setAccounts] = useState<SubaccountRecord[]>([]);
  const [accountsReady, setAccountsReady] = useState(false);

  useEffect(() => {
    if (statusLoading) return;
    if (status?.has_subaccount && status.subaccounts.length > 0) {
      setAccounts(
        status.subaccounts.map((s) => ({
          id: s.subaccount_code ?? String(s.id ?? Date.now()),
          business_name: s.business_name ?? "",
          account_name: s.account_name ?? "",
          account_number: s.account_number ?? "",
          bank_name: s.bank_name ?? "",
          bank_code: s.bank_code ?? "",
          // FIX: Paystack returns active as 1/0 (integer) or true/false.
          // Only use `active` — is_verified stays false even on working accounts.
          status: s.active ? "approved" : "pending",
          is_verified: s.is_verified ?? null,
          created_at: s.created_at ?? new Date().toISOString(),
        })),
      );
    } else {
      setAccounts([]);
    }
    setAccountsReady(true);
  }, [statusLoading, status]);

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<
    "form" | "verifying" | "confirmed" | "saving"
  >("form");
  const [form, setForm] = useState<FormState>({
    business_name: "",
    account_number: "",
    bank_code: "",
    bank_name: "",
  });
  const [verified, setVerified] = useState<{ account_name: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [bankSearch, setBankSearch] = useState("");
  const [showBankList, setShowBankList] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [showBusinessList, setShowBusinessList] = useState(false);

  const filteredBanks = NIGERIAN_BANKS.filter((b) =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase()),
  );
  const selectedBank = form.bank_code
    ? NIGERIAN_BANKS.find((b) => b.code === form.bank_code)
    : undefined;

  const fetchBusinesses = useCallback(async () => {
    if (businesses.length > 0) return;
    setBusinessesLoading(true);
    try {
      const params = new URLSearchParams({
        user_id: userId,
        page: "1",
        per_page: "100",
      });
      const res = await fetch(`${API_BASE_URL}/api/businesses?${params}`);
      const data = await res.json();
      if (data.success) setBusinesses(data.businesses || []);
    } catch {
      /* silently fail */
    } finally {
      setBusinessesLoading(false);
    }
  }, [userId, businesses.length]);

  const openModal = () => {
    setStep("form");
    setVerified(null);
    setError(null);
    setForm({
      business_name: "",
      account_number: "",
      bank_code: "",
      bank_name: "",
    });
    setShowModal(true);
    fetchBusinesses();
  };

  const closeModal = () => {
    setShowModal(false);
    setBankSearch("");
    setShowBankList(false);
    setShowBusinessList(false);
    setError(null);
  };

  const handleVerify = async () => {
    if (!form.account_number || form.account_number.length < 10) {
      setError("Enter a valid 10-digit account number");
      return;
    }
    if (!form.bank_code) {
      setError("Select a bank");
      return;
    }
    setStep("verifying");
    setError(null);
    const result = await verifyAccount(form.account_number, form.bank_code);
    if (result.success) {
      setVerified({ account_name: result.account_name });
      setStep("confirmed");
    } else {
      setError(
        result.error || "Could not verify account. Check number and bank.",
      );
      setStep("form");
    }
  };

  const handleSave = async () => {
    if (!verified || !form.business_name.trim()) {
      setError("Enter your business name");
      return;
    }
    setStep("saving");
    setError(null);
    const result = await createSubaccount({
      user_id: userId,
      business_name: form.business_name,
      account_number: form.account_number,
      bank_code: form.bank_code,
      account_name: verified.account_name,
    });
    if (result.success) {
      const newAccount: SubaccountRecord = {
        id: result.subaccount_code ?? `local-${Date.now()}`,
        business_name: form.business_name,
        account_name: verified.account_name,
        account_number: form.account_number,
        bank_name: form.bank_name,
        bank_code: form.bank_code,
        status: "pending",
        is_verified: null,
        created_at: new Date().toISOString(),
      };
      setAccounts((prev) => [...prev, newAccount]);
      closeModal();
      refetch();
      showNotification?.(
        "Bank account submitted — pending Paystack approval",
        "success",
      );
    } else {
      setError(result.error || "Failed to save account. Try again.");
      setStep("confirmed");
    }
  };

  const handleRemove = async (id: string) => {
    // Optimistic removal — works even if the subaccount was already deleted
    // from the Paystack dashboard (backend handles the 404 gracefully)
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    showNotification?.("Account removed", "success");
    try {
      await removeSubaccount(userId, id);
    } catch {
      /* swallow — local state is already correct */
    }
  };

  if (statusLoading || !accountsReady) return <PaymentSetupSkeleton />;

  return (
    <>
      <style>{shimmerCSS}</style>

      {accounts.length > 0 && (
        <div className="space-y-3 mb-4">
          {accounts.map((account) => (
            <SubaccountCard
              key={account.id}
              account={account}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {accounts.length === 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 border border-dashed border-gray-300 rounded-xl bg-gray-50 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                No bank accounts connected
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                Accept payments from clients via Paystack.{" "}
                <strong className="text-gray-700">2% fee</strong> per
                transaction.
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={openModal}
        className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        {accounts.length === 0 ? "Connect account" : "Add another account"}
      </button>

      {showModal && (
        <ConnectModal
          step={step}
          form={form}
          setForm={setForm}
          verified={verified}
          setVerified={setVerified}
          error={error}
          businesses={businesses}
          businessesLoading={businessesLoading}
          showBusinessList={showBusinessList}
          setShowBusinessList={setShowBusinessList}
          bankSearch={bankSearch}
          setBankSearch={setBankSearch}
          showBankList={showBankList}
          setShowBankList={setShowBankList}
          filteredBanks={filteredBanks}
          selectedBank={selectedBank}
          onClose={closeModal}
          onVerify={handleVerify}
          onSave={handleSave}
        />
      )}
    </>
  );
}
