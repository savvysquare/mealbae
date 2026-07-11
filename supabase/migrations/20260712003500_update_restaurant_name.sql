-- Update restaurant name from 'Stomach Care and More' to 'Stomach Care Restaurant'
UPDATE public.restaurants 
SET name = 'Stomach Care Restaurant' 
WHERE name = 'Stomach Care and More';
