import React, { useEffect, useRef } from 'react';

interface GoogleLoginButtonProps {
  onSuccess: (token: string) => void;
}

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess }) => {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Google Identity script if not already present
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = renderButton;
      document.body.appendChild(script);
    } else {
      renderButton();
    }
    function renderButton() {
      if (window.google && divRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            if (response.credential) {
              onSuccess(response.credential);
            }
          },
        });
        window.google.accounts.id.renderButton(divRef.current, {
          theme: 'outline',
          size: 'large',
          width: 240,
        });
      }
    }
    // Clean up
    return () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [onSuccess]);

  return (
    <div ref={divRef} style={{ width: 240, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
  );
};

export default GoogleLoginButton;
