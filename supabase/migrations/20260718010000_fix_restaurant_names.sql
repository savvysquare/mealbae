-- Migration: rename restaurants - replace & with 'and', fix Stomach Care name
UPDATE public.restaurants
SET name = REPLACE(name, ' & ', ' and ')
WHERE name LIKE '% & %';

-- Also fix Stomach Care and More → Stomach Care Restaurant (idempotent)
UPDATE public.restaurants
SET name = 'Stomach Care Restaurant'
WHERE name IN ('Stomach Care and More', 'Stomach Care and more');

-- Fix specific restaurant names per user request
UPDATE public.restaurants
SET name = 'Chicken Republic Gbongan Road'
WHERE name IN ('Chicken Republic Gbongan Rd', 'Chicken Republic (Gbongan Rd)');

UPDATE public.restaurants
SET name = 'Iya Sikirat Amala Spot'
WHERE name IN ('Iya Sikira Amala Spot', 'Iya Sikirat Amala spot');
