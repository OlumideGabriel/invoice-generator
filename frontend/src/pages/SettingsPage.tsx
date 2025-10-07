import React, { useState, useEffect } from 'react';
import { useSearchParams } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import BusinessSection from '../components/BusinessSection';
import ProfileSection from '../components/ProfileSection';
import MainMenu from '../components/MainMenu';
import Navbar from '../components/Navbar';
import TemplatesSection from '../components/TemplatesSection';
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
  BriefcaseBusiness,
  X
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

  useEffect(() => {
    const section = searchParams.get("section") || "profile";
    setActiveSection(section);
  }, [searchParams]);

  const sidebarItems = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'templates', label: 'Invoice Templates', icon: FileText },
    { id: 'business', label: 'Businesses', icon: BriefcaseBusiness },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const BusinessSectionWrapper = () => (
    <BusinessSection user={user} showNotification={showNotification} />
  );

  const BillingSection = () => (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Billing Information</h2>
            <p className="text-gray-500 text-sm mt-1">Manage your subscription and billing details</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 md:p-6 rounded-lg border border-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-1">Current Plan</h4>
                <p className="text-xl md:text-2xl font-bold text-teal-600">Free Plan</p>
                <p className="text-sm hidden text-gray-600 mt-1">5 invoices per month included</p>
              </div>
              <CreditCard className="h-8 w-8 md:h-12 md:w-12 text-teal-500" />
            </div>
            <div className="mt-4">
              <button className="px-4 py-3 bg-teal-600 hidden text-white rounded-md hover:bg-teal-500 transition-colors font-medium">
                Upgrade Plan
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg p-4 md:p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Billing History</h4>
            <div className="text-center py-6 md:py-8">
              <FileText className="h-8 w-8 md:h-12 md:w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No billing history available</p>
              <p className="text-sm text-gray-400">Your transaction history will appear here once you make a purchase</p>
            </div>
          </div>

          <div className="bg-white border border-gray-300 hidden rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h4>
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No payment method added</p>
              <button className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium">
                Add Payment Method
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    const sections = {
      profile: () => <ProfileSection showNotification={showNotification} />,
      templates: () => <TemplatesSection showNotification={showNotification} />,
      business: BusinessSectionWrapper,
      billing: BillingSection,
    };

    const Component = sections[activeSection] || sections.profile;
    return <Component />;
  };

  const Notification = ({ message, type }) => (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto z-50">
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
        <span className="text-sm font-medium flex-1">{message}</span>
        <button
          onClick={() => setNotification(null)}
          className="ml-3 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const getSectionTitle = (id) => {
    const item = sidebarItems.find((i) => i.id === id);
    return item ? item.label : "Profile Settings";
  };

  // Show loading state if user data is not yet available
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="md:block hidden sticky top-0 left-0 w-full z-30">
        <MainMenu showLogo={false} />
      </div>
      <div className="md:hidden block">
        <MainMenu />
      </div>

      <div className="">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-start gap-4 md:gap-6 items-center py-4 md:py-6">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center p-2 md:p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-gray-900">{getSectionTitle(activeSection)}</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 mb-20 md:mb-40 lg:px-8 py-6 md:py-8">
          <div className="rounded-xl py-3 mb-6">
            {/* Navigation Tabs - Horizontal Scrolling */}
            <div className="mb-6 md:mb-8">
              <div className="relative">
                {/* Mobile: Horizontal scrolling tabs */}
                <div className="md:hidden">
                  <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                    {sidebarItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSetSection(item.id)}
                          className={`flex-shrink-0 flex items-center px-4 py-3 rounded-full transition-colors text-sm font-medium whitespace-nowrap ${
                            isActive
                              ? 'bg-gray-900 text-white shadow-sm'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop: Horizontal scrolling tabs */}
                <div className="hidden md:block">
                  <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    {sidebarItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSetSection(item.id)}
                          className={`flex-shrink-0 flex items-center px-4 py-3 rounded-full transition-colors text-sm font-medium whitespace-nowrap ${
                            isActive
                              ? 'bg-gray-900 text-white shadow-sm'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="py-4 md:py-2 min-w-0">
              {renderActiveSection()}
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && <Notification {...notification} />}
      </div>
      <Navbar />
    </>
  );
};

export default SettingsPage;