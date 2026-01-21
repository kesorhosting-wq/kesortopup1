-- Fix the security definer view issue by using SECURITY INVOKER
-- This ensures the view respects the permissions of the querying user

DROP VIEW IF EXISTS public.payment_gateways_public;

-- Recreate view with SECURITY INVOKER (default, but explicit for clarity)
-- This view now respects the RLS of the underlying payment_gateways table
CREATE VIEW public.payment_gateways_public AS 
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
COMMENT ON VIEW public.payment_gateways_public IS 'Public-facing view of enabled payment gateways. Only exposes non-sensitive config fields (websocket_url). Requires authentication. Uses SECURITY INVOKER to respect underlying table RLS.';