-- Add reply_to_id column to messages table for reply feature
ALTER TABLE public.messages ADD COLUMN reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- Add reply_to_id column to direct_messages table
ALTER TABLE public.direct_messages ADD COLUMN reply_to_id uuid REFERENCES public.direct_messages(id) ON DELETE SET NULL;

-- Add reply_to_id column to channel_messages table  
ALTER TABLE public.channel_messages ADD COLUMN reply_to_id uuid REFERENCES public.channel_messages(id) ON DELETE SET NULL;

-- Add policy for users to update their own messages in groups
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (user_id = user_id);

-- Add policy for users to delete their own messages in groups
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (user_id = user_id);

-- Add policy for users to update their own DMs
CREATE POLICY "Users can update their own DMs"
ON public.direct_messages
FOR UPDATE
USING (sender_id = sender_id);

-- Add policy for users to delete their own DMs
CREATE POLICY "Users can delete their own DMs"
ON public.direct_messages
FOR DELETE
USING (sender_id = sender_id);

-- Add policy for users to update their own channel messages
CREATE POLICY "Users can update their own channel messages"
ON public.channel_messages
FOR UPDATE
USING (user_id = user_id);

-- Add policy for users to delete their own channel messages
CREATE POLICY "Users can delete their own channel messages"
ON public.channel_messages
FOR DELETE
USING (user_id = user_id);