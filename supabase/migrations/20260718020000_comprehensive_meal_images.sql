-- Migration: Comprehensive meal image assignment
-- Maps all base swallow/rice meals to their respective AI-generated images
-- Covers both legacy 'Name & Soup' style and plain meal names

UPDATE public.meals
SET image_url = CASE
  -- ── SWALLOW base: Amala ─────────────────────────────────────────────────────
  WHEN name ILIKE 'amala%'            THEN '/meals/amala.png'
  WHEN name ILIKE '%amala%'           THEN '/meals/amala.png'

  -- ── SWALLOW base: Eba ───────────────────────────────────────────────────────
  WHEN name ILIKE 'eba%'              THEN '/meals/eba.png'
  WHEN name ILIKE '%eba%'             THEN '/meals/eba.png'

  -- ── SWALLOW base: Semo ──────────────────────────────────────────────────────
  WHEN name ILIKE 'semo%'             THEN '/meals/semo.png'
  WHEN name ILIKE '%semo%'            THEN '/meals/semo.png'

  -- ── SWALLOW base: Pounded Yam ───────────────────────────────────────────────
  WHEN name ILIKE 'pounded yam%'      THEN '/meals/pounded-yam.png'
  WHEN name ILIKE '%pounded yam%'     THEN '/meals/pounded-yam.png'
  WHEN name ILIKE 'iyan%'             THEN '/meals/pounded-yam.png'

  -- ── SWALLOW base: Fufu / Poundo ─────────────────────────────────────────────
  WHEN name ILIKE 'fufu%'             THEN '/meals/pounded-yam.png'
  WHEN name ILIKE 'poundo%'           THEN '/meals/pounded-yam.png'
  WHEN name ILIKE 'tuwo%'             THEN '/meals/pounded-yam.png'

  -- ── RICE base: Jollof ───────────────────────────────────────────────────────
  WHEN name ILIKE 'jollof rice%'      THEN '/meals/jollof-rice.png'
  WHEN name ILIKE '%jollof%'          THEN '/meals/jollof-rice.png'
  WHEN name ILIKE 'white rice%'       THEN '/meals/jollof-rice.png'
  WHEN name ILIKE 'ofada%'            THEN '/meals/jollof-rice.png'
  WHEN name ILIKE 'rice & beans%'     THEN '/meals/jollof-rice.png'
  WHEN name ILIKE 'rice and beans%'   THEN '/meals/jollof-rice.png'
  WHEN name ILIKE 'coconut rice%'     THEN '/meals/jollof-rice.png'

  -- ── RICE base: Fried Rice ───────────────────────────────────────────────────
  WHEN name ILIKE 'fried rice%'       THEN '/meals/fried-rice.png'
  WHEN name ILIKE '%fried rice%'      THEN '/meals/fried-rice.png'
  WHEN name ILIKE 'spaghetti%'        THEN '/meals/fried-rice.png'
  WHEN name ILIKE 'pasta%'            THEN '/meals/fried-rice.png'

  ELSE image_url
END
WHERE (
  name ILIKE 'amala%' OR name ILIKE '%amala%' OR
  name ILIKE 'eba%' OR name ILIKE '%eba%' OR
  name ILIKE 'semo%' OR name ILIKE '%semo%' OR
  name ILIKE 'pounded yam%' OR name ILIKE '%pounded yam%' OR
  name ILIKE 'iyan%' OR name ILIKE 'fufu%' OR name ILIKE 'poundo%' OR name ILIKE 'tuwo%' OR
  name ILIKE 'jollof%' OR name ILIKE '%jollof%' OR
  name ILIKE 'white rice%' OR name ILIKE 'ofada%' OR
  name ILIKE 'rice & beans%' OR name ILIKE 'rice and beans%' OR name ILIKE 'coconut rice%' OR
  name ILIKE 'fried rice%' OR name ILIKE '%fried rice%' OR
  name ILIKE 'spaghetti%' OR name ILIKE 'pasta%'
);
