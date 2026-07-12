-- Drop the old RETURNS JSONB version and replace with RETURNS TABLE
-- which is properly cached by PostgREST / Supabase schema cache

DROP FUNCTION IF EXISTS public.place_order_guest(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, JSONB);

CREATE OR REPLACE FUNCTION public.place_order_guest(
  _restaurant_id      UUID,
  _delivery_address   TEXT,
  _delivery_phone     TEXT,
  _customer_name      TEXT,
  _notes              TEXT,
  _subtotal_naira     INTEGER,
  _delivery_fee_naira INTEGER,
  _total_naira        INTEGER,
  _items              JSONB   -- array of {meal_id, name_snapshot, price_snapshot, quantity}
)
RETURNS TABLE(id UUID, short_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order_id   UUID;
  _short_code TEXT;
  _item       JSONB;
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
  RETURNING public.orders.id, public.orders.short_code
  INTO _order_id, _short_code;

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

  -- Return single row
  RETURN QUERY SELECT _order_id, _short_code;
END;
$$;

-- Allow anyone (including anon) to call place_order_guest
GRANT EXECUTE ON FUNCTION public.place_order_guest(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, JSONB) TO anon, authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
