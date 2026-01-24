-- Fix linter ERROR: make public view run with invoker permissions
CREATE OR REPLACE VIEW public.payment_gateways_public
WITH (security_invoker = true)
AS
SELECT
  id,
  name,
  slug,
  enabled,
  created_at,
  updated_at,
  jsonb_build_object('websocket_url', (config ->> 'websocket_url'::text)) AS config
FROM public.payment_gateways;