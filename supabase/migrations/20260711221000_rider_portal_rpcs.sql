-- 1. Fetch active assignments for a rider phone
CREATE OR REPLACE FUNCTION public.get_rider_assignments(_phone TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _orders jsonb;
BEGIN
  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'short_code', o.short_code,
      'status', o.status,
      'delivery_address', o.delivery_address,
      'delivery_phone', o.delivery_phone,
      'delivery_fee_naira', o.delivery_fee_naira,
      'total_naira', o.total_naira,
      'created_at', o.created_at,
      'restaurants', jsonb_build_object(
        'name', r.name,
        'address', r.address,
        'phone', r.phone
      )
    ) ORDER BY o.created_at ASC
  ), '[]'::jsonb) INTO _orders
  FROM public.orders o
  JOIN public.restaurants r ON r.id = o.restaurant_id
  WHERE o.rider_phone = trim(_phone)
    AND o.status NOT IN ('delivered', 'cancelled', 'rejected');

  RETURN _orders;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_rider_assignments(TEXT) TO anon, authenticated;

-- 2. Fetch available pickups with no rider assigned
CREATE OR REPLACE FUNCTION public.get_available_pickups()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pickups jsonb;
BEGIN
  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'short_code', o.short_code,
      'status', o.status,
      'delivery_address', o.delivery_address,
      'delivery_phone', o.delivery_phone,
      'delivery_fee_naira', o.delivery_fee_naira,
      'total_naira', o.total_naira,
      'created_at', o.created_at,
      'restaurants', jsonb_build_object(
        'name', r.name,
        'address', r.address,
        'phone', r.phone
      )
    ) ORDER BY o.created_at ASC
  ), '[]'::jsonb) INTO _pickups
  FROM public.orders o
  JOIN public.restaurants r ON r.id = o.restaurant_id
  WHERE o.status IN ('preparing', 'ready_for_pickup')
    AND o.rider_phone IS NULL;

  RETURN _pickups;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_pickups() TO anon, authenticated;

-- 3. Accept a pickup securely as guest
CREATE OR REPLACE FUNCTION public.accept_pickup_guest(_order_id UUID, _rider_name TEXT, _rider_phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET rider_name = trim(_rider_name),
      rider_phone = trim(_rider_phone)
  WHERE id = _order_id
    AND status IN ('preparing', 'ready_for_pickup')
    AND rider_phone IS NULL;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_pickup_guest(UUID, TEXT, TEXT) TO anon, authenticated;

-- 4. Update order status securely as guest rider
CREATE OR REPLACE FUNCTION public.update_order_status_rider(_order_id UUID, _rider_phone TEXT, _status TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _status NOT IN ('rider_arrived_at_restaurant', 'out_for_delivery', 'rider_arrived_at_delivery', 'delivered') THEN
    RAISE EXCEPTION 'Unauthorized status transition for riders';
  END IF;

  UPDATE public.orders
  SET status = _status::public.order_status
  WHERE id = _order_id
    AND rider_phone = trim(_rider_phone);

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_status_rider(UUID, TEXT, TEXT) TO anon, authenticated;
