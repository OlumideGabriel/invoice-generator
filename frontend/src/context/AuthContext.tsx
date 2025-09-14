// context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface User {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  google_id: string | null;
  profile_picture_url: string | null;
  auth_provider: string | null;
  auth_method: string;
  is_guest: boolean;
  email_verified: boolean;
  data: any;
  created_at: string | null;
  updated_at: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<boolean>;
  signinNative: (user: User) => void;
  updateProfile: (updates: Partial<User>) => void;
  authModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => false,
  signinNative: () => {},
  updateProfile: () => {},
  authModalOpen: false,
  authModalMode: 'login',
  openAuthModal: () => {},
  closeAuthModal: () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Fetch full user profile from your Flask backend
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      const result = await response.json();

      if (result.success) {
        return result.user;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Check Supabase session
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          // Fetch full user profile from your backend
          const userProfile = await fetchUserProfile(data.session.user.id);
          if (userProfile) {
            setUser(userProfile);
          } else {
            // Fallback to basic Supabase user data
            setUser({
              id: data.session.user.id,
              user_id: data.session.user.id,
              email: data.session.user.email || '',
              first_name: null,
              last_name: null,
              google_id: null,
              profile_picture_url: null,
              auth_provider: 'supabase',
              auth_method: 'google',
              is_guest: false,
              email_verified: data.session.user.email_confirmed_at !== null,
              data: {},
              created_at: null,
              updated_at: null
            });
          }
          setLoading(false);
          return;
        }

        // 2. Check localStorage for native login
        const storedUser = localStorage.getItem("nativeUser");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
        }

        setLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initAuth();

    // Supabase auth listener
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        // Fetch full user profile when auth state changes
        const userProfile = await fetchUserProfile(session.user.id);
        if (userProfile) {
          setUser(userProfile);
        } else {
          setUser({
            id: session.user.id,
            user_id: session.user.id,
            email: session.user.email || '',
            first_name: null,
            last_name: null,
            google_id: null,
            profile_picture_url: null,
            auth_provider: 'supabase',
            auth_method: 'google',
            is_guest: false,
            email_verified: session.user.email_confirmed_at !== null,
            data: {},
            created_at: null,
            updated_at: null
          });
        }
      } else {
        const nativeUser = localStorage.getItem("nativeUser");
        if (nativeUser) {
          const parsed = JSON.parse(nativeUser);
          setUser(parsed);
        } else {
          setUser(null);
        }
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Refresh user data from backend
  const refreshUser = async () => {
    if (!user) return;

    try {
      const userProfile = await fetchUserProfile(user.id);
      if (userProfile) {
        setUser(userProfile);
        // Also update localStorage for native users
        if (user.auth_provider === 'email') {
          localStorage.setItem("nativeUser", JSON.stringify(userProfile));
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  // Native login (Flask backend)
  const signinNative = (userData: User) => {
    localStorage.setItem("nativeUser", JSON.stringify(userData));
    setUser(userData);
    closeAuthModal();
  };

  // Update user profile locally and in storage
  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);

    // Update localStorage for native users
    if (user.auth_provider === 'email') {
      localStorage.setItem("nativeUser", JSON.stringify(updatedUser));
    }
  };

  const logout = async () => {
    try {
      // First, clear the user state and local storage
      setUser(null);
      localStorage.removeItem("nativeUser");

      // Then sign out from Supabase (if they were using Supabase auth)
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear any remaining session data
      window.localStorage.removeItem('sb-auth-token');
      window.localStorage.removeItem('sb-user-data');

      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  };

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <Ctx.Provider value={{
      user,
      loading,
      logout,
      signinNative,
      updateProfile,
      authModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal,
      refreshUser
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);