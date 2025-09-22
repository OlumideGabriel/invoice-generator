import React, { useState, useEffect } from 'react';
import {
  BriefcaseBusiness,
  Plus,
  Building,
  Hash,
  Mail,
  MapPin,
  Phone,
  Trash2,
  Edit2,
  Wifi,
  WifiOff
} from 'lucide-react';
import BusinessModal from './BusinessModal';

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
  <div className="bg-teal-50 hover:border-teal-600 border-2 border-teal-500 rounded-lg p-4 sm:p-6 transition-all duration-200 hover:shadow-sm h-full flex flex-col">
    {/* Header Section */}
    <div className="flex items-start justify-between mb-4 min-h-0">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <Building className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold sm:text-lg font-medium text-teal-900 truncate">
            {business.name}
          </h3>
          {business.email && (
            <div className="text-xs sm:text-sm text-gray-500 flex items-center  min-w-0">
              <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate">{business.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-1 flex-shrink-0 ml-2">
        <button
          onClick={() => onEdit(business)}
          className="p-1.5 sm:p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-100 rounded-lg transition-colors"
          aria-label="Edit business"
        >
          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          onClick={() => onDelete(business.id)}
          className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          aria-label="Delete business"
        >
          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>

    {/* Content Section */}
    <div className="flex-1 space-y-2 text-xs sm:text-sm text-gray-500 mb-4 min-h-0">
      {business.address && (
        <div className="flex items-start min-w-0">
          <MapPin className="w-3 h-3 mr-2 flex-shrink-0 mt-0.5" />
          <span className="break-words leading-relaxed">{business.address}</span>
        </div>
      )}
      {business.phone && (
        <div className="flex items-center min-w-0">
          <Phone className="w-3 h-3 mr-2 flex-shrink-0" />
          <span className="truncate">{business.phone}</span>
        </div>
      )}
      {business.tax_id && (
        <div className="flex items-center min-w-0">
          <Hash className="w-3 h-3 mr-2 flex-shrink-0" />
          <span className="truncate">Tax ID: {business.tax_id}</span>
        </div>
      )}
    </div>

    {/* Footer Section */}
    <div className="pt-3 border-t border-gray-200 flex-shrink-0">
      <div className="flex justify-start">
        <span className="inline-flex items-center px-2 py-1 bg-teal-100 rounded-full text-xs font-medium text-teal-700">
          {business.invoice_count || 0} invoices
        </span>
      </div>
    </div>
  </div>
);

const BusinessSection: React.FC<BusinessSectionProps> = ({ user, showNotification }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Helpers for cache
  const saveToCache = (data: Business[]) => {
    // localStorage.setItem('businesses', JSON.stringify(data));
  };

  const loadFromCache = () => {
    // const cached = localStorage.getItem('businesses');
    // return cached ? (JSON.parse(cached) as Business[]) : [];
    return [];
  };

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showNotification('Connection restored', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showNotification('No internet connection', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showNotification]);

  // Load cache first, then fetch fresh
  useEffect(() => {
    const cachedBusinesses = loadFromCache();
    if (cachedBusinesses.length > 0) {
      setBusinesses(cachedBusinesses);
    }
    fetchBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBusinesses = async () => {
    if (!isOnline) {
      setFetchError(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setFetchError(false);

      console.log('Fetching businesses for user:', user.id);

      const response = await fetch(`/api/businesses?user_id=${user.id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Fetch response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Fetched businesses data:', data);

      if (data.success) {
        setBusinesses(data.businesses || []);
        saveToCache(data.businesses || []);
      } else {
        console.error('API returned success: false', data);
        showNotification(data.error || data.message || 'Failed to fetch businesses', 'error');
        setFetchError(true);
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
      showNotification(`Error fetching businesses: ${err.message}`, 'error');
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBusiness = async (businessId: string) => {
    if (!isOnline) return showNotification('No internet connection', 'error');
    if (!window.confirm('Are you sure you want to delete this business?')) return;

    try {
      setLoading(true);

      console.log('Deleting business:', businessId);

      const response = await fetch(`/api/businesses/${businessId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Delete response:', data);

      if (data.success) {
        showNotification('Business deleted successfully', 'success');
        await fetchBusinesses(); // Refresh the list
      } else {
        console.error('Delete API returned success: false', data);
        showNotification(data.error || data.message || 'Failed to delete business', 'error');
      }
    } catch (error) {
      console.error('Error deleting business:', error);
      showNotification(`Error deleting business: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBusiness = (business: Business) => {
    setEditingBusiness(business);
    setShowModal(true);
  };

  const handleAddNewBusiness = () => {
    setEditingBusiness(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingBusiness(null);
  };

  const handleModalSuccess = (message: string, type?: string) => {
    showNotification(message, type === 'error' ? 'error' : 'success');
    setShowModal(false);
    setEditingBusiness(null);
    fetchBusinesses(); // Refresh the list
  };

  return (
    <div className="max-w-7xl mx-auto ">
      {/* Main Business Section */}
      <div className="bg-white rounded-xl p-8 border border-gray-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Businesses</h2>
            <p className="text-gray-500 text-sm mt-1">Manage your business information and settings</p>
          </div>
          <div className="flex items-center space-x-3">
            {isOnline ? (
              <Wifi className="w-5 h-5 hidden text-green-500" title="Online" />
            ) : (
              <WifiOff className="w-5 h-5 hidden text-red-500" title="Offline" />
            )}
            <button
              onClick={handleAddNewBusiness}
              disabled={!isOnline}
              className={`px-6 py-4 min-w-32 text-white rounded-md transition-colors text-md font-medium ${
                isOnline
                  ? 'bg-teal-600 hover:bg-teal-500'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              Add Business
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading businesses...</p>
          </div>
        ) : fetchError ? (
          <div className="text-center py-12">
            <BriefcaseBusiness className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {isOnline ? 'Failed to load businesses' : 'No internet connection'}
            </p>
            <button
              onClick={fetchBusinesses}
              disabled={!isOnline}
              className={`px-4 py-3 rounded-md transition-colors font-medium ${
                isOnline
                  ? 'bg-teal-600 text-white hover:bg-teal-500'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Retry
            </button>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12">
            <BriefcaseBusiness className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No businesses added yet</p>
            <button
              onClick={handleAddNewBusiness}
              disabled={!isOnline}
              className={`px-4 py-3 rounded-md transition-colors font-medium ${
                isOnline
                  ? 'bg-teal-600 text-white hover:bg-teal-500'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              Add Your First Business
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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