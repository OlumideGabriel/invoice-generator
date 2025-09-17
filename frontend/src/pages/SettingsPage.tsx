import React, { useState, useEffect } from 'react';
import { useSearchParams } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import BusinessSection from '../components/BusinessSection';
import ProfileSection from '../components/ProfileSection';
import {
  User,
  Mail,
  ArrowLeft,
  CreditCard,
  Trash2,
  FileText,
  Bell,
  Phone,
  CheckCircle2,
  AlertCircle,
  BriefcaseBusiness
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionFromUrl = searchParams.get("section") || "profile";

  const [activeSection, setActiveSection] = useState(sectionFromUrl);
  const [notification, setNotification] = useState(null);

  // Keep URL in sync with state
  const handleSetSection = (id) => {
    setActiveSection(id);
    setSearchParams({ section: id });
  };

  // Sync activeSection with URL changes
  useEffect(() => {
    const section = searchParams.get("section") || "profile";
    if (section !== activeSection) {
      setActiveSection(section);
    }
  }, [searchParams, activeSection]);

  const sidebarItems = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'templates', label: 'Invoice Templates', icon: FileText },
    { id: 'business', label: 'Businesses', icon: BriefcaseBusiness },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

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
    <div className={`p-4 border-2 rounded-lg transition-colors cursor-pointer ${
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

  const BusinessSectionWrapper = () => (
    <BusinessSection user={user} showNotification={showNotification} />
  );

  const BillingSection = () => (
    <Card title="Billing Information" subtitle="Manage your subscription and billing details">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Current Plan</h4>
              <p className="text-2xl font-bold text-blue-600">Free Plan</p>
              <p className="text-sm hidden text-gray-600 mt-1">5 invoices per month</p>
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


  const renderActiveSection = () => {
    const sections = {
      profile: () => <ProfileSection showNotification={showNotification} />,
      notifications: NotificationsSection,
      templates: TemplatesSection,
      business: BusinessSectionWrapper,
      billing: BillingSection,
    };

    const Component = sections[activeSection] || sections.profile;
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

  // Show loading state if user data is not yet available
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-8">
          {/* Navigation Tabs */}
          <div className="w-full">
            <div className="rounded-xl py-3 ">
              <nav className="flex flex-row  overflow-x-auto gap-2.5">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSetSection(item.id)}
                      className={`flex items-center px-4 py-2 rounded-full text-sm min-w-fit transition-colors ${
                        isActive
                          ? "bg-gray-900 text-neutral-50 font-medium"
                          : item.danger
                            ? "text-red-600 hover:bg-red-50 bg-red-50 border border-red-600"
                            : "text-gray-700 bg-transparent border border-gray-400 font-medium"
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