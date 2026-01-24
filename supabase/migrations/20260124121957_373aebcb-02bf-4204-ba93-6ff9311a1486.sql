-- Add support for G2Bulk region/alternate game codes in verification configs
ALTER TABLE public.game_verification_configs
ADD COLUMN IF NOT EXISTS alternate_api_codes text[] NOT NULL DEFAULT '{}'::text[];

-- Default provider should now be G2Bulk
ALTER TABLE public.game_verification_configs
ALTER COLUMN api_provider SET DEFAULT 'g2bulk';

-- Migrate existing configs away from RapidAPI
UPDATE public.game_verification_configs
SET api_provider = 'g2bulk'
WHERE api_provider IS NULL OR api_provider = 'rapidapi';

-- Update auto-sync function for new games to default to G2Bulk (code will be corrected via Admin sync)
CREATE OR REPLACE FUNCTION public.sync_game_to_verification_config()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  normalized_name TEXT;
  api_code TEXT;
  needs_zone BOOLEAN;
BEGIN
  -- Check if a verification config already exists for this game name
  IF EXISTS (
    SELECT 1 FROM public.game_verification_configs 
    WHERE LOWER(game_name) = LOWER(NEW.name)
  ) THEN
    RETURN NEW;
  END IF;

  -- Normalize game name to create an initial code (Admin Sync will replace with exact G2Bulk codes)
  normalized_name := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]', '-', 'g'));
  normalized_name := REGEXP_REPLACE(normalized_name, '-+', '-', 'g');
  normalized_name := TRIM(BOTH '-' FROM normalized_name);

  -- Determine if zone is typically required (common patterns)
  needs_zone := (
    LOWER(NEW.name) LIKE '%mobile legends%' OR 
    LOWER(NEW.name) LIKE '%mlbb%' OR
    LOWER(NEW.name) LIKE '%magic chess%'
  );

  api_code := normalized_name;

  -- Insert new verification config with sensible defaults
  INSERT INTO public.game_verification_configs (
    game_name,
    api_code,
    api_provider,
    requires_zone,
    is_active,
    alternate_api_codes
  ) VALUES (
    NEW.name,
    api_code,
    'g2bulk',
    needs_zone,
    true,
    '{}'::text[]
  );

  RETURN NEW;
END;
$function$;