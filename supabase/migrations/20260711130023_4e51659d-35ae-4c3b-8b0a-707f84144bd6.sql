CREATE OR REPLACE FUNCTION public.mark_order_paid_by_phone(_order_id uuid, _phone text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _phone_norm text := regexp_replace(coalesce(_phone,''), '\D', '', 'g');
  _updated int;
BEGIN
  IF length(_phone_norm) < 7 THEN RETURN false; END IF;
  UPDATE public.orders
  SET payment_submitted_at = now()
  WHERE id = _order_id
    AND payment_submitted_at IS NULL
    AND regexp_replace(delivery_phone, '\D', '', 'g') = _phone_norm;
  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_order_paid_by_phone(uuid, text) TO anon, authenticated;