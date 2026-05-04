
-- Allow users to update their own chat messages
CREATE POLICY "Users update own messages" ON public.chat_messages
FOR UPDATE TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);
