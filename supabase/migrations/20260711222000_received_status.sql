-- Add 'received' to the order_status enum
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'received' AFTER 'delivered';

-- SECURITY DEFINER function: confirm_delivery_received
-- Customer-facing: marks their order as received after delivery, verified by phone number
CREATE OR REPLACE FUNCTION public.confirm_delivery_received(_order_id UUID, _phone TEXT)
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
  SET status = 'received'
  WHERE id = _order_id
    AND status = 'delivered'
    AND regexp_replace(delivery_phone, '\D', '', 'g') = _phone_norm;
  GET DIAGNOSTICS _rows_updated = ROW_COUNT;
  RETURN _rows_updated > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_delivery_received(UUID, TEXT) TO anon, authenticated;
