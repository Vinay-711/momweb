-- ==========================================================
-- SUPABASE STORED PROCEDURE: create_order_secure
-- Atomic, Server-Authoritative Checkout & Inventory Management
-- Padma's Floral Platform
-- ==========================================================

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
    
    -- Financials calculated strictly on server
    v_subtotal NUMERIC(10, 2) := 0.00;
    v_delivery_fee NUMERIC(10, 2) := 49.00;
    v_total_amount NUMERIC(10, 2) := 0.00;
    v_free_delivery_threshold NUMERIC(10, 2) := 1499.00;
    v_ramanagara_fee NUMERIC(10, 2) := 49.00;
    v_bengaluru_fee NUMERIC(10, 2) := 149.00;

    -- Iteration variables
    v_item JSONB;
    v_product_id TEXT;
    v_quantity INT;
    v_variant_name TEXT;
    v_prod_rec RECORD;
    v_unit_price NUMERIC(10, 2);
    v_item_subtotal NUMERIC(10, 2);
    v_matched_variant JSONB;
    v_v JSONB;
    
    -- Result storage
    v_inserted_items JSONB := '[]'::JSONB;
    v_created_order JSONB;
BEGIN
    -- 1. VALIDATE REQUIRED CUSTOMER & DELIVERY FIELDS
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

    -- 2. VALIDATE CART ITEMS ARRAY
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Cart cannot be empty. Please select floral items before ordering.';
    END IF;

    -- 3. FETCH LIVE BUSINESS SETTINGS FOR AUTHORITATIVE DELIVERY RULES
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

    -- 4. PROCESS EACH CART ITEM: LOCK ROW, VERIFY ACTIVE & STOCK, CALCULATE TRUSTED PRICES
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := COALESCE(v_item->>'product_id', v_item->'product'->>'id');
        v_quantity := COALESCE((v_item->>'quantity')::INT, 1);
        v_variant_name := COALESCE(
            v_item->>'selected_variant', 
            v_item->'selected_variant'->>'name'
        );

        IF v_product_id IS NULL THEN
            RAISE EXCEPTION 'Invalid order item: product_id is missing.';
        END IF;

        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Invalid item quantity: % must be greater than zero.', v_quantity;
        END IF;

        -- Lock the product record to prevent race conditions on stock quantity
        SELECT * INTO v_prod_rec
        FROM public.products
        WHERE id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID "%" does not exist in catalog.', v_product_id;
        END IF;

        IF NOT v_prod_rec.is_active THEN
            RAISE EXCEPTION 'Product "%" is currently unavailable.', v_prod_rec.name;
        END IF;

        IF v_prod_rec.stock_quantity < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for "%". Only % available, but % requested.', 
                v_prod_rec.name, v_prod_rec.stock_quantity, v_quantity;
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

        -- Atomically decrement product inventory
        UPDATE public.products
        SET 
            stock_quantity = stock_quantity - v_quantity,
            is_active = (stock_quantity - v_quantity > 0),
            updated_at = NOW()
        WHERE id = v_prod_rec.id;

        -- Append item to array for line item insertion
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

    -- 5. CALCULATE AUTHORITATIVE DELIVERY FEE & TOTAL
    IF v_subtotal >= v_free_delivery_threshold THEN
        v_delivery_fee := 0.00;
    ELSIF v_delivery_city = 'Bengaluru' THEN
        v_delivery_fee := v_bengaluru_fee;
    ELSE
        v_delivery_fee := v_ramanagara_fee;
    END IF;

    v_total_amount := v_subtotal + v_delivery_fee;

    -- 6. GENERATE GUARANTEED UNIQUE HUMAN-READABLE ORDER NUMBER via generate_order_number()
    --    Uses configurable prefix from business_settings + year + sequential counter
    --    Format: <PREFIX>-<YYYY>-<0001> (e.g. FL-2026-0001)
    v_order_number := public.generate_order_number();

    -- 7. INSERT ORDER RECORD
    INSERT INTO public.orders (
        id,
        order_number,
        customer_name,
        customer_phone,
        customer_email,
        recipient_name,
        recipient_phone,
        recipient_address,
        delivery_city,
        delivery_pincode,
        landmark,
        delivery_date,
        delivery_time_slot,
        card_message,
        order_notes,
        subtotal,
        delivery_fee,
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
        v_payment_method,
        'pending',
        'pending',
        NOW(),
        NOW()
    );

    -- 8. INSERT ORDER ITEMS
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
            total_price,
            selected_variant,
            created_at
        ) VALUES (
            (v_item->>'id')::UUID,
            v_order_id,
            (v_item->>'product_id')::TEXT,
            v_item->>'product_name',
            v_item->>'product_image',
            (v_item->>'quantity')::INT,
            (v_item->>'unit_price')::NUMERIC(10, 2),
            (v_item->>'total_price')::NUMERIC(10, 2),
            v_item->>'selected_variant',
            NOW()
        );
    END LOOP;

    -- 9. BUILD AND RETURN NORMALIZED ORDER JSON
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
        'total_amount', v_total_amount,
        'payment_method', v_payment_method,
        'payment_status', 'pending',
        'order_status', 'pending',
        'items', v_inserted_items,
        'created_at', NOW()
    );
END;
$$;

-- Grant execution to public anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.create_order_secure(JSONB, JSONB) TO anon, authenticated;
