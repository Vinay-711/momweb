import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const AdminResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);

  useEffect(() => {
    // Check if recovery session or token is present
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setIsRecoveryReady(true);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          setIsRecoveryReady(true);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please retype carefully.');
      return;
    }

    setLoading(true);

    try {
      const res = await updatePassword(password);
      setLoading(false);

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/admin/login?updated=true');
        }, 1500);
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to update password.');
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
          Set New Password
        </h1>
        <p className="mt-1.5 text-xs text-stone-600 font-medium">
          Create a strong password for your administrator account
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-stone-200 shadow-xl space-y-6">
          
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-medium">Secure Password Reset Session Active</span>
          </div>

          {success && (
            <div
              role="status"
              aria-live="polite"
              className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-bold">Password Updated Successfully!</p>
                <p className="text-[11px] text-emerald-700">Redirecting you to the admin sign in page...</p>
              </div>
            </div>
          )}

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-reset-password" className="text-xs font-semibold text-stone-700 block mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="admin-reset-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-12 py-3 text-sm focus:ring-2 focus:ring-[#143D2B] focus:bg-white transition-all min-h-[44px]"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="touch-target-44 absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 p-2 flex items-center justify-center min-w-[36px] min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] rounded-lg"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-controls="admin-reset-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="admin-reset-confirm-password" className="text-xs font-semibold text-stone-700 block mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="admin-reset-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-12 py-3 text-sm focus:ring-2 focus:ring-[#143D2B] focus:bg-white transition-all min-h-[44px]"
                />
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="touch-target-44 absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 p-2 flex items-center justify-center min-w-[36px] min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] rounded-lg"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  aria-controls="admin-reset-confirm-password"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl text-[11px] text-stone-600 space-y-1">
              <p className="font-semibold text-stone-700">Password Requirements:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li className={password.length >= 8 ? 'text-emerald-700 font-medium' : ''}>
                  At least 8 characters
                </li>
                <li className={password && password === confirmPassword ? 'text-emerald-700 font-medium' : ''}>
                  Passwords must match
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="touch-target-44 w-full bg-[#143D2B] hover:bg-[#1e5a3f] disabled:opacity-75 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:ring-offset-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" aria-hidden="true"></div>
                  <span>Saving New Password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-stone-100 text-center">
            <Link
              to="/admin/login"
              className="touch-target-44 inline-flex items-center justify-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium transition-colors py-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] rounded-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Back to Admin Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};
