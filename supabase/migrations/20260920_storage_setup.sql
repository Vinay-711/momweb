-- ==========================================================
-- PADMA'S FLORAL — SUPABASE STORAGE SETUP & RLS SECURITY
-- Target Buckets:
--   1. product-images   (Public read, Admin upload/replace)
--   2. category-images  (Public read, Admin upload/replace)
--   3. gallery-images   (Public read, Admin upload/replace)
--
-- Security & Validation:
--   - 5MB Max File Size (5242880 bytes)
--   - Image MIME Types only: image/jpeg, image/png, image/webp, image/avif, image/gif
--   - Strict Path Traversal Prevention (no '..')
--   - File Extension Validation (jpg, jpeg, png, webp, avif, gif)
--   - Enforced by PostgreSQL Row Level Security (RLS) on storage.objects
--   - NEVER exposes service-role keys (uses public anon/authenticated client with is_admin())
-- ==========================================================

-- 1. Helper function for file extension if not present
CREATE OR REPLACE FUNCTION storage.extension(name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    parts text[];
BEGIN
    parts := string_to_array(name, '.');
    IF array_length(parts, 1) > 1 THEN
        RETURN lower(parts[array_length(parts, 1)]);
    ELSE
        RETURN '';
    END IF;
END;
$$;

-- 2. Create / Upsert Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'product-images',
        'product-images',
        true,
        5242880, -- 5MB in bytes
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']::text[]
    ),
    (
        'category-images',
        'category-images',
        true,
        5242880, -- 5MB in bytes
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
    ),
    (
        'gallery-images',
        'gallery-images',
        true,
        5242880, -- 5MB in bytes
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
    )
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Ensure RLS is enabled on storage.objects and storage.buckets
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Clean up any previous policies on these buckets
DROP POLICY IF EXISTS "Public read flower images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload flower images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update flower images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete flower images" ON storage.objects;

DROP POLICY IF EXISTS "Public select flower media buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Admin manage flower media buckets" ON storage.buckets;

-- 5. Bucket Level Policies
CREATE POLICY "Public select flower media buckets" ON storage.buckets
    FOR SELECT TO anon, authenticated
    USING (id IN ('product-images', 'category-images', 'gallery-images'));

CREATE POLICY "Admin manage flower media buckets" ON storage.buckets
    FOR ALL TO authenticated
    USING ((select public.is_admin()))
    WITH CHECK ((select public.is_admin()));

-- 6. Object Level Policies (storage.objects)

-- A. PUBLIC READ: Customers and storefront visitors can view published images
CREATE POLICY "Public read flower images" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id IN ('product-images', 'category-images', 'gallery-images'));

-- B. ADMIN INSERT: Uploading new photos
CREATE POLICY "Admin upload flower images" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id IN ('product-images', 'category-images', 'gallery-images')
        AND (select public.is_admin())
        AND (name !~ '\.\.') -- Prevent directory traversal
        AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'))
    );

-- C. ADMIN UPDATE / REPLACE: Required for upsert file replacement
CREATE POLICY "Admin update flower images" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id IN ('product-images', 'category-images', 'gallery-images')
        AND (select public.is_admin())
    )
    WITH CHECK (
        bucket_id IN ('product-images', 'category-images', 'gallery-images')
        AND (select public.is_admin())
        AND (name !~ '\.\.')
        AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'))
    );

-- D. ADMIN DELETE: Removing retired images
CREATE POLICY "Admin delete flower images" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id IN ('product-images', 'category-images', 'gallery-images')
        AND (select public.is_admin())
    );
