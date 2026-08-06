-- Migration: 02_canvas_title_and_user_settings
-- Description: Adds title to canvases, bio/preferences to users for Settings page.

-- 1. Add title to canvases table (nullable, no default — allow NULL = "Untitled")
ALTER TABLE public.canvases
ADD COLUMN IF NOT EXISTS title TEXT;

-- 2. Add profile fields to users for the settings page
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS notification_email BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Create index for fast canvas title search
CREATE INDEX IF NOT EXISTS idx_canvases_user_id ON public.canvases(user_id);
