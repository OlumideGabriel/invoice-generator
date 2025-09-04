// Pages/AuthPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom';

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

  // Check for OAuth callback on component mount
  useEffect(() => {
    const checkOAuthCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // User is authenticated via OAuth, redirect to dashboard
        navigate('/');
      }
    };

    checkOAuthCallback();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'signup' ? 'api/auth/signup' : 'api/auth/signin';
      const payload = mode === 'signup'
        ? { first_name: firstName, last_name: lastName, email, password }
        : { email, password };

      // Use consistent environment variable
      const apiUrl = import.meta.env.VITE_API_BASE_URL || API_BASE_URL;
      const response = await fetch(`${apiUrl}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

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
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // The redirect will happen automatically, no need to navigate here
    } catch (err: any) {
      setError(err.message || 'Google login failed');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-h-[100dvh] w-full flex flex-row bg-neutral-900 overflow-hidden">
      {/* Left Section (Form) */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-20 relative min-h-screen bg-[#fff]">
        <div className="max-w-md w-full mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-900 mb-3 leading-tight">
            {mode === 'signup' ? 'Create an account' : 'Sign in to your account'}
          </h1>
          <p className="text-emerald-900/70 text-base mb-8">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-emerald-700 hover:text-emerald-900 underline cursor-pointer bg-transparent border-none"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                >
                  Log in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  className="text-emerald-700 hover:text-emerald-900 underline cursor-pointer bg-transparent border-none"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
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
                  id="firstName"
                  type="text"
                  placeholder="First name"
                  className="flex-1 bg-white placeholder-gray-400 border border-neutral-200 px-5 py-4 rounded-lg text-gray-900 text-md font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required={mode === 'signup'}
                />
                <input
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                  className="flex-1 bg-white placeholder-gray-400 border border-neutral-200 px-5 py-4 rounded-lg text-gray-900 text-md font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required={mode === 'signup'}
                />
              </div>
            )}

            <input
              id="email"
              type="email"
              placeholder="Email"
              className="w-full bg-white placeholder-gray-400 border border-neutral-200 px-5 py-4 rounded-lg text-gray-900 text-md font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="w-full bg-white placeholder-gray-400 border border-neutral-200 px-5 py-4 rounded-lg text-gray-900 text-md font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 text-lg bg-transparent border-none"
                onClick={() => setShowPassword(v => !v)}
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>



            {error && (
              <div className="text-red-400 text-sm mb-2 p-3 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-base transition mb-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (mode === 'signup' ? 'Creating account...' : 'Signing in...') : (mode === 'signup' ? 'Create account' : 'Sign in')}
            </button>

            <div className="relative text-center text-gray-500 text-sm my-6">
              <span className="relative z-10 px-4">or</span>
              <div className="absolute left-0 top-1/2 w-full border-t border-white/10 -z-10" style={{transform: 'translateY(-50%)'}}></div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button
                type="button"
                disabled={loading || googleLoading}
                className="flex items-center justify-center px-6 py-3 gap-2 border border-neutral-200 rounded-xl bg-white text-emerald-900 font-medium shadow-2xs hover:shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleGoogleLogin}
              >
                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="w-6 h-6" />
                {googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
              </button>
            </div>
          </form>
          <div className="self-center mt-6">
          <label htmlFor="terms" className="text-neutral-400 text-sm">
            By creating an account, you are agree to our {" "}
            <a href="/terms-of-service" className="text-gray-400 hover:underline" >
             Terms of Service</a>{" "} and {" "}
            <a href="/privacy-policy" className="text-gray-400 hover:underline"> Privacy Policy</a>
          </label>
        </div>

        </div>


      </div>

      {/* Right Section (Carousel/Marketing) */}
      <div className="hidden flex-1 lg:flex flex-col justify-center items-center bg-gradient-to-tr from-emerald-400 to-emerald-900 px-8 md:px-16 py-12 min-h-screen relative">
        <button
          onClick={() => navigate('/')}
          className="mb-20 bg-white/10 text-white border-none px-6 py-3 rounded-md text-sm font-medium cursor-pointer hover:bg-white/20 transition backdrop-blur"
        >
          Continue as guest →
        </button>

        <h2 className="text-2xl md:text-4xl font-medium text-white mb-5 text-center">
          Invoicing Made Super Easy
        </h2>

        <p className="text-white/90 text-lg md:text-xl mb-12 text-center max-w-2xl">
          Whether you&apos;re a freelancer or a business owner,<br />
          our platform simplifies your invoicing process.
        </p>

        <div className="max-w-lg w-full relative">
          <img
            src="/to-do.jpg"
            alt="To Do"
            className="max-w-full h-auto rounded-xl shadow-lg"
          />
          <a
            href="#"
            className="absolute bottom-2 right-2 text-xs text-white hover:text-white bg-black/10 px-2 py-1 rounded-full hover:bg-black/20 transition"
          >
            source: semklo.design
          </a>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;