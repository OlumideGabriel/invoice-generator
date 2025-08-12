import React from 'react';
import { supabase } from '../lib/supabase'; // make sure you have this client setup

const GoogleLoginButton: React.FC = () => {
  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // redirect after login
        queryParams: {
          access_type: 'offline', // get refresh token
          prompt: 'consent',       // force consent screen first time
        },
      },
    });

    if (error) {
      console.error('Google sign-in error:', error.message);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      style={{
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        borderRadius: 4,
        padding: '10px 20px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <img
        src="https://developers.google.com/identity/images/g-logo.png"
        alt="Google logo"
        width={18}
        height={18}
      />
      Continue with Google
    </button>
  );
};

export default GoogleLoginButton;



