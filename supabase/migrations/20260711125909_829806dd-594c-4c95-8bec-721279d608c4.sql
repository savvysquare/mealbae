CREATE OR REPLACE FUNCTION public.get_order_tracking(_order_id uuid, _phone text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order jsonb;
  _phone_norm text := regexp_replace(coalesce(_phone,''), '\D', '', 'g');
BEGIN
  IF length(_phone_norm) < 7 THEN RETURN NULL; END IF;
  SELECT jsonb_build_object(
    'id', o.id,
    'short_code', o.short_code,
    'status', o.status,
    'subtotal_naira', o.subtotal_naira,
    'delivery_fee_naira', o.delivery_fee_naira,
    'total_naira', o.total_naira,
    'delivery_address', o.delivery_address,
    'delivery_phone', o.delivery_phone,
    'payment_submitted_at', o.payment_submitted_at,
    'rider_name', o.rider_name,
    'rider_phone', o.rider_phone,
    'restaurant_id', o.restaurant_id,
    'restaurant_name', r.name,
    'restaurant_phone', r.phone,
    'created_at', o.created_at
  ) INTO _order
  FROM public.orders o
  JOIN public.restaurants r ON r.id = o.restaurant_id
  WHERE o.id = _order_id
    AND regexp_replace(o.delivery_phone, '\D', '', 'g') = _phone_norm;

  IF _order IS NULL THEN RETURN NULL; END IF;

  RETURN jsonb_build_object(
    'order', _order,
    'items', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', oi.id, 'name_snapshot', oi.name_snapshot, 'price_snapshot', oi.price_snapshot, 'quantity', oi.quantity)) FROM public.order_items oi WHERE oi.order_id = _order_id), '[]'::jsonb),
    'events', COALESCE((SELECT jsonb_agg(jsonb_build_object('status', oe.status, 'created_at', oe.created_at) ORDER BY oe.created_at) FROM public.order_status_events oe WHERE oe.order_id = _order_id), '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_tracking(uuid, text) TO anon, authenticated;