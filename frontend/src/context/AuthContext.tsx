// context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: any;
  loading: boolean;
  logout: () => Promise<void>;
  signinNative: (userOrEmail: any, password?: string) => Promise<void>;
  syncGoogleUserWithBackend: (supabaseUser: any) => Promise<void>;
}

const Ctx = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  signinNative: async () => {},
  syncGoogleUserWithBackend: async () => {},
});

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // 1. Check Supabase session
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        // Check if this is a Google OAuth user that needs backend sync
        await handleSupabaseUser(data.session.user);
        setLoading(false);
        return;
      }

      // 2. Check localStorage for native login
      const storedUser = localStorage.getItem("nativeUser");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser({
          ...parsed,
          user_id: parsed.id, // Use 'id' field consistently
        });
      }

      setLoading(false);
    };

    initAuth();

    // Supabase auth listener
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await handleSupabaseUser(session.user);
      } else {
        const nativeUser = localStorage.getItem("nativeUser");
        if (nativeUser) {
          const parsed = JSON.parse(nativeUser);
          setUser({
            ...parsed,
            user_id: parsed.id,
          });
        } else {
          setUser(null);
        }
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Handle Supabase user (including Google OAuth)
  const handleSupabaseUser = async (supabaseUser: any) => {
    try {
      // Try to sync with backend
      await syncGoogleUserWithBackend(supabaseUser);
    } catch (error) {
      console.error("Error syncing user with backend:", error);
      // Still set the Supabase user even if backend sync fails, but with minimal data
      setUser({
        id: supabaseUser.id,
        user_id: supabaseUser.id,
        email: supabaseUser.email,
        first_name: supabaseUser.user_metadata?.first_name || supabaseUser.user_metadata?.full_name?.split(' ')[0] || '',
        last_name: supabaseUser.user_metadata?.last_name || supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        auth_method: 'google',
        backend_synced: false // Flag to indicate backend sync failed
      });
    }
  };

  // Sync Google OAuth user with backend
  const syncGoogleUserWithBackend = async (supabaseUser: any) => {
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.data.session?.access_token}`
        },
      });

      const data = await response.json();
      if (response.ok && data.success && data.user) {
        // Use the backend user data - this is the authoritative source
        const backendUser = {
          ...data.user,
          user_id: data.user.id, // Map id to user_id for frontend consistency
          // Keep some useful Supabase properties
          supabase_id: supabaseUser.id,
          picture: data.user.picture || supabaseUser.user_metadata?.avatar_url,
          backend_synced: true
        };

        setUser(backendUser);
      } else {
        throw new Error(data.error || "Failed to sync user");
      }
    } catch (error) {
      console.error("Backend sync error:", error);
      throw error;
    }
  };

  // Native login (Flask backend) - now handles both email/password and direct user object
  const signinNative = async (userOrEmail: any, password?: string) => {
    // If it's already a user object (from AuthPage), just set it
    if (typeof userOrEmail === 'object' && userOrEmail.id) {
      const fixedUser = {
        ...userOrEmail,
        user_id: userOrEmail.id, // Use 'id' consistently
      };
      localStorage.setItem("nativeUser", JSON.stringify(fixedUser));
      setUser(fixedUser);
      return;
    }

    // Otherwise, it's email/password login
    const email = userOrEmail;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Login failed");
    }

    const fixedUser = {
      ...data.user,
      user_id: data.user.id, // Your backend returns 'id'
    };

    localStorage.setItem("nativeUser", JSON.stringify(fixedUser));
    setUser(fixedUser);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("nativeUser");
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, logout, signinNative, syncGoogleUserWithBackend }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);