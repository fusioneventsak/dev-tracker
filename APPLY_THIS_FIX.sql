-- ================================================
-- COMPLETE CHAT SYSTEM FIX - RUN THIS IN SUPABASE
-- ================================================
-- This creates all tables and sets up working policies
-- Run this entire script in Supabase Dashboard → SQL Editor

-- 1. CREATE TABLES IF THEY DON'T EXIST
-- ================================================

-- Chats table
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  type TEXT NOT NULL CHECK (type IN ('direct', 'group', 'all')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat participants table
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Message files table
CREATE TABLE IF NOT EXISTS public.message_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task files table
CREATE TABLE IF NOT EXISTS public.task_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE INDEXES
-- ================================================

CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat ON public.chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON public.messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_files_message ON public.message_files(message_id);
CREATE INDEX IF NOT EXISTS idx_task_files_task ON public.task_files(task_id);

-- 3. ENABLE RLS
-- ================================================

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;

-- 4. DROP ALL EXISTING POLICIES
-- ================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'chats' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.chats';
    END LOOP;

    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'chat_participants' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.chat_participants';
    END LOOP;

    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.messages';
    END LOOP;

    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'message_files' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.message_files';
    END LOOP;

    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'task_files' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.task_files';
    END LOOP;
END $$;

-- 5. CREATE SIMPLE, WORKING POLICIES
-- ================================================

-- CHATS POLICIES
CREATE POLICY "chats_select_policy"
  ON public.chats FOR SELECT
  USING (true);

CREATE POLICY "chats_insert_policy"
  ON public.chats FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "chats_update_policy"
  ON public.chats FOR UPDATE
  USING (created_by = auth.uid());

-- CHAT PARTICIPANTS POLICIES (Simple, no recursion)
CREATE POLICY "chat_participants_select_policy"
  ON public.chat_participants FOR SELECT
  USING (true);

CREATE POLICY "chat_participants_insert_policy"
  ON public.chat_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_participants_update_policy"
  ON public.chat_participants FOR UPDATE
  USING (user_id = auth.uid());

-- MESSAGES POLICIES
CREATE POLICY "messages_select_policy"
  ON public.messages FOR SELECT
  USING (true);

CREATE POLICY "messages_insert_policy"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_update_policy"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid());

-- MESSAGE FILES POLICIES
CREATE POLICY "message_files_select_policy"
  ON public.message_files FOR SELECT
  USING (true);

CREATE POLICY "message_files_insert_policy"
  ON public.message_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages
      WHERE messages.id = message_files.message_id
      AND messages.sender_id = auth.uid()
    )
  );

-- TASK FILES POLICIES
CREATE POLICY "task_files_select_policy"
  ON public.task_files FOR SELECT
  USING (true);

CREATE POLICY "task_files_insert_policy"
  ON public.task_files FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "task_files_delete_policy"
  ON public.task_files FOR DELETE
  USING (uploaded_by = auth.uid());

-- 6. CREATE TRIGGER FUNCTION FOR CHAT UPDATES
-- ================================================

CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chats
  SET updated_at = NOW()
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_chat_on_message ON public.messages;

-- Create trigger
CREATE TRIGGER update_chat_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_timestamp();

-- ================================================
-- DONE! Your chat system is now set up.
-- Close this SQL Editor tab and refresh your app.
-- ================================================
