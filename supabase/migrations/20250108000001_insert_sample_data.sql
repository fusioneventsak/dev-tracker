-- Insert sample data for the first user in the system
-- This script will add projects, tasks, team members, and comments

DO $$
DECLARE
  v_user_id UUID;
  v_project_banana_cam UUID;
  v_project_photosphere UUID;
  v_task_auth UUID;
  v_task_camera UUID;
BEGIN
  -- Get the first user ID (you should have created an account)
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Please sign up first at http://localhost:3002/auth/signup';
  END IF;

  RAISE NOTICE 'Inserting data for user: %', v_user_id;

  -- Insert Projects
  INSERT INTO public.projects (id, user_id, name, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_user_id, 'Banana Cam', '2025-10-01T00:00:00.000Z', '2025-10-01T00:00:00.000Z')
  RETURNING id INTO v_project_banana_cam;

  INSERT INTO public.projects (id, user_id, name, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_user_id, 'Photosphere', '2025-10-01T00:00:00.000Z', '2025-10-01T00:00:00.000Z')
  RETURNING id INTO v_project_photosphere;

  RAISE NOTICE 'Created projects: Banana Cam (%), Photosphere (%)', v_project_banana_cam, v_project_photosphere;

  -- Insert Team Members
  INSERT INTO public.team_members (id, user_id, name, email, role, created_at)
  VALUES
    (gen_random_uuid(), v_user_id, 'Ferdinand', 'ferdinand@example.com', 'Developer', NOW()),
    (gen_random_uuid(), v_user_id, 'Sarah', 'sarah@example.com', 'Developer', NOW());

  RAISE NOTICE 'Created team members: Ferdinand, Sarah';

  -- Insert Tasks
  INSERT INTO public.tasks (
    id, project_id, user_id, done, feature_task, description,
    assigned_to, priority, status, start_date, target_date, notes,
    created_at, updated_at
  )
  VALUES
    (
      gen_random_uuid(), v_project_banana_cam, v_user_id, false,
      'Authentication', 'Add user authentication system',
      'Ferdinand', 'High', 'In Progress', '2025-10-01', '2025-10-15',
      'OAuth integration required', '2025-10-01T00:00:00.000Z', NOW()
    )
  RETURNING id INTO v_task_auth;

  INSERT INTO public.tasks (
    id, project_id, user_id, done, feature_task, description,
    assigned_to, priority, status, start_date, target_date, notes,
    created_at, updated_at
  )
  VALUES
    (
      gen_random_uuid(), v_project_banana_cam, v_user_id, false,
      'Camera Integration', 'Integrate camera functionality',
      'Sarah', 'High', 'Backlog', NULL, '2025-10-20',
      '', '2025-10-01T00:00:00.000Z', '2025-10-01T00:00:00.000Z'
    )
  RETURNING id INTO v_task_camera;

  RAISE NOTICE 'Created tasks: Authentication (%), Camera Integration (%)', v_task_auth, v_task_camera;

  -- Insert Comments
  INSERT INTO public.comments (id, task_id, user_id, author, content, created_at)
  VALUES
    (
      gen_random_uuid(), v_task_auth, v_user_id,
      'Sarah', 'We should use NextAuth.js for OAuth integration - it''s well maintained and has good documentation.',
      '2025-10-05T14:30:00.000Z'
    );

  RAISE NOTICE 'Created comment on Authentication task';

  RAISE NOTICE 'Data import complete! ✅';
  RAISE NOTICE 'Projects: 2, Tasks: 2, Team Members: 2, Comments: 1';
END $$;
