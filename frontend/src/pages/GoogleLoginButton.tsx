import React from "react";
import { supabase } from "../lib/supabase";

interface GoogleLoginButtonProps {
  glow?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  glow = false,
  disabled = false,
  loading = false,
}) => {
  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("Google sign-in error:", error.message);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={disabled || loading}
      className={`
        flex items-center justify-center w-full px-6 py-3 gap-2
        border rounded-xl text-emerald-900
        transition-all duration-300
        disabled:opacity-60 disabled:cursor-not-allowed
        hover:shadow-sm
        ${
          glow
            ? "animate-google-glow border-emerald-500"
            : "border-gray-200 hover:border-gray-300"
        }
      `}
    >
      <img
        src="https://developers.google.com/identity/images/g-logo.png"
        alt="Google"
        className="w-5 h-5"
      />
      <span>{loading ? "Redirecting..." : "Continue with Google"}</span>
    </button>
  );
};

export default GoogleLoginButton;
