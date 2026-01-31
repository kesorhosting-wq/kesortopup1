-- Add slug column to games table
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index for slug (optional, allows null for now until all games have slugs)
CREATE UNIQUE INDEX IF NOT EXISTS games_slug_unique ON public.games (slug) WHERE slug IS NOT NULL;

-- Generate slugs for existing games based on their names
-- This converts names to lowercase, replaces spaces with hyphens, and removes special characters
UPDATE public.games 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'),  -- Remove special chars
      '\s+', '-', 'g'  -- Replace spaces with hyphens
    ),
    '-+', '-', 'g'  -- Replace multiple hyphens with single
  )
)
WHERE slug IS NULL;