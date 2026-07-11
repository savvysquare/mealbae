-- Make customer_id nullable so guests can place orders without an auth account
ALTER TABLE public.orders ALTER COLUMN customer_id DROP NOT NULL;

-- Allow anon and authenticated to INSERT without customer_id
GRANT INSERT ON public.orders TO anon, authenticated;
GRANT INSERT ON public.order_items TO anon, authenticated;

-- Allow anon to read their own order via short_code / delivery_phone (already handled by get_order_tracking SECURITY DEFINER)

-- SECURITY DEFINER function: place_order_guest
-- Bypasses RLS completely so no auth is required
CREATE OR REPLACE FUNCTION public.place_order_guest(
  _restaurant_id UUID,
  _delivery_address TEXT,
  _delivery_phone TEXT,
  _customer_name TEXT,
  _notes TEXT,
  _subtotal_naira INTEGER,
  _delivery_fee_naira INTEGER,
  _total_naira INTEGER,
  _items JSONB          -- array of {meal_id, name_snapshot, price_snapshot, quantity}
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order_id UUID;
  _short_code TEXT;
  _item JSONB;
BEGIN
  -- Insert the order (no customer_id required for guests)
  INSERT INTO public.orders (
    restaurant_id,
    delivery_address,
    delivery_phone,
    customer_name,
    notes,
    subtotal_naira,
    delivery_fee_naira,
    total_naira,
    status
  )
  VALUES (
    _restaurant_id,
    _delivery_address,
    _delivery_phone,
    _customer_name,
    _notes,
    _subtotal_naira,
    _delivery_fee_naira,
    _total_naira,
    'pending_payment'
  )
  RETURNING id, short_code INTO _order_id, _short_code;

  -- Insert order items
  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    INSERT INTO public.order_items (order_id, meal_id, name_snapshot, price_snapshot, quantity)
    VALUES (
      _order_id,
      (_item->>'meal_id')::UUID,
      _item->>'name_snapshot',
      (_item->>'price_snapshot')::INTEGER,
      (_item->>'quantity')::INTEGER
    );
  END LOOP;

  RETURN jsonb_build_object('id', _order_id, 'short_code', _short_code);
END;
$$;

-- Allow anyone (including anon) to call place_order_guest
GRANT EXECUTE ON FUNCTION public.place_order_guest(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, JSONB) TO anon, authenticated;

-- SECURITY DEFINER function: mark_order_paid_guest
-- Marks an order's payment_submitted_at without auth — verified by phone number match
CREATE OR REPLACE FUNCTION public.mark_order_paid_guest(_order_id UUID, _phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rows_updated INTEGER;
  _phone_norm TEXT := regexp_replace(coalesce(_phone,''), '\D', '', 'g');
BEGIN
  UPDATE public.orders
  SET payment_submitted_at = now()
  WHERE id = _order_id
    AND regexp_replace(delivery_phone, '\D', '', 'g') = _phone_norm
    AND payment_submitted_at IS NULL;
  GET DIAGNOSTICS _rows_updated = ROW_COUNT;
  RETURN _rows_updated > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_order_paid_guest(UUID, TEXT) TO anon, authenticated;
