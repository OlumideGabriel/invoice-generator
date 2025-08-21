import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config/api';

interface Business {
  id: string;
  name: string;
  email?: string;
  address?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  tax_id?: string;
  payment_info?: string;
  created_at?: string;
  updated_at?: string;
}

interface BusinessContextType {
  businesses: Business[];
  loading: boolean;
  error: string | null;
  fetchBusinesses: () => Promise<void>;
  createBusiness: (businessData: Omit<Business, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateBusiness: (id: string, businessData: Partial<Business>) => Promise<boolean>;
  deleteBusiness: (id: string) => Promise<boolean>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};

interface BusinessProviderProps {
  children: ReactNode;
}

export const BusinessProvider: React.FC<BusinessProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinesses = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}api/businesses?user_id=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setBusinesses(data.businesses || []);
      } else {
        setError(data.error || 'Failed to fetch businesses');
      }
    } catch (err) {
      setError('Failed to fetch businesses');
      console.error('Error fetching businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  const createBusiness = async (businessData: Omit<Business, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}api/businesses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...businessData,
          user_id: user.id,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchBusinesses(); // Refresh the list
        return true;
      } else {
        setError(data.error || 'Failed to create business');
        return false;
      }
    } catch (err) {
      setError('Failed to create business');
      console.error('Error creating business:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateBusiness = async (id: string, businessData: Partial<Business>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}api/businesses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchBusinesses(); // Refresh the list
        return true;
      } else {
        setError(data.error || 'Failed to update business');
        return false;
      }
    } catch (err) {
      setError('Failed to update business');
      console.error('Error updating business:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteBusiness = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}api/businesses/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchBusinesses(); // Refresh the list
        return true;
      } else {
        setError(data.error || 'Failed to delete business');
        return false;
      }
    } catch (err) {
      setError('Failed to delete business');
      console.error('Error deleting business:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchBusinesses();
    }
  }, [user?.id]);

  const value: BusinessContextType = {
    businesses,
    loading,
    error,
    fetchBusinesses,
    createBusiness,
    updateBusiness,
    deleteBusiness,
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};
