import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AlertModal from '../components/AlertModal';
import {
  User,
  Mail,
  Lock,
  Save,
  Camera,
  Edit2,
  Phone,
  MapPin,
  X,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const ProfileSection = ({ showNotification }) => {
  const { user, updateProfile, refreshUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });

  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm: ''
  });

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const getInitials = (u) => {
    if (!u) return 'U';
    const first = u.first_name?.[0]?.toUpperCase() || '';
    const last = u.last_name?.[0]?.toUpperCase() || '';
    return first || last ? `${first}${last}` : u.email?.[0]?.toUpperCase() || 'U';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // Only send non-email fields for update
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone
      };

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        updateProfile(updateData);
        setIsEditing(false);
        showNotification('Profile updated successfully');
        await refreshUser();
      } else {
        showNotification(result.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
    setIsEditing(false);
  };

  const handlePasswordSubmit = async () => {
    if (passwords.new_password !== passwords.confirm) {
      showNotification('New passwords do not match', 'error');
      return;
    }
    if (passwords.new_password.length < 6) {
      showNotification('Password must be at least 6 characters long', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          current_password: passwords.current_password,
          new_password: passwords.new_password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPasswords({ current_password: '', new_password: '', confirm: '' });
        setShowPasswordModal(false);
        showNotification('Password updated successfully');
      } else {
        showNotification(result.message || 'Failed to update password', 'error');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      showNotification('Failed to update password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showNotification('Please enter your password to confirm account deletion', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          password: deletePassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showNotification('Account deleted successfully');
        setShowDeleteModal(false);
        setDeletePassword('');
        logout();
      } else {
        showNotification(result.message || 'Failed to delete account', 'error');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showNotification('Failed to delete account', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPasswordForm = () => {
    setShowPasswordModal(false);
    setPasswords({ current_password: '', new_password: '', confirm: '' });
  };

  const resetDeleteForm = () => {
    setShowDeleteModal(false);
    setDeletePassword('');
  };

  const PasswordActions = () => (
    <>
      <button
        onClick={resetPasswordForm}
        className="px-4 py-2 lg:w-1/2 h-10 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        disabled={isLoading}
      >
        Cancel
      </button>
      <button
        onClick={handlePasswordSubmit}
        className="px-4 py-2 lg:w-1/2 h-10 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {isLoading ? 'Updating...' : 'Update Password'}
      </button>
    </>
  );

  const DeleteActions = () => (
    <>
      <button
        onClick={resetDeleteForm}
        className="px-4 py-2 lg:w-1/2 h-10 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        disabled={isLoading}
      >
        Keep Account
      </button>
      <button
        onClick={handleDeleteAccount}
        className="px-4 py-2 lg:w-1/2 h-10 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {isLoading ? 'Deleting...' : 'Delete Forever'}
      </button>
    </>
  );

  const FormField = ({ label, name, type = 'text', icon: Icon, value, readOnly = false, placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {isEditing && !readOnly ? (
        <div className="relative">
          {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />}
          <input
            type={type}
            name={name}
            value={value}
            onChange={handleInputChange}
            className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            placeholder={placeholder}
          />
        </div>
      ) : (
        <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg">
          {Icon && <Icon className="h-4 w-4 text-gray-400 mr-2" />}
          <span className="text-gray-900">{value || 'Not set'}</span>
        </div>
      )}
    </div>
  );

  const Card = ({ title, subtitle, children, headerAction }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {headerAction}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-6 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className=" h-20 w-20 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full flex items-center justify-center text-xl font-bold text-white">
                {user?.profile_picture_url ? (
                  <img src={user.profile_picture_url} alt="Profile" className="w-full p-2 rounded-full object-cover" />
                ) : (
                  <span>{getInitials(user)}</span>
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 bg-white hover:bg-gray-50 text-gray-600 p-1.5 rounded-full shadow-lg border transition-colors">
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {user?.first_name || user?.last_name
                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                  : 'User'}
              </h2>
              <div className="flex items-center text-gray-500 text-sm mt-1">
                <MapPin className="w-3 h-3 mr-1" />
                <span>Joined since {new Date(user?.created_at || Date.now()).getFullYear()}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
            className="inline-flex min-w-40 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700
            transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Personal Information */}
      <Card title="Personal Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="First Name" name="first_name" value={formData.first_name} />
          <FormField label="Last Name" name="last_name" value={formData.last_name} />
          <FormField
            label="Email Address"
            name="email"
            type="email"
            icon={Mail}
            value={formData.email}
            readOnly={true}
          />
          <FormField label="Phone Number" name="phone" type="tel" icon={Phone} value={formData.phone} />
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </Card>

      {/* Security */}
      <Card title="Security">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-start justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Lock className="h-5 w-5 self-start text-gray-400 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Password</h4>
                <p className="text-sm text-gray-600">Update your account password</p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 w-full mt-3 md:mt-0 md:w-auto min-w-40 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Change Password
            </button>
          </div>
        </div>
      </Card>

      {/* Account Management */}
      <Card title="Account Management">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-start justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <Trash2 className="h-5 w-5 self-start text-red-600 mr-3" />
              <div>
                <h4 className="font-medium text-red-800">Delete Account</h4>
                <p className="text-sm text-red-600">
                  Permanently delete your account and all associated data
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 w-full mt-3 md:mt-0 min-w-40 md:w-auto py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </Card>

      {/* Password Change Modal */}
      <AlertModal
        isOpen={showPasswordModal}
        onClose={resetPasswordForm}
        type="info"
        title="Change Password"
        actions={<PasswordActions />}
        dismissible={!isLoading}
      >
        <div className="space-y-4">
          <div>
            <input
              type="password"
              name="current_password"
              value={passwords.current_password}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border !bg-gray-100 !border-transparent rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <input
              type="password"
              name="new_password"
              value={passwords.new_password}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border !bg-gray-100 !border-transparent rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <input
              type="password"
              name="confirm"
              value={passwords.confirm}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border !bg-gray-100 !border-transparent rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm new password"
            />
          </div>
        </div>
      </AlertModal>

      {/* Delete Account Modal */}
      <AlertModal
        isOpen={showDeleteModal}
        onClose={resetDeleteForm}
        type="error"
        title="Delete Account"
        actions={<DeleteActions />}
        dismissible={!isLoading}
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-100 rounded-lg border border-red-200">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-red-800">Warning: This action is irreversible</h3>
            </div>
            <p className="text-red-700 text-sm">
              This action cannot be undone. All your data, including invoices, clients, and templates, will be permanently deleted.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter <strong>DELETE</strong> to confirm account deletion
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full px-3 py-2 border !bg-gray-100 !border-transparent rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder=""
            />
          </div>
        </div>
      </AlertModal>
    </div>
  );
};

export default ProfileSection;