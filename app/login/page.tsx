'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-context';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
} from '@/lib/auth-service';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Email state
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/chat');
    }
  }, [user, authLoading, router]);

  const clearError = () => setError('');

  // === Email/Password ===
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password / कृपया ईमेल और पासवर्ड डालें');
      return;
    }
    if (password.length < 6) {
      setError('Password too short (min 6 chars) / पासवर्ड बहुत छोटा है (कम से कम 6 अक्षर)');
      return;
    }

    setIsLoading(true);
    clearError();
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      router.push('/chat');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setError('No account found. Create one first? / कोई खाता नहीं मिला। पहले साइन अप करें?');
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Wrong password / गलत पासवर्ड');
      } else if (code === 'auth/email-already-in-use') {
        setError('Email already exists. Sign in instead. / यह ईमेल पहले से मौजूद है। साइन इन करें।');
      } else if (code === 'auth/invalid-email') {
        setError('Invalid email / गलत ईमेल');
      } else {
        setError(err.message || 'Error. Try again. / त्रुटि। पुनः प्रयास करें।');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // === Google ===
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    clearError();
    try {
      await signInWithGoogle();
      router.push('/chat');
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign-in failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 hero-gradient">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 hero-gradient mesh-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to landing */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home / होम पर जाएं
        </Link>

        {/* Card */}
        <div className="glass-card bg-white/80 backdrop-blur-xl rounded-3xl p-8 animate-scale-in border border-white/50 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔐</div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {isSignUp ? 'Create Account' : 'Login'}
            </h1>
            <h2 className="text-xl text-blue-600 font-semibold">
              {isSignUp ? 'नया खाता बनाएं' : 'लॉग इन करें'}
            </h2>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          {/* ===== Email Form ===== */}
          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email / ईमेल
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: name@gmail.com"
                disabled={isLoading}
                className="w-full px-5 py-4 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 text-lg shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password / पासवर्ड
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  disabled={isLoading}
                  className="w-full px-5 py-4 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 pr-12 text-lg shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg hover:shadow-blue-600/20"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  {isSignUp ? 'Create Account / खाता बनाएं' : 'Sign In / साइन इन'}
                </>
              )}
            </button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); clearError(); }}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors py-2 px-4 rounded-lg hover:bg-blue-50"
            >
              {isSignUp
                ? 'Already have an account? Login / पहले से खाता है? लॉग इन'
                : 'New here? Create Account / नया खाता बनाएं'}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">OR / या</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-bold text-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3 shadow-sm"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google / गूगल
          </button>

          {/* Disclaimer */}
          <p className="text-xs text-slate-500 text-center mt-8 leading-relaxed max-w-xs mx-auto">
            By continuing, you agree to our Terms.
            <br />
            जारी रखकर, आप हमारी शर्तों से सहमत हैं।
          </p>
        </div>
      </div>
    </div>
  );
}
