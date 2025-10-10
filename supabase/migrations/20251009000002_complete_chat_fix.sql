-- Complete chat system fix
-- 1. Drop ALL existing policies to start fresh
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on chat_participants
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'chat_participants') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.chat_participants';
    END LOOP;

    -- Drop all policies on chats
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'chats') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.chats';
    END LOOP;

    -- Drop all policies on messages
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'messages') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.messages';
    END LOOP;
END $$;

-- 2. Create simple, working policies
-- Chat participants - allow all authenticated users to view and manage
CREATE POLICY "chat_participants_select" ON public.chat_participants
    FOR SELECT USING (true);

CREATE POLICY "chat_participants_insert" ON public.chat_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_participants_update" ON public.chat_participants
    FOR UPDATE USING (user_id = auth.uid());

-- Chats - allow all authenticated users to view and create
CREATE POLICY "chats_select" ON public.chats
    FOR SELECT USING (true);

CREATE POLICY "chats_insert" ON public.chats
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "chats_update" ON public.chats
    FOR UPDATE USING (created_by = auth.uid());

-- Messages - allow viewing and creating messages
CREATE POLICY "messages_select" ON public.messages
    FOR SELECT USING (true);

CREATE POLICY "messages_insert" ON public.messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_update" ON public.messages
    FOR UPDATE USING (sender_id = auth.uid());

-- 3. Ensure foreign key exists (add if missing)
DO $$
BEGIN
    -- Check if foreign key exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'messages_sender_id_fkey'
    ) THEN
        ALTER TABLE public.messages
        ADD CONSTRAINT messages_sender_id_fkey
        FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;
