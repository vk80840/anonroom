-- Add media support to direct_messages
ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT;

-- Add media support to messages (group messages)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT;

-- Add media support to channel_messages
ALTER TABLE public.channel_messages 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT;

-- Create chat_media bucket for message attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat media
CREATE POLICY "Anyone can view chat media"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');

CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-media');

CREATE POLICY "Users can delete their own chat media"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-media');