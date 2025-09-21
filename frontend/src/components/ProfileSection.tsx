import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AlertModal from '../components/AlertModal';
import {
  User,
  Mail,
  Lock,
  Bell,
  Save,
  Camera,
  Edit2,
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [formData, setFormData] = useState({
    first_name: '',
    email: ''
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
        email: user.email || ''
      });
    }
  }, [user]);

  const getInitials = (u) => {
    if (!u) return 'U';
    return u.first_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || 'U';
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
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          first_name: formData.first_name
        }),
      });

      const result = await response.json();

      if (result.success) {
        updateProfile({
          first_name: formData.first_name
        });
        setIsEditing(false);
        showNotification('Profile updated successfully');
        await refreshUser();
      } else {
        showNotification(result.error || 'Failed to update profile', 'error');
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
        email: user.email || ''
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
      const response = await fetch('/api/users/password', {
        method: 'PUT',
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
        showNotification(result.error || 'Failed to update password', 'error');
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
      const response = await fetch('/api/users/delete', {
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
        showNotification(result.error || 'Failed to delete account', 'error');
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
        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        disabled={isLoading}
      >
        Cancel
      </button>
      <button
        onClick={handlePasswordSubmit}
        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        disabled={isLoading}
      >
        Keep Account
      </button>
      <button
        onClick={handleDeleteAccount}
        className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {isLoading ? 'Deleting...' : 'Delete Forever'}
      </button>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Profile Information */}
      <div className="bg-white rounded-xl p-8 border border-gray-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Profile</h2>
          {isEditing ? (
            <div className="flex space-x-3">
              <button
                onClick={handleSaveProfile}
                className="px-4 py-3 text-white min-w-32 bg-teal-600 rounded-md hover:bg-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-3 text-white min-w-32  bg-teal-600 rounded-md hover:bg-teal-500 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        <div className="flex items-start space-x-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-300 to-green-400 rounded-full flex items-center justify-center text-2xl font-bold text-gray-800">
              {user?.profile_picture_url ? (
                <img src={user.profile_picture_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span>{getInitials(user)}</span>
              )}
            </div>
            <button className="absolute -top-1 -right-1 w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
              <Camera className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                onClick={() => !isEditing && setIsEditing(true)}
                className={`px-4 py-3 w-full input max-w-md bg-gray-100 rounded-xl border-0 text-gray-900 transition-colors ${
                  isEditing
                    ? 'bg-white border border-gray-300 focus:ring-2 focus:ring-teal-500 cursor-text'
                    : 'bg-gray-100 cursor-pointer hover:bg-gray-200'
                }`}
                placeholder="Enter your name"
                readOnly={!isEditing}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl p-8 border border-gray-300">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Notifications</h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
              <p className="text-gray-500 text-sm mt-1">Receive email updates about invoices and payments.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={notificationsEnabled}
              onChange={() => setNotificationsEnabled(!notificationsEnabled)}
            />
            <div className={`w-12 h-6 rounded-full peer ${notificationsEnabled ? 'bg-teal-500' : 'bg-gray-300'} peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
          </label>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-xl p-8 border border-gray-300">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Security</h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Password</h3>
              <p className="text-gray-500 text-sm mt-1">Change your password to keep your account secure.</p>
            </div>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-3 text-blue-600 border-2 border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Delete Account */}
      <div className="bg-red-50 rounded-xl p-8 border border-red-300">
        <h2 className="text-2xl font-semibold text-red-900 mb-4">Delete account</h2>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-red-800 flex-1">Once you delete your account, there is no going back. Please be certain.</p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-3 border-2 border-red-500 text-white whitespace-nowrap rounded-md bg-red-600 hover:bg-red-500 transition-colors text-md font-medium"
          >
            Delete account
          </button>
        </div>
      </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
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
              Enter your password to confirm account deletion
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full px-3 py-2 border !bg-gray-100 !border-transparent rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>
        </div>
      </AlertModal>
    </div>
  );
};

export default ProfileSection;