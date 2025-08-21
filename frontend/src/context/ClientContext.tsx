import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config/api';

interface Client {
  id: string;
  name: string;
  email?: string;
  address?: string;
  phone?: string;
  company?: string;
  created_at?: string;
  updated_at?: string;
}

interface ClientContextType {
  clients: Client[];
  loading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  createClient: (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateClient: (id: string, clientData: Partial<Client>) => Promise<boolean>;
  deleteClient: (id: string) => Promise<boolean>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const useClient = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};

interface ClientProviderProps {
  children: ReactNode;
}

export const ClientProvider: React.FC<ClientProviderProps> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchClients = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}api/clients?user_id=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setClients(data.clients || []);
      } else {
        setError(data.error || 'Failed to fetch clients');
      }
    } catch (err) {
      setError('Failed to fetch clients');
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const response = await fetch(`${API_BASE_URL}api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...clientData,
          user_id: user.id
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchClients(); // Refresh the list
        return true;
      } else {
        setError(data.error || 'Failed to create client');
        return false;
      }
    } catch (err) {
      setError('Failed to create client');
      console.error('Error creating client:', err);
      return false;
    }
  };

  const updateClient = async (id: string, clientData: Partial<Client>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchClients(); // Refresh the list
        return true;
      } else {
        setError(data.error || 'Failed to update client');
        return false;
      }
    } catch (err) {
      setError('Failed to update client');
      console.error('Error updating client:', err);
      return false;
    }
  };

  const deleteClient = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}api/clients/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchClients(); // Refresh the list
        return true;
      } else {
        setError(data.error || 'Failed to delete client');
        return false;
      }
    } catch (err) {
      setError('Failed to delete client');
      console.error('Error deleting client:', err);
      return false;
    }
  };

  // Fetch clients when user changes
  useEffect(() => {
    if (user?.id) {
      fetchClients();
    } else {
      setClients([]);
    }
  }, [user?.id]);

  const value: ClientContextType = {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
};
