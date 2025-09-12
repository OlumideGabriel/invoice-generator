import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import SideMenu from './components/SideMenu';
import { CurrencyProvider } from './context/CurrencyContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import InvoiceGenerator from './components/InvoiceGenerator';
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
  const isHomePage = location.pathname === '/home';
  const { user, loading, authModalOpen, authModalMode, closeAuthModal } = useAuth();

  if (loading) return null;

  // Redirects
  if (isAuthPage && user) return <Navigate to="/" replace />;
  if (isHomePage && user) return <Navigate to="/" replace />;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Auth modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        initialMode={authModalMode}
      />

      {/* MainMenu (top) */}
      {!isAuthPage && (!isHomePage || user) && <MainMenu />}

      {/* Main content row */}
      <div className="flex flex-row flex-1 min-h-0">
        {!isAuthPage && (!isHomePage || user) && <SideMenu />}

        <main className="flex-1 overflow-y-auto min-h-0">
          <Routes>
            {/* Auth routes */}
            <Route
              path="/auth"
              element={!user ? <AuthPage /> : <Navigate to="/" replace />}
            />
            <Route
              path="/home"
              element={!user ? <Home /> : <Navigate to="/" replace />}
            />

            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/auth/callback" element={<ProtectedRoute><AuthCallback /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />

            {/* Public routes */}
            <Route path="/" element={<InvoiceGenerator />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          </Routes>
        </main>
      </div>

      {/* Footer (always sticks at the bottom of layout, not inside <main>) */}
      {!isAuthPage && (!isHomePage || user) && <Footer />}
    </div>
  );
};

export default App;
