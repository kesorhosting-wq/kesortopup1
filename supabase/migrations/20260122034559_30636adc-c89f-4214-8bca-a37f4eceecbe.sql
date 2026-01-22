-- Add icon column to payment_gateways table
ALTER TABLE public.payment_gateways 
ADD COLUMN icon text DEFAULT '💳';

-- Update the existing KHQR row to have a nicer default
UPDATE public.payment_gateways 
SET icon = '📱' 
WHERE slug = 'ikhode-bakong';