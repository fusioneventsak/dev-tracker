-- Migration: Auto-add new users to "All Team" chat
-- This ensures new signups immediately have access to the team chat

-- Update the handle_new_user function to also add user to All Team chat
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  all_chat_id UUID;
BEGIN
  -- 1. Create profile for new user
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );

  -- 2. Ensure "All Team" chat exists
  -- Try to get existing "All Team" chat
  SELECT id INTO all_chat_id
  FROM public.chats
  WHERE type = 'all'
  LIMIT 1;

  -- If it doesn't exist, create it (using the new user as creator for now)
  IF all_chat_id IS NULL THEN
    INSERT INTO public.chats (name, type, created_by)
    VALUES ('All Team', 'all', NEW.id)
    RETURNING id INTO all_chat_id;
  END IF;

  -- 3. Add new user to the "All Team" chat
  INSERT INTO public.chat_participants (chat_id, user_id, joined_at, last_read_at)
  VALUES (all_chat_id, NEW.id, NOW(), NOW())
  ON CONFLICT (chat_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is still active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: Add any existing users who aren't in the "All Team" chat
DO $$
DECLARE
  all_chat_id UUID;
BEGIN
  -- Get or create "All Team" chat
  SELECT id INTO all_chat_id
  FROM public.chats
  WHERE type = 'all'
  LIMIT 1;

  IF all_chat_id IS NULL THEN
    INSERT INTO public.chats (name, type, created_by)
    VALUES ('All Team', 'all', (SELECT id FROM auth.users ORDER BY created_at LIMIT 1))
    RETURNING id INTO all_chat_id;
  END IF;

  -- Add all users who aren't already participants
  INSERT INTO public.chat_participants (chat_id, user_id, joined_at, last_read_at)
  SELECT
    all_chat_id,
    u.id,
    NOW(),
    NOW()
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.chat_participants cp
    WHERE cp.chat_id = all_chat_id AND cp.user_id = u.id
  );

  RAISE NOTICE 'Added % users to All Team chat', (
    SELECT COUNT(*) FROM public.chat_participants WHERE chat_id = all_chat_id
  );
END $$;

-- Verification
SELECT
  'All Team Chat Setup' as status,
  c.name,
  c.type,
  COUNT(cp.id) as participant_count
FROM public.chats c
LEFT JOIN public.chat_participants cp ON cp.chat_id = c.id
WHERE c.type = 'all'
GROUP BY c.id, c.name, c.type;
