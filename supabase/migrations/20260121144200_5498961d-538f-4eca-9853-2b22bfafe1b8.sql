-- Fix the handle_new_user trigger to ensure profiles are created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, wallet_balance)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    0
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update the process topup trigger to handle paid -> processing -> completed flow
CREATE OR REPLACE FUNCTION public.trigger_process_topup_on_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When status changes TO 'paid', automatically set to 'processing' and trigger fulfillment
  IF (NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid')) THEN
    -- Update status to processing
    NEW.status := 'processing';
    NEW.status_message := 'Auto-processing order...';
    
    -- Make async HTTP request to the edge function for fulfillment
    PERFORM net.http_post(
      url := 'https://nzvfzbrwlovqttsxrcws.supabase.co/functions/v1/process-topup',
      body := jsonb_build_object(
        'action', 'fulfill',
        'orderId', NEW.id::text
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56dmZ6YnJ3bG92cXR0c3hyY3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDAxMzQsImV4cCI6MjA4NDU3NjEzNH0.Si4Jvr48fSRHzaBGhQ44EfkCw068B9fIDZ1bvYqhK-g'
      )
    );
    
    RAISE LOG 'Auto-processing order % (changed from paid to processing)', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS process_topup_on_paid ON public.topup_orders;
CREATE TRIGGER process_topup_on_paid
  BEFORE UPDATE ON public.topup_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_process_topup_on_paid();