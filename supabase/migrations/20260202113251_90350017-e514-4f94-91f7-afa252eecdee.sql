-- Add default_package_icon column to games table for per-game default package icons
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS default_package_icon text;

-- Add comment for clarity
COMMENT ON COLUMN public.games.default_package_icon IS 'Default icon URL to use for packages in this game when no package-specific icon is set';