import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, LogOut, ArrowLeft, RefreshCw, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, loading, signOut, refreshAdminStatus } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Session Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCF9F6] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-[#143D2B] text-[#D4AF37] flex items-center justify-center shadow-xl mb-6 relative animate-pulse">
          <span className="font-serif text-2xl font-bold">P</span>
          <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin"></div>
        </div>
        <h2 className="font-serif text-xl font-bold text-[#143D2B]">Padma's Floral Admin</h2>
        <p className="mt-2 text-xs text-stone-500 font-medium flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-stone-400 animate-bounce" />
          <span>Verifying administrator credentials & session...</span>
        </p>
      </div>
    );
  }

  // 2. Unauthenticated State -> Redirect to Login with return URL
  if (!user) {
    const redirectUrl = location.pathname !== '/admin'
      ? `/admin/login?redirect=${encodeURIComponent(location.pathname)}`
      : '/admin/login';
    return <Navigate to={redirectUrl} replace />;
  }

  // 3. Authenticated but Unauthorized State (Non-Admin User)
  if (!isAdmin) {
    const handleSignOutAndSwitch = async () => {
      await signOut();
      navigate('/admin/login');
    };

    const handleRetry = async () => {
      setIsRefreshing(true);
      await refreshAdminStatus();
      setIsRefreshing(false);
    };

    return (
      <div className="min-h-screen bg-[#FCF9F6] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white border border-red-200 rounded-3xl shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              Access Restricted
            </h2>
            <p className="mt-1 text-xs text-stone-500 font-medium">
              Administrator Privileges Required (HTTP 403 Forbidden)
            </p>
          </div>

          <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-left space-y-2 text-xs">
            <div className="flex justify-between items-center text-stone-600">
              <span className="font-medium">Signed in account:</span>
              <span className="font-mono text-[11px] font-bold text-stone-900 truncate max-w-[200px]">
                {user.email}
              </span>
            </div>
            <div className="flex justify-between items-center text-stone-600">
              <span className="font-medium">Account Role:</span>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                {user.role}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 pt-2 border-t border-stone-200">
              This account does not have an active record in <code className="bg-stone-200 px-1 rounded text-stone-800">public.admin_users</code>. To manage products, orders, and business settings, please sign in with an authorized administrative account.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleRetry}
              disabled={isRefreshing}
              className="w-full bg-[#143D2B] hover:bg-[#1e5a3f] text-white py-3 rounded-xl font-bold text-xs shadow transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Checking Privileges...' : 'Re-check Authorization Status'}</span>
            </button>

            <button
              onClick={handleSignOutAndSwitch}
              className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out & Switch Account</span>
            </button>
          </div>

          <div className="pt-2 border-t border-stone-100">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Customer Boutique</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Admin State
  return <>{children}</>;
};
