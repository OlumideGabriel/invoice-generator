import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

import {
  CreditCard,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Crown,
  Loader2,
} from "lucide-react";
import { API_BASE_URL } from "../config/api";

interface BillingSectionProps {
  user: {
    id: string;
    email: string;
    plan?: string;
  };
  showNotification: (message: string, type?: "success" | "error") => void;
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
}

const BillingSection: React.FC<BillingSectionProps> = ({
  user,
  showNotification,
}) => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [upgrading, setUpgrading] = useState(false);

  const isPro = user.plan === "pro";

  // ← Fix: was missing, caused permanent loading spinner
  useEffect(() => {
    fetchSubscriptionStatus();
  }, [user.id]);

  const getAuthHeaders = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      };
    }

    const nativeUser = localStorage.getItem("nativeUser");
    if (nativeUser) {
      const parsed = JSON.parse(nativeUser);
      const token = parsed.access_token || parsed.token;
      if (token) {
        return {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
      }
    }

    showNotification("Session expired. Please login again.", "error");
    window.location.href = "/login";
    return {};
  };

  const fetchSubscriptionStatus = async () => {
    setLoadingTransactions(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/paystack/subscription/status?user_id=${user.id}`,
        {
          headers: await getAuthHeaders(),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        setTransactions(data.transactions || []);
      } else if (response.status === 401) {
        showNotification("Please login again", "error");
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/paystack/subscription/initialize`,
        {
          method: "POST",
          headers: await getAuthHeaders(),
          body: JSON.stringify({ user_id: user.id }),
        },
      );

      const data = await response.json();

      if (response.ok && data.success && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        showNotification(data.error || "Failed to initialize payment", "error");
      }
    } catch (error) {
      console.error("Error upgrading:", error);
      showNotification("Failed to upgrade. Please try again.", "error");
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !window.confirm(
        "Are you sure you want to cancel your Pro subscription? You will lose access to Pro features after your current billing period ends.",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/paystack/subscription/cancel`,
        {
          method: "POST",
          headers: await getAuthHeaders(),
          body: JSON.stringify({ user_id: user.id }),
        },
      );

      const data = await response.json();

      if (data.success) {
        showNotification(data.message, "success");
        fetchSubscriptionStatus();
      } else {
        showNotification(data.error || "Failed to cancel", "error");
      }
    } catch (error) {
      console.error("Error canceling:", error);
      showNotification("Failed to cancel subscription", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
              Billing Information
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage your subscription and billing details
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Current Plan Card */}
          <div
            className={`rounded-lg p-6 border-2 ${
              isPro
                ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300"
                : "bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200"
            }`}
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {isPro ? (
                    <Crown className="h-5 w-5 text-amber-600" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-teal-600" />
                  )}
                  <h4 className="text-lg font-medium text-gray-900">
                    Current Plan
                  </h4>
                </div>
                <p className="text-2xl md:text-3xl font-bold mb-2">
                  {isPro ? "Pro Plan" : "Free Plan"}
                </p>
                {isPro && subscription?.current_period_end && (
                  <p className="text-sm text-gray-600">
                    Next billing date:{" "}
                    {formatDate(subscription.current_period_end)}
                  </p>
                )}
                {isPro && subscription?.cancel_at_period_end && (
                  <p className="text-sm text-amber-600 mt-1">
                    Your subscription will end on{" "}
                    {formatDate(subscription.current_period_end)}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                {isPro ? (
                  <CreditCard className="h-12 w-12 md:h-16 md:w-16 text-amber-500 opacity-50" />
                ) : (
                  <CreditCard className="h-12 w-12 md:h-16 md:w-16 text-teal-500 opacity-50" />
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {!isPro ? (
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {upgrading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Upgrade to Pro (₦2,999/month)
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                !subscription?.cancel_at_period_end && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={loading}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                  >
                    Cancel Subscription
                  </button>
                )
              )}
            </div>
          </div>

          {/* Plan Features */}
          <div className="bg-white border border-gray-300 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Plan Features
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {isPro ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-gray-700">
                      Unlimited businesses
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-gray-700">
                      Unlimited invoices
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-gray-700">
                      Priority support
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-gray-700">
                      Advanced analytics
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span className="text-sm text-gray-700">
                      1 business included
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span className="text-sm text-gray-700">
                      5 invoices per month
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span className="text-sm text-gray-700">Email support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span className="text-sm text-gray-700">
                      Basic analytics
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Billing History */}
          <div className="bg-white border border-gray-300 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Payment History
            </h4>
            {loadingTransactions ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading payment history...</p>
              </div>
            ) : transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Description
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-700">
                          {formatDate(tx.date)}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {tx.description}
                        </td>
                        <td className="py-3 px-4 text-gray-700 font-medium">
                          {formatAmount(tx.amount, tx.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-2 text-gray-400">
                <FileText className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">No transaction history</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSection;
