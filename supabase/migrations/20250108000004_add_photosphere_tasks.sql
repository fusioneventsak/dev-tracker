-- Add tasks to Photosphere project

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

  -- Get Photosphere project ID
  SELECT id INTO v_project_id FROM public.projects WHERE name = 'Photosphere' LIMIT 1;

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Photosphere project not found';
  END IF;

  -- Delete existing tasks for Photosphere project (if any)
  DELETE FROM public.tasks WHERE project_id = v_project_id;

  RAISE NOTICE 'Deleted existing tasks for Photosphere project';

  -- Insert new tasks
  INSERT INTO public.tasks (
    id, project_id, user_id, done, feature_task, description,
    assigned_to, priority, status, start_date, target_date, notes,
    created_at, updated_at
  )
  VALUES
    (
      gen_random_uuid(), v_project_id, v_user_id, false,
      'Finish Setting up Enterprise DNS', 'Walk client through Set up.',
      'Ferdinand', 'High', 'In Progress', '2025-10-08', '2025-10-10',
      '', NOW(), NOW()
    ),
    (
      gen_random_uuid(), v_project_id, v_user_id, false,
      'Fix admin dashboard', 'Admin Dashboard and subcription are not showing the correct data',
      'Ferdinand', 'Low', 'Backlog', NULL, '2025-10-31',
      '', NOW(), NOW()
    ),
    (
      gen_random_uuid(), v_project_id, v_user_id, false,
      'Any Aspect Ratio Allowed', 'Make it so the photouploader detects the aspect ratio and displays the full aspect ratio in the photosphere. the images should still use compression to keep file size down. Empty slots remain 9:16.',
      'Ferdinand', 'High', 'Backlog', NULL, '2025-10-31',
      '', NOW(), NOW()
    );

  RAISE NOTICE 'Created 3 new tasks for Photosphere project';
END $$;
