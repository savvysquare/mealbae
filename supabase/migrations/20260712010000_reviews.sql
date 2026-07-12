-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  customer_name TEXT NOT NULL DEFAULT 'Guest',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id ON public.reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);

-- RLS Enablement
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY "Anyone can read reviews" ON public.reviews
  FOR SELECT TO anon, authenticated USING (true);

-- Insert policy (controlled by Security Definer RPC, but allow direct service_role)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO anon, authenticated, service_role;

-- Create view for restaurant rating stats
CREATE OR REPLACE VIEW public.restaurant_rating_stats AS
SELECT
  restaurant_id,
  coalesce(avg(rating), 0)::numeric(3,2) as avg_rating,
  count(*)::integer as review_count
FROM public.reviews
GROUP BY restaurant_id;

-- Grant permissions on view
GRANT SELECT ON public.restaurant_rating_stats TO anon, authenticated;

-- SECURITY DEFINER function: submit_review
-- Customer-facing: allows submitting a rating and optional review message for a received order, verified by matching phone number
CREATE OR REPLACE FUNCTION public.submit_review(
  _order_id UUID,
  _phone TEXT,
  _rating INTEGER,
  _review_text TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _restaurant_id UUID;
  _customer_name TEXT;
  _phone_norm TEXT := regexp_replace(coalesce(_phone,''), '\D', '', 'g');
  _status public.order_status;
BEGIN
  -- Verify order status and phone
  SELECT restaurant_id, customer_name, status INTO _restaurant_id, _customer_name, _status
  FROM public.orders
  WHERE id = _order_id
    AND regexp_replace(delivery_phone, '\D', '', 'g') = _phone_norm;

  IF _restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Order not found or phone number does not match.';
  END IF;

  IF _status != 'received' THEN
    RAISE EXCEPTION 'Reviews can only be submitted for received orders.';
  END IF;

  -- Insert or update the review
  INSERT INTO public.reviews (order_id, restaurant_id, rating, review_text, customer_name)
  VALUES (_order_id, _restaurant_id, _rating, _review_text, coalesce(_customer_name, 'Guest'))
  ON CONFLICT (order_id) DO UPDATE
  SET rating = EXCLUDED.rating,
      review_text = EXCLUDED.review_text,
      created_at = now();

  RETURN TRUE;
END;
$$;

-- Grant execution
GRANT EXECUTE ON FUNCTION public.submit_review(UUID, TEXT, INTEGER, TEXT) TO anon, authenticated;
