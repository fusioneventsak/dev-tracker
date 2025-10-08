-- Add visibility and sharing permissions to projects and tasks

-- Add columns to projects table
ALTER TABLE public.projects
ADD COLUMN visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'specific', 'all')),
ADD COLUMN shared_with UUID[] DEFAULT ARRAY[]::UUID[];

-- Add columns to tasks table
ALTER TABLE public.tasks
ADD COLUMN visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'specific', 'all')),
ADD COLUMN shared_with UUID[] DEFAULT ARRAY[]::UUID[];

-- Update existing rows to have default visibility
UPDATE public.projects SET visibility = 'private' WHERE visibility IS NULL;
UPDATE public.tasks SET visibility = 'private' WHERE visibility IS NULL;

-- Drop existing RLS policies for projects
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

-- Drop existing RLS policies for tasks
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;

-- New RLS Policies for projects with visibility support
CREATE POLICY "Users can view accessible projects" ON public.projects
  FOR SELECT USING (
    auth.uid() = user_id OR  -- Owner can always view
    visibility = 'all' OR     -- Anyone can view if visibility is 'all'
    (visibility = 'specific' AND auth.uid() = ANY(shared_with))  -- Shared users can view
  );

CREATE POLICY "Users can create own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- New RLS Policies for tasks with visibility support
CREATE POLICY "Users can view accessible tasks" ON public.tasks
  FOR SELECT USING (
    auth.uid() = user_id OR  -- Owner can always view
    visibility = 'all' OR     -- Anyone can view if visibility is 'all'
    (visibility = 'specific' AND auth.uid() = ANY(shared_with)) OR  -- Shared users can view
    -- Also check if user has access to the parent project
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
      AND (
        projects.user_id = auth.uid() OR
        projects.visibility = 'all' OR
        (projects.visibility = 'specific' AND auth.uid() = ANY(projects.shared_with))
      )
    )
  );

CREATE POLICY "Users can create own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Update comments policy to work with new task visibility
DROP POLICY IF EXISTS "Users can view comments on own tasks" ON public.comments;
CREATE POLICY "Users can view comments on accessible tasks" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = comments.task_id
      AND (
        tasks.user_id = auth.uid() OR
        tasks.visibility = 'all' OR
        (tasks.visibility = 'specific' AND auth.uid() = ANY(tasks.shared_with)) OR
        EXISTS (
          SELECT 1 FROM public.projects
          WHERE projects.id = tasks.project_id
          AND (
            projects.user_id = auth.uid() OR
            projects.visibility = 'all' OR
            (projects.visibility = 'specific' AND auth.uid() = ANY(projects.shared_with))
          )
        )
      )
    )
  );
