-- Add policy for public/anon users to view enabled payment gateways (basic info only)
-- This allows the Topup page to display payment options to non-logged-in users
CREATE POLICY "Public can view enabled payment gateways" 
ON public.payment_gateways 
FOR SELECT 
TO anon, authenticated
USING (enabled = true);