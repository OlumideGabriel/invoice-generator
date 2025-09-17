// src/pages/AuthCallback.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        setLoading(true);

        // Wait for Supabase to process the OAuth callback
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(sessionError.message);
        }

        if (session) {
          // Successfully authenticated, redirect to home/dashboard
          navigate('/new', { replace: true });
        } else {
          // No session found, might need to wait a bit longer or show error
          setTimeout(() => {
            navigate('/auth?error=oauth_timeout');
          }, 2000);
        }
      } catch (err: any) {
        setError(err.message);
        navigate('/auth?error=oauth_failed');
      } finally {
        setLoading(false);
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-lg">Authentication failed</div>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/auth')}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}