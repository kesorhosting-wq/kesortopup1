-- Add cover_image column to games table for game banner/cover images
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS cover_image TEXT;