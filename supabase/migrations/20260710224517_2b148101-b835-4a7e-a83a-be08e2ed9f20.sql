
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('customer', 'restaurant_staff', 'admin');

CREATE TYPE public.order_status AS ENUM (
  'pending_payment',
  'payment_confirmed',
  'awaiting_restaurant_acceptance',
  'accepted_by_restaurant',
  'preparing',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
  'rejected',
  'cancelled'
);

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============ RESTAURANTS ============
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  description TEXT,
  image_url TEXT,
  opens_at TIME NOT NULL DEFAULT '08:00',
  closes_at TIME NOT NULL DEFAULT '22:00',
  is_open_override BOOLEAN,
  delivery_fee_naira INTEGER NOT NULL DEFAULT 700,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.restaurants TO anon, authenticated;
GRANT ALL ON public.restaurants TO service_role;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read restaurants" ON public.restaurants FOR SELECT TO anon, authenticated USING (true);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, restaurant_id)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.staff_restaurant_id(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT restaurant_id FROM public.user_roles WHERE user_id = _user_id AND role = 'restaurant_staff' LIMIT 1;
$$;

-- Admins can manage everything
CREATE POLICY "Admins manage restaurants" ON public.restaurants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ MENU CATEGORIES ============
CREATE TABLE public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_categories TO anon, authenticated;
GRANT ALL ON public.menu_categories TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.menu_categories TO authenticated;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.menu_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage own categories" ON public.menu_categories FOR ALL TO authenticated
  USING (public.staff_restaurant_id(auth.uid()) = restaurant_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.staff_restaurant_id(auth.uid()) = restaurant_id OR public.has_role(auth.uid(), 'admin'));

-- ============ MEALS ============
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_naira INTEGER NOT NULL,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.meals (restaurant_id);
CREATE INDEX ON public.meals USING gin (to_tsvector('simple', name));
GRANT SELECT ON public.meals TO anon, authenticated;
GRANT ALL ON public.meals TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.meals TO authenticated;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read meals" ON public.meals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage own meals" ON public.meals FOR ALL TO authenticated
  USING (public.staff_restaurant_id(auth.uid()) = restaurant_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.staff_restaurant_id(auth.uid()) = restaurant_id OR public.has_role(auth.uid(), 'admin'));

-- ============ BANK ACCOUNTS ============
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bank_accounts TO anon, authenticated;
GRANT ALL ON public.bank_accounts TO service_role;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read bank" ON public.bank_accounts FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "Admins manage bank" ON public.bank_accounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ ORDERS ============
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code TEXT NOT NULL UNIQUE DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6)),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id),
  status public.order_status NOT NULL DEFAULT 'pending_payment',
  subtotal_naira INTEGER NOT NULL,
  delivery_fee_naira INTEGER NOT NULL DEFAULT 0,
  total_naira INTEGER NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_phone TEXT NOT NULL,
  customer_name TEXT,
  notes TEXT,
  payment_submitted_at TIMESTAMPTZ,
  payment_confirmed_at TIMESTAMPTZ,
  rider_name TEXT,
  rider_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.orders (customer_id);
CREATE INDEX ON public.orders (restaurant_id);
CREATE INDEX ON public.orders (status);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own orders" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = customer_id);
CREATE POLICY "Customers create own orders" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers cancel own pending orders" ON public.orders FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id AND status IN ('pending_payment','payment_confirmed'))
  WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Staff read own restaurant orders" ON public.orders FOR SELECT TO authenticated
  USING (public.staff_restaurant_id(auth.uid()) = restaurant_id);
CREATE POLICY "Staff update own restaurant orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.staff_restaurant_id(auth.uid()) = restaurant_id)
  WITH CHECK (public.staff_restaurant_id(auth.uid()) = restaurant_id);
CREATE POLICY "Admins read orders" ON public.orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ ORDER ITEMS ============
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES public.meals(id) ON DELETE SET NULL,
  name_snapshot TEXT NOT NULL,
  price_snapshot INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.order_items (order_id);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read items via order" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (
    o.customer_id = auth.uid()
    OR public.staff_restaurant_id(auth.uid()) = o.restaurant_id
    OR public.has_role(auth.uid(), 'admin')
  )));
CREATE POLICY "Insert items for own order" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid()));

-- ============ ORDER STATUS EVENTS ============
CREATE TABLE public.order_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.order_status_events (order_id);
GRANT SELECT ON public.order_status_events TO authenticated;
GRANT ALL ON public.order_status_events TO service_role;
ALTER TABLE public.order_status_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read events via order" ON public.order_status_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (
    o.customer_id = auth.uid()
    OR public.staff_restaurant_id(auth.uid()) = o.restaurant_id
    OR public.has_role(auth.uid(), 'admin')
  )));

-- Trigger: log status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_status_events (order_id, status) VALUES (NEW.id, NEW.status);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_events (order_id, status) VALUES (NEW.id, NEW.status);
    NEW.updated_at = now();
    -- Auto-advance payment_confirmed -> awaiting_restaurant_acceptance
    IF NEW.status = 'payment_confirmed' AND NEW.payment_confirmed_at IS NULL THEN
      NEW.payment_confirmed_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_status_insert AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();
CREATE TRIGGER orders_status_update BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- After payment_confirmed, another trigger auto-advances to awaiting_restaurant_acceptance
CREATE OR REPLACE FUNCTION public.auto_advance_after_payment() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'payment_confirmed' THEN
    UPDATE public.orders SET status = 'awaiting_restaurant_acceptance' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER orders_auto_advance AFTER UPDATE OF status ON public.orders
  FOR EACH ROW WHEN (NEW.status = 'payment_confirmed')
  EXECUTE FUNCTION public.auto_advance_after_payment();

-- Profile auto-create on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'))
  ON CONFLICT (id) DO NOTHING;
  -- Default role: customer for phone signups, no default for email
  IF NEW.phone IS NOT NULL AND NEW.phone <> '' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_events;

-- ============ SEED: Bank + Restaurants + Menus ============
INSERT INTO public.bank_accounts (bank_name, account_name, account_number) VALUES
  ('Opay', 'MealBAE', '8141894696');

-- Restaurants
WITH r AS (
  INSERT INTO public.restaurants (name, address, phone, description, opens_at, closes_at, delivery_fee_naira, image_url) VALUES
    ('Iya Sikira Amala Spot', 'Oke-Fia Road, Osogbo', '+2348030000001', 'Legendary Yoruba amala, ewedu & gbegiri.', '09:00', '21:00', 600, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800'),
    ('The Place Osogbo', 'Gbongan-Ibadan Road, Osogbo', '+2348030000002', 'Fast, fresh Nigerian classics done right.', '08:00', '22:30', 700, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800'),
    ('Kilimanjaro Osogbo', 'Station Road, Osogbo', '+2348030000003', 'Iconic jollof, fried rice & chicken.', '08:00', '22:00', 700, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'),
    ('Chicken Republic Gbongan Rd', 'Gbongan Road, Osogbo', '+2348030000004', 'Refuel Meals, Spicy Chicken and Jollof.', '09:00', '22:00', 800, 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800'),
    ('Osogbo Suya Palace', 'Testing Ground, Osogbo', '+2348030000005', 'Northern-style suya, kilishi & grills.', '16:00', '23:30', 800, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800'),
    ('Cool Chops & Grills', 'Alekuwodo, Osogbo', '+2348030000006', 'Chops, small chops, grilled fish & drinks.', '11:00', '23:00', 750, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800')
  RETURNING id, name
)
SELECT 1;

-- Helper: insert categories + meals per restaurant
DO $$
DECLARE
  r_id UUID;
  c_main UUID; c_side UUID; c_drink UUID; c_starter UUID; c_dessert UUID;
BEGIN
  -- 1. Iya Sikira Amala Spot
  SELECT id INTO r_id FROM public.restaurants WHERE name = 'Iya Sikira Amala Spot';
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Swallow & Soups', 1) RETURNING id INTO c_main;
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Proteins', 2) RETURNING id INTO c_side;
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Drinks', 3) RETURNING id INTO c_drink;
  INSERT INTO public.meals (restaurant_id, category_id, name, description, price_naira) VALUES
    (r_id, c_main, 'Amala + Ewedu + Gbegiri', 'Yam flour swallow with signature Yoruba soups.', 2500),
    (r_id, c_main, 'Amala + Efo Riro', 'Rich vegetable soup with palm oil & assorted.', 2800),
    (r_id, c_main, 'Semo + Egusi', 'Melon seed soup with vegetables.', 2500),
    (r_id, c_main, 'Pounded Yam + Egusi', 'Freshly pounded yam with egusi soup.', 3200),
    (r_id, c_side, 'Assorted Meat', 'Beef, shaki, ponmo mix.', 1800),
    (r_id, c_side, 'Fried Fish (Titus)', 'Whole fried mackerel.', 2000),
    (r_id, c_side, 'Boiled Egg', 'One boiled egg.', 400),
    (r_id, c_drink, 'Chilled Zobo', 'Hibiscus drink.', 700),
    (r_id, c_drink, 'Bottled Water', 'Eva 75cl.', 300);

  -- 2. The Place
  SELECT id INTO r_id FROM public.restaurants WHERE name = 'The Place Osogbo';
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Rice Meals', 1) RETURNING id INTO c_main;
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Proteins', 2) RETURNING id INTO c_side;
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Sides', 3) RETURNING id INTO c_starter;
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Drinks', 4) RETURNING id INTO c_drink;
  INSERT INTO public.meals (restaurant_id, category_id, name, description, price_naira) VALUES
    (r_id, c_main, 'Jollof Rice', 'Party-style smoky jollof.', 2200),
    (r_id, c_main, 'Fried Rice', 'Vegetable fried rice.', 2400),
    (r_id, c_main, 'White Rice + Stew', 'Steamed rice with tomato stew.', 2000),
    (r_id, c_main, 'Ofada Rice + Ayamase', 'Local rice with green pepper sauce.', 3200),
    (r_id, c_side, 'Grilled Chicken', 'Quarter chicken.', 2500),
    (r_id, c_side, 'Peppered Turkey', '2 pieces.', 3500),
    (r_id, c_starter, 'Plantain', 'Fried ripe plantain.', 800),
    (r_id, c_starter, 'Moi Moi', 'Steamed bean pudding.', 700),
    (r_id, c_drink, 'Coca-Cola 50cl', 'Chilled.', 500),
    (r_id, c_drink, 'Chapman', 'House chapman.', 1200);

  -- 3. Kilimanjaro
  SELECT id INTO r_id FROM public.restaurants WHERE name = 'Kilimanjaro Osogbo';
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Combos', 1) RETURNING id INTO c_main;
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Chicken', 2) RETURNING id INTO c_side;
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Snacks', 3) RETURNING id INTO c_starter;
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Drinks', 4) RETURNING id INTO c_drink;
  INSERT INTO public.meals (restaurant_id, category_id, name, description, price_naira) VALUES
    (r_id, c_main, 'Kili Jollof + Chicken', 'Jollof rice with 1pc chicken.', 3200),
    (r_id, c_main, 'Fried Rice + Chicken', 'Fried rice with 1pc chicken.', 3300),
    (r_id, c_main, 'Rice & Beans + Plantain', 'Combo with stew.', 2800),
    (r_id, c_side, 'Spicy Chicken (2pc)', 'Signature spicy chicken.', 3000),
    (r_id, c_side, 'Grilled Chicken', 'Half chicken.', 4500),
    (r_id, c_starter, 'Meat Pie', 'Fresh-baked.', 900),
    (r_id, c_starter, 'Sausage Roll', 'Warm sausage roll.', 700),
    (r_id, c_drink, 'Kili Smoothie', 'Berry blend.', 1800),
    (r_id, c_drink, 'Bottled Water', '75cl.', 300);

  -- 4. Chicken Republic
  SELECT id INTO r_id FROM public.restaurants WHERE name = 'Chicken Republic Gbongan Rd';
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Refuel Meals', 1) RETURNING id INTO c_main;
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Chicken', 2) RETURNING id INTO c_side;
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Wraps & Sides', 3) RETURNING id INTO c_starter;
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Drinks', 4) RETURNING id INTO c_drink;
  INSERT INTO public.meals (restaurant_id, category_id, name, description, price_naira) VALUES
    (r_id, c_main, 'Refuel Max', 'Jollof, chicken, plantain, coleslaw.', 3800),
    (r_id, c_main, 'Refuel Jr.', 'Smaller refuel combo.', 2500),
    (r_id, c_side, 'Spicy Chicken 2pc', 'Bone-in spicy chicken.', 2800),
    (r_id, c_side, 'Crunchy Chicken 2pc', 'Extra-crispy.', 2800),
    (r_id, c_starter, 'Chicken Wrap', 'Grilled chicken wrap.', 2400),
    (r_id, c_starter, 'Fries (Regular)', 'Salted fries.', 1200),
    (r_id, c_drink, 'Pepsi 50cl', 'Chilled.', 500),
    (r_id, c_drink, 'Fanta 50cl', 'Chilled.', 500);

  -- 5. Osogbo Suya Palace
  SELECT id INTO r_id FROM public.restaurants WHERE name = 'Osogbo Suya Palace';
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Suya & Grills', 1) RETURNING id INTO c_main;
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Sides', 2) RETURNING id INTO c_starter;
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Drinks', 3) RETURNING id INTO c_drink;
  INSERT INTO public.meals (restaurant_id, category_id, name, description, price_naira) VALUES
    (r_id, c_main, 'Beef Suya (Small)', '500g grilled beef with yaji.', 3000),
    (r_id, c_main, 'Beef Suya (Large)', '1kg party pack.', 6000),
    (r_id, c_main, 'Chicken Suya', 'Spicy chicken sticks.', 3500),
    (r_id, c_main, 'Ram Suya', 'Tender ram meat.', 4500),
    (r_id, c_main, 'Grilled Catfish', 'Whole catfish with pepper sauce.', 5500),
    (r_id, c_starter, 'Onions & Pepper Mix', 'Suya sides.', 500),
    (r_id, c_starter, 'Yaji Extra', 'House suya spice.', 300),
    (r_id, c_drink, 'Zobo Bottle', 'Chilled 50cl.', 800),
    (r_id, c_drink, 'Malt', '33cl.', 900);

  -- 6. Cool Chops & Grills
  SELECT id INTO r_id FROM public.restaurants WHERE name = 'Cool Chops & Grills';
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Small Chops', 1) RETURNING id INTO c_starter;
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Grills', 2) RETURNING id INTO c_main;
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Desserts', 3) RETURNING id INTO c_dessert;
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (r_id, 'Drinks', 4) RETURNING id INTO c_drink;
  INSERT INTO public.meals (restaurant_id, category_id, name, description, price_naira) VALUES
    (r_id, c_starter, 'Puff Puff Pack', '10 pieces.', 1500),
    (r_id, c_starter, 'Samosa & Spring Rolls', '6 pieces mix.', 2200),
    (r_id, c_starter, 'Peppered Gizzard', 'Spicy grilled gizzard.', 2800),
    (r_id, c_main, 'Grilled Fish (Croaker)', 'With sauce & sides.', 6500),
    (r_id, c_main, 'BBQ Chicken Wings', '8 pieces.', 3800),
    (r_id, c_main, 'Asun', 'Spicy peppered goat meat.', 4500),
    (r_id, c_dessert, 'Chinchin Cup', 'Crunchy snack.', 800),
    (r_id, c_dessert, 'Fruit Bowl', 'Fresh fruit mix.', 2000),
    (r_id, c_drink, 'Cocktail (Non-alc)', 'House mocktail.', 2200),
    (r_id, c_drink, 'Water 75cl', 'Chilled.', 300);
END $$;
