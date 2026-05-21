import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BusinessSection from "../components/BusinessSection";
import ProfileSection from "../components/ProfileSection";
import MainMenu from "../components/MainMenu";
import Navbar from "../components/Navbar";
import TemplatesSection from "../components/TemplatesSection";
import IntegrationsSection from "../components/IntegrationsSection";
import PaymentSetup from "../components/PaymentSetup";
import BillingSection from "../components/BillingSection";

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
  X,
  Cog,
  Banknote,
} from "lucide-react";

const SettingsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionFromUrl = searchParams.get("section") || "profile";

  const [activeSection, setActiveSection] = useState<string>(sectionFromUrl);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Keep URL in sync with state
  const handleSetSection = (id: string) => {
    setActiveSection(id);
    setSearchParams({ section: id });
  };

  useEffect(() => {
    const section = searchParams.get("section") || "profile";
    setActiveSection(section);
  }, [searchParams]);

  const sidebarItems = [
    { id: "profile", label: "Profile Settings", icon: User },
    { id: "templates", label: "Invoice Templates", icon: FileText },
    { id: "business", label: "Businesses", icon: BriefcaseBusiness },
    { id: "billing", label: "Billing", icon: CreditCard }, // Changed from Banknote to CreditCard
    { id: "payments", label: "Payment Collection", icon: Banknote },
    { id: "integrations", label: "Manage Integrations", icon: Cog },
  ];

  const showNotification = (message: string, type: string = "success") => {
    const validType: "success" | "error" =
      type === "error" ? "error" : "success";
    setNotification({ message, type: validType });
    setTimeout(() => setNotification(null), 3000);
  };

  const BusinessSectionWrapper = () => (
    <BusinessSection
      user={{
        id: user!.id,
        first_name: user!.first_name ?? undefined,
        last_name: user!.last_name ?? undefined,
        email: user!.email,
        plan: user!.plan ?? undefined, // ← pass plan so Pro gating works
      }}
      showNotification={showNotification}
    />
  );

  const BillingSectionWrapper = () => (
    <BillingSection
      user={{
        id: user!.id,
        email: user!.email,
        plan: user!.plan ?? "free",
      }}
      showNotification={showNotification}
    />
  );

  const renderActiveSection = () => {
    const sections = {
      profile: () => <ProfileSection showNotification={showNotification} />,
      templates: () => <TemplatesSection showNotification={showNotification} />,
      business: BusinessSectionWrapper,
      billing: BillingSectionWrapper,
      payments: () => (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-300">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                Payment Collection
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Connect your bank account to receive payments from clients
                directly via Paystack.
              </p>
            </div>
            <PaymentSetup
              userId={user!.id}
              showNotification={showNotification}
            />
          </div>
        </div>
      ),
      integrations: () => (
        <IntegrationsSection showNotification={showNotification} />
      ),
    };

    const Component =
      sections[activeSection as keyof typeof sections] || sections.profile;
    return <Component />;
  };

  const Notification = ({
    message,
    type,
  }: {
    message: string;
    type: "success" | "error";
  }) => (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto z-50">
      <div
        className={`flex items-center p-4 rounded-lg shadow-lg ${
          type === "success"
            ? "bg-green-100 border border-green-200 text-green-800"
            : "bg-red-100 border border-red-200 text-red-800"
        }`}
      >
        {type === "success" ? (
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

  const getSectionTitle = (id: string) => {
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
                <h1 className="text-xl md:text-3xl font-bold text-gray-900">
                  {getSectionTitle(activeSection)}
                </h1>
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
                              ? "bg-gray-900 text-white shadow-sm"
                              : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
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
                              ? "bg-gray-900 text-white shadow-sm"
                              : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
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
            <div className="py-4 md:py-2 min-w-0">{renderActiveSection()}</div>
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
