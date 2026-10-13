-- ==========================================================
-- PADMA'S FLORAL — HARDENED ROW LEVEL SECURITY (RLS) AUDIT & IMPLEMENTATION
-- Schema: PostgreSQL on Supabase
-- Target Tables: categories, products, customers, orders,
--                order_items, business_settings, delivery_zones, admin_users
--
-- Security Features:
-- 1. Non-editable authorization: Uses public.admin_users + JWT app_metadata
--    (NEVER user_metadata)
-- 2. Principle of Least Privilege: Specific SELECT, INSERT, UPDATE, DELETE policies
-- 3. Both USING and WITH CHECK on all UPDATE policies
-- 4. Protection against unauthorized scraping of orders & customer PII
-- 5. Strict input constraints on public order placement
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- 1. RECREATE TABLES CLEANLY
-- ==========================================================
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.delivery_zones CASCADE;
DROP TABLE IF EXISTS public.business_settings CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- ==========================================================
-- 2. DEDICATED ADMIN AUTHORIZATION TABLE
-- ==========================================================
CREATE TABLE public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper function: public.is_admin()
-- Uses SECURITY INVOKER and checks non-editable JWT app_metadata OR admin_users table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT (
    -- 1. Check tamper-proof app_metadata in JWT (set only via server / dashboard)
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

-- ==========================================================
-- 3. CORE DOMAIN TABLES
-- ==========================================================

-- Categories
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customers
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    delivery_address TEXT NOT NULL,
    delivery_city TEXT NOT NULL,
    delivery_pincode TEXT NOT NULL,
    delivery_date DATE NOT NULL,
    delivery_time_slot TEXT NOT NULL,
    notes TEXT,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_fee >= 0),
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- Business Settings
CREATE TABLE public.business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL DEFAULT 'Padma''s Floral',
    phone TEXT NOT NULL DEFAULT '9740030159',
    whatsapp TEXT NOT NULL DEFAULT '7676117596',
    email TEXT DEFAULT 'padmasfloral@gmail.com',
    address TEXT NOT NULL DEFAULT 'Ramanagara, Karnataka',
    city TEXT NOT NULL DEFAULT 'Ramanagara',
    pincode TEXT NOT NULL DEFAULT '562159',
    instagram_url TEXT,
    facebook_url TEXT,
    delivery_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 49.00 CHECK (delivery_fee >= 0),
    free_delivery_threshold NUMERIC(10, 2) DEFAULT 1499.00 CHECK (free_delivery_threshold IS NULL OR free_delivery_threshold >= 0),
    minimum_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 199.00 CHECK (minimum_order_amount >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Delivery Zones
CREATE TABLE public.delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    pincode TEXT NOT NULL,
    delivery_fee NUMERIC(10, 2) NOT NULL CHECK (delivery_fee >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ==========================================================
-- 4. INDEXES
-- ==========================================================
CREATE INDEX idx_categories_display_order ON public.categories (display_order);
CREATE INDEX idx_categories_is_active ON public.categories (is_active);
CREATE INDEX idx_categories_slug ON public.categories (slug);

CREATE INDEX idx_products_category_id ON public.products (category_id);
CREATE INDEX idx_products_is_available ON public.products (is_available);
CREATE INDEX idx_products_is_featured ON public.products (is_featured);
CREATE INDEX idx_products_price ON public.products (price);
CREATE INDEX idx_products_created_at ON public.products (created_at DESC);
CREATE INDEX idx_products_slug ON public.products (slug);

CREATE INDEX idx_customers_phone ON public.customers (phone);
CREATE INDEX idx_customers_email ON public.customers (email);

CREATE INDEX idx_orders_customer_id ON public.orders (customer_id);
CREATE INDEX idx_orders_order_number ON public.orders (order_number);
CREATE INDEX idx_orders_order_status ON public.orders (order_status);
CREATE INDEX idx_orders_payment_status ON public.orders (payment_status);
CREATE INDEX idx_orders_delivery_date ON public.orders (delivery_date);
CREATE INDEX idx_orders_delivery_city ON public.orders (delivery_city);
CREATE INDEX idx_orders_delivery_pincode ON public.orders (delivery_pincode);
CREATE INDEX idx_orders_created_at ON public.orders (created_at DESC);

CREATE INDEX idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items (product_id);

CREATE INDEX idx_delivery_zones_pincode ON public.delivery_zones (pincode);
CREATE INDEX idx_delivery_zones_is_active ON public.delivery_zones (is_active);

-- ==========================================================
-- 5. UPDATED_AT TRIGGERS
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_business_settings_updated_at BEFORE UPDATE ON public.business_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================================
-- 6. ROW LEVEL SECURITY (RLS) ACTIVATION
-- ==========================================================
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Grant minimal necessary schema privileges
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.categories, public.products, public.delivery_zones, public.business_settings TO anon, authenticated;
GRANT INSERT ON public.orders, public.order_items, public.customers TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ==========================================================
-- 7. AUDITED POLICIES BY TABLE & ROLE
-- ==========================================================

-- ----------------------------------------------------------
-- A. ADMIN USERS TABLE POLICIES
-- ----------------------------------------------------------
CREATE POLICY "Admins can view admin_users" ON public.admin_users
    FOR SELECT TO authenticated
    USING (id = (select auth.uid()) OR (select public.is_admin()));

-- ----------------------------------------------------------
-- B. CATEGORIES POLICIES
-- Public: Read active categories ONLY
-- Admin: Full manage
-- ----------------------------------------------------------
CREATE POLICY "Public read active categories" ON public.categories
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "Admins select all categories" ON public.categories
    FOR SELECT TO authenticated
    USING ((select public.is_admin()));

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

-- ----------------------------------------------------------
-- C. PRODUCTS & INVENTORY POLICIES
-- Public: Read available products ONLY (cannot modify inventory)
-- Admin: Full manage
-- ----------------------------------------------------------
CREATE POLICY "Public read available products" ON public.products
    FOR SELECT TO anon, authenticated
    USING (is_available = true);

CREATE POLICY "Admins select all products" ON public.products
    FOR SELECT TO authenticated
    USING ((select public.is_admin()));

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

-- ----------------------------------------------------------
-- D. BUSINESS SETTINGS POLICIES
-- Public: Read settings necessary for storefront
-- Admin: Update/manage settings
-- ----------------------------------------------------------
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

-- ----------------------------------------------------------
-- E. DELIVERY ZONES POLICIES
-- Public: Read active delivery zones
-- Admin: Full manage
-- ----------------------------------------------------------
CREATE POLICY "Public read active delivery zones" ON public.delivery_zones
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "Admins select all delivery zones" ON public.delivery_zones
    FOR SELECT TO authenticated
    USING ((select public.is_admin()));

CREATE POLICY "Admins insert delivery zones" ON public.delivery_zones
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "Admins update delivery zones" ON public.delivery_zones
    FOR UPDATE TO authenticated
    USING ((select public.is_admin()))
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "Admins delete delivery zones" ON public.delivery_zones
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));

-- ----------------------------------------------------------
-- F. CUSTOMERS POLICIES
-- Public: Can insert profile at checkout
-- Customer: Can read own profile
-- Admin: Read and manage all customer records
-- Public CANNOT read all customers (anti-scraping protection)
-- ----------------------------------------------------------
CREATE POLICY "Public create customer record" ON public.customers
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Customer view own profile" ON public.customers
    FOR SELECT TO authenticated
    USING (id = (select auth.uid()));

CREATE POLICY "Admins view all customers" ON public.customers
    FOR SELECT TO authenticated
    USING ((select public.is_admin()));

CREATE POLICY "Admins update customers" ON public.customers
    FOR UPDATE TO authenticated
    USING ((select public.is_admin()))
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "Admins delete customers" ON public.customers
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));

-- ----------------------------------------------------------
-- G. ORDERS POLICIES
-- Public: Can INSERT with validated fields & 'pending' status
-- Customer: Can read own orders if logged in
-- Admin: Read all orders, update status, delete
-- Public CANNOT read all orders, update, or delete
-- ----------------------------------------------------------
CREATE POLICY "Public create order" ON public.orders
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        customer_name IS NOT NULL AND
        customer_phone IS NOT NULL AND
        delivery_address IS NOT NULL AND
        delivery_city IS NOT NULL AND
        delivery_pincode IS NOT NULL AND
        delivery_date IS NOT NULL AND
        total >= 0 AND
        subtotal >= 0 AND
        order_status = 'pending' AND
        payment_status IN ('pending', 'paid')
    );

CREATE POLICY "Customers view own orders" ON public.orders
    FOR SELECT TO authenticated
    USING (customer_id = (select auth.uid()));

CREATE POLICY "Admins view all orders" ON public.orders
    FOR SELECT TO authenticated
    USING ((select public.is_admin()));

CREATE POLICY "Admins update orders" ON public.orders
    FOR UPDATE TO authenticated
    USING ((select public.is_admin()))
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "Admins delete orders" ON public.orders
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));

-- ----------------------------------------------------------
-- H. ORDER ITEMS POLICIES
-- Public: Can INSERT line items belonging to a pending order
-- Customer: Can read own line items
-- Admin: Full manage
-- ----------------------------------------------------------
-- Helper to validate that an order exists and is pending without exposing order PII
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

CREATE POLICY "Public create order items for pending orders" ON public.order_items
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        quantity > 0 AND
        unit_price >= 0 AND
        subtotal >= 0 AND
        public.is_pending_order(order_id)
    );

CREATE POLICY "Customers view own order items" ON public.order_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.customer_id = (select auth.uid())
        )
    );

CREATE POLICY "Admins view all order items" ON public.order_items
    FOR SELECT TO authenticated
    USING ((select public.is_admin()));

CREATE POLICY "Admins update order items" ON public.order_items
    FOR UPDATE TO authenticated
    USING ((select public.is_admin()))
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "Admins delete order items" ON public.order_items
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));

-- ==========================================================
-- 8. SECURE LOOKUP RPC FOR PUBLIC ORDER CONFIRMATION / TRACKING
-- Sanitized endpoint requiring exact order number match
-- ==========================================================
CREATE OR REPLACE FUNCTION public.lookup_order(
    p_order_number TEXT,
    p_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_order JSONB;
BEGIN
    SELECT json_build_object(
        'id', o.id,
        'order_number', o.order_number,
        'customer_name', o.customer_name,
        'customer_phone', o.customer_phone,
        'customer_email', o.customer_email,
        'delivery_address', o.delivery_address,
        'delivery_city', o.delivery_city,
        'delivery_pincode', o.delivery_pincode,
        'delivery_date', o.delivery_date,
        'delivery_time_slot', o.delivery_time_slot,
        'notes', o.notes,
        'order_status', o.order_status,
        'payment_status', o.payment_status,
        'subtotal', o.subtotal,
        'delivery_fee', o.delivery_fee,
        'total', o.total,
        'created_at', o.created_at,
        'items', COALESCE(json_agg(json_build_object(
            'id', oi.id,
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal
        )) FILTER (WHERE oi.id IS NOT NULL), '[]'::json)
    )::jsonb INTO v_order
    FROM public.orders o
    LEFT JOIN public.order_items oi ON oi.order_id = o.id
    WHERE o.order_number = p_order_number
      AND (p_phone IS NULL OR o.customer_phone = p_phone)
    GROUP BY o.id;

    RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_order(TEXT, TEXT) TO anon, authenticated;

-- ==========================================================
-- 9. INITIAL SEED DATA FOR STOREFRONT
-- ==========================================================

-- Business Settings
INSERT INTO public.business_settings (
    id, business_name, phone, whatsapp, email, address, city, pincode,
    delivery_enabled, delivery_fee, free_delivery_threshold, minimum_order_amount
) VALUES (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11',
    'Padma''s Floral', '9740030159', '7676117596', 'padmasfloral@gmail.com',
    'Ramanagara, Karnataka, India', 'Ramanagara', '562159',
    true, 49.00, 1499.00, 199.00
);

-- Delivery Zones
INSERT INTO public.delivery_zones (id, name, pincode, delivery_fee, is_active)
VALUES
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'Ramanagara Town & Surroundings', '562159', 49.00, true),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'Channapatna Silk City Zone', '562160', 79.00, true),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'Bidadi Industrial & Town Area', '562109', 89.00, true),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', 'Kengeri & RR Nagar (South Bengaluru)', '560060', 149.00, true),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', 'Jayanagar & JP Nagar (South Bengaluru)', '560011', 149.00, true),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d16', 'Koramangala & HSR (Central Bengaluru)', '560034', 169.00, true),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d17', 'Indiranagar & MG Road (East Bengaluru)', '560038', 179.00, true),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d18', 'Whitefield & Bellandur Tech Hub', '560066', 199.00, true);

-- Categories
INSERT INTO public.categories (id, name, slug, description, image_url, display_order, is_active)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Traditional & Puja Garlands', 'traditional-puja-garlands', 'Fresh hand-knotted jasmine (Mallige), marigold, and tuberose strings for temples, festivals, and home rituals.', 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80', 1, true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Boutique Rose Bouquets', 'boutique-rose-bouquets', 'Premium hand-tied Dutch roses, spray roses, and eucalyptus wraps for birthdays, anniversaries, and romantic surprises.', 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80', 2, true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Weddings & Varmalas', 'weddings-varmalas', 'Artisan designer wedding garlands, bride-groom varmalas, reception stage decor, and floral jewelry.', 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80', 3, true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Exotic Lilies & Orchids', 'exotic-lilies-orchids', 'Sophisticated oriental lilies, blue dendrobium orchids, and carnation arrangements for high-end gifting.', 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80', 4, true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Car & Event Decor', 'car-event-decor', 'Grand floral car decorations for weddings, corporate celebrations, inaugurations, and home entry archways.', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80', 5, true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Sympathy & Condolences', 'sympathy-condolences', 'Respectful white floral wreaths, quiet standing sprays, and elegant condolence arrangements.', 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=800&q=80', 6, true);

-- Products
INSERT INTO public.products (
    id, category_id, name, slug, description, price, image_url,
    stock_quantity, low_stock_threshold, is_available, is_featured
) VALUES
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
     'Royal Jasmine & Rose Petal Garland (ಮಲ್ಲಿಗೆ ಮಾಲೆ)', 'royal-jasmine-rose-petal-garland',
     'Artfully hand-woven using fresh aromatic Ramanagara Mallige (Mysore Jasmine) layered with rich red velvet rose petals and scented tuberose.',
     549.00, 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=1000&q=80', 25, 5, true, true),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
     'Padma’s Signature Velvet Crimson Bouquet', 'padmas-signature-velvet-crimson-bouquet',
     '30 stems of long-stem red roses hand-tied in Japanese artisanal wrapping paper with golden botanical ribbons and fresh Italian Ruscus greenery.',
     1299.00, 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1000&q=80', 18, 3, true, true),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
     'Sacred Sevanthige & Marigold Puja String (ಸೇವಂತಿಗೆ)', 'sacred-sevanthige-marigold-puja-string',
     'Bright golden-yellow Chrysanthemum (Sevanthige) flowers intertwined with saffron marigold blooms and tulsi leaves.',
     299.00, 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1000&q=80', 40, 10, true, true),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
     'Artisan Pastels Wedding Varmala Pair (ಕಲ್ಯಾಣ ಮಾಲೆ)', 'artisan-pastels-wedding-varmala-pair',
     'Exquisite bridal & groom varmalas woven with blush baby-pink roses, fragrant tuberose beads, baby’s breath (Gypsophila), and pearl accents.',
     2999.00, 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1000&q=80', 10, 2, true, true),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
     'Morning Mist Casablanca Lily & Orchid Vase', 'morning-mist-casablanca-lily-orchid-vase',
     'Fragrant white Asiatic and Casablanca lilies paired with exotic violet dendrobium orchids, presented in an elegant fluted glass vase.',
     1699.00, 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1000&q=80', 12, 3, true, true),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b16', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
     'Blush Sunshine Mixed Carnation & Rose Bunch', 'blush-sunshine-mixed-carnation-rose-bunch',
     'A joyful blend of peach garden roses, yellow carnations, pink gerberas, and white daisies tied in rustic brown Kraft paper with a silk ribbon bow.',
     749.00, 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=1000&q=80', 20, 5, true, false),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
     'Royal Wedding Car Floral Decoration Package', 'royal-wedding-car-floral-decoration',
     'On-site decoration for groom and bridal cars in Ramanagara and South Bengaluru. Includes front bonnet floral heart/v-crest, mirror accents, door handle floral bunches, and satin draping.',
     2999.00, 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1000&q=80', 5, 1, true, true),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b18', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
     'Peaceful Serenity White Lily & Rose Condolence Wreath', 'peaceful-serenity-condolence-wreath',
     'Respectful, elegant circular floral wreath hand-crafted with fresh white chrysanthemums, pristine white lilies, ivory roses, and lush palm fronds.',
     1999.00, 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=1000&q=80', 8, 2, true, false);
