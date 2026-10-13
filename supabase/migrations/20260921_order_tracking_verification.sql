-- ==========================================================
-- SUPABASE MIGRATION: 20260921_order_tracking_verification.sql
-- Secure Customer Order Tracking with Dual-Factor Verification
-- (Order Reference Number + Normalized Customer/Recipient Phone)
-- ==========================================================

CREATE OR REPLACE FUNCTION public.lookup_order(
    p_order_number TEXT,
    p_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_clean_phone TEXT;
    v_last10_phone TEXT;
    v_order JSONB;
BEGIN
    -- 1. Input Validation: Both order number and phone number are required
    IF p_order_number IS NULL OR TRIM(p_order_number) = '' THEN
        RETURN NULL;
    END IF;

    IF p_phone IS NULL OR TRIM(p_phone) = '' THEN
        RETURN NULL;
    END IF;

    -- 2. Phone Sanitization: Extract digits only
    v_clean_phone := regexp_replace(TRIM(p_phone), '\D', '', 'g');

    -- Require minimum 10 digits (standard Indian mobile/landline length)
    IF length(v_clean_phone) < 10 THEN
        RETURN NULL;
    END IF;

    -- Extract last 10 digits to seamlessly match across +91, 0, or national formats
    v_last10_phone := right(v_clean_phone, 10);

    -- 3. Perform verified lookup
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

-- Explicitly grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.lookup_order(TEXT, TEXT) TO anon, authenticated;

-- Ensure functional index for fast order lookup
CREATE INDEX IF NOT EXISTS idx_orders_order_number_upper ON public.orders (UPPER(TRIM(order_number)));
