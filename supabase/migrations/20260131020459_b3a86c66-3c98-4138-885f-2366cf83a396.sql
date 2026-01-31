-- Create function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_game_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate slug from name if not provided or if name changed
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.name IS DISTINCT FROM NEW.name) THEN
    NEW.slug := LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'),
          '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate slugs
DROP TRIGGER IF EXISTS generate_game_slug_trigger ON public.games;
CREATE TRIGGER generate_game_slug_trigger
BEFORE INSERT OR UPDATE ON public.games
FOR EACH ROW
EXECUTE FUNCTION public.generate_game_slug();