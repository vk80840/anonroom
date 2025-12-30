-- Add profile fields and security question to anon_users
ALTER TABLE public.anon_users 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS birthday date,
ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS security_question text,
ADD COLUMN IF NOT EXISTS security_answer_hash text;

-- Create channels table (public groups anyone can join)
CREATE TABLE public.channels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  member_count integer DEFAULT 0
);

-- Enable RLS on channels
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Channels are public
CREATE POLICY "Anyone can view channels" ON public.channels FOR SELECT USING (true);
CREATE POLICY "Anyone can create channels" ON public.channels FOR INSERT WITH CHECK (true);

-- Create channel members table
CREATE TABLE public.channel_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- Enable RLS on channel_members
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view channel members" ON public.channel_members FOR SELECT USING (true);
CREATE POLICY "Anyone can join channels" ON public.channel_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can leave channels" ON public.channel_members FOR DELETE USING (true);

-- Create channel messages table
CREATE TABLE public.channel_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on channel_messages
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;

-- Only members can view/send messages
CREATE POLICY "Members can view channel messages" ON public.channel_messages FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = channel_messages.channel_id AND user_id = channel_messages.user_id));

CREATE POLICY "Members can send channel messages" ON public.channel_messages FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = channel_messages.channel_id AND user_id = channel_messages.user_id));

-- Enable realtime for channels
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_messages;

-- Add custom_code to groups table
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS custom_code text;

-- Create function to update channel member count
CREATE OR REPLACE FUNCTION public.update_channel_member_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.channels SET member_count = member_count + 1 WHERE id = NEW.channel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.channels SET member_count = member_count - 1 WHERE id = OLD.channel_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for member count
CREATE TRIGGER update_channel_member_count_trigger
AFTER INSERT OR DELETE ON public.channel_members
FOR EACH ROW EXECUTE FUNCTION public.update_channel_member_count();