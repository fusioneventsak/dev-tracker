-- Diagnostic script to check Ferdinand's account and project visibility issues

-- 1. Check if Ferdinand's account exists in auth.users
SELECT
  'Auth User Check' as check_type,
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email ILIKE '%ferdinand%';

-- 2. Check if Ferdinand has a profile
SELECT
  'Profile Check' as check_type,
  p.id,
  p.email,
  p.name,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email ILIKE '%ferdinand%';

-- 3. List ALL projects with their visibility settings
SELECT
  'All Projects' as check_type,
  p.id,
  p.name,
  p.visibility,
  p.user_id,
  u.email as owner_email,
  p.created_at
FROM public.projects p
LEFT JOIN auth.users u ON u.id = p.user_id
ORDER BY p.created_at DESC;

-- 4. Check if "All Team" chat exists
SELECT
  'All Team Chat' as check_type,
  id,
  name,
  type,
  created_by,
  created_at
FROM public.chats
WHERE type = 'all';

-- 5. Check chat participants (who has access to chat)
SELECT
  'Chat Participants' as check_type,
  cp.id,
  cp.chat_id,
  u.email as participant_email,
  cp.joined_at
FROM public.chat_participants cp
JOIN auth.users u ON u.id = cp.user_id
JOIN public.chats c ON c.id = cp.chat_id
WHERE c.type = 'all'
ORDER BY cp.joined_at;

-- 6. Check if Ferdinand is in any chats
SELECT
  'Ferdinand Chat Memberships' as check_type,
  c.name,
  c.type,
  cp.joined_at
FROM public.chat_participants cp
JOIN public.chats c ON c.id = cp.chat_id
JOIN auth.users u ON u.id = cp.user_id
WHERE u.email ILIKE '%ferdinand%';

-- 7. Test RLS policy for projects (simulate Ferdinand's view)
-- This requires running AS Ferdinand's user ID
-- First, get Ferdinand's ID
WITH ferdinand_user AS (
  SELECT id FROM auth.users WHERE email ILIKE '%ferdinand%' LIMIT 1
)
SELECT
  'Projects Ferdinand Should See' as check_type,
  p.id,
  p.name,
  p.visibility,
  CASE
    WHEN p.visibility = 'all' THEN 'YES - visibility=all'
    WHEN p.user_id = (SELECT id FROM ferdinand_user) THEN 'YES - is owner'
    ELSE 'NO - restricted'
  END as ferdinand_can_access,
  p.user_id,
  u.email as owner_email
FROM public.projects p
LEFT JOIN auth.users u ON u.id = p.user_id;

-- 8. Check notifications sent to Ferdinand
SELECT
  'Ferdinand Notifications' as check_type,
  n.id,
  n.type,
  n.title,
  n.message,
  n.read,
  n.created_at
FROM public.notifications n
JOIN auth.users u ON u.id = n.user_id
WHERE u.email ILIKE '%ferdinand%'
ORDER BY n.created_at DESC
LIMIT 10;
