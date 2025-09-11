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
  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-3">
        <Building className="w-8 h-8 text-blue-700" />
        <div>
          <h3 className="font-semibold text-gray-900">{business.name}</h3>
          {business.email && (
            <p className="text-sm text-gray-600 flex items-center">
              <Mail className="w-3 h-3 mr-1" />
              {business.email}
            </p>
          )}
        </div>
      </div>
      <div className="flex space-x-1">
        <button
          onClick={() => onEdit(business)}
          className="p-2 text-gray-400 hover:!text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(business.id)}
          className="p-2 text-gray-400 hover:!text-red-600 hover:bg-red-100 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>

    <div className="space-y-2 text-sm text-gray-600">
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

    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="px-2 py-0.5 bg-blue-100 rounded-full text-blue-500">
          {business.invoice_count || 0} invoices
        </span>
        <span className="px-2 py-0.5 bg-blue-100 rounded-full text-blue-500">
          Created {new Date(business.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  </div>
);

const BusinessFormModal: React.FC<{
  business?: Business;
  onSubmit: (data: BusinessFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}> = ({ business, onSubmit, onCancel, isEditing = false }) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Business' : 'Add New Business'}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tax identification number"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isEditing ? 'Update Business' : 'Add Business'}
            </button>
          </div>
        </form>
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
    localStorage.setItem('businesses', JSON.stringify(data));
  };

  const loadFromCache = () => {
    const cached = localStorage.getItem('businesses');
    return cached ? (JSON.parse(cached) as Business[]) : [];
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

      const response = await fetch(`/api/businesses?user_id=${user.id}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.success) {
        setBusinesses(data.businesses);
        saveToCache(data.businesses);
      } else {
        showNotification('Failed to fetch businesses', 'error');
        setFetchError(true);
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
      showNotification('Error fetching businesses', 'error');
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBusiness = async (formData: BusinessFormData) => {
    if (!isOnline) return showNotification('No internet connection', 'error');

    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_id: user.id })
      });

      const data = await response.json();
      if (data.success) {
        showNotification('Business added successfully');
        setShowModal(false);
        fetchBusinesses();
      } else {
        showNotification(data.error || 'Failed to add business', 'error');
      }
    } catch {
      showNotification('Error adding business', 'error');
    }
  };

  const handleUpdateBusiness = async (formData: BusinessFormData) => {
    if (!editingBusiness) return;
    if (!isOnline) return showNotification('No internet connection', 'error');

    try {
      const response = await fetch(`/api/businesses/${editingBusiness.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        showNotification('Business updated successfully');
        setEditingBusiness(null);
        setShowModal(false);
        fetchBusinesses();
      } else {
        showNotification(data.error || 'Failed to update business', 'error');
      }
    } catch {
      showNotification('Error updating business', 'error');
    }
  };

  const handleDeleteBusiness = async (businessId: string) => {
    if (!isOnline) return showNotification('No internet connection', 'error');
    if (!window.confirm('Are you sure you want to delete this business?')) return;

    try {
      const response = await fetch(`/api/businesses/${businessId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        showNotification('Business deleted successfully');
        fetchBusinesses();
      } else {
        showNotification(data.error || 'Failed to delete business', 'error');
      }
    } catch {
      showNotification('Error deleting business', 'error');
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

  const Card: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center">
            {isOnline ? (
              <Wifi className="w-5 h-5 hidden text-green-500" title="Online" />
            ) : (
              <WifiOff className="w-5 h-5 hidden text-red-500" title="Offline" />
            )}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  return (
    <>
      <Card title="Businesses" subtitle="Manage your business information and settings">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading businesses...</p>
          </div>
        ) : fetchError ? (
          <div className="text-center py-8">
            <BriefcaseBusiness className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {isOnline ? 'Failed to load businesses' : 'No internet connection'}
            </p>
            <button
              onClick={fetchBusinesses}
              disabled={!isOnline}
              className={`mt-4 inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                isOnline
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Retry
            </button>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-8">
            <BriefcaseBusiness className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No businesses added yet</p>
            <button
              onClick={handleAddNewBusiness}
              disabled={!isOnline}
              className={`mt-4 inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                isOnline
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Business
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {businesses.map((business) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  onDelete={handleDeleteBusiness}
                  onEdit={handleEditBusiness}
                />
              ))}

              <button
                onClick={handleAddNewBusiness}
                disabled={!isOnline}
                className={`inline-flex items-center px-4 py-2 justify-center rounded-lg transition-colors border-2 border-dashed ${
                  isOnline
                    ? 'text-neutral-400 bg-gray-50 hover:bg-gray-100 border-gray-300'
                    : 'text-gray-300 bg-gray-100 border-gray-200 cursor-not-allowed'
                }`}
              >
                <Plus size={20} className="mr-
2" />
                Add Business
              </button>
            </div>

            <button
              onClick={handleAddNewBusiness}
              className="inline-flex hidden items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Business
            </button>
          </div>
        )}
      </Card>

      {showModal && (
        <BusinessFormModal
          business={editingBusiness || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
          isEditing={!!editingBusiness}
        />
      )}
    </>
  );
};

export default BusinessSection;