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
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import InvoicesPage from './pages/InvoicesPage';
import ClientsPage from './pages/ClientsPage';


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
            <Route path="/" element={<Dashboard />} />
            <Route path="/create-invoice" element={<InvoiceGenerator />} />
            <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>

    </div>
  );
};

export default App;
