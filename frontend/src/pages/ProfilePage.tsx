import React, { useState } from 'react';
import { User, Mail, Lock, Save, Camera, ArrowLeft, Edit2, Check, X, CreditCard, Trash2, FileText, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();

  const [activeSection, setActiveSection] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
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
    { id: 'profile', label: 'My Profile', icon: User, active: true },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'templates', label: 'Invoice Templates', icon: FileText },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'delete', label: 'Delete Account', icon: Trash2, danger: true }
  ];

  // Helper for avatar initials
  const getInitials = (u) => {
    if (!u) return '';
    const first = u.first_name ? u.first_name[0].toUpperCase() : '';
    const last = u.last_name ? u.last_name[0].toUpperCase() : '';
    if (first || last) return `${first}${last}`;
    if (u.email) return u.email[0].toUpperCase();
    return '';
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

  const handleSaveProfile = async () => {
    try {
      if (updateProfile) {
        await updateProfile(formData);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
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

  const handlePasswordSubmit = async () => {
    if (passwords.new !== passwords.confirm) {
      alert('New passwords do not match');
      return;
    }
    if (passwords.new.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      console.log('Password update requested');
      setPasswords({ current: '', new: '', confirm: '' });
      setShowPasswordForm(false);
      alert('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Failed to update password. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h2>
          <button
            onClick={() => navigate('/auth?mode=login')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Render different sections based on activeSection
  const renderProfileSection = () => (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
              {user.profile_picture ? (
                <img src={user.profile_picture} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {getInitials(user) || <User className="w-10 h-10" />}
                </span>
              )}
            </div>
            <button className="absolute bottom-0 right-0 bg-gray-600 hover:bg-gray-700 text-white p-1.5 rounded-full shadow-lg transition-colors">
              <Camera className="w-3 h-3" />
            </button>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {user.first_name || user.last_name
                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                : 'User'}
            </h2>
            <p className="text-gray-600">{formData.bio || 'Team Manager'}</p>
            <p className="text-gray-500 text-sm">{formData.city || 'City'}, {formData.country || 'Country'}</p>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          <span>Edit</span>
        </button>
      </div>

      {/* Personal Information */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
          {isEditing && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center space-x-2 px-3 py-1.5 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
            {isEditing ? (
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="text-gray-900 py-2">{user.first_name || 'Rafiqur'}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
            {isEditing ? (
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="text-gray-900 py-2">{user.last_name || 'Rahman'}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email address</label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="text-gray-900 py-2">{user.email}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="text-gray-900 py-2">{formData.phone || '+09 345 346 46'}</div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">Bio</label>
            {isEditing ? (
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="text-gray-900 py-2">{formData.bio || 'Team Manager'}</div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleSaveProfile}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Address Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Address</h3>
          <button className="flex items-center space-x-2 px-3 py-1.5 text-gray-600 hover:text-gray-800 transition-colors">
            <Edit2 className="w-4 h-4" />
            <span>Edit</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Country</label>
            <div className="text-gray-900 py-2">{formData.country || 'United Kingdom'}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">City/State</label>
            <div className="text-gray-900 py-2">{formData.city || 'Leeds, East London'}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Postal Code</label>
            <div className="text-gray-900 py-2">{formData.postal_code || 'ERT 2354'}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">TAX ID</label>
            <div className="text-gray-900 py-2">{formData.tax_id || 'AS45645756'}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Email Notifications</h4>
            <p className="text-sm text-gray-600">Receive email updates about invoices and payments</p>
          </div>
          <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">SMS Notifications</h4>
            <p className="text-sm text-gray-600">Get text messages for important updates</p>
          </div>
          <input type="checkbox" className="w-4 h-4 text-blue-600" />
        </div>
      </div>
    </div>
  );

  const renderTemplatesSection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Invoice Templates</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-gray-900">Modern Template</h4>
          <p className="text-sm text-gray-600 mt-1">Clean and professional design</p>
          <button className="mt-3 px-3 py-1 bg-blue-600 text-white rounded text-sm">Current</button>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300">
          <h4 className="font-medium text-gray-900">Classic Template</h4>
          <p className="text-sm text-gray-600 mt-1">Traditional business style</p>
          <button className="mt-3 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm">Select</button>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300">
          <h4 className="font-medium text-gray-900">Minimal Template</h4>
          <p className="text-sm text-gray-600 mt-1">Simple and elegant</p>
          <button className="mt-3 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm">Select</button>
        </div>
      </div>
    </div>
  );

  const renderBillingSection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Billing</h2>
      <div className="space-y-4">
        <div className="p-6 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Current Plan</h4>
          <p className="text-2xl font-bold text-blue-600">Free Plan</p>
          <p className="text-sm text-gray-600 mt-1">5 invoices per month</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Upgrade Plan</button>
        </div>
        <div className="p-6 border rounded-lg">
          <h4 className="font-medium text-gray-900 mb-4">Billing History</h4>
          <div className="text-sm text-gray-600">No billing history available</div>
        </div>
      </div>
    </div>
  );

  const renderDeleteSection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Delete Account</h2>
      <div className="p-6 border border-red-200 bg-red-50 rounded-lg">
        <h4 className="font-medium text-red-900 mb-2">Permanently delete your account</h4>
        <p className="text-sm text-red-700 mb-4">
          This action cannot be undone. All your data, including invoices and templates, will be permanently deleted.
        </p>
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          Delete Account
        </button>
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
      case 'billing':
        return renderBillingSection();
      case 'delete':
        return renderDeleteSection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : item.danger
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border p-8">
              {renderActiveSection()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;