-- ==========================================================
-- PADMA'S FLORAL — REAL BUSINESS CONTENT MIGRATION
-- Migration: 20260924_real_business_content.sql
-- Factual details strictly as provided:
-- Business name: Padma's Floral
-- City: Ramanagara
-- Address: Ramanagara Town
-- Phone: 9740030159
-- WhatsApp: 7676117596
-- Instagram: __vinxy_ (https://www.instagram.com/__vinxy_/)
-- Opening hours: 24/7
-- Products: All types of flower decorations
-- Categories: flower
-- Prices: Depends on the seasons
-- Delivery areas: Ramanagara and Bengaluru
-- ==========================================================

-- 1. Ensure business_settings table columns and factual settings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_settings' 
        AND column_name = 'instagram_url'
    ) THEN
        ALTER TABLE public.business_settings ADD COLUMN instagram_url TEXT;
    END IF;
END $$;

UPDATE public.business_settings
SET
    business_name = 'Padma''s Floral',
    phone = '9740030159',
    whatsapp = '7676117596',
    address = 'Ramanagara Town',
    city = 'Ramanagara',
    instagram_url = 'https://www.instagram.com/__vinxy_/',
    updated_at = NOW();

-- If no row exists, insert one
INSERT INTO public.business_settings (
    id,
    business_name,
    phone,
    whatsapp,
    address,
    city,
    instagram_url,
    delivery_enabled,
    delivery_fee,
    free_delivery_threshold,
    minimum_order_amount,
    updated_at
)
SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Padma''s Floral',
    '9740030159',
    '7676117596',
    'Ramanagara Town',
    'Ramanagara',
    'https://www.instagram.com/__vinxy_/',
    true,
    0.00,
    0.00,
    0.00,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.business_settings);

-- 2. Category: flower
INSERT INTO public.categories (
    id,
    name,
    slug,
    description,
    image_url,
    display_order,
    is_active
)
VALUES (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'::uuid,
    'flower',
    'flower',
    'All types of flower decorations. Delivery in Ramanagara and Bengaluru. Prices depend on the seasons. Open 24/7.',
    '/images/products/flower-decorations.jpg',
    1,
    true
)
ON CONFLICT (slug) DO UPDATE
SET
    name = 'flower',
    description = 'All types of flower decorations. Delivery in Ramanagara and Bengaluru. Prices depend on the seasons. Open 24/7.',
    is_active = true;

-- 3. Product: All types of flower decorations
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
)
VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01'::uuid,
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'::uuid,
    'All types of flower decorations',
    'all-types-of-flower-decorations',
    'All types of flower decorations. Delivery in Ramanagara and Bengaluru. Prices depend on the seasons. Open 24/7. Inquire via WhatsApp or call.',
    0.00,
    '/images/products/flower-decorations.jpg',
    999,
    10,
    true,
    true
)
ON CONFLICT (slug) DO UPDATE
SET
    name = 'All types of flower decorations',
    category_id = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'::uuid,
    description = 'All types of flower decorations. Delivery in Ramanagara and Bengaluru. Prices depend on the seasons. Open 24/7. Inquire via WhatsApp or call.',
    is_available = true,
    is_featured = true;

-- 4. Clean fabricated testimonials if the table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'testimonials'
    ) THEN
        DELETE FROM public.testimonials WHERE is_verified = false OR rating = 5;
    END IF;
END $$;

-- 5. Delivery Zones: Ramanagara and Bengaluru
DELETE FROM public.delivery_zones;

INSERT INTO public.delivery_zones (id, name, pincode, delivery_fee, is_active)
VALUES
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01'::uuid, 'Ramanagara', '562159', 0.00, true),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02'::uuid, 'Bengaluru', '560001', 0.00, true);
