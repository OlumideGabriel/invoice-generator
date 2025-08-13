// context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: any;
  loading: boolean;
  logout: () => Promise<void>;
  signinNative: (email: string, password: string) => Promise<void>;
}

const Ctx = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  signinNative: async () => {},
});

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Check Supabase session first
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
        setLoading(false);
        return;
      }

      // Check localStorage for native login
      const storedUser = localStorage.getItem("nativeUser");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      setLoading(false);
    };

    initAuth();

    // Supabase auth listener
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        const nativeUser = localStorage.getItem("nativeUser");
        setUser(nativeUser ? JSON.parse(nativeUser) : null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Native login (Flask backend)
  const signinNative = async (email: string, password: string) => {
    const res = await fetch(`${process.env.VITE_API_URL}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Login failed");
    }

    localStorage.setItem("nativeUser", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("nativeUser");
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, logout, signinNative }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
