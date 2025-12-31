-- Change context_id from uuid to text to support DM composite keys
ALTER TABLE public.game_sessions ALTER COLUMN context_id TYPE text USING context_id::text;