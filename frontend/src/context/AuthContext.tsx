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
      // 1. Check Supabase session
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser({
          ...data.session.user,
          user_id: data.session.user.user_id ?? data.session.user.id,
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
          user_id: parsed.user_id ?? parsed.id,
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
          user_id: session.user.user_id ?? session.user.id,
        });
      } else {
        const nativeUser = localStorage.getItem("nativeUser");
        if (nativeUser) {
          const parsed = JSON.parse(nativeUser);
          setUser({
            ...parsed,
            user_id: parsed.user_id ?? parsed.id,
          });
        } else {
          setUser(null);
        }
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

    const fixedUser = {
      ...data.user,
      user_id: data.user.user_id ?? data.user.id,
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
    <Ctx.Provider value={{ user, loading, logout, signinNative }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
