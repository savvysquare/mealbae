-- ============ RIDERS TABLE ============
CREATE TABLE public.riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.riders TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.riders TO authenticated;
GRANT ALL ON public.riders TO service_role;

ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;

-- Only admins can manage riders
CREATE POLICY "Admins manage riders" ON public.riders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Dispatch/vendor staff can read active riders to populate dropdowns
CREATE POLICY "Staff read riders" ON public.riders FOR SELECT TO authenticated
  USING (is_active = true);

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to keep updated_at fresh
CREATE TRIGGER riders_updated_at
  BEFORE UPDATE ON public.riders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
