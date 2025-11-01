-- Add billing fields to projects and tasks tables
-- This migration adds the missing billed and billed_date columns

-- Add billing fields to projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS billed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS billed_date DATE NULL;

-- Add billing fields to tasks table  
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS billed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS billed_date DATE NULL;

-- Backfill: ensure billed is false where null (older rows)
UPDATE public.projects SET billed = FALSE WHERE billed IS NULL;
UPDATE public.tasks SET billed = FALSE WHERE billed IS NULL;

-- Optional indexes for frequent billing filters
CREATE INDEX IF NOT EXISTS idx_projects_billed ON public.projects(billed);
CREATE INDEX IF NOT EXISTS idx_tasks_billed ON public.tasks(billed);
