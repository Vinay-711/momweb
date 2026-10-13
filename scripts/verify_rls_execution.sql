-- ==========================================================
-- PADMA'S FLORAL — COMPREHENSIVE RLS VERIFICATION TEST
-- Executes real queries under anon, customer, and admin roles
-- ==========================================================

BEGIN;

-- Setup test users
INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'customer@example.com', '{"role":"authenticated"}', '{"role":"admin"}'), -- Malicious user attempting to set role=admin in user_metadata!
  ('22222222-2222-2222-2222-222222222222', 'admin_app_meta@example.com', '{"role":"admin"}', '{}'), -- Admin via app_metadata
  ('33333333-3333-3333-3333-333333333333', 'admin_table@example.com', '{"role":"authenticated"}', '{}') -- Admin via admin_users table
ON CONFLICT (id) DO NOTHING;

-- Register admin in dedicated admin_users table
INSERT INTO public.admin_users (id, email, role)
VALUES ('33333333-3333-3333-3333-333333333333', 'admin_table@example.com', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Add an existing test customer and existing test order
INSERT INTO public.customers (id, name, phone, email)
VALUES ('44444444-4444-4444-4444-444444444444', 'Pre-existing Customer', '9740030159', 'existing@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.orders (
    id, order_number, customer_id, customer_name, customer_phone, customer_email,
    delivery_address, delivery_city, delivery_pincode, delivery_date, delivery_time_slot,
    subtotal, delivery_fee, total, order_status, payment_status
) VALUES (
    '55555555-5555-5555-5555-555555555555', 'PF-2609-EXISTING',
    '44444444-4444-4444-4444-444444444444', 'Pre-existing Customer', '9740030159', 'existing@example.com',
    'Main Bazaar, Ramanagara', 'Ramanagara', '562159', CURRENT_DATE, 'Morning (8:00 AM - 12:00 PM)',
    549.00, 49.00, 598.00, 'pending', 'pending'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_items (
    id, order_id, product_id, product_name, quantity, unit_price, subtotal
) VALUES (
    '66666666-6666-6666-6666-666666666666',
    '55555555-5555-5555-5555-555555555555',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
    'Royal Jasmine & Rose Petal Garland',
    1, 549.00, 549.00
) ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ==========================================================
-- TEST SUITE 1: ANONYMOUS ROLE (PUBLIC STOREFRONT VISITOR)
-- ==========================================================
\echo '=================================================='
\echo 'TEST SUITE 1: ANONYMOUS PUBLIC CUSTOMER'
\echo '=================================================='

SET ROLE anon;
SET request.jwt.claims = '{"role": "anon"}';
SET request.jwt.claim.sub = '';

-- 1. Read active categories (MUST SUCCEED)
SELECT count(*) = 6 AS "TEST 1.1: Anon can read active categories" FROM public.categories;

-- 2. Read available products (MUST SUCCEED)
SELECT count(*) = 8 AS "TEST 1.2: Anon can read available products" FROM public.products;

-- 3. Read active business settings (MUST SUCCEED)
SELECT count(*) = 1 AS "TEST 1.3: Anon can read business settings" FROM public.business_settings;

-- 4. Read active delivery zones (MUST SUCCEED)
SELECT count(*) = 8 AS "TEST 1.4: Anon can read active delivery zones" FROM public.delivery_zones;

-- 5. Read customers (MUST BE BLOCKED / PERMISSION DENIED)
DO $$
BEGIN
    PERFORM count(*) FROM public.customers;
    RAISE EXCEPTION 'VULNERABLE: Anon should NOT be able to read customers';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'TEST 1.5: PASSED (Anon cannot read customer table — permission denied)';
END $$;

-- 6. Read orders (MUST BE BLOCKED / PERMISSION DENIED)
DO $$
BEGIN
    PERFORM count(*) FROM public.orders;
    RAISE EXCEPTION 'VULNERABLE: Anon should NOT be able to read orders';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'TEST 1.6: PASSED (Anon cannot read orders table — permission denied)';
END $$;

-- 7. Read order items (MUST BE BLOCKED / PERMISSION DENIED)
DO $$
BEGIN
    PERFORM count(*) FROM public.order_items;
    RAISE EXCEPTION 'VULNERABLE: Anon should NOT be able to read order items';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'TEST 1.7: PASSED (Anon cannot read order_items table — permission denied)';
END $$;

-- 8. Public creates order with valid pending data (MUST SUCCEED)
INSERT INTO public.orders (
    id, order_number, customer_name, customer_phone,
    delivery_address, delivery_city, delivery_pincode, delivery_date, delivery_time_slot,
    subtotal, delivery_fee, total, order_status, payment_status
) VALUES (
    '77777777-7777-7777-7777-777777777777', 'PF-2609-ANON1', 'Ramanagara Resident', '9740030159',
    'Ijoor Circle, Ramanagara', 'Ramanagara', '562159', CURRENT_DATE, 'Morning (8:00 AM - 12:00 PM)',
    549.00, 49.00, 598.00, 'pending', 'pending'
);
\echo 'TEST 1.8: PASSED (Anon successfully placed valid pending order)'

-- 9. Public creates order item for existing pending order (MUST SUCCEED)
INSERT INTO public.order_items (
    id, order_id, product_name, quantity, unit_price, subtotal
) VALUES (
    '88888888-8888-8888-8888-888888888888',
    '77777777-7777-7777-7777-777777777777',
    'Royal Jasmine & Rose Petal Garland',
    1, 549.00, 549.00
);
\echo 'TEST 1.9: PASSED (Anon successfully inserted order item for valid pending order)'

-- 10. Update product price / inventory as anon (MUST BE BLOCKED)
DO $$
BEGIN
    UPDATE public.products SET price = 1.00 WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11';
    RAISE EXCEPTION 'VULNERABLE: Anon should NOT have UPDATE permissions on products';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'TEST 1.10: PASSED (Anon cannot update product price — permission denied)';
END $$;

-- 11. Delete product as anon (MUST BE BLOCKED)
DO $$
BEGIN
    DELETE FROM public.products WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11';
    RAISE EXCEPTION 'VULNERABLE: Anon should NOT have DELETE permissions on products';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'TEST 1.11: PASSED (Anon cannot delete products — permission denied)';
END $$;

-- 12. Modify business settings as anon (MUST BE BLOCKED)
DO $$
BEGIN
    UPDATE public.business_settings SET phone = '0000000000';
    RAISE EXCEPTION 'VULNERABLE: Anon should NOT have UPDATE permissions on business_settings';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'TEST 1.12: PASSED (Anon cannot modify business settings — permission denied)';
END $$;

-- 13. Update arbitrary order as anon (MUST BE BLOCKED)
DO $$
BEGIN
    UPDATE public.orders SET order_status = 'delivered' WHERE order_number = 'PF-2609-EXISTING';
    RAISE EXCEPTION 'VULNERABLE: Anon should NOT have UPDATE permissions on orders';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'TEST 1.13: PASSED (Anon cannot update arbitrary orders — permission denied)';
END $$;

-- 14. Delete arbitrary order as anon (MUST BE BLOCKED)
DO $$
BEGIN
    DELETE FROM public.orders WHERE order_number = 'PF-2609-EXISTING';
    RAISE EXCEPTION 'VULNERABLE: Anon should NOT have DELETE permissions on orders';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'TEST 1.14: PASSED (Anon cannot delete arbitrary orders — permission denied)';
END $$;

-- 15. Lookup order via RPC (MUST SUCCEED FOR EXACT ORDER NUMBER)
SELECT (public.lookup_order('PF-2609-ANON1')->>'customer_name') = 'Ramanagara Resident' AS "TEST 1.15: Sanitized order lookup works for exact order";

-- 16. Lookup order with wrong phone (MUST RETURN NULL)
SELECT public.lookup_order('PF-2609-ANON1', '9999999999') IS NULL AS "TEST 1.16: Order lookup with mismatched phone returns NULL";


-- ==========================================================
-- TEST SUITE 2: MALICIOUS USER ATTEMPTING METADATA PRIVILEGE ESCALATION
-- User sets {"role": "admin"} in raw_user_meta_data
-- ==========================================================
\echo ''
\echo '=================================================='
\echo 'TEST SUITE 2: METADATA PRIVILEGE ESCALATION ATTEMPT'
\echo '=================================================='

SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
-- Simulate JWT with app_metadata=authenticated and user_metadata=admin
SET request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "app_metadata": {"role": "authenticated"}, "user_metadata": {"role": "admin"}}';

-- 1. Check is_admin() helper
SELECT public.is_admin() = false AS "TEST 2.1: is_admin() REJECTS user_metadata='admin'";

-- 2. Try to select all orders (MUST RETURN ONLY OWN ORDERS = 0)
SELECT count(*) = 0 AS "TEST 2.2: Malicious user CANNOT read other customers orders" FROM public.orders;

-- 3. Try to update product price (MUST EFFECT 0 ROWS)
UPDATE public.products SET price = 1.00 WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11';
SELECT price = 549.00 AS "TEST 2.3: Malicious user CANNOT update product prices" FROM public.products WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11';

-- 4. Try to read all customer records (MUST BE 0 ROWS)
SELECT count(*) = 0 AS "TEST 2.4: Malicious user CANNOT read customers table" FROM public.customers;


-- ==========================================================
-- TEST SUITE 3: AUTHENTICATED AUTHORIZED ADMIN (via app_metadata)
-- ==========================================================
\echo ''
\echo '=================================================='
\echo 'TEST SUITE 3: AUTHORIZED ADMIN (JWT app_metadata)'
\echo '=================================================='

SET ROLE authenticated;
SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
SET request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "app_metadata": {"role": "admin"}}';

-- 1. Check is_admin()
SELECT public.is_admin() = true AS "TEST 3.1: is_admin() recognizes app_metadata role='admin'";

-- 2. Admin reads all orders (MUST SUCCEED, >= 2 orders)
SELECT count(*) >= 2 AS "TEST 3.2: Admin can read all orders" FROM public.orders;

-- 3. Admin reads all customers (MUST SUCCEED, >= 1)
SELECT count(*) >= 1 AS "TEST 3.3: Admin can read all customers" FROM public.customers;

-- 4. Admin updates order status (MUST SUCCEED)
UPDATE public.orders SET order_status = 'confirmed' WHERE order_number = 'PF-2609-EXISTING';
SELECT order_status = 'confirmed' AS "TEST 3.4: Admin can update order status to confirmed" FROM public.orders WHERE order_number = 'PF-2609-EXISTING';

-- 5. Admin updates inventory (MUST SUCCEED)
UPDATE public.products SET stock_quantity = 30 WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11';
SELECT stock_quantity = 30 AS "TEST 3.5: Admin can manage product inventory" FROM public.products WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11';

-- 6. Admin creates new category (MUST SUCCEED)
INSERT INTO public.categories (name, slug, description, display_order, is_active)
VALUES ('Festival Specials', 'festival-specials', 'Special festive floral collections', 7, true);
SELECT count(*) = 7 AS "TEST 3.6: Admin can insert new category" FROM public.categories;

-- 7. Admin updates business settings (MUST SUCCEED)
UPDATE public.business_settings SET delivery_fee = 59.00;
SELECT delivery_fee = 59.00 AS "TEST 3.7: Admin can manage business settings" FROM public.business_settings;


-- ==========================================================
-- TEST SUITE 4: AUTHENTICATED AUTHORIZED ADMIN (via admin_users table)
-- ==========================================================
\echo ''
\echo '=================================================='
\echo 'TEST SUITE 4: AUTHORIZED ADMIN (dedicated admin_users table)'
\echo '=================================================='

SET ROLE authenticated;
SET request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
SET request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "app_metadata": {"role": "authenticated"}}';

-- 1. Check is_admin() via table lookup
SELECT public.is_admin() = true AS "TEST 4.1: is_admin() recognizes user in admin_users table";

-- 2. Admin can read all orders
SELECT count(*) >= 2 AS "TEST 4.2: Table-authorized admin can read all orders" FROM public.orders;

-- 3. Admin can update order status to 'delivered'
UPDATE public.orders SET order_status = 'delivered' WHERE order_number = 'PF-2609-EXISTING';
SELECT order_status = 'delivered' AS "TEST 4.3: Table-authorized admin can update order status to delivered" FROM public.orders WHERE order_number = 'PF-2609-EXISTING';

\echo ''
\echo '=================================================='
\echo 'ALL ROW LEVEL SECURITY VERIFICATION TESTS COMPLETED!'
\echo '=================================================='
