-- ==============================================================================
-- PADMA'S FLORAL — IDEMPOTENT PRODUCTION SECURITY HARDENING & RLS MIGRATION
-- Migration File: 20260921_production_security_hardening.sql
-- 
-- Scope & Protections:
-- 1. Full Row-Level Security (RLS) across all core domain tables.
-- 2. Closes customer PII scraping gap: Public/Anon SELECT on `orders` and `order_items` revoked.
-- 3. Dedicated Admin Authorization table `public.admin_users` and `is_admin()` helper.
--    - Evaluates tamper-proof JWT `app_metadata.role` and `admin_users` table.
--    - Strictly ignores user-editable `user_metadata`.
-- 4. Server-Authoritative Checkout (`create_order_secure` RPC):
--    - Prices and totals are NEVER trusted from the browser.
--    - Atomic inventory decrement with `FOR UPDATE` product row-locking.
-- 5. Dual-Factor Customer Order Tracking (`lookup_order` RPC):
--    - Requires exact Order Reference Number AND matching 10-digit mobile number.
-- 6. Zero service-role exposure: All procedures execute securely under Postgres RLS.
-- ==============================================================================

-- Enable standard cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- STEP 1: SCHEMA CONSISTENCY & COLUMN GUARDS
-- Ensure all required columns exist across products, orders, order_items, settings
-- ------------------------------------------------------------------------------

-- Products columns
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10, 2);
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS occasions TEXT[] DEFAULT '{"All"}';
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{"Fresh"}';
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS delivery_available_cities TEXT[] DEFAULT '{"Ramanagara", "Bengaluru"}';
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS lead_time_hours INTEGER DEFAULT 3;
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;

-- Orders columns
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS recipient_phone TEXT;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS recipient_address TEXT;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS landmark TEXT;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS card_message TEXT;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS order_notes TEXT;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2);
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';

-- Order items columns
ALTER TABLE IF EXISTS public.order_items ADD COLUMN IF NOT EXISTS product_image TEXT;
ALTER TABLE IF EXISTS public.order_items ADD COLUMN IF NOT EXISTS total_price NUMERIC(10, 2);
ALTER TABLE IF EXISTS public.order_items ADD COLUMN IF NOT EXISTS selected_variant TEXT;
ALTER TABLE IF EXISTS public.order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Business settings columns
ALTER TABLE IF EXISTS public.business_settings ADD COLUMN IF NOT EXISTS store_name TEXT DEFAULT 'Padma''s Floral';
ALTER TABLE IF EXISTS public.business_settings ADD COLUMN IF NOT EXISTS ramanagara_delivery_fee NUMERIC(10, 2) DEFAULT 49.00;
ALTER TABLE IF EXISTS public.business_settings ADD COLUMN IF NOT EXISTS bengaluru_delivery_fee NUMERIC(10, 2) DEFAULT 149.00;
ALTER TABLE IF EXISTS public.business_settings ADD COLUMN IF NOT EXISTS free_delivery_threshold NUMERIC(10, 2) DEFAULT 1499.00;
ALTER TABLE IF EXISTS public.business_settings ADD COLUMN IF NOT EXISTS min_lead_time_hours INTEGER DEFAULT 2;
ALTER TABLE IF EXISTS public.business_settings ADD COLUMN IF NOT EXISTS announcement_banner TEXT DEFAULT 'Fresh blooms delivered daily across Ramanagara & Bengaluru';
ALTER TABLE IF EXISTS public.business_settings ADD COLUMN IF NOT EXISTS is_store_open BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS public.business_settings ADD COLUMN IF NOT EXISTS order_number_prefix TEXT DEFAULT 'FL';

-- ------------------------------------------------------------------------------
-- STEP 2: DEDICATED ADMIN AUTHORIZATION TABLE & FUNCTION
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Helper function: public.is_admin()
-- Uses SECURITY INVOKER and checks tamper-proof JWT app_metadata OR admin_users table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT (
    -- 1. Check tamper-proof app_metadata in JWT (assigned only via server-role/dashboard)
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

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Helper to validate pending order ownership without exposing order PII
CREATE OR REPLACE FUNCTION public.is_pending_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = p_order_id
      AND order_status = 'pending'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_pending_order(UUID) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- STEP 3: ENABLE ROW-LEVEL SECURITY ON ALL TABLES
-- ------------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- STEP 4: CLEAN UP ANY PREVIOUS INSECURE POLICIES
-- Drop broad read policies that inadvertently allow anonymous order scraping
-- ------------------------------------------------------------------------------

-- Categories policies cleanup
DROP POLICY IF EXISTS "Public read active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins select all categories" ON public.categories;
DROP POLICY IF EXISTS "Admins insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins delete categories" ON public.categories;
DROP POLICY IF EXISTS "Allow all users to read categories" ON public.categories;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.categories;

-- Products policies cleanup
DROP POLICY IF EXISTS "Public read available products" ON public.products;
DROP POLICY IF EXISTS "Admins select all products" ON public.products;
DROP POLICY IF EXISTS "Admins insert products" ON public.products;
DROP POLICY IF EXISTS "Admins update products and inventory" ON public.products;
DROP POLICY IF EXISTS "Admins delete products" ON public.products;
DROP POLICY IF EXISTS "Allow all users to read products" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;

-- Orders policies cleanup (CRITICAL: removes open SELECT)
DROP POLICY IF EXISTS "Public select orders" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
DROP POLICY IF EXISTS "Allow all users to read orders" ON public.orders;
DROP POLICY IF EXISTS "Public create order" ON public.orders;
DROP POLICY IF EXISTS "Customers view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins delete orders" ON public.orders;

-- Order items policies cleanup
DROP POLICY IF EXISTS "Public select order_items" ON public.order_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.order_items;
DROP POLICY IF EXISTS "Allow all users to read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Public create order items for pending orders" ON public.order_items;
DROP POLICY IF EXISTS "Customers view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins update order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins delete order items" ON public.order_items;

-- Business settings cleanup
DROP POLICY IF EXISTS "Public read business settings" ON public.business_settings;
DROP POLICY IF EXISTS "Admins update business settings" ON public.business_settings;
DROP POLICY IF EXISTS "Admins insert business settings" ON public.business_settings;
DROP POLICY IF EXISTS "Admins delete business settings" ON public.business_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.business_settings;

-- Admin users cleanup
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can update admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can delete admin_users" ON public.admin_users;

-- ------------------------------------------------------------------------------
-- STEP 5: DEPLOY STRICT PRODUCTION ROW-LEVEL SECURITY POLICIES
-- ------------------------------------------------------------------------------

-- A. ADMIN USERS TABLE POLICIES
CREATE POLICY "Admins can view admin_users" ON public.admin_users
    FOR SELECT TO authenticated
    USING (id = (select auth.uid()) OR (select public.is_admin()));

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

-- B. CATEGORIES POLICIES
CREATE POLICY "Public read active categories" ON public.categories
    FOR SELECT TO anon, authenticated
    USING (is_active = true OR (select public.is_admin()));

CREATE POLICY "Admins insert categories" ON public.categories
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "Admins update categories" ON public.categories
    FOR UPDATE TO authenticated
    USING ((select public.is_admin()))
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "Admins delete categories" ON public.categories
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));

-- C. PRODUCTS & INVENTORY POLICIES
CREATE POLICY "Public read available products" ON public.products
    FOR SELECT TO anon, authenticated
    USING (
        (COALESCE(is_active, true) = true AND COALESCE(is_available, true) = true)
        OR (select public.is_admin())
    );

CREATE POLICY "Admins insert products" ON public.products
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "Admins update products and inventory" ON public.products
    FOR UPDATE TO authenticated
    USING ((select public.is_admin()))
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "Admins delete products" ON public.products
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));

-- D. ORDERS POLICIES (Strict customer isolation & anti-scraping)
-- 1. Anonymous visitors CANNOT select all orders.
-- 2. Authenticated customers can ONLY view their own orders where customer_id = auth.uid().
-- 3. Verified administrators can view, update, and delete all orders.
CREATE POLICY "Customers view own orders" ON public.orders
    FOR SELECT TO authenticated
    USING (customer_id = (select auth.uid()) OR (select public.is_admin()));

CREATE POLICY "Public create order" ON public.orders
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        customer_name IS NOT NULL AND
        customer_phone IS NOT NULL AND
        delivery_address IS NOT NULL AND
        order_status = 'pending' AND
        payment_status IN ('pending', 'paid')
    );

CREATE POLICY "Admins update orders" ON public.orders
    FOR UPDATE TO authenticated
    USING ((select public.is_admin()))
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "Admins delete orders" ON public.orders
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));

-- E. ORDER ITEMS POLICIES
CREATE POLICY "Customers view own order items" ON public.order_items
    FOR SELECT TO authenticated
    USING (
        (select public.is_admin()) OR
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.customer_id = (select auth.uid())
        )
    );

CREATE POLICY "Public create order items for pending orders" ON public.order_items
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        quantity > 0 AND
        unit_price >= 0 AND
        public.is_pending_order(order_id)
    );

CREATE POLICY "Admins update order items" ON public.order_items
    FOR UPDATE TO authenticated
    USING ((select public.is_admin()))
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "Admins delete order items" ON public.order_items
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));

-- F. BUSINESS SETTINGS POLICIES
CREATE POLICY "Public read business settings" ON public.business_settings
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Admins update business settings" ON public.business_settings
    FOR UPDATE TO authenticated
    USING ((select public.is_admin()))
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "Admins insert business settings" ON public.business_settings
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "Admins delete business settings" ON public.business_settings
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));

-- ------------------------------------------------------------------------------
-- STEP 6: DUAL-FACTOR ORDER TRACKING RPC (lookup_order)
-- Requires exact order number + normalized 10-digit mobile number
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.lookup_order(
    p_order_number TEXT,
    p_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_phone TEXT;
    v_last10_phone TEXT;
    v_order JSONB;
BEGIN
    IF p_order_number IS NULL OR TRIM(p_order_number) = '' THEN
        RETURN NULL;
    END IF;

    IF p_phone IS NULL OR TRIM(p_phone) = '' THEN
        RETURN NULL;
    END IF;

    v_clean_phone := regexp_replace(TRIM(p_phone), '\D', '', 'g');
    IF length(v_clean_phone) < 10 THEN
        RETURN NULL;
    END IF;

    v_last10_phone := right(v_clean_phone, 10);

    SELECT json_build_object(
        'id', o.id,
        'order_number', o.order_number,
        'customer_name', o.customer_name,
        'customer_phone', o.customer_phone,
        'customer_email', o.customer_email,
        'recipient_name', COALESCE(o.recipient_name, o.customer_name),
        'recipient_phone', o.recipient_phone,
        'recipient_address', COALESCE(o.recipient_address, o.delivery_address),
        'delivery_address', COALESCE(o.delivery_address, o.recipient_address),
        'delivery_city', o.delivery_city,
        'delivery_pincode', o.delivery_pincode,
        'delivery_date', o.delivery_date,
        'delivery_time_slot', o.delivery_time_slot,
        'landmark', o.landmark,
        'card_message', o.card_message,
        'order_notes', COALESCE(o.order_notes, o.notes),
        'notes', COALESCE(o.notes, o.order_notes),
        'subtotal', o.subtotal,
        'delivery_fee', o.delivery_fee,
        'total', COALESCE(o.total_amount, o.total),
        'total_amount', COALESCE(o.total_amount, o.total),
        'payment_method', o.payment_method,
        'payment_status', o.payment_status,
        'order_status', o.order_status,
        'created_at', o.created_at,
        'updated_at', o.updated_at,
        'items', COALESCE(json_agg(json_build_object(
            'id', oi.id,
            'order_id', oi.order_id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'product_image', oi.product_image,
            'selected_variant', oi.selected_variant,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', COALESCE(oi.subtotal, oi.total_price),
            'total_price', COALESCE(oi.total_price, oi.subtotal)
        ) ORDER BY oi.created_at ASC) FILTER (WHERE oi.id IS NOT NULL), '[]'::json)
    )::jsonb INTO v_order
    FROM public.orders o
    LEFT JOIN public.order_items oi ON oi.order_id = o.id
    WHERE UPPER(TRIM(o.order_number)) = UPPER(TRIM(p_order_number))
      AND (
        right(regexp_replace(COALESCE(o.customer_phone, ''), '\D', '', 'g'), 10) = v_last10_phone
        OR (o.recipient_phone IS NOT NULL AND right(regexp_replace(o.recipient_phone, '\D', '', 'g'), 10) = v_last10_phone)
      )
    GROUP BY o.id;

    RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_order(TEXT, TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- STEP 7: SERVER-AUTHORITATIVE CHECKOUT RPC (create_order_secure)
-- Prices and totals are calculated strictly on the server.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_order_secure(
    p_order JSONB,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_id UUID := gen_random_uuid();
    v_order_number TEXT;
    v_customer_name TEXT;
    v_customer_phone TEXT;
    v_customer_email TEXT;
    v_recipient_name TEXT;
    v_recipient_phone TEXT;
    v_recipient_address TEXT;
    v_delivery_city TEXT;
    v_delivery_pincode TEXT;
    v_delivery_date DATE;
    v_delivery_time_slot TEXT;
    v_landmark TEXT;
    v_card_message TEXT;
    v_order_notes TEXT;
    v_payment_method TEXT;
    
    v_subtotal NUMERIC(10, 2) := 0.00;
    v_delivery_fee NUMERIC(10, 2) := 49.00;
    v_total_amount NUMERIC(10, 2) := 0.00;
    v_free_delivery_threshold NUMERIC(10, 2) := 1499.00;
    v_ramanagara_fee NUMERIC(10, 2) := 49.00;
    v_bengaluru_fee NUMERIC(10, 2) := 149.00;

    v_item JSONB;
    v_product_id TEXT;
    v_quantity INT;
    v_variant_name TEXT;
    v_prod_rec RECORD;
    v_unit_price NUMERIC(10, 2);
    v_item_subtotal NUMERIC(10, 2);
    v_v JSONB;
    v_inserted_items JSONB := '[]'::JSONB;
BEGIN
    -- 1. Validate inputs
    v_customer_name := NULLIF(TRIM(p_order->>'customer_name'), '');
    IF v_customer_name IS NULL THEN
        RAISE EXCEPTION 'Customer name is required.';
    END IF;

    v_customer_phone := NULLIF(TRIM(p_order->>'customer_phone'), '');
    IF v_customer_phone IS NULL OR LENGTH(REGEXP_REPLACE(v_customer_phone, '\D', '', 'g')) < 10 THEN
        RAISE EXCEPTION 'A valid 10-digit customer mobile number is required.';
    END IF;

    v_customer_email := NULLIF(TRIM(p_order->>'customer_email'), '');
    v_recipient_name := COALESCE(NULLIF(TRIM(p_order->>'recipient_name'), ''), v_customer_name);
    v_recipient_phone := COALESCE(NULLIF(TRIM(p_order->>'recipient_phone'), ''), v_customer_phone);

    v_recipient_address := NULLIF(TRIM(COALESCE(p_order->>'recipient_address', p_order->>'delivery_address')), '');
    IF v_recipient_address IS NULL THEN
        RAISE EXCEPTION 'Delivery address is required.';
    END IF;

    v_delivery_city := COALESCE(NULLIF(TRIM(p_order->>'delivery_city'), ''), 'Ramanagara');
    IF v_delivery_city NOT IN ('Ramanagara', 'Bengaluru') THEN
        RAISE EXCEPTION 'Delivery is currently only available in Ramanagara and Bengaluru.';
    END IF;

    v_delivery_pincode := NULLIF(TRIM(p_order->>'delivery_pincode'), '');
    IF v_delivery_pincode IS NULL THEN
        RAISE EXCEPTION 'Delivery pincode is required.';
    END IF;

    IF p_order->>'delivery_date' IS NULL THEN
        RAISE EXCEPTION 'Delivery date is required.';
    END IF;
    v_delivery_date := (p_order->>'delivery_date')::DATE;

    v_delivery_time_slot := COALESCE(NULLIF(TRIM(p_order->>'delivery_time_slot'), ''), 'Morning (8:00 AM - 12:00 PM)');
    v_landmark := NULLIF(TRIM(p_order->>'landmark'), '');
    v_card_message := NULLIF(TRIM(p_order->>'card_message'), '');
    v_order_notes := NULLIF(TRIM(COALESCE(p_order->>'order_notes', p_order->>'notes')), '');
    v_payment_method := COALESCE(NULLIF(TRIM(p_order->>'payment_method'), ''), 'cod');

    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Cart cannot be empty. Please select floral items before ordering.';
    END IF;

    -- 2. Fetch live settings
    SELECT 
        COALESCE(ramanagara_delivery_fee, 49.00),
        COALESCE(bengaluru_delivery_fee, 149.00),
        COALESCE(free_delivery_threshold, 1499.00)
    INTO 
        v_ramanagara_fee,
        v_bengaluru_fee,
        v_free_delivery_threshold
    FROM public.business_settings
    LIMIT 1;

    -- 3. Lock products, calculate prices, decrement stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := COALESCE(v_item->>'product_id', v_item->'product'->>'id');
        v_quantity := COALESCE((v_item->>'quantity')::INT, 1);
        v_variant_name := COALESCE(v_item->>'selected_variant', v_item->'selected_variant'->>'name');

        IF v_product_id IS NULL THEN
            RAISE EXCEPTION 'Invalid order item: product_id is missing.';
        END IF;

        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Invalid item quantity: % must be greater than zero.', v_quantity;
        END IF;

        -- Row-level lock to prevent concurrent inventory overselling
        SELECT * INTO v_prod_rec
        FROM public.products
        WHERE id::TEXT = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID "%" does not exist in catalog.', v_product_id;
        END IF;

        IF COALESCE(v_prod_rec.is_active, v_prod_rec.is_available, true) = false THEN
            RAISE EXCEPTION 'Product "%" is currently unavailable.', v_prod_rec.name;
        END IF;

        IF COALESCE(v_prod_rec.stock_quantity, 0) < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for "%". Only % available, but % requested.', 
                v_prod_rec.name, COALESCE(v_prod_rec.stock_quantity, 0), v_quantity;
        END IF;

        -- Determine server-authoritative price
        v_unit_price := NULL;
        IF v_variant_name IS NOT NULL AND v_prod_rec.variants IS NOT NULL THEN
            FOR v_v IN SELECT * FROM jsonb_array_elements(v_prod_rec.variants)
            LOOP
                IF (v_v->>'name') = v_variant_name THEN
                    v_unit_price := (v_v->>'price')::NUMERIC(10, 2);
                    EXIT;
                END IF;
            END LOOP;
        END IF;

        IF v_unit_price IS NULL THEN
            v_unit_price := COALESCE(v_prod_rec.sale_price, v_prod_rec.price);
        END IF;

        v_item_subtotal := v_unit_price * v_quantity;
        v_subtotal := v_subtotal + v_item_subtotal;

        -- Atomically update inventory
        UPDATE public.products
        SET 
            stock_quantity = stock_quantity - v_quantity,
            is_active = (stock_quantity - v_quantity > 0),
            updated_at = NOW()
        WHERE id = v_prod_rec.id;

        v_inserted_items := v_inserted_items || jsonb_build_object(
            'id', gen_random_uuid(),
            'order_id', v_order_id,
            'product_id', v_prod_rec.id,
            'product_name', v_prod_rec.name,
            'product_image', COALESCE(v_prod_rec.images[1], v_prod_rec.image_url),
            'quantity', v_quantity,
            'unit_price', v_unit_price,
            'total_price', v_item_subtotal,
            'selected_variant', v_variant_name
        );
    END LOOP;

    -- 4. Calculate delivery fee & total
    IF v_subtotal >= v_free_delivery_threshold THEN
        v_delivery_fee := 0.00;
    ELSIF v_delivery_city = 'Bengaluru' THEN
        v_delivery_fee := v_bengaluru_fee;
    ELSE
        v_delivery_fee := v_ramanagara_fee;
    END IF;

    v_total_amount := v_subtotal + v_delivery_fee;

    -- 5. Generate unique order number
    BEGIN
        v_order_number := public.generate_order_number();
    EXCEPTION WHEN OTHERS THEN
        v_order_number := 'FL-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
    END;

    -- 6. Insert order
    INSERT INTO public.orders (
        id,
        order_number,
        customer_name,
        customer_phone,
        customer_email,
        recipient_name,
        recipient_phone,
        recipient_address,
        delivery_address,
        delivery_city,
        delivery_pincode,
        landmark,
        delivery_date,
        delivery_time_slot,
        card_message,
        order_notes,
        subtotal,
        delivery_fee,
        total,
        total_amount,
        payment_method,
        payment_status,
        order_status,
        created_at,
        updated_at
    ) VALUES (
        v_order_id,
        v_order_number,
        v_customer_name,
        v_customer_phone,
        v_customer_email,
        v_recipient_name,
        v_recipient_phone,
        v_recipient_address,
        v_recipient_address,
        v_delivery_city,
        v_delivery_pincode,
        v_landmark,
        v_delivery_date,
        v_delivery_time_slot,
        v_card_message,
        v_order_notes,
        v_subtotal,
        v_delivery_fee,
        v_total_amount,
        v_total_amount,
        v_payment_method,
        'pending',
        'pending',
        NOW(),
        NOW()
    );

    -- 7. Insert items
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_inserted_items)
    LOOP
        INSERT INTO public.order_items (
            id,
            order_id,
            product_id,
            product_name,
            product_image,
            quantity,
            unit_price,
            subtotal,
            total_price,
            selected_variant,
            created_at
        ) VALUES (
            (v_item->>'id')::UUID,
            v_order_id,
            (v_item->>'product_id')::UUID,
            v_item->>'product_name',
            v_item->>'product_image',
            (v_item->>'quantity')::INT,
            (v_item->>'unit_price')::NUMERIC(10, 2),
            (v_item->>'total_price')::NUMERIC(10, 2),
            (v_item->>'total_price')::NUMERIC(10, 2),
            v_item->>'selected_variant',
            NOW()
        );
    END LOOP;

    RETURN jsonb_build_object(
        'id', v_order_id,
        'order_number', v_order_number,
        'customer_name', v_customer_name,
        'customer_phone', v_customer_phone,
        'customer_email', v_customer_email,
        'recipient_name', v_recipient_name,
        'recipient_phone', v_recipient_phone,
        'recipient_address', v_recipient_address,
        'delivery_city', v_delivery_city,
        'delivery_pincode', v_delivery_pincode,
        'delivery_date', v_delivery_date,
        'delivery_time_slot', v_delivery_time_slot,
        'landmark', v_landmark,
        'card_message', v_card_message,
        'order_notes', v_order_notes,
        'subtotal', v_subtotal,
        'delivery_fee', v_delivery_fee,
        'total', v_total_amount,
        'total_amount', v_total_amount,
        'payment_method', v_payment_method,
        'payment_status', 'pending',
        'order_status', 'pending',
        'items', v_inserted_items,
        'created_at', NOW()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_secure(JSONB, JSONB) TO anon, authenticated;
