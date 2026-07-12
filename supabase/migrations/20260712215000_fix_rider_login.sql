-- Fix verify_rider_login to also normalize phone numbers (strip non-digits, handle +234/0 prefix)
-- and give clearer error messages

CREATE OR REPLACE FUNCTION public.verify_rider_login(_phone TEXT, _name TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rider RECORD;
  -- Normalize phone: strip all non-digits
  _phone_digits TEXT := regexp_replace(coalesce(trim(_phone), ''), '\D', '', 'g');
  -- Also store last 10 digits for comparison
  _phone_last10 TEXT;
BEGIN
  -- Get last 10 digits (handles +2348012345678 vs 08012345678)
  _phone_last10 := right(_phone_digits, 10);

  -- Try matching by normalized phone (last 10 digits)
  SELECT * INTO _rider FROM public.riders
  WHERE regexp_replace(coalesce(phone, ''), '\D', '', 'g') LIKE ('%' || _phone_last10)
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Phone number not found. Make sure you are registered as a rider. Contact admin if you need help.'
    );
  END IF;

  -- Case-insensitive name match (also trim whitespace)
  IF lower(trim(_rider.name)) != lower(trim(_name)) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Name does not match our records for this phone. Check spelling — it must match what admin used when registering you.'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'rider', jsonb_build_object('name', _rider.name, 'phone', _rider.phone)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_rider_login(TEXT, TEXT) TO anon, authenticated;
