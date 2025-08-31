import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Lock,
  Save,
  Camera,
  ArrowLeft,
  Edit2,
  Check,
  X,
  CreditCard,
  Trash2,
  FileText,
  Bell,
  Phone,
  MapPin,
  Settings,
  CheckCircle2,
  AlertCircle,
  BriefcaseBusiness
} from 'lucide-react';

const SettingsPage = () => {
  // Mock user data for demo
  const { user, updateProfile } = useAuth();

  const [activeSection, setActiveSection] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    country: user?.country || '',
    city: user?.city || '',
    postal_code: user?.postal_code || '',
    tax_id: user?.tax_id || ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'templates', label: 'Invoice Templates', icon: FileText },
    { id: 'business', label: 'Businesses', icon: BriefcaseBusiness },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'delete', label: 'Delete Account', icon: Trash2, danger: true }
  ];

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Helper for avatar initials
  const getInitials = (u) => {
    if (!u) return '';
    const first = u.first_name ? u.first_name[0].toUpperCase() : '';
    const last = u.last_name ? u.last_name[0].toUpperCase() : '';
    if (first || last) return `${first}${last}`;
    if (u.email) return u.email[0].toUpperCase();
    return 'U';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    showNotification('Profile updated successfully');
  };

  const handleCancelEdit = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      country: user?.country || '',
      city: user?.city || '',
      postal_code: user?.postal_code || '',
      tax_id: user?.tax_id || ''
    });
    setIsEditing(false);
  };

  const handlePasswordSubmit = () => {
    if (passwords.new !== passwords.confirm) {
      showNotification('New passwords do not match', 'error');
      return;
    }
    if (passwords.new.length < 6) {
      showNotification('Password must be at least 6 characters long', 'error');
      return;
    }

    setPasswords({ current: '', new: '', confirm: '' });
    setShowPasswordForm(false);
    showNotification('Password updated successfully');
  };

  // Render different sections based on activeSection
  const renderProfileSection = () => (
    <div className="space-y-8 mb-20">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">


        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl font-bold text-white">
                {user.profile_picture ? (
                  <img src={user.profile_picture} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <span className="text-xl font-bold">
                    {getInitials(user)}
                  </span>
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 bg-white hover:bg-gray-50 text-gray-600 p-1.5 rounded-full shadow-lg border transition-colors">
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {user.first_name || user.last_name
                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                  : 'User'}
              </h2>
              <p className="text-gray-600 text-sm">{formData.bio || 'Team Manager'}</p>
              <div className="flex items-center text-gray-500 text-sm mt-1">
                <MapPin className="w-3 h-3 mr-1" />
                <span>{formData.city || 'City'}, {formData.country || 'Country'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Personal Information Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
          <p className="text-sm text-gray-500 mt-1">Update your personal details and contact information</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{user.first_name || 'Not set'}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{user.last_name || 'Not set'}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              {isEditing ? (
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ) : (
                <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">{user.email}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              {isEditing ? (
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ) : (
                <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">{formData.phone || 'Not set'}</span>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{formData.bio || 'No bio added'}</div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Address Information Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
          <p className="text-sm text-gray-500 mt-1">Manage your address and tax details</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{formData.country || 'Not set'}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City/State</label>
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{formData.city || 'Not set'}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{formData.postal_code || 'Not set'}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{formData.tax_id || 'Not set'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Security</h3>
            <p className="text-sm text-gray-500 mt-1">Update your password and security settings</p>
          </div>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Lock className="w-4 h-4 mr-2" />
            Change Password
          </button>
        </div>

        {showPasswordForm && (
          <div className="p-6 border-t border-gray-200">
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  name="current"
                  value={passwords.current}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  name="new"
                  value={passwords.new}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  name="confirm"
                  value={passwords.confirm}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handlePasswordSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Password
                </button>
                <button
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswords({ current: '', new: '', confirm: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
          <p className="text-sm text-gray-500 mt-1">Choose how you want to be notified about updates</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-600">Receive email updates about invoices and payments</p>
              </div>
            </div>
            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Phone className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                <p className="text-sm text-gray-600">Get text messages for important updates</p>
              </div>
            </div>
            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTemplatesSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Invoice Templates</h3>
          <p className="text-sm text-gray-500 mt-1">Choose your preferred invoice template design</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="font-medium text-gray-900">Modern Template</h4>
              <p className="text-sm text-gray-600 mt-1">Clean and professional design</p>
              <button className="mt-3 px-3 py-1 bg-blue-600 text-white rounded text-sm">Current</button>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-gray-50 transition-colors">
              <FileText className="h-8 w-8 text-gray-400 mb-3" />
              <h4 className="font-medium text-gray-900">Classic Template</h4>
              <p className="text-sm text-gray-600 mt-1">Traditional business style</p>
              <button className="mt-3 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors">Select</button>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-gray-50 transition-colors">
              <FileText className="h-8 w-8 text-gray-400 mb-3" />
              <h4 className="font-medium text-gray-900">Minimal Template</h4>
              <p className="text-sm text-gray-600 mt-1">Simple and elegant</p>
              <button className="mt-3 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors">Select</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

const renderBusinessSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Businesses</h3>
          <p className="text-sm text-gray-500 mt-1">Choose your preferred invoice template design</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="font-medium text-gray-900">Modern Template</h4>
              <p className="text-sm text-gray-600 mt-1">Clean and professional design</p>
              <button className="mt-3 px-3 py-1 bg-blue-600 text-white rounded text-sm">Current</button>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-gray-50 transition-colors">
              <FileText className="h-8 w-8 text-gray-400 mb-3" />
              <h4 className="font-medium text-gray-900">Classic Template</h4>
              <p className="text-sm text-gray-600 mt-1">Traditional business style</p>
              <button className="mt-3 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors">Select</button>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-gray-50 transition-colors">
              <FileText className="h-8 w-8 text-gray-400 mb-3" />
              <h4 className="font-medium text-gray-900">Minimal Template</h4>
              <p className="text-sm text-gray-600 mt-1">Simple and elegant</p>
              <button className="mt-3 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors">Select</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBillingSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Billing Information</h3>
          <p className="text-sm text-gray-500 mt-1">Manage your subscription and billing details</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Current Plan</h4>
                <p className="text-2xl font-bold text-blue-600">Free Plan</p>
                <p className="text-sm text-gray-600 mt-1">5 invoices per month</p>
              </div>
              <CreditCard className="h-12 w-12 text-blue-500" />
            </div>
            <button className="hidden mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Upgrade Plan
            </button>
          </div>
          <div className="border rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4">Billing History</h4>
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No billing history available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeleteSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
          <p className="text-sm text-red-600 mt-1">Permanently delete your account and all associated data</p>
        </div>
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <AlertCircle className="h-8 w-8 text-red-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
              <p className="text-sm text-red-700 mb-4">
                This action cannot be undone. All your data, including invoices, clients, and templates, will be permanently deleted.
              </p>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'notifications':
        return renderNotificationsSection();
      case 'templates':
        return renderTemplatesSection();
      case 'business':
        return renderBusinessSection();
      case 'billing':
        return renderBillingSection();
      case 'delete':
        return renderDeleteSection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-start gap-6 items-center py-6">

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-3 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex items-center space-x-3">

              <div>
                <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
                <p className="mt-2 hidden text-gray-600">Manage your account preferences and settings</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sidebar">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Mobile Responsive (settings sidebar) */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="lg:bg-white lg:rounded-xl lg:shadow-sm lg:border border-slate-200 overflow-hidden">
              <div className="lg:p-4">
                <h2 className="text-sm hidden lg:flex font-medium text-gray-500 uppercase tracking-wider mb-4">Settings</h2>
                <nav className="flex flex-row lg:flex-col lg:space-y-1 h-9 lg:h-auto overflow-x-auto lg:overflow-y-auto
                lg:max-h-[calc(100vh-200px)] gap-2.5 lg:gap-0">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`
                          flex items-center px-4 lg:px-3 py-2.5 lg:rounded-lg rounded-full transition-colors text-sm
                          min-w-fit lg:w-full text-left
                          ${isActive
                            ? 'bg-gray-900 text-neutral-50 font-medium'
                            : item.danger
                              ? 'text-red-600 hover:bg-red-50 bg-red-50 lg:bg-transparent'
                              : 'text-gray-700 hover:bg-white bg-transparent border lg:border-none lg:bg-gray-200 lg:bg-transparent'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                        <span className="truncate whitespace-nowrap lg:whitespace-normal">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {renderActiveSection()}
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`flex items-center p-4 rounded-lg shadow-lg ${
            notification.type === 'success'
              ? 'bg-green-100 border border-green-200 text-green-800'
              : 'bg-red-100 border border-red-200 text-red-800'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 mr-3 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-3 text-red-600" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;