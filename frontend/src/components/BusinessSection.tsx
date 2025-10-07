import React, { useState, useEffect } from 'react';
import {
  BriefcaseBusiness,
  Plus,
  Building,
  Mail,
  MapPin,
  Phone,
  Trash2,
  Edit2,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import BusinessModal from './BusinessModal';
import { API_BASE_URL } from '../config/api';

interface Business {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  address?: string;
  phone?: string;
  tax_id?: string;
  invoice_count?: number;
  created_at: string;
  updated_at?: string;
}

interface BusinessSectionProps {
  user: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
  };
  showNotification: (message: string, type?: 'success' | 'error') => void;
}

const BusinessCard: React.FC<{
  business: Business;
  onDelete: (id: string) => void;
  onEdit: (business: Business) => void;
}> = ({ business, onDelete, onEdit }) => (
  <div className="bg-teal-50 border-2 border-teal-500 rounded-lg p-4 sm:p-6 transition-all duration-200 h-full flex flex-col">
    <div className="flex items-start justify-between mb-4 sm:mb-6">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="flex-shrink-0 w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
          <Building className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
            {business.name}
          </h3>
          {business.email && (
            <div className="text-sm text-gray-600 flex items-center min-w-0">
              <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{business.email}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex space-x-1 flex-shrink-0 ml-2">
        <button
          onClick={() => onEdit(business)}
          className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Edit business"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(business.id)}
          className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Delete business"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>

    <div className="flex-1 space-y-2 sm:space-y-3 text-sm text-gray-700 mb-4 sm:mb-6">
      {business.address && (
        <div className="flex items-start">
          <MapPin className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-gray-500" />
          <span className="break-words leading-relaxed text-xs sm:text-sm">
            {business.address}
          </span>
        </div>
      )}
      {business.phone && (
        <div className="flex items-center">
          <Phone className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
          <span className="truncate text-xs sm:text-sm">{business.phone}</span>
        </div>
      )}
    </div>

    <div className="pt-3 sm:pt-4 border-t border-gray-200">
      <span className="text-teal-600 font-medium text-xs sm:text-sm">
        {business.invoice_count || 0} invoices
      </span>
    </div>
  </div>
);

const BusinessSection: React.FC<BusinessSectionProps> = ({
  user,
  showNotification,
}) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [hasNetworkError, setHasNetworkError] = useState(!navigator.onLine);

  const fetchBusinesses = async () => {
    setLoading(true);

    // Check true offline state before fetch
    if (!navigator.onLine) {
      setHasNetworkError(true);
      showNotification(
        'You appear to be offline. Please check your internet connection.',
        'error'
      );
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        user_id: user.id,
        page: '1',
        per_page: '100',
      });

      const response = await fetch(`${API_BASE_URL}/api/businesses?${params}`);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setBusinesses(data.businesses || []);
      } else {
        showNotification('Error fetching businesses', 'error');
      }

      setHasNetworkError(false);
    } catch (error) {
      if (!navigator.onLine) {
        setHasNetworkError(true);
        showNotification('You appear to be offline.', 'error');
      } else {
        showNotification(
          'Server error. Please try again later.',
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-update when going online/offline
  useEffect(() => {
    fetchBusinesses();

    const handleOnline = () => {
      setHasNetworkError(false);
      fetchBusinesses();
    };
    const handleOffline = () => {
      setHasNetworkError(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setHasNetworkError(false);
    setLoading(true);
    fetchBusinesses();
  };

  const handleDeleteBusiness = async (businessId: string) => {
    if (!window.confirm('Are you sure you want to delete this business?'))
      return;

    if (hasNetworkError) {
      showNotification(
        'No internet connection. Please check your network and try again.',
        'error'
      );
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/businesses/${businessId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showNotification('Business deleted successfully', 'success');
        fetchBusinesses();
      } else {
        showNotification(data.error || 'Failed to delete business', 'error');
      }
    } catch (error) {
      if (!navigator.onLine) {
        setHasNetworkError(true);
        showNotification('You appear to be offline.', 'error');
      } else {
        showNotification('Server error while deleting business.', 'error');
      }
    }
  };

  const handleEditBusiness = (business: Business) => {
    if (hasNetworkError) {
      showNotification('No internet connection. Please check your network and try again.', 'error');
      return;
    }
    setEditingBusiness(business);
    setShowModal(true);
  };

  const handleAddNewBusiness = () => {
    if (hasNetworkError) {
      showNotification('No internet connection. Please check your network and try again.', 'error');
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
    showNotification(message, 'success');
    setShowModal(false);
    setEditingBusiness(null);
    if (!hasNetworkError) {
      fetchBusinesses();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-row items-start justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl font-bold text-gray-900">Businesses</h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Manage your business information and settings
              </p>
            </div>
            <button
              onClick={handleAddNewBusiness}
              className="inline-flex items-center px-4 py-2.5 sm:px-6 sm:py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium shadow-sm text-sm sm:text-base min-w-20 sm:w-auto justify-center mt-2 sm:mt-0"
              disabled={hasNetworkError}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Add <span className="hidden md:block">&nbsp;Business</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 sm:py-20">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="text-gray-500 mt-3 sm:mt-4 text-sm sm:text-base">
              Loading businesses...
            </p>
          </div>
        ) : hasNetworkError ? (
          <div className="bg-white rounded-md border border-gray-200 p-6 sm:p-12 text-center">
            <WifiOff className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              No internet connection
            </h3>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              Please check your connection and try again
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-4 py-2.5 sm:px-6 sm:py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Retry
            </button>
          </div>
        ) : businesses.length === 0 ? (
          <div className="bg-white rounded-md border border-gray-200 p-6 sm:p-12 text-center">
            <BriefcaseBusiness className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              No businesses yet
            </h3>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              Get started by adding your first business
            </p>
            <button
              onClick={handleAddNewBusiness}
              className="inline-flex items-center px-4 py-2.5 sm:px-6 sm:py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Add Your First Business
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

      {/* Business Modal */}
      <BusinessModal
        isOpen={showModal}
        onClose={handleModalClose}
        modalType={editingBusiness ? 'edit' : 'create'}
        business={editingBusiness}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default BusinessSection;
