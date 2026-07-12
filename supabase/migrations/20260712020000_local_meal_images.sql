-- Migration: Set image_url for meals that now have local generated images
-- Generated images are served from /meals/ in the public folder

UPDATE public.meals SET image_url = CASE name
  -- Swallow meals (generated images)
  WHEN 'Amala & Ewedu (Gbegiri)'    THEN '/meals/amala.png'
  WHEN 'Amala + Ewedu + Gbegiri'    THEN '/meals/amala.png'
  WHEN 'Amala + Efo Riro'           THEN '/meals/amala.png'
  WHEN 'Amala & Ewedu'              THEN '/meals/amala.png'
  WHEN 'Black Amala & Ewedu'        THEN '/meals/amala.png'
  WHEN 'Eba & Efo Riro'             THEN '/meals/eba.png'
  WHEN 'Eba & Egusi'                THEN '/meals/eba.png'
  WHEN 'Eba & Vegetable Soup'       THEN '/meals/eba.png'
  WHEN 'Semo & Okra Soup'           THEN '/meals/semo.png'
  WHEN 'Semo & Vegetable Soup'      THEN '/meals/semo.png'
  WHEN 'Semo + Egusi'               THEN '/meals/semo.png'
  WHEN 'Pounded Yam & Efo Riro'     THEN '/meals/pounded-yam.png'
  WHEN 'Pounded Yam & Egusi'        THEN '/meals/pounded-yam.png'
  WHEN 'Pounded Yam + Egusi'        THEN '/meals/pounded-yam.png'
  WHEN 'Tuwo & Miyan Kuka'          THEN '/meals/semo.png'

  -- Rice meals (generated images)
  WHEN 'Jollof Rice'                THEN '/meals/jollof-rice.png'
  WHEN 'Jollof Rice & Chicken'      THEN '/meals/jollof-rice.png'
  WHEN 'Kili Jollof + Chicken'      THEN '/meals/jollof-rice.png'
  WHEN 'Fried Rice'                 THEN '/meals/fried-rice.png'
  WHEN 'Fried Rice & Beef'          THEN '/meals/fried-rice.png'
  WHEN 'Fried Rice & Chicken'       THEN '/meals/fried-rice.png'
  WHEN 'Fried Rice + Chicken'       THEN '/meals/fried-rice.png'
  WHEN 'Coconut Rice'               THEN '/meals/jollof-rice.png'
  WHEN 'White Rice + Stew'          THEN '/meals/jollof-rice.png'
  WHEN 'White Rice & Stew'          THEN '/meals/jollof-rice.png'
  WHEN 'White Rice & Beans'         THEN '/meals/jollof-rice.png'
  WHEN 'Ofada Rice & Ayamase'       THEN '/meals/jollof-rice.png'
  WHEN 'Ofada Rice + Ayamase'       THEN '/meals/jollof-rice.png'
  WHEN 'Ofada with Fried Fish'      THEN '/meals/jollof-rice.png'
  WHEN 'Ofada with Assorted Meat'   THEN '/meals/jollof-rice.png'
  WHEN 'Rice & Beans + Plantain'    THEN '/meals/jollof-rice.png'
  WHEN 'Spaghetti Bolognese'        THEN '/meals/fried-rice.png'
  WHEN 'Spaghetti Jollof'           THEN '/meals/fried-rice.png'
  ELSE image_url  -- keep existing for meals not explicitly mapped here
END
WHERE name IN (
  'Amala & Ewedu (Gbegiri)', 'Amala + Ewedu + Gbegiri', 'Amala + Efo Riro',
  'Amala & Ewedu', 'Black Amala & Ewedu',
  'Eba & Efo Riro', 'Eba & Egusi', 'Eba & Vegetable Soup',
  'Semo & Okra Soup', 'Semo & Vegetable Soup', 'Semo + Egusi',
  'Pounded Yam & Efo Riro', 'Pounded Yam & Egusi', 'Pounded Yam + Egusi',
  'Tuwo & Miyan Kuka',
  'Jollof Rice', 'Jollof Rice & Chicken', 'Kili Jollof + Chicken',
  'Fried Rice', 'Fried Rice & Beef', 'Fried Rice & Chicken', 'Fried Rice + Chicken',
  'Coconut Rice', 'White Rice + Stew', 'White Rice & Stew', 'White Rice & Beans',
  'Ofada Rice & Ayamase', 'Ofada Rice + Ayamase', 'Ofada with Fried Fish',
  'Ofada with Assorted Meat', 'Rice & Beans + Plantain',
  'Spaghetti Bolognese', 'Spaghetti Jollof'
);
