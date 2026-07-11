-- Alter type public.order_status to add 'rider_arrived_at_restaurant' status
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'rider_arrived_at_restaurant' BEFORE 'out_for_delivery';
