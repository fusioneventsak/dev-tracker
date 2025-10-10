-- Backfill missing profiles for existing auth.users
-- This ensures every auth user has a corresponding profile

INSERT INTO public.profiles (id, email, name, created_at)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', email) as name,
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
