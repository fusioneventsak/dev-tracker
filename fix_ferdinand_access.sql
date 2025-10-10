-- Fix script for Ferdinand's access issues
-- This script will:
-- 1. Ensure Ferdinand has a profile (backfill if missing)
-- 2. Add Ferdinand to the "All Team" chat
-- 3. Verify project visibility settings

-- STEP 1: Backfill missing profile for Ferdinand if needed
-- This inserts a profile for any auth user that doesn't have one
INSERT INTO public.profiles (id, email, name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))
FROM auth.users u
WHERE u.email ILIKE '%ferdinand%'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  );

-- Verify profile was created
SELECT
  'Profile Created/Exists' as status,
  p.id,
  p.email,
  p.name
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email ILIKE '%ferdinand%';

-- STEP 2: Ensure "All Team" chat exists
-- Create it if it doesn't exist (using the first admin user as creator)
INSERT INTO public.chats (name, type, created_by)
SELECT
  'All Team',
  'all',
  (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM public.chats WHERE type = 'all'
);

-- STEP 3: Add Ferdinand to the "All Team" chat if not already there
INSERT INTO public.chat_participants (chat_id, user_id, joined_at, last_read_at)
SELECT
  c.id as chat_id,
  u.id as user_id,
  NOW() as joined_at,
  NOW() as last_read_at
FROM public.chats c
CROSS JOIN auth.users u
WHERE c.type = 'all'
  AND u.email ILIKE '%ferdinand%'
  AND NOT EXISTS (
    SELECT 1 FROM public.chat_participants cp
    WHERE cp.chat_id = c.id AND cp.user_id = u.id
  );

-- Verify Ferdinand is now in the chat
SELECT
  'Chat Membership Verified' as status,
  u.email,
  c.name as chat_name,
  cp.joined_at
FROM public.chat_participants cp
JOIN auth.users u ON u.id = cp.user_id
JOIN public.chats c ON c.id = cp.chat_id
WHERE u.email ILIKE '%ferdinand%';

-- STEP 4: Verify project visibility settings
-- Show which projects Ferdinand should now be able to see
SELECT
  'Projects Ferdinand Can See' as status,
  p.name,
  p.visibility,
  u.email as owner
FROM public.projects p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE p.visibility = 'all'
   OR p.user_id = (SELECT id FROM auth.users WHERE email ILIKE '%ferdinand%')
ORDER BY p.created_at DESC;

-- STEP 5: Final verification - Count accessible resources
SELECT
  'Final Access Count' as status,
  (SELECT COUNT(*) FROM public.profiles WHERE email ILIKE '%ferdinand%') as profile_count,
  (SELECT COUNT(*)
   FROM public.projects p
   WHERE p.visibility = 'all'
      OR p.user_id = (SELECT id FROM auth.users WHERE email ILIKE '%ferdinand%')
  ) as accessible_projects,
  (SELECT COUNT(*)
   FROM public.chat_participants cp
   JOIN auth.users u ON u.id = cp.user_id
   WHERE u.email ILIKE '%ferdinand%'
  ) as chat_memberships;

-- SUCCESS MESSAGE
SELECT '✅ Fix script completed! Ferdinand should now have access to:' as message
UNION ALL
SELECT '   - Profile in the system'
UNION ALL
SELECT '   - All Team chat'
UNION ALL
SELECT '   - All projects with visibility = ''all'''
UNION ALL
SELECT '' as message
UNION ALL
SELECT '⚠️  Ask Ferdinand to:' as message
UNION ALL
SELECT '   1. Log out completely'
UNION ALL
SELECT '   2. Clear browser cache/cookies'
UNION ALL
SELECT '   3. Log back in'
UNION ALL
SELECT '   4. Refresh the page';
