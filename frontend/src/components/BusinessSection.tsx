import React, { useState, useEffect } from 'react';
import {
  BriefcaseBusiness,
  Plus,
  X,
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

interface BusinessFormData {
  name: string;
  email: string;
  address: string;
  phone: string;
  tax_id: string;
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
  <div className="bg-white hover:border-gray-400 border border-gray-300 rounded-lg p-6 transition-shadow hover:shadow-sm">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-3">
        <Building className="w-8 h-8 text-teal-600" />
        <div>
          <h3 className="text-lg font-medium text-gray-900">{business.name}</h3>
          {business.email && (
            <p className="text-sm text-gray-500 flex items-center mt-1">
              <Mail className="w-3 h-3 mr-1" />
              {business.email}
            </p>
          )}
        </div>
      </div>
      <div className="flex space-x-1">
        <button
          onClick={() => onEdit(business)}
          className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(business.id)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>

    <div className="space-y-2 text-sm text-gray-500">
      {business.address && (
        <p className="flex items-center">
          <MapPin className="w-3 h-3 mr-2 flex-shrink-0" />
          <span className="truncate">{business.address}</span>
        </p>
      )}
      {business.phone && (
        <p className="flex items-center">
          <Phone className="w-3 h-3 mr-2 flex-shrink-0" />
          {business.phone}
        </p>
      )}
      {business.tax_id && (
        <p className="flex items-center">
          <Hash className="w-3 h-3 mr-2 flex-shrink-0" />
          Tax ID: {business.tax_id}
        </p>
      )}
    </div>

    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="px-2 py-0.5 bg-teal-100 rounded-full text-teal-700">
          {business.invoice_count || 0} invoices
        </span>
        <span className="px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
          Created {new Date(business.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  </div>
);

interface BusinessFormModalProps {
  business?: Business;
  onSubmit: (data: BusinessFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
  loading?: boolean;
}

const BusinessFormModal: React.FC<BusinessFormModalProps> = ({
  business,
  onSubmit,
  onCancel,
  isEditing = false,
  loading = false
}) => {
  const [formData, setFormData] = useState<BusinessFormData>({
    name: business?.name || '',
    email: business?.email || '',
    address: business?.address || '',
    phone: business?.phone || '',
    tax_id: business?.tax_id || ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-8 border-b border-gray-300">
          <h3 className="text-2xl font-semibold text-gray-900">
            {isEditing ? 'Edit Business' : 'Add New Business'}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-teal-500 transition-colors"
              placeholder="Enter business name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-teal-500 transition-colors"
              placeholder="business@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-teal-500 transition-colors"
              placeholder="Business address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-teal-500 transition-colors"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax ID
              </label>
              <input
                type="text"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-teal-500 transition-colors"
                placeholder="Tax identification number"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-6 border-t border-gray-300">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!formData.name.trim()) {
                  showNotification('Business name is required', 'error');
                  return;
                }
                console.log('Form submission with data:', formData);
                onSubmit(formData);
              }}
              disabled={loading || !formData.name.trim()}
              className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (isEditing ? 'Update Business' : 'Add Business')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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

  const handleAddBusiness = async (formData: BusinessFormData) => {
    if (!isOnline) return showNotification('No internet connection', 'error');

    try {
      setLoading(true);

      console.log('Adding business with data:', { ...formData, user_id: user.id });

      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ ...formData, user_id: user.id })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.success) {
        showNotification('Business added successfully', 'success');
        setShowModal(false);
        await fetchBusinesses(); // Refresh the list
      } else {
        console.error('API returned success: false', data);
        showNotification(data.error || data.message || 'Failed to add business', 'error');
      }
    } catch (error) {
      console.error('Error adding business:', error);
      showNotification(`Error adding business: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBusiness = async (formData: BusinessFormData) => {
    if (!editingBusiness) return;
    if (!isOnline) return showNotification('No internet connection', 'error');

    try {
      setLoading(true);

      console.log('Updating business:', editingBusiness.id, 'with data:', formData);

      const response = await fetch(`/api/businesses/${editingBusiness.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('Update response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Update response:', data);

      if (data.success) {
        showNotification('Business updated successfully', 'success');
        setEditingBusiness(null);
        setShowModal(false);
        await fetchBusinesses(); // Refresh the list
      } else {
        console.error('Update API returned success: false', data);
        showNotification(data.error || data.message || 'Failed to update business', 'error');
      }
    } catch (error) {
      console.error('Error updating business:', error);
      showNotification(`Error updating business: ${error.message}`, 'error');
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

  const handleFormSubmit = (formData: BusinessFormData) => {
    if (editingBusiness) {
      handleUpdateBusiness(formData);
    } else {
      handleAddBusiness(formData);
    }
  };

  const handleCancelForm = () => {
    setShowModal(false);
    setEditingBusiness(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Main Business Section */}
      <div className="bg-white rounded-xl p-8 border border-gray-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Businesses</h2>
            <p className="text-gray-500 text-sm mt-1">Manage your business information and settings</p>
          </div>
          <div className="flex items-center space-x-3">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-500" title="Online" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" title="Offline" />
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

      {showModal && (
        <BusinessFormModal
          business={editingBusiness || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
          isEditing={!!editingBusiness}
          loading={loading}
        />
      )}
    </div>
  );
};

export default BusinessSection;