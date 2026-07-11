
-- 1. Prefix relative image URLs with stable Lovable project URL so they load on any host (e.g. vercel)
UPDATE public.meals
SET image_url = 'https://project--06e28c51-ab5a-490f-b5cc-0274c1e2a304.lovable.app' || image_url
WHERE image_url LIKE '/\_\_l5e/%' ESCAPE '\';

UPDATE public.restaurants
SET image_url = 'https://project--06e28c51-ab5a-490f-b5cc-0274c1e2a304.lovable.app' || image_url
WHERE image_url LIKE '/\_\_l5e/%' ESCAPE '\';

-- 2. Public function to look up orders by delivery phone number for tracking
CREATE OR REPLACE FUNCTION public.track_orders_by_phone(_phone text)
RETURNS TABLE (
  id uuid,
  short_code text,
  status order_status,
  total_naira integer,
  created_at timestamptz,
  restaurant_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.short_code, o.status, o.total_naira, o.created_at, r.name AS restaurant_name
  FROM public.orders o
  JOIN public.restaurants r ON r.id = o.restaurant_id
  WHERE regexp_replace(o.delivery_phone, '\D', '', 'g') = regexp_replace(_phone, '\D', '', 'g')
    AND length(regexp_replace(_phone, '\D', '', 'g')) >= 7
  ORDER BY o.created_at DESC
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.track_orders_by_phone(text) TO anon, authenticated;
