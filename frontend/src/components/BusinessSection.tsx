import React, { useState, useEffect, useCallback } from "react";
import {
  BriefcaseBusiness,
  Plus,
  MapPin,
  Phone,
  Trash2,
  Edit2,
  WifiOff,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Clock,
  CircleDashed,
} from "lucide-react";
import BusinessModal from "./BusinessModal";
import { API_BASE_URL } from "../config/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Business {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  address?: string;
  phone?: string;
  tax_id?: string;
  invoice_count?: number;
  paystack_subaccount_code?: string;
  is_verified?: boolean | null;
  created_at: string;
  updated_at?: string;
}

interface BusinessSectionProps {
  user: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    plan?: string;
  };
  showNotification: (message: string, type?: "success" | "error") => void;
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-md bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3.5 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-3/4" />
    </div>
    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
      <div className="h-3 bg-gray-100 rounded w-16" />
      <div className="h-5 bg-gray-100 rounded-full w-28" />
    </div>
  </div>
);

const BusinessSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {[0, 1, 2].map((i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

// ─── Payment badge ────────────────────────────────────────────────────────────

const PaymentBadge: React.FC<{ business: Business }> = ({ business }) => {
  if (business.is_verified) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        Paystack verified
      </span>
    );
  }
  if (business.paystack_subaccount_code) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
        <Clock className="w-3 h-3" />
        Awaiting approval
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
      <CircleDashed className="w-3 h-3" />
      No payment setup
    </span>
  );
};

// ─── Business card ────────────────────────────────────────────────────────────

const BusinessCard: React.FC<{
  business: Business;
  onDelete: (id: string) => void;
  onEdit: (business: Business) => void;
}> = ({ business, onDelete, onEdit }) => {
  const initials = business.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="group bg-white border border-gray-300 rounded-xl p-5 flex flex-col gap-4 hover:border-gray-400 hover:shadow-sm transition-all duration-150">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-gray-600 tracking-tight">
              {initials}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate leading-tight">
              {business.name}
            </h3>
            {business.email && (
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {business.email}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
          <button
            onClick={() => onEdit(business)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Edit business"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(business.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            aria-label="Delete business"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {(business.address || business.phone) && (
        <div className="space-y-1.5">
          {business.address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-gray-600 leading-relaxed">
                {business.address}
              </span>
            </div>
          )}
          {business.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600">{business.phone}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
        <span className="text-xs text-gray-400">
          {business.invoice_count || 0}{" "}
          {business.invoice_count === 1 ? "invoice" : "invoices"}
        </span>
        <PaymentBadge business={business} />
      </div>
    </div>
  );
};

// ─── Pro upgrade banner ───────────────────────────────────────────────────────

const ProUpgradeBanner: React.FC = () => (
  <div className="bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 rounded-lg p-4 md:p-6 flex items-center gap-4 mb-6">
    <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
      <Sparkles className="w-5 h-5 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-900">
        Multiple businesses — Pro feature
      </p>
      <p className="text-xs text-gray-600 mt-0.5">
        You're on the free plan, which supports one business. Upgrade to Pro to
        add unlimited businesses.
      </p>
    </div>
    <button className="flex-shrink-0 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
      Upgrade
    </button>
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="text-center py-12 md:py-16">
    <BriefcaseBusiness className="h-12 w-12 text-gray-300 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      No businesses yet
    </h3>
    <p className="text-gray-500 mb-6 text-sm max-w-xs mx-auto">
      Get started by adding your first business
    </p>
    <button
      onClick={onAdd}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-700 transition-colors"
    >
      <Plus className="w-4 h-4" />
      Add your first business
    </button>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const BusinessSection: React.FC<BusinessSectionProps> = ({
  user,
  showNotification,
}) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [hasNetworkError, setHasNetworkError] = useState(!navigator.onLine);
  const [canAddBusiness, setCanAddBusiness] = useState(false);
  const [isPlanDetermined, setIsPlanDetermined] = useState(false);

  const fetchBusinesses = useCallback(async () => {
    if (!navigator.onLine) {
      setHasNetworkError(true);
      showNotification(
        "You appear to be offline. Please check your internet connection.",
        "error",
      );
      setLoading(false);
      setIsPlanDetermined(true);
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({
        user_id: user.id,
        page: "1",
        per_page: "100",
      });
      const response = await fetch(`${API_BASE_URL}/api/businesses?${params}`);
      if (!response.ok) throw new Error(`API returned ${response.status}`);

      const data = await response.json();

      if (data.success) {
        setBusinesses(data.businesses || []);
        setCanAddBusiness(data.can_add_business ?? true);
        // Once we have data from the server, we know the plan status
        setIsPlanDetermined(true);
      } else {
        showNotification("Error fetching businesses", "error");
        setIsPlanDetermined(true);
      }

      setHasNetworkError(false);
    } catch {
      if (!navigator.onLine) {
        setHasNetworkError(true);
        showNotification("You appear to be offline.", "error");
      } else {
        showNotification("Server error. Please try again later.", "error");
      }
      setIsPlanDetermined(true);
    } finally {
      setLoading(false);
    }
  }, [user.id, showNotification]);

  useEffect(() => {
    fetchBusinesses();

    const handleOnline = () => {
      setHasNetworkError(false);
      fetchBusinesses();
    };
    const handleOffline = () => setHasNetworkError(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchBusinesses]);

  const handleDeleteBusiness = async (businessId: string) => {
    if (!window.confirm("Are you sure you want to delete this business?"))
      return;
    if (hasNetworkError) {
      showNotification(
        "No internet connection. Please check your network and try again.",
        "error",
      );
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/businesses/${businessId}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (data.success) {
        showNotification("Business deleted successfully", "success");
        fetchBusinesses();
      } else {
        showNotification(data.error || "Failed to delete business", "error");
      }
    } catch {
      if (!navigator.onLine) {
        setHasNetworkError(true);
        showNotification("You appear to be offline.", "error");
      } else {
        showNotification("Server error while deleting business.", "error");
      }
    }
  };

  const handleEditBusiness = (business: Business) => {
    if (hasNetworkError) {
      showNotification(
        "No internet connection. Please check your network and try again.",
        "error",
      );
      return;
    }
    setEditingBusiness(business);
    setShowModal(true);
  };

  const handleAddNewBusiness = () => {
    if (hasNetworkError) {
      showNotification(
        "No internet connection. Please check your network and try again.",
        "error",
      );
      return;
    }
    // Check if user is on free plan and already has a business
    if (!canAddBusiness && user.plan !== "pro") {
      showNotification(
        "Free plan supports one business. Upgrade to Pro to add more.",
        "error",
      );
      return;
    }
    setEditingBusiness(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingBusiness(null);
  };

  const handleModalSuccess = (message: string) => {
    showNotification(message, "success");
    setShowModal(false);
    setEditingBusiness(null);
    fetchBusinesses();
  };

  // Show upgrade banner only when:
  // 1. We've determined the plan status (not loading)
  // 2. User cannot add more businesses
  // 3. User is NOT on pro plan
  const showUpgradeBanner =
    isPlanDetermined && !canAddBusiness && user.plan !== "pro";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-300">
        {showUpgradeBanner && <ProUpgradeBanner />}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
              Businesses
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage your business profiles and settings
            </p>
          </div>

          <button
            onClick={handleAddNewBusiness}
            disabled={
              hasNetworkError ||
              (!canAddBusiness && user.plan !== "pro" && !loading)
            }
            title={
              !canAddBusiness && user.plan !== "pro"
                ? "Upgrade to Pro to add more businesses"
                : undefined
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium
                       rounded-md hover:bg-teal-700 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Business</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {loading ? (
          <BusinessSkeleton />
        ) : hasNetworkError ? (
          <div className="text-center py-12 md:py-16">
            <WifiOff className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No internet connection
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              Please check your connection and try again.
            </p>
            <button
              onClick={fetchBusinesses}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : businesses.length === 0 ? (
          <EmptyState onAdd={handleAddNewBusiness} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                onDelete={handleDeleteBusiness}
                onEdit={handleEditBusiness}
              />
            ))}
          </div>
        )}
      </div>

      <BusinessModal
        isOpen={showModal}
        onClose={handleModalClose}
        modalType={editingBusiness ? "edit" : "create"}
        business={editingBusiness}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default BusinessSection;
