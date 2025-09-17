import React from 'react';
import {
  Building,
  Mail,
  MapPin,
  Phone,
  Hash,
  X,
  Calendar,
  FileText,
  User
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

interface BusinessModalProps {
  business: Business;
  onClose: () => void;
  user?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

const BusinessModal: React.FC<BusinessModalProps> = ({ business, onClose, user }) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <Building className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">{business.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Business Information</h3>

              <div className="space-y-4">
                {business.email && (
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-gray-900">{business.email}</p>
                    </div>
                  </div>
                )}

                {business.phone && (
                  <div className="flex items-start">
                    <Phone className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-gray-900">{business.phone}</p>
                    </div>
                  </div>
                )}

                {business.tax_id && (
                  <div className="flex items-start">
                    <Hash className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tax ID</p>
                      <p className="text-gray-900">{business.tax_id}</p>
                    </div>
                  </div>
                )}

                {business.address && (
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p className="text-gray-900">{business.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Business Statistics</h3>

              <div className="space-y-4">
                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Invoices Created</p>
                    <p className="text-gray-900">{business.invoice_count || 0}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created On</p>
                    <p className="text-gray-900">{formatDate(business.created_at)}</p>
                  </div>
                </div>

                {business.updated_at && (
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Updated</p>
                      <p className="text-gray-900">{formatDate(business.updated_at)}</p>
                    </div>
                  </div>
                )}

                {user && (
                  <div className="flex items-start">
                    <User className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Business Owner</p>
                      <p className="text-gray-900">
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessModal;