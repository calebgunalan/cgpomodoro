-- Add work/break duration settings to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS work_duration integer NOT NULL DEFAULT 25,
ADD COLUMN IF NOT EXISTS short_break_duration integer NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS long_break_duration integer NOT NULL DEFAULT 15,
ADD COLUMN IF NOT EXISTS sound_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS sound_type text NOT NULL DEFAULT 'bell';