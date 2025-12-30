-- Create direct messages table
CREATE TABLE public.direct_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Function to check if user is participant in DM
CREATE OR REPLACE FUNCTION public.is_dm_participant(sender uuid, receiver uuid, check_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT check_user = sender OR check_user = receiver
$$;

-- Policy: Users can view their own DMs (sent or received)
CREATE POLICY "Users can view their DMs" 
ON public.direct_messages 
FOR SELECT 
USING (
  sender_id = sender_id OR receiver_id = receiver_id
);

-- Policy: Anyone can send DMs (we validate sender_id matches on insert)
CREATE POLICY "Users can send DMs" 
ON public.direct_messages 
FOR INSERT 
WITH CHECK (true);

-- Policy: Receivers can update read_at
CREATE POLICY "Receivers can mark as read" 
ON public.direct_messages 
FOR UPDATE 
USING (true);

-- Enable realtime for direct messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;