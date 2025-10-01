import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

interface BusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalType?: 'create' | 'edit';
  business?: any;
  businessData?: any; // Alternative prop name for compatibility
  data?: any; // Generic prop name for compatibility with PartyField
  onSuccess: (message: string, type?: string) => void;
}

const BusinessModal: React.FC<BusinessModalProps> = ({
  isOpen,
  onClose,
  modalType = 'create',
  business,
  businessData,
  data,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    tax_id: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Determine which business data to use (supports multiple prop names)
  const businessToEdit = business || businessData || data;
  const actualModalType = businessToEdit ? 'edit' : modalType;

  useEffect(() => {
    if (actualModalType === 'edit' && businessToEdit) {
      setFormData({
        name: businessToEdit.name || '',
        email: businessToEdit.email || '',
        address: businessToEdit.address || '',
        phone: businessToEdit.phone || '',
        tax_id: businessToEdit.tax_id || ''
      });
    } else {
      setFormData({ name: '', email: '', address: '', phone: '', tax_id: '' });
    }
    setFormErrors({});
    setIsSubmitting(false);
  }, [actualModalType, businessToEdit, isOpen]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Business name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!user?.id) {
      onSuccess('User not authenticated', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = actualModalType === 'create'
        ? `${API_BASE_URL}/api/businesses`
        : `${API_BASE_URL}/api/businesses/${businessToEdit.id}`;

      const method = actualModalType === 'create' ? 'POST' : 'PUT';
      const payload = actualModalType === 'create'
        ? { ...formData, user_id: user.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const successMessage = actualModalType === 'create'
          ? `Business "${formData.name}" has been created successfully`
          : `Business "${formData.name}" has been updated successfully`;

        onSuccess(successMessage);
        onClose();
      } else {
        // Handle validation errors from server
        if (data.errors && Array.isArray(data.errors)) {
          const errors: Record<string, string> = {};
          data.errors.forEach((error: string) => {
            if (error.toLowerCase().includes('name')) {
              errors.name = error;
            } else if (error.toLowerCase().includes('email')) {
              errors.email = error;
            } else if (error.toLowerCase().includes('tax')) {
              errors.tax_id = error;
            }
          });

          if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
          } else {
            onSuccess(data.errors.join(', '), 'error');
          }
        } else {
          onSuccess(data.error || data.message || 'Operation failed', 'error');
        }
      }
    } catch (error) {
      console.error('Business modal error:', error);
      onSuccess('Network error occurred. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {actualModalType === 'create' ? 'Add New Business' : 'Edit Business'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full input px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  formErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter business name"
                disabled={isSubmitting}
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full input px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter business email"
                disabled={isSubmitting}
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full input px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter business phone"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax ID
              </label>
              <input
                type="text"
                value={formData.tax_id}
                onChange={(e) => handleInputChange('tax_id', e.target.value)}
                className={`w-full input px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  formErrors.tax_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter tax identification number"
                disabled={isSubmitting}
              />
              {formErrors.tax_id && (
                <p className="mt-1 text-sm text-red-600">{formErrors.tax_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className="w-full input px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter business address"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 w-1/2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center w-1/2 px-4 py-2.5 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? (actualModalType === 'create' ? 'Creating...' : 'Saving...')
                  : (actualModalType === 'create' ? 'Add Business' : 'Save Changes')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BusinessModal;