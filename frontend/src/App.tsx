import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SideMenu from './components/SideMenu';
import { CurrencyProvider } from './context/CurrencyContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import InvoiceGenerator from './components/InvoiceGenerator';
import PartyField from './components/PartyField';
import MainMenu from './components/MainMenu';
import Footer from './components/Footer';
import useInvoice from './hooks/useInvoice';
import AuthPage from './pages/AuthPage';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/SettingsPage';
import InvoicesPage from './pages/InvoicesPage';
import ClientsPage from './pages/ClientsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsOfServicePage from './pages/TermsOfServicePage'


function Clients() {
  return <div className="p-6">Clients Page</div>;
}

function Settings() {
  return <div className="p-6">Settings Page</div>;
}

import { useLocation } from 'react-router-dom';

const App: React.FC = () => {
  const invoice = useInvoice();
  return (
    <CurrencyProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </CurrencyProvider>
  );
};

import { useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';
  const { user, loading } = useAuth();

  if (loading) return null;

  if (isAuthPage) {
    // If user is logged in, redirect away from /auth
    if (user) return <Navigate to="/" replace />;
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <MainMenu />
      <div className="flex flex-row flex-1 main-content min-h-0">
        <SideMenu />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/Dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/" element={<InvoiceGenerator />} />
            <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          </Routes>
        </main>
      </div>

    </div>
  );
};

export default App;
