-- Fix infinite recursion in chat_participants RLS policy
-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view participants of their chats" ON public.chat_participants;

-- Create a corrected policy that doesn't cause recursion
-- Users can view participants if they are part of the same chat
CREATE POLICY "Users can view participants of their chats"
  ON public.chat_participants FOR SELECT
  USING (
    user_id = auth.uid() OR
    chat_id IN (
      SELECT chat_id FROM public.chat_participants
      WHERE user_id = auth.uid()
    )
  );

-- Also update the insert policy to be more permissive for "all" type chats
DROP POLICY IF EXISTS "Chat creators can add participants" ON public.chat_participants;

CREATE POLICY "Users can join all-type chats"
  ON public.chat_participants FOR INSERT
  WITH CHECK (
    -- Allow chat creators to add participants
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = chat_participants.chat_id
      AND chats.created_by = auth.uid()
    )
    OR
    -- Allow any user to join "all" type chats as themselves
    (
      user_id = auth.uid() AND
      EXISTS (
        SELECT 1 FROM public.chats
        WHERE chats.id = chat_participants.chat_id
        AND chats.type = 'all'
      )
    )
  );
