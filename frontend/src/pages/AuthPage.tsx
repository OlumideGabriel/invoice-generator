// Pages/AuthPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';


const AuthPage: React.FC = () => {
  const location = useLocation();
  // Read ?mode=login from the URL
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
  const navigate = useNavigate();
  const { signinNative } = useAuth();

  // In your AuthPage.tsx, update this part:

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  try {
    const endpoint = mode === 'signup' ? 'api/auth/signup' : 'api/auth/signin';
    const payload = mode === 'signup'
      ? { first_name: firstName, last_name: lastName, email, password }
      : { email, password };

    // Use import.meta.env instead of API_BASE_URL
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data.success) {
      // If backend returns user object, use it
      if (data.user) {
        signinNative(data.user); // This now works with the updated AuthContext
        navigate('/');
      }
    } else {
      setError(data.error || 'Authentication failed.');
    }
  } catch (err: any) {
    setError(err.message || 'An error occurred');
  } finally {
    setLoading(false);
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
                <a
                  href="#"
                  className="text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                  onClick={e => {
                    e.preventDefault();
                    setMode('login');
                    setError(null);
                  }}
                >
                  Log in
                </a>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <a
                  href="#"
                  className="text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                  onClick={e => {
                    e.preventDefault();
                    setMode('signup');
                    setError(null);
                  }}
                >
                  Create one
                </a>
              </>
            )}
          </p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="flex gap-4">
                <input id="firstName" type="text" placeholder="First name" className="flex-1 bg-white placeholder-gray-400 border border-neutral-200 px-5 py-4 rounded-lg text-gray-900 text-md font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200" value={firstName} onChange={e => setFirstName(e.target.value)} required={mode === 'signup'} />
                <input id="lastName" type="text" placeholder="Last name" className="flex-1 bg-white placeholder-gray-400 border border-neutral-200 px-5 py-4 rounded-lg text-gray-900 text-md font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200" value={lastName} onChange={e => setLastName(e.target.value)} required={mode === 'signup'} />
              </div>
            )}
            <input id="email" type="email" placeholder="Email" className="w-full bg-white placeholder-gray-400 border border-neutral-200 px-5 py-4 rounded-lg text-gray-900 text-md font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200" value={email} onChange={e => setEmail(e.target.value)} required />
            <div className="relative">
              <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="w-full bg-white placeholder-gray-400 border border-neutral-200 px-5 py-4 rounded-lg text-gray-900 text-md font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200" value={password} onChange={e => setPassword(e.target.value)} required />
              <a
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 text-lg"
                tabIndex={-1}
                onClick={() => setShowPassword(v => !v)}
              >
                {showPassword ? (
                  <EyeOff size={22} />
                ) : (
                  <Eye size={22} />
                )}
              </a>
            </div>
            {mode === 'signup' && (
              <div className="flex items-center gap-3 mb-2">
                <input type="checkbox" id="terms" className="w-4 h-4 p-6 accent-emerald-700" checked={terms} onChange={e => setTerms(e.target.checked)} required />
                <label htmlFor="terms" className="text-gray-500 text-sm">I agree to the <a href="#" className="text-gray-500 hover:text-gray-700 underline">Terms & Conditions</a></label>
              </div>
            )}
            {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-base transition mb-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (mode === 'signup' ? 'Creating account...' : 'Signing in...') : (mode === 'signup' ? 'Create account' : 'Sign in')}
            </button>
            <div className="relative text-center text-gray-500 text-sm my-6">
              <span className="relative z-10 px-4">or</span>
              <div className="absolute left-0 top-1/2 w-full border-t border-white/10 -z-10" style={{transform: 'translateY(-50%)'}}></div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button
                   type="button"
                   className="flex items-center justify-center px-6 py-3 gap-2 border border-neutral-200 rounded-xl bg-white text-emerald-900 font-medium shadow-2xs hover:shadow-sm transition"
                   onClick={async () => {
                     setLoading(true);
                     setError(null);
                     const { error } = await supabase.auth.signInWithOAuth({
                       provider: 'google',
                       options: { redirectTo: window.location.origin }
                     });
                     if (error) setError(error.message);
                     setLoading(false);
                   }}
                 >
                   <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="w-6 h-6" />
                   Continue with Google
                </button>
            </div>
          </form>
        </div>
      </div>
      {/* Right Section (Carousel/Marketing) */}
      <div className=" hidden flex-1 lg:flex flex-col justify-center items-center bg-gradient-to-tr from-emerald-400
      to-emerald-900 px-8 md:px-16 py-12 min-h-screen relative">
        <button
            onClick={() => navigate('/')}
        className="mb-20 bg-white/10 text-white border-none
        px-6 py-3 rounded-md text-sm font-medium cursor-pointer hover:bg-white/20 transition
         backdrop-blur">Continue as guest →</button>
        <h2 className="text-2xl md:text-4xl font-medium text-white mb-5 text-center">
          Invoicing Made Super Easy
        </h2>
        <p className="text-white/90 text-lg md:text-xl mb-12 text-center max-w-2xl">
          Whether you&apos;re a freelancer or a business owner,<br />
          our platform simplifies your invoicing process.</p>

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
