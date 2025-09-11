// Pages/AuthPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const AuthPage: React.FC = () => {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const initialMode = urlParams.get('mode') === 'signup' ? 'signup' : 'login';

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

  const navigate = useNavigate();
  const { signinNative } = useAuth();

  // Check if user is already logged in via Supabase session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch the user from our database instead of raw Google JSON
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/${session.user.id}`);
        if (res.ok) {
          const user = await res.json();
          signinNative(user);
          navigate('/');
        }
      }
    };
    checkSession();
  }, [navigate, signinNative]);

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
        navigate('/');
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
      // Redirect happens automatically; our useEffect will handle fetching user
    } catch (err: any) {
      setError(err.message || 'Google login failed');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-neutral-900 overflow-hidden">
      {/* Form Section */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-20 bg-white min-h-screen">
        <div className="max-w-md w-full mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-900 mb-3">
            {mode === 'signup' ? 'Create an account' : 'Sign in to your account'}
          </h1>
          <p className="text-emerald-900/70 text-base mb-8">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-emerald-700 hover:text-emerald-900 underline"
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
                  className="text-emerald-700 hover:text-emerald-900 underline"
                  onClick={() => { setMode('signup'); setError(null); }}
                >
                  Create one
                </button>
              </>
            )}
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="First name"
                  className="flex-1 border px-5 py-4 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Last name"
                  className="flex-1 border px-5 py-4 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                />
              </div>
            )}

            <input
              type="email"
              placeholder="Email"
              className="w-full border px-5 py-4 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="w-full border px-5 py-4 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword(v => !v)}
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>

            {mode === 'signup' && (
              <div className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={e => setTerms(e.target.checked)}
                  className="w-4 h-4 accent-emerald-700"
                  required
                />
                <label className="text-gray-500 text-sm">
                  I agree to the <a href="/terms-of-service" className="underline">Terms</a> and <a href="/privacy-policy" className="underline"> Privacy</a>
                </label>
              </div>
            )}

            {error && <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg">{error}</div>}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition disabled:opacity-60"
            >
              {loading ? (mode === 'signup' ? 'Creating account...' : 'Signing in...') : (mode === 'signup' ? 'Create account' : 'Sign in')}
            </button>

            <div className="relative text-center text-gray-500 text-sm my-6">
              <span className="relative z-10 px-4">or</span>
              <div className="absolute left-0 top-1/2 w-full border-t border-gray-200 -z-10" style={{ transform: 'translateY(-50%)' }}></div>
            </div>

            <button
              type="button"
              disabled={loading || googleLoading}
              className="flex items-center justify-center px-6 py-3 gap-2 border rounded-xl text-emerald-900 hover:shadow-sm transition disabled:opacity-60 w-full"
              onClick={handleGoogleLogin}
            >
              <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="w-6 h-6" />
              {googleLoading ? 'Redirecting...' : 'Continue with Google'}
            </button>

            <button
              type="button"
              className="hidden w-full justify-center px-6 py-4 mt-2 border rounded-xl text-emerald-900 hover:bg-gray-100"
              onClick={() => navigate('/')}
            >
              Continue as Guest
            </button>
          </form>
        </div>
      </div>

      {/* Right Section */}
      <div className="hidden flex-1 lg:flex flex-col justify-center items-center bg-gradient-to-tr from-emerald-400 to-emerald-900 px-8 md:px-16 py-12 min-h-screen relative">
        <button
          onClick={() => navigate('/')}
          className="mb-20 bg-white/10 text-white px-6 py-3 rounded-md hover:bg-white/20 transition"
        >
          Continue as guest →
        </button>
        <h2 className="text-2xl md:text-4xl font-medium text-white mb-5 text-center">
          Invoicing Made Super Easy
        </h2>
        <p className="text-white/90 text-lg md:text-xl mb-12 text-center max-w-2xl">
          Whether you&apos;re a freelancer or a business owner, our platform simplifies your invoicing process.
        </p>
        <div className="max-w-lg w-full relative">
          <img src="/to-do.jpg" alt="To Do" className="max-w-full h-auto rounded-xl shadow-lg" />
          <a href="#" className="absolute bottom-2 right-2 text-xs text-white bg-black/10 px-2 py-1 rounded-full">source: semklo.design</a>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
