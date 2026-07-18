
-- 1. order_groups table
CREATE TABLE public.order_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', '') FROM 1 FOR 6)),
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text,
  delivery_phone text NOT NULL,
  delivery_address text NOT NULL,
  notes text,
  subtotal_naira integer NOT NULL,
  delivery_fee_naira integer NOT NULL DEFAULT 0,
  total_naira integer NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX order_groups_phone_idx ON public.order_groups (delivery_phone);
CREATE INDEX order_groups_created_at_idx ON public.order_groups (created_at DESC);

GRANT SELECT ON public.order_groups TO anon;
GRANT SELECT, INSERT, UPDATE ON public.order_groups TO authenticated;
GRANT ALL ON public.order_groups TO service_role;

ALTER TABLE public.order_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read groups" ON public.order_groups FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update groups" ON public.order_groups FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Customers read own groups" ON public.order_groups FOR SELECT TO authenticated
  USING (auth.uid() = customer_id);

-- 2. orders.order_group_id
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_group_id uuid REFERENCES public.order_groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_order_group_id_idx ON public.orders (order_group_id);

-- 3. place_order_group_guest RPC
-- items JSON: [{ restaurant_id, subtotal_naira, delivery_fee_naira, items: [{ meal_id, name_snapshot, price_snapshot, quantity }] }]
CREATE OR REPLACE FUNCTION public.place_order_group_guest(
  _delivery_address text,
  _delivery_phone text,
  _customer_name text,
  _notes text,
  _subtotal_naira integer,
  _delivery_fee_naira integer,
  _total_naira integer,
  _restaurants jsonb
)
RETURNS TABLE(group_id uuid, group_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _group_id uuid;
  _group_code text;
  _r jsonb;
  _new_order_id uuid;
  _service_id uuid;
  _item jsonb;
BEGIN
  -- Insert group
  INSERT INTO public.order_groups (
    customer_name, delivery_phone, delivery_address, notes,
    subtotal_naira, delivery_fee_naira, total_naira
  ) VALUES (
    _customer_name, _delivery_phone, _delivery_address, _notes,
    _subtotal_naira, _delivery_fee_naira, _total_naira
  ) RETURNING id, code INTO _group_id, _group_code;

  -- Find a service user to own guest orders (any admin)
  SELECT ur.user_id INTO _service_id FROM public.user_roles ur WHERE ur.role = 'admin'::app_role LIMIT 1;
  IF _service_id IS NULL THEN
    RAISE EXCEPTION 'No service account available';
  END IF;

  -- Iterate restaurants
  FOR _r IN SELECT * FROM jsonb_array_elements(_restaurants) LOOP
    INSERT INTO public.orders (
      customer_id, restaurant_id, order_group_id,
      subtotal_naira, delivery_fee_naira, total_naira,
      delivery_address, delivery_phone, customer_name, notes,
      status
    ) VALUES (
      _service_id,
      (_r->>'restaurant_id')::uuid,
      _group_id,
      (_r->>'subtotal_naira')::int,
      (_r->>'delivery_fee_naira')::int,
      (_r->>'subtotal_naira')::int + (_r->>'delivery_fee_naira')::int,
      _delivery_address, _delivery_phone, _customer_name, _notes,
      'pending_payment'::order_status
    ) RETURNING id INTO _new_order_id;

    FOR _item IN SELECT * FROM jsonb_array_elements(_r->'items') LOOP
      INSERT INTO public.order_items (order_id, meal_id, name_snapshot, price_snapshot, quantity)
      VALUES (
        _new_order_id,
        (_item->>'meal_id')::uuid,
        _item->>'name_snapshot',
        (_item->>'price_snapshot')::int,
        (_item->>'quantity')::int
      );
    END LOOP;
  END LOOP;

  RETURN QUERY SELECT _group_id, _group_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order_group_guest(text,text,text,text,integer,integer,integer,jsonb) TO anon, authenticated;

-- 4. get_group_tracking RPC (by code + phone)
CREATE OR REPLACE FUNCTION public.get_group_tracking(_code text, _phone text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _phone_norm text := regexp_replace(coalesce(_phone,''), '\D', '', 'g');
  _group jsonb;
  _group_id uuid;
BEGIN
  IF length(_phone_norm) < 7 THEN RETURN NULL; END IF;

  SELECT id, jsonb_build_object(
    'id', g.id,
    'code', g.code,
    'delivery_address', g.delivery_address,
    'delivery_phone', g.delivery_phone,
    'customer_name', g.customer_name,
    'subtotal_naira', g.subtotal_naira,
    'delivery_fee_naira', g.delivery_fee_naira,
    'total_naira', g.total_naira,
    'payment_status', g.payment_status,
    'payment_submitted_at', g.payment_submitted_at,
    'created_at', g.created_at
  ) INTO _group_id, _group
  FROM public.order_groups g
  WHERE g.code = upper(_code)
    AND regexp_replace(g.delivery_phone, '\D', '', 'g') = _phone_norm;

  IF _group IS NULL THEN RETURN NULL; END IF;

  RETURN jsonb_build_object(
    'group', _group,
    'orders', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', o.id,
        'short_code', o.short_code,
        'status', o.status,
        'subtotal_naira', o.subtotal_naira,
        'delivery_fee_naira', o.delivery_fee_naira,
        'total_naira', o.total_naira,
        'restaurant_id', o.restaurant_id,
        'restaurant_name', r.name,
        'restaurant_phone', r.phone,
        'rider_name', o.rider_name,
        'rider_phone', o.rider_phone,
        'created_at', o.created_at,
        'items', COALESCE((SELECT jsonb_agg(jsonb_build_object(
          'id', oi.id, 'name_snapshot', oi.name_snapshot,
          'price_snapshot', oi.price_snapshot, 'quantity', oi.quantity
        )) FROM public.order_items oi WHERE oi.order_id = o.id), '[]'::jsonb),
        'events', COALESCE((SELECT jsonb_agg(jsonb_build_object(
          'status', oe.status, 'created_at', oe.created_at
        ) ORDER BY oe.created_at) FROM public.order_status_events oe WHERE oe.order_id = o.id), '[]'::jsonb)
      ) ORDER BY r.name)
      FROM public.orders o
      JOIN public.restaurants r ON r.id = o.restaurant_id
      WHERE o.order_group_id = _group_id
    ), '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_group_tracking(text, text) TO anon, authenticated;

-- 5. mark_group_paid_by_phone
CREATE OR REPLACE FUNCTION public.mark_group_paid_by_phone(_code text, _phone text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _phone_norm text := regexp_replace(coalesce(_phone,''), '\D', '', 'g');
  _group_id uuid;
BEGIN
  IF length(_phone_norm) < 7 THEN RETURN false; END IF;

  UPDATE public.order_groups
  SET payment_submitted_at = COALESCE(payment_submitted_at, now()),
      payment_status = 'submitted',
      updated_at = now()
  WHERE code = upper(_code)
    AND regexp_replace(delivery_phone, '\D', '', 'g') = _phone_norm
  RETURNING id INTO _group_id;

  IF _group_id IS NULL THEN RETURN false; END IF;

  -- Cascade to child orders
  UPDATE public.orders
  SET payment_submitted_at = COALESCE(payment_submitted_at, now())
  WHERE order_group_id = _group_id AND payment_submitted_at IS NULL;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_group_paid_by_phone(text, text) TO anon, authenticated;
