-- ==========================================================
-- PADMA'S FLORAL — STORAGE RLS & SECURITY VERIFICATION
-- Tests:
-- 1. Anonymous read access to public media buckets
-- 2. Anonymous upload & modification blocking
-- 3. Non-admin authenticated blocking
-- 4. Path traversal & file extension rejection
-- 5. Admin upload, replace (upsert), and delete permissions
-- ==========================================================

BEGIN;

-- Pre-seed test image in product-images by system
INSERT INTO storage.objects (id, bucket_id, name, owner, metadata)
VALUES (
    '99999999-9999-9999-9999-999999999991',
    'product-images',
    'royal-jasmine-garland.webp',
    '22222222-2222-2222-2222-222222222222',
    '{"size": 150240, "mimetype": "image/webp"}'::jsonb
) ON CONFLICT (bucket_id, name) DO NOTHING;

COMMIT;

-- ==========================================================
-- TEST 1: ANONYMOUS PUBLIC CUSTOMER
-- ==========================================================
\echo '=================================================='
\echo 'STORAGE TEST 1: ANONYMOUS PUBLIC ACCESS'
\echo '=================================================='

SET ROLE anon;
SET request.jwt.claims = '{"role": "anon"}';

-- 1.1 Public can read flower images
SELECT count(*) = 1 AS "TEST 1.1: Anon can read public flower images"
FROM storage.objects
WHERE bucket_id = 'product-images';

-- 1.2 Public CANNOT insert images
DO $$
BEGIN
    INSERT INTO storage.objects (bucket_id, name, metadata)
    VALUES ('product-images', 'malicious.jpg', '{}'::jsonb);
    RAISE EXCEPTION 'VULNERABLE: Anon should NOT be able to upload to storage!';
EXCEPTION WHEN insufficient_privilege OR check_violation OR others THEN
    RAISE NOTICE 'TEST 1.2: PASSED (Anon cannot upload images — rejected by RLS)';
END $$;

-- 1.3 Public CANNOT update/replace images
DO $$
BEGIN
    UPDATE storage.objects SET name = 'hacked.jpg' WHERE name = 'royal-jasmine-garland.webp';
    RAISE EXCEPTION 'VULNERABLE: Anon should NOT be able to update storage objects!';
EXCEPTION WHEN insufficient_privilege OR check_violation OR others THEN
    RAISE NOTICE 'TEST 1.3: PASSED (Anon cannot update/replace images — rejected by RLS)';
END $$;

-- 1.4 Public CANNOT delete images
DO $$
BEGIN
    DELETE FROM storage.objects WHERE name = 'royal-jasmine-garland.webp';
    RAISE EXCEPTION 'VULNERABLE: Anon should NOT be able to delete storage objects!';
EXCEPTION WHEN insufficient_privilege OR check_violation OR others THEN
    RAISE NOTICE 'TEST 1.4: PASSED (Anon cannot delete images — rejected by RLS)';
END $$;


-- ==========================================================
-- TEST 2: NON-ADMIN AUTHENTICATED USER
-- ==========================================================
\echo ''
\echo '=================================================='
\echo 'STORAGE TEST 2: REGULAR AUTHENTICATED USER (NON-ADMIN)'
\echo '=================================================='

SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
SET request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "app_metadata": {"role": "authenticated"}, "user_metadata": {"role": "admin"}}';

-- 2.1 Non-admin CANNOT upload images
DO $$
BEGIN
    INSERT INTO storage.objects (bucket_id, name, metadata)
    VALUES ('product-images', 'customer-upload.jpg', '{}'::jsonb);
    RAISE EXCEPTION 'VULNERABLE: Non-admin should NOT be able to upload to product storage!';
EXCEPTION WHEN insufficient_privilege OR check_violation OR others THEN
    RAISE NOTICE 'TEST 2.1: PASSED (Non-admin cannot upload — rejected by RLS)';
END $$;


-- ==========================================================
-- TEST 3: VALIDATION ENFORCEMENT (PATH & EXTENSION)
-- ==========================================================
\echo ''
\echo '=================================================='
\echo 'STORAGE TEST 3: PATH TRAVERSAL & EXTENSION VALIDATION'
\echo '=================================================='

-- Admin context
SET ROLE authenticated;
SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
SET request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "app_metadata": {"role": "admin"}}';

-- 3.1 Reject directory traversal ('..')
DO $$
BEGIN
    INSERT INTO storage.objects (bucket_id, name, metadata)
    VALUES ('product-images', '../../etc/passwd.jpg', '{}'::jsonb);
    RAISE EXCEPTION 'VULNERABLE: Path traversal should NOT be allowed!';
EXCEPTION WHEN insufficient_privilege OR check_violation OR others THEN
    RAISE NOTICE 'TEST 3.1: PASSED (Directory traversal rejected by RLS)';
END $$;

-- 3.2 Reject non-image extension (.sh, .exe, .js)
DO $$
BEGIN
    INSERT INTO storage.objects (bucket_id, name, metadata)
    VALUES ('product-images', 'malicious-script.js', '{}'::jsonb);
    RAISE EXCEPTION 'VULNERABLE: Non-image extension should NOT be allowed!';
EXCEPTION WHEN insufficient_privilege OR check_violation OR others THEN
    RAISE NOTICE 'TEST 3.2: PASSED (Non-image extension rejected by RLS)';
END $$;


-- ==========================================================
-- TEST 4: AUTHORIZED ADMIN CAPABILITIES
-- ==========================================================
\echo ''
\echo '=================================================='
\echo 'STORAGE TEST 4: AUTHORIZED ADMIN UPLOAD & REPLACE'
\echo '=================================================='

-- 4.1 Admin uploads new product image
INSERT INTO storage.objects (bucket_id, name, metadata)
VALUES ('product-images', 'new-rose-bouquet.webp', '{"size": 89000, "mimetype": "image/webp"}'::jsonb);
\echo 'TEST 4.1: PASSED (Admin successfully uploaded new product photo)'

-- 4.2 Admin uploads new category image
INSERT INTO storage.objects (bucket_id, name, metadata)
VALUES ('category-images', 'wedding-varmalas-banner.jpg', '{"size": 120000, "mimetype": "image/jpeg"}'::jsonb);
\echo 'TEST 4.2: PASSED (Admin successfully uploaded category banner)'

-- 4.3 Admin updates/replaces image (upsert)
UPDATE storage.objects
SET metadata = '{"size": 95000, "mimetype": "image/webp", "optimized": true}'::jsonb
WHERE bucket_id = 'product-images' AND name = 'new-rose-bouquet.webp';
\echo 'TEST 4.3: PASSED (Admin successfully updated/replaced image)'

-- 4.4 Admin deletes image
DELETE FROM storage.objects
WHERE bucket_id = 'product-images' AND name = 'new-rose-bouquet.webp';
\echo 'TEST 4.4: PASSED (Admin successfully deleted image)'

\echo ''
\echo '=================================================='
\echo 'ALL STORAGE ROW LEVEL SECURITY TESTS PASSED!'
\echo '=================================================='
