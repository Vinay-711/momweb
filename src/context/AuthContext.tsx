import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AdminUserProfile {
  id: string;
  email: string;
  role: 'admin' | 'superadmin' | 'customer';
  isAdmin: boolean;
  appMetadataRole?: string;
}

interface AuthContextType {
  user: AdminUserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error?: string; isAdmin?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  refreshAdminStatus: () => Promise<boolean>;
  isDemoAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_ADMIN_KEY = 'padma_floral_admin_session';

/**
 * Verifies whether a given Supabase user holds administrator privileges.
 * 
 * SECURITY RULES:
 * 1. Checks server-managed `app_metadata.role` (cryptographically signed in JWT).
 * 2. Checks database function `public.is_admin()` via RPC.
 * 3. Checks `public.admin_users` table via direct query.
 * 4. NEVER trusts `user_metadata` or `raw_user_meta_data`, which are user-editable via the client SDK.
 */
async function checkAdminPrivileges(user: User): Promise<boolean> {
  if (!user || !supabase) return false;

  // 1. Check tamper-proof app_metadata in JWT
  const appRole = (user.app_metadata?.role as string | undefined)?.toLowerCase();
  if (appRole === 'admin' || appRole === 'superadmin') {
    return true;
  }

  // 2. Query server-side database RPC `public.is_admin()`
  try {
    const { data: rpcIsAdmin, error: rpcError } = await supabase.rpc('is_admin');
    if (!rpcError && Boolean(rpcIsAdmin)) {
      return true;
    }
  } catch (err) {
    // RPC may not yet be created or permission issue, proceed to table check
  }

  // 3. Query dedicated `public.admin_users` table
  try {
    const { data: adminRecord, error: tableError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!tableError && adminRecord && (adminRecord.role === 'admin' || adminRecord.role === 'superadmin')) {
      return true;
    }
  } catch (err) {
    // Table may not yet exist on remote or query failed
  }

  return false;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemoAuth = !isSupabaseConfigured();
  const sessionCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to construct AdminUserProfile
  const buildProfile = useCallback((u: User, adminStatus: boolean): AdminUserProfile => {
    const appRole = (u.app_metadata?.role as string) || (adminStatus ? 'admin' : 'customer');
    return {
      id: u.id,
      email: u.email || '',
      role: adminStatus ? (appRole === 'superadmin' ? 'superadmin' : 'admin') : 'customer',
      isAdmin: adminStatus,
      appMetadataRole: u.app_metadata?.role,
    };
  }, []);

  // Handle active session and verify authorization
  const processSession = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setUser(null);
      setSession(null);
      return;
    }

    // Check if session is already expired
    if (currentSession.expires_at) {
      const expiresAtMs = currentSession.expires_at * 1000;
      if (Date.now() >= expiresAtMs) {
        // Expired session
        if (supabase) {
          await supabase.auth.signOut();
        }
        setUser(null);
        setSession(null);
        return;
      }
    }

    setSession(currentSession);
    const adminStatus = await checkAdminPrivileges(currentSession.user);
    const profile = buildProfile(currentSession.user, adminStatus);
    setUser(profile);
  }, [buildProfile]);

  // Monitor session expiration gracefully
  useEffect(() => {
    if (sessionCheckTimerRef.current) {
      clearInterval(sessionCheckTimerRef.current);
    }

    if (session?.expires_at) {
      const expiresAtMs = session.expires_at * 1000;
      const timeRemaining = expiresAtMs - Date.now();

      if (timeRemaining > 0) {
        // Check 10 seconds after expiration or on interval
        sessionCheckTimerRef.current = setTimeout(async () => {
          console.warn('[Padma Floral Auth] Session expired. Signing out gracefully.');
          if (supabase) {
            await supabase.auth.signOut();
          }
          setUser(null);
          setSession(null);
          window.location.href = '/admin/login?reason=expired';
        }, timeRemaining + 1000);
      }
    }

    return () => {
      if (sessionCheckTimerRef.current) {
        clearTimeout(sessionCheckTimerRef.current);
      }
    };
  }, [session]);

  // Initialize session and subscribe to auth state changes
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: { session: initialSession }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('[Padma Floral Auth] getSession error:', error);
          }
          if (isMounted) {
            if (initialSession) {
              await processSession(initialSession);
            } else if (Boolean(import.meta.env?.DEV)) {
              // Local development fallback: allow local test session if present
              try {
                const stored = localStorage.getItem(LOCAL_ADMIN_KEY);
                if (stored) {
                  const parsed = JSON.parse(stored);
                  if (parsed?.id && parsed?.role === 'admin') {
                    setUser({
                      id: parsed.id,
                      email: parsed.email || 'admin@padmasfloral.com',
                      role: 'admin',
                      isAdmin: true,
                    });
                  }
                }
              } catch (e) {
                console.error('[Padma Floral Auth] Local storage session read failed:', e);
              }
            } else {
              // When Supabase is configured in production, strictly clear any unauthenticated local state.
              localStorage.removeItem(LOCAL_ADMIN_KEY);
              setUser(null);
              setSession(null);
            }
          }
        } catch (err) {
          console.error('[Padma Floral Auth] Initial session recovery failed:', err);
        } finally {
          if (isMounted) setLoading(false);
        }

        // Real-time subscription to Supabase auth events
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event: AuthChangeEvent, updatedSession: Session | null) => {
            if (!isMounted) return;

            if (event === 'SIGNED_OUT') {
              setUser(null);
              setSession(null);
              setLoading(false);
              return;
            }

            if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
              await processSession(updatedSession);
            }

            setLoading(false);
          }
        );

        return () => {
          isMounted = false;
          subscription.unsubscribe();
        };
      } else {
        // Offline / Unconfigured fallback: check local storage mock session
        try {
          const stored = localStorage.getItem(LOCAL_ADMIN_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.id && parsed?.role === 'admin') {
              setUser({
                id: parsed.id,
                email: parsed.email || 'admin@padmasfloral.com',
                role: 'admin',
                isAdmin: true,
              });
            }
          }
        } catch (e) {
          console.error('[Padma Floral Auth] Local storage session read failed:', e);
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [processSession]);

  // Manual refresh of admin authorization status (e.g. after owner promotes account in DB)
  const refreshAdminStatus = async (): Promise<boolean> => {
    if (isSupabaseConfigured() && supabase) {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const adminStatus = await checkAdminPrivileges(currentUser);
        setUser(buildProfile(currentUser, adminStatus));
        return adminStatus;
      }
    }
    return Boolean(user?.isAdmin);
  };

  // Sign In with email and password
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error?: string; isAdmin?: boolean }> => {
    // Local development fallback: permitted in local development mode
    const isLocalDev = Boolean(import.meta.env?.DEV);
    if (isLocalDev) {
      if (
        (email.toLowerCase() === 'admin@padmasfloral.com' && (password === 'padma123' || password === 'password123')) ||
        (email.toLowerCase() === 'owner@padmasfloral.com' && (password === 'padma123' || password === 'password123'))
      ) {
        const demoProfile: AdminUserProfile = {
          id: 'dev-demo-admin',
          email,
          role: 'admin',
          isAdmin: true,
        };
        setUser(demoProfile);
        localStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(demoProfile));
        return { isAdmin: true };
      }
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          return { error: error.message };
        }

        if (data.user) {
          // Strictly verify authorization against server data (JWT app_metadata, is_admin RPC, admin_users)
          const adminStatus = await checkAdminPrivileges(data.user);
          const profile = buildProfile(data.user, adminStatus);
          setUser(profile);
          setSession(data.session);

          return { isAdmin: adminStatus };
        }

        return { error: 'Authentication failed. Please check your credentials.' };
      } catch (err: any) {
        return { error: err.message || 'Login failed unexpectedly. Please try again.' };
      }
    }

    return { error: 'Invalid credentials. Production database authentication is required.' };
  };

  // Sign Out
  const signOut = async () => {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('[Padma Floral Auth] Sign out error:', err);
      }
    }
    setUser(null);
    setSession(null);
    localStorage.removeItem(LOCAL_ADMIN_KEY);
  };

  // Password Reset Request
  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) {
      return { error: 'Supabase authentication is not configured.' };
    }

    try {
      const redirectTo = `${window.location.origin}/admin/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'Password reset request failed.' };
    }
  };

  // Update Password (when following reset link)
  const updatePassword = async (newPassword: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) {
      return { error: 'Supabase authentication is not configured.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'Password update failed.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: Boolean(user && user.isAdmin),
        loading,
        session,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        refreshAdminStatus,
        isDemoAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const defaultAuthContext: AuthContextType = {
  user: null,
  isAdmin: false,
  loading: false,
  session: null,
  signIn: async () => ({ error: 'AuthProvider not initialized' }),
  signOut: async () => {},
  resetPassword: async () => ({ error: 'AuthProvider not initialized' }),
  updatePassword: async () => ({ error: 'AuthProvider not initialized' }),
  refreshAdminStatus: async () => false,
  isDemoAuth: false,
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('[useAuth] Hook called outside of AuthProvider, using safe fallback context');
    return defaultAuthContext;
  }
  return context;
};
