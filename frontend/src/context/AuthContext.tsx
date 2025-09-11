// context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: any;
  loading: boolean;
  logout: () => Promise<boolean>;
  signinNative: (user: any) => void;
  authModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
}

const Ctx = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => false,
  signinNative: () => {},
  authModalOpen: false,
  authModalMode: 'login',
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const initAuth = async () => {
      // 1. Check Supabase session
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser({
          ...data.session.user,
          id: data.session.user.id,
          user_id: data.session.user.id,
        });
        setLoading(false);
        return;
      }

      // 2. Check localStorage for native login
      const storedUser = localStorage.getItem("nativeUser");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser({
          ...parsed,
          id: parsed.id,
          user_id: parsed.id,
        });
      }

      setLoading(false);
    };

    initAuth();

    // Supabase auth listener
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setUser({
          ...session.user,
          id: session.user.id,
          user_id: session.user.id,
        });
      } else {
        const nativeUser = localStorage.getItem("nativeUser");
        if (nativeUser) {
          const parsed = JSON.parse(nativeUser);
          setUser({
            ...parsed,
            id: parsed.id,
            user_id: parsed.id,
          });
        } else {
          setUser(null);
        }
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Native login (Flask backend)
  const signinNative = (user: any) => {
    localStorage.setItem("nativeUser", JSON.stringify(user));
    setUser(user);
    closeAuthModal(); // Close modal after successful login
  };

  const logout = async () => {
    try {
      // First, clear the user state and local storage
      setUser(null);
      localStorage.removeItem("nativeUser");

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear any remaining session data
      window.localStorage.removeItem('sb-auth-token');
      window.localStorage.removeItem('sb-user-data');

      return true; // Indicate success
    } catch (error) {
      console.error('Error during logout:', error);
      return false; // Indicate failure
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
      authModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);