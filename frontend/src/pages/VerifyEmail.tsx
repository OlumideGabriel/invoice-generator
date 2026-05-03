import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token || !type) {
          setStatus('error');
          setMessage('Invalid verification link. Missing token or type.');
          return;
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any,
        });

        if (error) {
          setStatus('error');
          setMessage(error.message);
        } else {
          setStatus('success');
          setMessage('Email verified successfully! You can now sign in.');
          // Redirect to auth page after a delay
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
        }
      } catch (err: any) {
        setStatus('error');
        setMessage('An unexpected error occurred during verification.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying your email...
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your email address.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Email Verified!
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              Redirecting to sign in page...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => navigate('/auth')}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
            >
              Back to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
