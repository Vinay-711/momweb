-- ==========================================================
-- PADMA'S FLORAL — SECURE ADMIN AUTHENTICATION & AUTHORIZATION
-- Target Schema: PostgreSQL on Supabase
-- Target Tables: public.admin_users
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create dedicated admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Helper function: public.is_admin()
-- Uses SECURITY INVOKER and checks non-editable JWT app_metadata OR admin_users table
-- NOTE: Never checks user_metadata, which is user-editable via the client SDK.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT (
    -- 1. Check tamper-proof app_metadata in JWT (set only via server / dashboard / service-role)
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'superadmin')
    OR
    -- 2. Check dedicated admin_users table for authenticated user
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = (select auth.uid())
      AND role IN ('admin', 'superadmin')
    )
  );
$$;

-- Grant EXECUTE to public roles so client SDK can evaluate authorization
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 3. Row Level Security Policies for admin_users
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Superadmins can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Superadmins can update admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Superadmins can delete admin_users" ON public.admin_users;

-- Any authenticated user can check if their own UUID is in admin_users, or an existing admin can view all admins
CREATE POLICY "Admins can view admin_users" ON public.admin_users
    FOR SELECT TO authenticated
    USING (id = (select auth.uid()) OR (select public.is_admin()));

-- Only existing admins/superadmins can manage admin_users
CREATE POLICY "Admins can insert admin_users" ON public.admin_users
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "Admins can update admin_users" ON public.admin_users
    FOR UPDATE TO authenticated
    USING ((select public.is_admin()))
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "Admins can delete admin_users" ON public.admin_users
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));

-- Grant table privileges
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.admin_users TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.admin_users TO authenticated;

-- ==========================================================
-- 4. BOOTSTRAP HELPER PROCEDURE
-- To promote an existing Supabase Auth user to Admin, run:
--
-- INSERT INTO public.admin_users (id, email, role)
-- SELECT id, email, 'admin'
-- FROM auth.users
-- WHERE email = 'owner@padmasfloral.com'
-- ON CONFLICT (email) DO UPDATE SET role = 'admin';
-- ==========================================================
