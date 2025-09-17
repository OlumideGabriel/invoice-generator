import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import SideMenu from './components/SideMenu';
import { CurrencyProvider } from './context/CurrencyContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import InvoiceGenerator from './components/InvoiceGenerator';
import PartyField from './components/PartyField';
import MainMenu from './components/MainMenu';
import Footer from './components/Footer';
import useInvoice from './hooks/useInvoice';
import AuthPage from './pages/AuthPage';
import AuthModal from './components/AuthModal';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/SettingsPage';
import InvoicesPage from './pages/InvoicesPage';
import ClientsPage from './pages/ClientsPage';
import Home from './pages/Home';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import SupportForm from './pages/SupportForm';
import ComingSoon from './pages/ComingSoon';


const App: React.FC = () => {
  const invoice = useInvoice();
  return (
    <CurrencyProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </CurrencyProvider>
  );
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';
  const isHomePage = location.pathname === '/';
  const { user, loading, authModalOpen, authModalMode, closeAuthModal } = useAuth();

  if (loading) return null;

  // If user is logged in and tries to access auth page, redirect to home
  if (isAuthPage && user) {
    return <Navigate to="/new" replace />;
  }

  // If user is logged in and tries to access home page, redirect to dashboard
  if (isHomePage && user) {
    return <Navigate to="/new" replace />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Show AuthModal if it's open */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        initialMode={authModalMode}
      />

      {/* Show MainMenu unless we're on the auth page or home page when logged out */}
      {!isAuthPage && (!isHomePage || user) && <MainMenu />}

      <div className="flex flex-row flex-1 main-content min-h-0">
        {/* Show SideMenu unless we're on the auth page OR home page when logged out */}
        {!isAuthPage && (!isHomePage || user) && <SideMenu />}

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            {/* Auth page route - only accessible when not logged in */}
            <Route
              path="/auth"
              element={!user ? <AuthPage /> : <Navigate to="/" replace />}
            />

            {/* Home page - only accessible when not logged in */}
            <Route
              path="/"
              element={!user ? <Home /> : <Navigate to="/" replace />}
            />

            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/auth/callback" element={<ProtectedRoute><AuthCallback /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
            <Route path="/clients/new" element={<ClientsPage />} />
            <Route path="/clients/edit/:id" element={<ClientsPage />} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />


            {/* Public routes */}
            <Route path="/new" element={<InvoiceGenerator />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;