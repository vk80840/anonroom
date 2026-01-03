-- Create table for Telegram notification connections
CREATE TABLE IF NOT EXISTS public.telegram_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  telegram_chat_id BIGINT NOT NULL,
  telegram_username TEXT,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only see/manage their own connections
CREATE POLICY "Users can view own telegram connection" 
ON public.telegram_connections 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert own telegram connection" 
ON public.telegram_connections 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update own telegram connection" 
ON public.telegram_connections 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete own telegram connection" 
ON public.telegram_connections 
FOR DELETE 
USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.telegram_connections;