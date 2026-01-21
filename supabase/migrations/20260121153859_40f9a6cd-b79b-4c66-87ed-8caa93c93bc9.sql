-- Add featured column to games table
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

-- Create index for faster featured game queries
CREATE INDEX IF NOT EXISTS idx_games_featured ON public.games(featured) WHERE featured = true;