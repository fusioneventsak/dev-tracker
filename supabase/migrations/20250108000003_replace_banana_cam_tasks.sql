-- Replace tasks in Banana Cam project with new tasks

DO $$
DECLARE
  v_user_id UUID;
  v_project_id UUID;
BEGIN
  -- Get the first user ID
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found';
  END IF;

  -- Get Banana Cam project ID
  SELECT id INTO v_project_id FROM public.projects WHERE name = 'Banana Cam' LIMIT 1;

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Banana Cam project not found';
  END IF;

  -- Delete existing tasks for Banana Cam project
  DELETE FROM public.tasks WHERE project_id = v_project_id;

  RAISE NOTICE 'Deleted existing tasks for Banana Cam project';

  -- Insert new tasks
  INSERT INTO public.tasks (
    id, project_id, user_id, done, feature_task, description,
    assigned_to, priority, status, start_date, target_date, notes,
    created_at, updated_at
  )
  VALUES
    (
      gen_random_uuid(), v_project_id, v_user_id, false,
      'Authentication', 'Add user authentication system',
      'Ferdinand', 'High', 'In Progress', '2025-10-01', '2025-10-10',
      '', NOW(), NOW()
    ),
    (
      gen_random_uuid(), v_project_id, v_user_id, false,
      'Pricing Structure', 'Come up with pricing structure for tokens',
      'Arthur', 'High', 'In Progress', '2025-10-07', '2025-10-08',
      '', NOW(), NOW()
    );

  RAISE NOTICE 'Created 2 new tasks for Banana Cam project';
END $$;
