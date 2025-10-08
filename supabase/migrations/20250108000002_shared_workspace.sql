-- Convert from individual user workspaces to shared workspace
-- All authenticated users can see and manage all data

-- Drop existing restrictive RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

DROP POLICY IF EXISTS "Users can view own team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can create own team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can update own team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can delete own team members" ON public.team_members;

DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;

DROP POLICY IF EXISTS "Users can view comments on own tasks" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments on own tasks" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

-- Create new shared workspace policies
-- Profiles: All authenticated users can view all profiles
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects: All authenticated users can manage all projects
CREATE POLICY "Authenticated users can view all projects" ON public.projects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create projects" ON public.projects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all projects" ON public.projects
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all projects" ON public.projects
  FOR DELETE USING (auth.role() = 'authenticated');

-- Team Members: All authenticated users can manage all team members
CREATE POLICY "Authenticated users can view all team members" ON public.team_members
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create team members" ON public.team_members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all team members" ON public.team_members
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all team members" ON public.team_members
  FOR DELETE USING (auth.role() = 'authenticated');

-- Tasks: All authenticated users can manage all tasks
CREATE POLICY "Authenticated users can view all tasks" ON public.tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all tasks" ON public.tasks
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all tasks" ON public.tasks
  FOR DELETE USING (auth.role() = 'authenticated');

-- Comments: All authenticated users can manage all comments
CREATE POLICY "Authenticated users can view all comments" ON public.comments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all comments" ON public.comments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all comments" ON public.comments
  FOR DELETE USING (auth.role() = 'authenticated');
