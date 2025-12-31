-- Create game_sessions table to store games as messages
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_type TEXT NOT NULL CHECK (game_type IN ('tictactoe', 'rps', 'memory')),
  player1_id UUID NOT NULL,
  player2_id UUID,
  game_state JSONB NOT NULL DEFAULT '{}',
  winner_id UUID,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Context: which chat this game belongs to
  context_type TEXT NOT NULL CHECK (context_type IN ('group', 'channel', 'dm')),
  context_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can view games they're part of
CREATE POLICY "Users can view their games"
ON public.game_sessions
FOR SELECT
USING (player1_id = player1_id OR player2_id = player2_id);

-- Anyone can create games
CREATE POLICY "Users can create games"
ON public.game_sessions
FOR INSERT
WITH CHECK (true);

-- Players can update games they're in
CREATE POLICY "Players can update their games"
ON public.game_sessions
FOR UPDATE
USING (player1_id = player1_id OR player2_id = player2_id);

-- Enable realtime for game_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_game_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_game_sessions_updated_at
BEFORE UPDATE ON public.game_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_game_session_timestamp();