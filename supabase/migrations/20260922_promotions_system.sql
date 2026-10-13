-- ==============================================================================
-- PADMA'S FLORAL — PROMOTIONS & MARKETING OFFERS SYSTEM
-- Migration: 20260922_promotions_system.sql
-- 
-- Features:
-- 1. Table: public.promotions (title, description, banner_image, discount_type,
--    discount_value, start_date, end_date, is_active, coupon extensibility)
-- 2. Database determines active status authoritatively:
--    is_active = TRUE AND start_date <= NOW() AND (end_date IS NULL OR end_date >= NOW())
-- 3. Database View: public.active_promotions
-- 4. Database Function / RPC: public.get_active_promotions()
-- 5. Row-Level Security (RLS) ensuring public users ONLY receive active promotions,
--    while administrators have full CRUD access.
-- 6. Initial seed promotions matching user requirements:
--    - Festival Flowers
--    - Weekend Special
--    - Wedding Season
--    - Pooja Collection (No fake discount)
-- ==============================================================================

-- Enable standard cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TABLE: public.promotions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    banner_image TEXT,
    discount_type TEXT NOT NULL DEFAULT 'none' CHECK (discount_type IN ('none', 'percentage', 'fixed_amount', 'free_delivery')),
    discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_value >= 0),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Extensible coupon code & qualification fields
    code TEXT UNIQUE,
    min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (min_order_amount >= 0),
    max_discount_amount NUMERIC(10, 2) CHECK (max_discount_amount IS NULL OR max_discount_amount >= 0),
    usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
    times_used INTEGER NOT NULL DEFAULT 0 CHECK (times_used >= 0),
    
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_promotion_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Index for high-speed active status evaluation by the database
CREATE INDEX IF NOT EXISTS idx_promotions_active_dates 
ON public.promotions (is_active, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_promotions_code 
ON public.promotions (code) WHERE code IS NOT NULL;

-- Automatic updated_at trigger
CREATE OR REPLACE FUNCTION public.update_promotion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_promotions_updated_at ON public.promotions;
CREATE TRIGGER trigger_promotions_updated_at
    BEFORE UPDATE ON public.promotions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_promotion_timestamp();

-- ------------------------------------------------------------------------------
-- 2. DATABASE DETERMINATION OF ACTIVE PROMOTIONS (VIEW & RPC)
-- ------------------------------------------------------------------------------

-- View: active_promotions (Postgres 15+ security_invoker)
CREATE OR REPLACE VIEW public.active_promotions 
WITH (security_invoker = true) AS
SELECT 
    id,
    title,
    description,
    banner_image,
    discount_type,
    discount_value,
    start_date,
    end_date,
    is_active,
    code,
    min_order_amount,
    max_discount_amount,
    usage_limit,
    times_used,
    display_order,
    created_at,
    updated_at,
    TRUE AS is_currently_active
FROM public.promotions
WHERE is_active = TRUE
  AND start_date <= NOW()
  AND (end_date IS NULL OR end_date >= NOW());

-- RPC: get_active_promotions
CREATE OR REPLACE FUNCTION public.get_active_promotions()
RETURNS SETOF public.promotions
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT *
    FROM public.promotions
    WHERE is_active = TRUE
      AND start_date <= NOW()
      AND (end_date IS NULL OR end_date >= NOW())
    ORDER BY display_order ASC, created_at DESC;
$$;

-- RPC: validate_coupon_code (Authoritative database coupon validation)
CREATE OR REPLACE FUNCTION public.validate_coupon_code(
    p_code TEXT,
    p_subtotal NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
    v_promo public.promotions%ROWTYPE;
    v_discount NUMERIC(10, 2) := 0.00;
    v_delivery_discount NUMERIC(10, 2) := 0.00;
BEGIN
    -- Look up active promotion matching the code (case-insensitive)
    SELECT * INTO v_promo
    FROM public.promotions
    WHERE UPPER(code) = UPPER(TRIM(p_code))
      AND is_active = TRUE
      AND start_date <= NOW()
      AND (end_date IS NULL OR end_date >= NOW())
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'Invalid or expired coupon code.'
        );
    END IF;

    -- Check minimum order qualification
    IF v_promo.min_order_amount > 0 AND p_subtotal < v_promo.min_order_amount THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', format('This coupon requires a minimum order of ₹%s.', v_promo.min_order_amount),
            'min_order_amount', v_promo.min_order_amount
        );
    END IF;

    -- Check usage limit if configured
    IF v_promo.usage_limit IS NOT NULL AND v_promo.times_used >= v_promo.usage_limit THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'This coupon has reached its maximum redemption limit.'
        );
    END IF;

    -- Calculate discount
    IF v_promo.discount_type = 'percentage' THEN
        v_discount := ROUND((p_subtotal * v_promo.discount_value) / 100.0, 2);
        IF v_promo.max_discount_amount IS NOT NULL AND v_discount > v_promo.max_discount_amount THEN
            v_discount := v_promo.max_discount_amount;
        END IF;
    ELSIF v_promo.discount_type = 'fixed_amount' THEN
        v_discount := LEAST(v_promo.discount_value, p_subtotal);
    ELSIF v_promo.discount_type = 'free_delivery' THEN
        v_delivery_discount := 49.00;
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'promotion_id', v_promo.id,
        'title', v_promo.title,
        'code', v_promo.code,
        'discount_type', v_promo.discount_type,
        'discount_value', v_promo.discount_value,
        'discount_amount', v_discount,
        'delivery_discount', v_delivery_discount,
        'message', format('Coupon %s applied successfully!', v_promo.code)
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. ROW-LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view active promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins have full access to promotions" ON public.promotions;

-- 3a. Public / Anon: can ONLY read promotions that the database determines are active
CREATE POLICY "Public can view active promotions"
ON public.promotions
FOR SELECT
TO public
USING (
    is_active = TRUE 
    AND start_date <= NOW() 
    AND (end_date IS NULL OR end_date >= NOW())
);

-- 3b. Administrators: full access (SELECT, INSERT, UPDATE, DELETE) to all promotions
CREATE POLICY "Admins have full access to promotions"
ON public.promotions
FOR ALL
TO authenticated
USING (
    public.is_admin() OR 
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'superadmin')
)
WITH CHECK (
    public.is_admin() OR 
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'superadmin')
);

-- Grant appropriate permissions
GRANT SELECT ON public.active_promotions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_promotions() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon_code(TEXT, NUMERIC) TO anon, authenticated;
GRANT SELECT ON public.promotions TO anon, authenticated;
GRANT ALL ON public.promotions TO authenticated;

-- ------------------------------------------------------------------------------
-- 4. SEED PROMOTIONS (Matching User Request Examples)
-- ------------------------------------------------------------------------------
INSERT INTO public.promotions (
    id, title, description, banner_image, discount_type, discount_value, 
    start_date, end_date, is_active, code, min_order_amount, display_order
) VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    'Festival Flowers',
    'Traditional fresh Mysore mallige, vibrant sevanti, and fragrant marigold garlands hand-crafted for auspicious rituals and home festivities.',
    'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=1200&q=80',
    'percentage',
    10.00,
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '30 days',
    TRUE,
    'FESTIVAL10',
    499.00,
    1
),
(
    '10000000-0000-0000-0000-000000000002',
    'Weekend Special',
    'Make weekends luminous with handcrafted rose flower baskets and fresh dining arrangements delivered to your doorstep.',
    'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1200&q=80',
    'fixed_amount',
    100.00,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '7 days',
    TRUE,
    'WEEKEND100',
    799.00,
    2
),
(
    '10000000-0000-0000-0000-000000000003',
    'Wedding Season',
    'Grand bridal varmalas, venue entrance flower hangings, and family garland packages with guaranteed dawn delivery.',
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    'free_delivery',
    0.00,
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '60 days',
    TRUE,
    'WEDDINGFREE',
    1200.00,
    3
),
(
    '10000000-0000-0000-0000-000000000004',
    'Pooja Collection',
    'Pure dawn-harvested pooja blooms, sacred bilva leaves, tulsi, and lotus buds curated for daily and special worship rituals.',
    'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=1200&q=80',
    'none',
    0.00,
    NOW() - INTERVAL '10 days',
    NULL, -- Ongoing curated collection without expiry
    TRUE,
    NULL,
    0.00,
    4
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    banner_image = EXCLUDED.banner_image,
    discount_type = EXCLUDED.discount_type,
    discount_value = EXCLUDED.discount_value,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    is_active = EXCLUDED.is_active,
    code = EXCLUDED.code,
    min_order_amount = EXCLUDED.min_order_amount,
    display_order = EXCLUDED.display_order;
