-- SECURITY DEFINER function to securely check rider login without exposing all riders via anon RLS
CREATE OR REPLACE FUNCTION public.verify_rider_login(_phone TEXT, _name TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rider RECORD;
BEGIN
  SELECT * INTO _rider FROM public.riders 
  WHERE phone = trim(_phone) AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Rider phone number not registered or deactivated. Contact Admin.');
  END IF;

  IF lower(trim(_rider.name)) != lower(trim(_name)) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Name does not match our records for this phone number.');
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'rider', jsonb_build_object('name', _rider.name, 'phone', _rider.phone)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_rider_login(TEXT, TEXT) TO anon, authenticated;
