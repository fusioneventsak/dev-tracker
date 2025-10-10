-- Fix profiles table foreign key to include ON DELETE CASCADE
-- This ensures that when a user is deleted from auth.users, their profile is automatically deleted

-- Drop the existing foreign key constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add the foreign key constraint back with ON DELETE CASCADE
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Note: The deleteAuthenticatedUser function in lib/db.ts now explicitly deletes
-- the profile before calling auth.admin.deleteUser() for defensive programming.
-- This migration ensures the schema is also correct for any future direct deletions.
