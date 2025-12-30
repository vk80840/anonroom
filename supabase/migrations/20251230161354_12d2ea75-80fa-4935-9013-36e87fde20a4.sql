-- Create table for anonymous users (username + password only, no email)
CREATE TABLE public.anon_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for groups
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.anon_users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE DEFAULT substring(md5(random()::text), 1, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for group members
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.anon_users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create table for messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.anon_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.anon_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for anon_users (public read for username display, but password protected)
CREATE POLICY "Anyone can view usernames" 
ON public.anon_users 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create account" 
ON public.anon_users 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for groups (public access since no auth)
CREATE POLICY "Anyone can view groups" 
ON public.groups 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create groups" 
ON public.groups 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for group_members
CREATE POLICY "Anyone can view group members" 
ON public.group_members 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can join groups" 
ON public.group_members 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can leave groups" 
ON public.group_members 
FOR DELETE 
USING (true);

-- RLS Policies for messages
CREATE POLICY "Anyone can view messages" 
ON public.messages 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;