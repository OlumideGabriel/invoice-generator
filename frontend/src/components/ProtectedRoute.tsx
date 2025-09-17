import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, openAuthModal } = useAuth();

  if (loading) return null; // Or a spinner/loading indicator

  if (!user) {
    openAuthModal('login');
    return <Navigate to="/new" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;