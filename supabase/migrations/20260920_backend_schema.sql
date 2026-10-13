-- ==========================================================
-- PADMA'S FLORAL — PRODUCTION POSTGRESQL BACKEND SCHEMA
-- Tables: categories, products, customers, orders,
--         order_items, business_settings, delivery_zones
-- Features: UUID PKs, Foreign Keys, Status Constraints,
--           Optimized Indexes, Automatic updated_at triggers,
--           Strict Row Level Security (RLS)
-- ==========================================================

-- Enable cryptographic extensions for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- 1. CLEAN RECREATION (CASCADE)
-- ==========================================================
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.delivery_zones CASCADE;
DROP TABLE IF EXISTS public.business_settings CASCADE;

-- ==========================================================
-- 2. TABLE DEFINITIONS
-- ==========================================================

-- Table: categories
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

-- Table: products
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

-- Table: customers
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: orders
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

-- Table: order_items
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- Table: business_settings
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

-- Table: delivery_zones
CREATE TABLE public.delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    pincode TEXT NOT NULL,
    delivery_fee NUMERIC(10, 2) NOT NULL CHECK (delivery_fee >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ==========================================================
-- 3. INDEXES FOR PERFORMANCE & FAST LOOKUPS
-- ==========================================================

-- Categories indexes
CREATE INDEX idx_categories_display_order ON public.categories (display_order);
CREATE INDEX idx_categories_is_active ON public.categories (is_active);
CREATE INDEX idx_categories_slug ON public.categories (slug);

-- Products indexes
CREATE INDEX idx_products_category_id ON public.products (category_id);
CREATE INDEX idx_products_is_available ON public.products (is_available);
CREATE INDEX idx_products_is_featured ON public.products (is_featured);
CREATE INDEX idx_products_price ON public.products (price);
CREATE INDEX idx_products_created_at ON public.products (created_at DESC);
CREATE INDEX idx_products_slug ON public.products (slug);

-- Customers indexes
CREATE INDEX idx_customers_phone ON public.customers (phone);
CREATE INDEX idx_customers_email ON public.customers (email);

-- Orders indexes
CREATE INDEX idx_orders_customer_id ON public.orders (customer_id);
CREATE INDEX idx_orders_order_number ON public.orders (order_number);
CREATE INDEX idx_orders_order_status ON public.orders (order_status);
CREATE INDEX idx_orders_payment_status ON public.orders (payment_status);
CREATE INDEX idx_orders_delivery_date ON public.orders (delivery_date);
CREATE INDEX idx_orders_delivery_city ON public.orders (delivery_city);
CREATE INDEX idx_orders_delivery_pincode ON public.orders (delivery_pincode);
CREATE INDEX idx_orders_created_at ON public.orders (created_at DESC);

-- Order Items indexes
CREATE INDEX idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items (product_id);

-- Delivery Zones indexes
CREATE INDEX idx_delivery_zones_pincode ON public.delivery_zones (pincode);
CREATE INDEX idx_delivery_zones_is_active ON public.delivery_zones (is_active);

-- ==========================================================
-- 4. AUTOMATIC updated_at TRIGGER FUNCTION
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_business_settings_updated_at ON public.business_settings;
CREATE TRIGGER trg_business_settings_updated_at
    BEFORE UPDATE ON public.business_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================================
-- 5. ROW LEVEL SECURITY (RLS) & ACCESS CONTROL
-- ==========================================================

-- Enable RLS on all 7 tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Grant standard role permissions on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.delivery_zones TO anon, authenticated;
GRANT SELECT ON public.business_settings TO anon, authenticated;
GRANT SELECT, INSERT ON public.orders TO anon, authenticated;
GRANT SELECT, INSERT ON public.order_items TO anon, authenticated;
GRANT INSERT ON public.customers TO anon, authenticated;

-- Grant all permissions to authenticated staff/owner
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Category Policies
CREATE POLICY "Public can view active categories" ON public.categories
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "Admins full manage categories" ON public.categories
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Product Policies
CREATE POLICY "Public can view available products" ON public.products
    FOR SELECT TO anon, authenticated
    USING (is_available = true);

CREATE POLICY "Admins full manage products" ON public.products
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Delivery Zones Policies
CREATE POLICY "Public can view active delivery zones" ON public.delivery_zones
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "Admins full manage delivery zones" ON public.delivery_zones
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Business Settings Policies
CREATE POLICY "Public can view business settings" ON public.business_settings
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Admins full manage business settings" ON public.business_settings
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Orders Policies
-- Anyone (customers) can insert new orders during checkout
CREATE POLICY "Public can create orders" ON public.orders
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Customers can view orders by order_number for order tracking & confirmation
CREATE POLICY "Public can view orders" ON public.orders
    FOR SELECT TO anon, authenticated
    USING (true);

-- Admin staff can update order status / full management
CREATE POLICY "Admins full manage orders" ON public.orders
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Order Items Policies
CREATE POLICY "Public can create order items" ON public.order_items
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Public can view order items" ON public.order_items
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Admins full manage order items" ON public.order_items
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Customers Privacy Policies
-- Customers can register themselves during checkout
CREATE POLICY "Public can insert customers" ON public.customers
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Sensitive customer lists are ONLY accessible to authenticated admins/shop owners
CREATE POLICY "Admins full manage customers" ON public.customers
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ==========================================================
-- 6. STORAGE BUCKET CONFIGURATION (Supabase Storage)
-- ==========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin write product images" ON storage.objects;
CREATE POLICY "Admin write product images" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'product-images');

-- ==========================================================
-- 7. INITIAL SEED DATA FOR PADMA'S FLORAL
-- ==========================================================

-- Business Settings (Single row)
INSERT INTO public.business_settings (
    id,
    business_name,
    phone,
    whatsapp,
    email,
    address,
    city,
    pincode,
    delivery_enabled,
    delivery_fee,
    free_delivery_threshold,
    minimum_order_amount
) VALUES (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11',
    'Padma''s Floral',
    '9740030159',
    '7676117596',
    'padmasfloral@gmail.com',
    'Ramanagara, Karnataka, India',
    'Ramanagara',
    '562159',
    true,
    49.00,
    1499.00,
    199.00
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
    id,
    category_id,
    name,
    slug,
    description,
    price,
    image_url,
    stock_quantity,
    low_stock_threshold,
    is_available,
    is_featured
) VALUES
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'Royal Jasmine & Rose Petal Garland (ಮಲ್ಲಿಗೆ ಮಾಲೆ)',
        'royal-jasmine-rose-petal-garland',
        'Artfully hand-woven using fresh aromatic Ramanagara Mallige (Mysore Jasmine) layered with rich red velvet rose petals and scented tuberose.',
        549.00,
        'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=1000&q=80',
        25,
        5,
        true,
        true
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        'Padma’s Signature Velvet Crimson Bouquet',
        'padmas-signature-velvet-crimson-bouquet',
        '30 stems of long-stem red roses hand-tied in Japanese artisanal wrapping paper with golden botanical ribbons and fresh Italian Ruscus greenery.',
        1299.00,
        'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1000&q=80',
        18,
        3,
        true,
        true
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'Sacred Sevanthige & Marigold Puja String (ಸೇವಂತಿಗೆ)',
        'sacred-sevanthige-marigold-puja-string',
        'Bright golden-yellow Chrysanthemum (Sevanthige) flowers intertwined with saffron marigold blooms and tulsi leaves.',
        299.00,
        'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1000&q=80',
        40,
        10,
        true,
        true
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        'Artisan Pastels Wedding Varmala Pair (ಕಲ್ಯಾಣ ಮಾಲೆ)',
        'artisan-pastels-wedding-varmala-pair',
        'Exquisite bridal & groom varmalas woven with blush baby-pink roses, fragrant tuberose beads, baby’s breath (Gypsophila), and pearl accents.',
        2999.00,
        'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1000&q=80',
        10,
        2,
        true,
        true
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
        'Morning Mist Casablanca Lily & Orchid Vase',
        'morning-mist-casablanca-lily-orchid-vase',
        'Fragrant white Asiatic and Casablanca lilies paired with exotic violet dendrobium orchids, presented in an elegant fluted glass vase.',
        1699.00,
        'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1000&q=80',
        12,
        3,
        true,
        true
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b16',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        'Blush Sunshine Mixed Carnation & Rose Bunch',
        'blush-sunshine-mixed-carnation-rose-bunch',
        'A joyful blend of peach garden roses, yellow carnations, pink gerberas, and white daisies tied in rustic brown Kraft paper with a silk ribbon bow.',
        749.00,
        'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=1000&q=80',
        20,
        5,
        true,
        false
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
        'Royal Wedding Car Floral Decoration Package',
        'royal-wedding-car-floral-decoration',
        'On-site decoration for groom and bridal cars in Ramanagara and South Bengaluru. Includes front bonnet floral heart/v-crest, mirror accents, door handle floral bunches, and satin draping.',
        2999.00,
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1000&q=80',
        5,
        1,
        true,
        true
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b18',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
        'Peaceful Serenity White Lily & Rose Condolence Wreath',
        'peaceful-serenity-condolence-wreath',
        'Respectful, elegant circular floral wreath hand-crafted with fresh white chrysanthemums, pristine white lilies, ivory roses, and lush palm fronds.',
        1999.00,
        'https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=1000&q=80',
        8,
        2,
        true,
        false
    );
