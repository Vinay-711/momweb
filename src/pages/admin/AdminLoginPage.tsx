import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, resetPassword, isDemoAuth } = useAuth();

  // Mode: 'login' | 'forgot'
  const [mode, setMode] = useState<'login' | 'forgot'>('login');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // URL Query Reason Alerts
  const reason = searchParams.get('reason');
  const isUpdated = searchParams.get('updated') === 'true';
  const redirectTarget = searchParams.get('redirect') || '/admin';

  useEffect(() => {
    if (isUpdated) {
      setSuccessMsg('Your password has been successfully updated! Please sign in with your new password.');
    }
  }, [isUpdated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await signIn(email, password);
      setLoading(false);

      if (res.error) {
        setError(res.error);
      } else if (!res.isAdmin) {
        // Authenticated in Supabase but lacks admin privileges in app_metadata or admin table
        setError('Signed in successfully, but this account does not have administrator privileges. Please contact the store owner.');
      } else {
        navigate(redirectTarget);
      }
    } catch (err: any) {
      setLoading(false);
      setError('An unexpected error occurred during sign-in. Please try again.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim()) {
      setError('Please enter your email address to receive a password reset link.');
      return;
    }

    setLoading(true);
    const res = await resetPassword(email);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccessMsg(`Password reset instructions have been sent to ${email}. Check your inbox for the recovery link.`);
    }
  };

  return (
    <main className="min-h-screen bg-[#FCF9F6] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 group mb-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] rounded-full"
          aria-label="Padma's Floral - Return to Homepage"
        >
          <div className="w-14 h-14 rounded-full bg-[#143D2B] text-[#D4AF37] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <span className="font-serif text-2xl font-bold" aria-hidden="true">P</span>
          </div>
        </Link>
        <h1 className="font-serif text-3xl font-bold text-[#143D2B]">
          Padma's Floral Admin
        </h1>
        <p className="mt-1.5 text-xs text-stone-600 font-medium">
          Protected administrative portal for business operations
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-stone-200 shadow-xl space-y-6">
          
          {/* Query Param Notices */}
          {reason === 'expired' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Session Expired</p>
                <p className="text-[11px] text-amber-800">Your previous session has expired for security. Please sign in again.</p>
              </div>
            </div>
          )}

          {reason === 'unauthorized' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Access Denied</p>
                <p className="text-[11px] text-red-800">Administrator credentials are required to view that page.</p>
              </div>
            </div>
          )}

          {/* Live Supabase Connection Badge */}
          {isDemoAuth ? (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <Sparkles className="w-4 h-4 text-amber-600" aria-hidden="true" />
                <span>Evaluation / Offline Demo Mode</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Supabase credentials not detected in environment. Sign in with owner demo credentials.
              </p>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" aria-hidden="true" />
              <span className="text-[11px] font-medium">Secured with Supabase Auth & PostgreSQL RLS</span>
            </div>
          )}

          {/* Success Message Banner */}
          {successMsg && (
            <div
              role="status"
              aria-live="polite"
              className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span className="text-[11px] leading-relaxed font-medium">{successMsg}</span>
            </div>
          )}

          {/* Error Message Banner */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span className="text-[11px] leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {/* Mode 1: Sign In */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="admin-login-email" className="text-xs font-semibold text-stone-700 block mb-1">
                  Admin Email Address
                </label>
                <div className="relative">
                  <input
                    id="admin-login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="owner@padmasfloral.com"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-3 text-sm focus:ring-2 focus:ring-[#143D2B] focus:bg-white transition-all min-h-[44px]"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="admin-login-password" className="text-xs font-semibold text-stone-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="touch-target-44 text-xs text-[#143D2B] hover:text-[#C84B5B] font-semibold transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] rounded"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="admin-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-12 py-3 text-sm focus:ring-2 focus:ring-[#143D2B] focus:bg-white transition-all min-h-[44px]"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="touch-target-44 absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 p-2 flex items-center justify-center min-w-[36px] min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] rounded-lg"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-controls="admin-login-password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="touch-target-44 w-full bg-[#143D2B] hover:bg-[#1e5a3f] disabled:opacity-75 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:ring-offset-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" aria-hidden="true"></div>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Sign In to Dashboard</span>
                )}
              </button>
            </form>
          ) : (
            /* Mode 2: Forgot Password / Password Reset */
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-center space-y-1 pb-1">
                <h2 className="font-serif font-bold text-stone-800 text-sm">
                  Reset Admin Password
                </h2>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Enter your registered administrator email address and we'll send a secure password reset link.
                </p>
              </div>

              <div>
                <label htmlFor="admin-forgot-email" className="text-xs font-semibold text-stone-700 block mb-1">
                  Admin Email Address
                </label>
                <div className="relative">
                  <input
                    id="admin-forgot-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="owner@padmasfloral.com"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-3 text-sm focus:ring-2 focus:ring-[#143D2B] focus:bg-white transition-all min-h-[44px]"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="touch-target-44 w-full bg-[#143D2B] hover:bg-[#1e5a3f] disabled:opacity-75 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:ring-offset-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" aria-hidden="true"></div>
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" aria-hidden="true" />
                    <span>Send Password Reset Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="touch-target-44 w-full text-center text-xs font-semibold text-stone-600 hover:text-stone-900 py-2.5 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] rounded-xl"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* Footer Back Link */}
          <div className="pt-4 border-t border-stone-100 text-center">
            <Link
              to="/"
              className="touch-target-44 inline-flex items-center justify-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium transition-colors py-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] rounded-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Return to Customer Boutique</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};
