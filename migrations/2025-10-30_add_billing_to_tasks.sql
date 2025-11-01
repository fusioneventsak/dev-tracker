-- Add billing fields to tasks table
-- Run this in Supabase SQL Editor or via CLI

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS billed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS billed_date DATE NULL;

-- Backfill: ensure billed is false where null (older rows)
UPDATE public.tasks SET billed = FALSE WHERE billed IS NULL;

-- Optional index for frequent billing filters
CREATE INDEX IF NOT EXISTS idx_tasks_billed ON public.tasks(billed);
