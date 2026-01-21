-- Drop and recreate the view with proper public access
DROP VIEW IF EXISTS public.payment_gateways_public;

-- Create the public view that only exposes websocket_url (safe for public)
CREATE VIEW public.payment_gateways_public 
WITH (security_invoker = false)
AS
SELECT 
  id,
  name,
  slug,
  enabled,
  created_at,
  updated_at,
  -- Only expose websocket_url from config, hide sensitive data
  jsonb_build_object('websocket_url', config->>'websocket_url') AS config
FROM public.payment_gateways;

-- Grant public read access since no sensitive data is exposed
GRANT SELECT ON public.payment_gateways_public TO anon;
GRANT SELECT ON public.payment_gateways_public TO authenticated;