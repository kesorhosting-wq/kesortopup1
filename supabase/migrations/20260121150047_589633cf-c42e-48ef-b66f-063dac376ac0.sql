-- Drop and recreate payment_gateways_public view with RLS-compatible security
-- The view is a security concern because it exposes payment gateway config without RLS

-- First drop the existing view
DROP VIEW IF EXISTS public.payment_gateways_public;

-- Recreate as a secure view that only exposes non-sensitive data
-- Using security_barrier to prevent information leakage through view optimization
CREATE VIEW public.payment_gateways_public 
WITH (security_barrier = true) 
AS 
SELECT 
    id,
    slug,
    name,
    enabled,
    created_at,
    updated_at,
    -- Only expose the websocket_url from config, not other potentially sensitive fields
    jsonb_build_object('websocket_url', config -> 'websocket_url') AS config
FROM payment_gateways
WHERE enabled = true;

-- Grant SELECT only to authenticated users (not anon)
REVOKE ALL ON public.payment_gateways_public FROM anon;
REVOKE ALL ON public.payment_gateways_public FROM authenticated;
GRANT SELECT ON public.payment_gateways_public TO authenticated;

-- Add comment explaining the security design
COMMENT ON VIEW public.payment_gateways_public IS 'Public-facing view of enabled payment gateways. Only exposes non-sensitive config fields (websocket_url). Requires authentication.';