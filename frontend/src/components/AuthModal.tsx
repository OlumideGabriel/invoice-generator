// Components/AuthModal.tsx
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Modal from './Modal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signup' | 'login';
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login' 
}) => {
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signinNative } = useAuth();

  useEffect(() => {
    // Reset form when modal opens/closes
    if (!isOpen) {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setError(null);
      setTerms(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'signup' ? 'api/auth/signup' : 'api/auth/signin';
      const payload = mode === 'signup'
        ? { first_name: firstName, last_name: lastName, email, password }
        : { email, password };

      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Authentication failed');

      if (data.success && data.user) {
        signinNative(data.user);
        onClose(); // Close modal on successful auth
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });

      if (error) throw new Error(error.message);
      // Google login will redirect, so we don't need to close the modal here
    } catch (err: any) {
      setError(err.message || 'Google login failed');
      setGoogleLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-sm z-50 mx-auto">

        <h2 className="text-3xl font-regular text-neutral-800 mb-8 text-center">
          {mode === 'signup' ? 'Create an account' : 'Sign in'}
        </h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="flex md:flex-row gap-4">
              <input
                type="text"
                placeholder="First name"
                className="flex-1 w-32 input border px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Last name"
                className="flex-1 w-32 input border px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
              />
            </div>
          )}

          <input
            type="email"
            placeholder="Email"
            className="w-full border input px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="w-full input border px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-neutral-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword(v => !v)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

        {error && <div className="text-red-500 text-sm px-3 py-2 bg-red-50 rounded-lg">{error}</div>}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-4 !bg-neutral-800 hover:!bg-neutral-900 text-white rounded-xl transition disabled:opacity-60"
          >
            {loading ? (mode === 'signup' ? 'Creating account...' : 'Signing in...') : (mode === 'signup' ? 'Create account' : 'Sign in')}
          </button>

          <div className="relative text-center text-gray-500 text-xs my-4">
            <span className="relative z-10 px-2 bg-white">or</span>
            <div className="absolute left-0 top-1/2 w-full border-t border-gray-200 -z-10" style={{ transform: 'translateY(-50%)' }}></div>
          </div>

          <button
            type="button"
            disabled={loading || googleLoading}
            className="flex items-center justify-center px-4 py-3 gap-2 border rounded-xl text-neutral-900 hover:shadow-sm transition disabled:opacity-60 w-full"
            onClick={handleGoogleLogin}
          >
            <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="w-5 h-5" />
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <p className="text-gray-700 text-center pt-4 text-sm mb-6">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="text-neutral-700 hover:text-neutral-900 underline"
                onClick={() => { setMode('login'); setError(null); }}
              >
                Log in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="text-gray-800 hover:text-gray-900 underline"
                onClick={() => { setMode('signup'); setError(null); }}
              >
                Create one
              </button>
            </>
          )}
        </p>

            <div className="m-10 pt-2">
            <p className="text-xs text-gray-400 text-center mt-4">
              By clicking "Sign in", you accept Medium's{' '}
              <a href="/terms-of-service" className="text-gray-400 underline hover:no-underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy-policy" className="text-gray-400 underline hover:no-underline">
                Privacy Policy
              </a>
              .
            </p>
            </div>
        </form>
      </div>
    </Modal>
  );
};

export default AuthModal;