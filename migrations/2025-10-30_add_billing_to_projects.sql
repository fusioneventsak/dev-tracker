-- Add billing fields to projects table
-- Run this in Supabase SQL Editor or via CLI

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS billed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS billed_date DATE NULL;

-- Backfill: ensure billed is false where null (older rows)
UPDATE public.projects SET billed = FALSE WHERE billed IS NULL;

-- Optional index if you plan to filter by billed often
CREATE INDEX IF NOT EXISTS idx_projects_billed ON public.projects(billed);
