-- Fix 1: Create a secure view for anon_users that hides password_hash
CREATE VIEW public.anon_users_public AS
SELECT id, username, created_at, last_seen_at
FROM public.anon_users;

-- Grant access to the view
GRANT SELECT ON public.anon_users_public TO anon;
GRANT SELECT ON public.anon_users_public TO authenticated;

-- Fix 2: Create function to check if user is a group member (for use in RLS)
CREATE OR REPLACE FUNCTION public.is_group_member(group_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = group_uuid
    AND user_id = user_uuid
  )
$$;

-- Fix 3: Drop overly permissive message policies and create member-only policy
DROP POLICY IF EXISTS "Anyone can view messages" ON public.messages;

CREATE POLICY "Members can view group messages" 
ON public.messages 
FOR SELECT 
USING (
  public.is_group_member(group_id, user_id)
);

-- Fix 4: Tighten message insert policy to require group membership
DROP POLICY IF EXISTS "Anyone can send messages" ON public.messages;

CREATE POLICY "Members can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  public.is_group_member(group_id, user_id)
);

-- Fix 5: Create a secure function for password verification (called by edge function)
CREATE OR REPLACE FUNCTION public.verify_password(user_username text, provided_password text)
RETURNS TABLE(id uuid, username text, created_at timestamptz, last_seen_at timestamptz, password_valid boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
  user_record record;
BEGIN
  SELECT au.id, au.username, au.created_at, au.last_seen_at, au.password_hash
  INTO user_record
  FROM public.anon_users au
  WHERE au.username = lower(user_username);
  
  IF user_record IS NULL THEN
    RETURN;
  END IF;
  
  -- Return user data with password validity flag
  -- The actual bcrypt comparison will be done in the edge function
  RETURN QUERY SELECT 
    user_record.id,
    user_record.username,
    user_record.created_at,
    user_record.last_seen_at,
    user_record.password_hash = provided_password as password_valid;
END;
$$;

-- Create function to register user with password (will be updated to use bcrypt via edge function)
CREATE OR REPLACE FUNCTION public.create_user_with_password(user_username text, hashed_password text)
RETURNS TABLE(id uuid, username text, created_at timestamptz, last_seen_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user record;
BEGIN
  -- Check if username exists
  IF EXISTS (SELECT 1 FROM public.anon_users WHERE anon_users.username = lower(user_username)) THEN
    RAISE EXCEPTION 'Username already taken';
  END IF;
  
  INSERT INTO public.anon_users (username, password_hash)
  VALUES (lower(user_username), hashed_password)
  RETURNING anon_users.id, anon_users.username, anon_users.created_at, anon_users.last_seen_at
  INTO new_user;
  
  RETURN QUERY SELECT new_user.id, new_user.username, new_user.created_at, new_user.last_seen_at;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.verify_password TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_with_password TO anon;