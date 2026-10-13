-- ==========================================================
-- SUPABASE MIGRATION: Human-Friendly Configurable Order Numbers
-- Format: <PREFIX>-<YEAR>-<0001> (e.g. FL-2026-0001)
-- Padma's Floral Platform
-- ==========================================================

-- 1. ADD CONFIGURABLE ORDER PREFIX TO BUSINESS SETTINGS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_settings' 
        AND column_name = 'order_number_prefix'
    ) THEN
        ALTER TABLE public.business_settings ADD COLUMN order_number_prefix TEXT NOT NULL DEFAULT 'FL';
    END IF;
END $$;

-- Update existing settings record to default 'FL' if empty
UPDATE public.business_settings 
SET order_number_prefix = 'FL' 
WHERE order_number_prefix IS NULL OR order_number_prefix = '';

-- 2. CREATE POSTGRESQL SEQUENCE FOR SEQUENTIAL ORDER NUMBERING
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq 
    START WITH 1 
    INCREMENT BY 1 
    MINVALUE 1 
    NO MAXVALUE 
    CACHE 1;

-- 3. ENSURE UNIQUE CONSTRAINT ON ORDERS.ORDER_NUMBER
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_orders_order_number'
    ) THEN
        ALTER TABLE public.orders ADD CONSTRAINT uq_orders_order_number UNIQUE (order_number);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN others THEN NULL;
END $$;

-- 4. DATABASE FUNCTION TO GENERATE AUTHORITATIVE UNIQUE HUMAN-FRIENDLY ORDER NUMBER
CREATE OR REPLACE FUNCTION public.generate_order_number(p_prefix TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_prefix TEXT;
    v_year TEXT := TO_CHAR(NOW(), 'YYYY');
    v_seq_num BIGINT;
    v_candidate TEXT;
    v_exists BOOLEAN;
    v_attempt INT := 0;
BEGIN
    -- Determine prefix: parameter > business_settings > fallback 'FL'
    IF p_prefix IS NOT NULL AND TRIM(p_prefix) <> '' THEN
        v_prefix := UPPER(TRIM(p_prefix));
    ELSE
        SELECT COALESCE(NULLIF(TRIM(order_number_prefix), ''), 'FL')
        INTO v_prefix
        FROM public.business_settings
        LIMIT 1;
        
        v_prefix := COALESCE(v_prefix, 'FL');
    END IF;

    -- Generate candidate with sequence, retrying if collision occurs
    LOOP
        v_attempt := v_attempt + 1;
        v_seq_num := nextval('public.order_number_seq');
        v_candidate := v_prefix || '-' || v_year || '-' || LPAD(v_seq_num::TEXT, 4, '0');

        SELECT EXISTS (
            SELECT 1 FROM public.orders WHERE order_number = v_candidate
        ) INTO v_exists;

        IF NOT v_exists OR v_attempt > 20 THEN
            EXIT;
        END IF;
    END LOOP;

    RETURN v_candidate;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_order_number(TEXT) TO anon, authenticated;

-- 5. TRIGGER TO GUARANTEE UNIQUE HUMAN-FRIENDLY ORDER NUMBERS ON INSERT
CREATE OR REPLACE FUNCTION public.trg_fn_set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.order_number IS NULL OR TRIM(NEW.order_number) = '' THEN
        NEW.order_number := public.generate_order_number();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_ensure_order_number ON public.orders;
CREATE TRIGGER trg_orders_ensure_order_number
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_fn_set_order_number();
