import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import BusinessSection from '../components/BusinessSection'; // Renamed import
import {
  User,
  Mail,
  Lock,
  Save,
  Camera,
  ArrowLeft,
  Edit2,
  CreditCard,
  Trash2,
  FileText,
  Bell,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  BriefcaseBusiness
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

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

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const BusinessSectionWrapper = () => (
    <BusinessSection user={user} showNotification={showNotification} />
  );

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

  const resetPasswordForm = () => {
    setShowPasswordForm(false);
    setPasswords({ current: '', new: '', confirm: '' });
  };

  const FormField = ({ label, name, type = 'text', icon: Icon, value, readOnly = false, placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {isEditing && !readOnly ? (
        <div className="relative">
          {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />}
          {type === 'textarea' ? (
            <textarea
              name={name}
              value={value}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={placeholder}
            />
          ) : (
            <input
              type={type}
              name={name}
              value={value}
              onChange={handleInputChange}
              className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder={placeholder}
            />
          )}
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

  const ProfileSection = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl font-bold text-white">
                {user.profile_picture ? (
                  <img src={user.profile_picture} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <span>{getInitials(user)}</span>
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

      {/* Personal Information */}
      <Card title="Personal Information" subtitle="Update your personal details and contact information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="First Name" name="first_name" value={formData.first_name} />
          <FormField label="Last Name" name="last_name" value={formData.last_name} />
          <FormField label="Email Address" name="email" type="email" icon={Mail} value={formData.email} />
          <FormField label="Phone Number" name="phone" type="tel" icon={Phone} value={formData.phone} />
          <div className="md:col-span-2">
            <FormField
              label="Bio"
              name="bio"
              type="textarea"
              value={formData.bio}
              placeholder="Tell us about yourself..."
            />
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
      </Card>

      {/* Address Information */}
      <Card title="Address Information" subtitle="Manage your address and tax details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Country" name="country" value={formData.country} readOnly />
          <FormField label="City/State" name="city" value={formData.city} readOnly />
          <FormField label="Postal Code" name="postal_code" value={formData.postal_code} readOnly />
          <FormField label="Tax ID" name="tax_id" value={formData.tax_id} readOnly />
        </div>
      </Card>

      {/* Security */}
      <Card
        title="Security"
        subtitle="Update your password and security settings"
        headerAction={
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Lock className="w-4 h-4 mr-2" />
            Change Password
          </button>
        }
      >
        {showPasswordForm && (
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
                onClick={resetPasswordForm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  const NotificationToggle = ({ icon: Icon, title, description, defaultChecked = false }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center">
        <Icon className="h-5 w-5 text-gray-400 mr-3" />
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <input
        type="checkbox"
        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        defaultChecked={defaultChecked}
      />
    </div>
  );

  const NotificationsSection = () => (
    <Card title="Notification Preferences" subtitle="Choose how you want to be notified about updates">
      <div className="space-y-4">
        <NotificationToggle
          icon={Mail}
          title="Email Notifications"
          description="Receive email updates about invoices and payments"
          defaultChecked={true}
        />
        <NotificationToggle
          icon={Phone}
          title="SMS Notifications"
          description="Get text messages for important updates"
        />
      </div>
    </Card>
  );

  const TemplateCard = ({ title, description, isActive = false, onSelect }) => (
    <div className={`p-4 border-2 rounded-lg transition-colors ${
      isActive
        ? 'border-blue-200 bg-blue-50'
        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
    }`}>
      <FileText className={`h-8 w-8 mb-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
      <h4 className="font-medium text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
      <button
        onClick={onSelect}
        className={`mt-3 px-3 py-1 rounded text-sm transition-colors ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {isActive ? 'Current' : 'Select'}
      </button>
    </div>
  );

  const TemplatesSection = () => (
    <Card title="Invoice Templates" subtitle="Choose your preferred invoice template design">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <TemplateCard
          title="Modern Template"
          description="Clean and professional design"
          isActive={true}
          onSelect={() => showNotification('Template updated')}
        />
        <TemplateCard
          title="Classic Template"
          description="Traditional business style"
          onSelect={() => showNotification('Template updated')}
        />
        <TemplateCard
          title="Minimal Template"
          description="Simple and elegant"
          onSelect={() => showNotification('Template updated')}
        />
      </div>
    </Card>
  );

  const BillingSection = () => (
    <Card title="Billing Information" subtitle="Manage your subscription and billing details">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Current Plan</h4>
              <p className="text-2xl font-bold text-blue-600">Free Plan</p>
              <p className="text-sm text-gray-600 mt-1">5 invoices per month</p>
            </div>
            <CreditCard className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Billing History</h4>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No billing history available</p>
          </div>
        </div>
      </div>
    </Card>
  );

  const DeleteSection = () => (
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
  );

  const renderActiveSection = () => {
    const sections = {
      profile: ProfileSection,
      notifications: NotificationsSection,
      templates: TemplatesSection,
      business: BusinessSectionWrapper, // Use the wrapper
      billing: BillingSection,
      delete: DeleteSection
    };

    const Component = sections[activeSection] || ProfileSection;
    return <Component />;
  };

  const Notification = ({ message, type }) => (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center p-4 rounded-lg shadow-lg ${
        type === 'success'
          ? 'bg-green-100 border border-green-200 text-green-800'
          : 'bg-red-100 border border-red-200 text-red-800'
      }`}>
        {type === 'success' ? (
          <CheckCircle2 className="h-5 w-5 mr-3 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 mr-3 text-red-600" />
        )}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );

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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-8">
          {/* Navigation Tabs */}
          <div className="w-full">
            <div className="rounded-xl py-3 mb-6">
              <nav className="flex flex-row h-9 overflow-x-auto gap-2.5">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`flex items-center px-4 py-2.5 rounded-full text-sm min-w-fit ${
                        isActive
                          ? 'bg-gray-900 text-neutral-50 font-medium'
                          : item.danger
                            ? 'text-red-600 hover:bg-red-50 bg-red-50'
                            : 'text-gray-700 hover:bg-white bg-transparent border'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                      <span className="truncate whitespace-nowrap">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {renderActiveSection()}
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && <Notification {...notification} />}
    </div>
  );
};

export default SettingsPage;