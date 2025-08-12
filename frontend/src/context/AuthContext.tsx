// context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const Ctx = createContext({
  user: null as any,
  loading: true,
  logout: async () => {},
  signinNative: async (email: string, password: string) => {},
});

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load user from either Supabase or localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      // Check Supabase session first
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
        setLoading(false);
        return;
      }

      // If no Supabase session, check localStorage for Flask login
      const storedUser = localStorage.getItem("nativeUser");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      setLoading(false);
    };

    initAuth();

    // Subscribe to Supabase auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        // If Supabase logs out, clear user if not using native login
        const nativeUser = localStorage.getItem("nativeUser");
        setUser(nativeUser ? JSON.parse(nativeUser) : null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Login with Flask API
  const signinNative = async (email: string, password: string) => {
    const res = await fetch(
      `${process.env.VITE_API_URL}/api/auth/signin`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Login failed");
    }

    // Save native login in localStorage
    localStorage.setItem("nativeUser", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  // Logout for both systems
  const logout = async () => {
    // Sign out from Supabase (if Google login)
    await supabase.auth.signOut();
    // Remove native login from storage
    localStorage.removeItem("nativeUser");
    // Clear user state
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, logout, signinNative }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
