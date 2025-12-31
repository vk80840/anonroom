import { useState, useEffect } from 'react';
import { Gamepad2, Trophy, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import TicTacToe from '@/components/games/TicTacToe';
import RockPaperScissors from '@/components/games/RockPaperScissors';
import MemoryGame from '@/components/games/MemoryGame';
import SnakeGame from '@/components/games/SnakeGame';
import Connect4 from '@/components/games/Connect4';
import WordGuess from '@/components/games/WordGuess';

interface GameSession {
  id: string;
  game_type: 'tictactoe' | 'rps' | 'memory' | 'snake' | 'connect4' | 'wordguess';
  player1_id: string;
  player2_id: string | null;
  game_state: any;
  winner_id: string | null;
  status: 'waiting' | 'playing' | 'finished';
  created_at: string;
}

interface GameMessageCardProps {
  gameSession: GameSession;
  currentUserId: string;
  player1Name: string;
  player2Name?: string;
  onGameUpdate: (gameState: any, winnerId?: string, status?: string) => void;
}

const gameNames: Record<string, string> = {
  tictactoe: 'Tic Tac Toe',
  rps: 'Rock Paper Scissors',
  memory: 'Memory Match',
  snake: 'Snake',
  connect4: 'Connect 4',
  wordguess: 'Word Guess',
};

const gameEmojis: Record<string, string> = {
  tictactoe: '⭕',
  rps: '✂️',
  memory: '🧠',
  snake: '🐍',
  connect4: '🔴',
  wordguess: '📝',
};

const GameMessageCard = ({ 
  gameSession, 
  currentUserId, 
  player1Name, 
  player2Name = 'Waiting...',
  onGameUpdate
}: GameMessageCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localGameState, setLocalGameState] = useState(gameSession.game_state);

  useEffect(() => {
    setLocalGameState(gameSession.game_state);
  }, [gameSession.game_state]);

  const handleGameStateChange = async (newState: any) => {
    setLocalGameState(newState);
    onGameUpdate(newState);
  };

  const handleGameEnd = async (winnerId: string | null) => {
    onGameUpdate(localGameState, winnerId || undefined, 'finished');
  };

  const joinGame = async () => {
    if (!gameSession.player2_id && currentUserId !== gameSession.player1_id) {
      await supabase
        .from('game_sessions')
        .update({ player2_id: currentUserId, status: 'playing' })
        .eq('id', gameSession.id);
    }
    setIsExpanded(true);
  };

  const isPlayer = currentUserId === gameSession.player1_id || currentUserId === gameSession.player2_id;
  const isWinner = gameSession.winner_id === currentUserId;
  const hasEnded = gameSession.status === 'finished';

  // Collapsed card view
  if (!isExpanded) {
    return (
      <div className="flex justify-center my-3">
        <div 
          className={`bg-card border rounded-2xl p-4 max-w-sm w-full shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
            hasEnded ? 'border-muted' : 'border-primary/30'
          }`}
          onClick={joinGame}
        >
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
              hasEnded ? 'bg-muted' : 'bg-primary/10'
            }`}>
              {gameEmojis[gameSession.game_type]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {gameNames[gameSession.game_type]}
                </span>
                {hasEnded && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    Finished
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{player1Name}</span>
                <span>vs</span>
                <span>{gameSession.player2_id ? player2Name : 'Waiting...'}</span>
              </div>
            </div>
            {hasEnded && gameSession.winner_id && (
              <div className="flex items-center gap-1 text-yellow-500">
                <Trophy className="w-4 h-4" />
                <span className="text-xs font-medium">
                  {isWinner ? 'You won!' : 'Lost'}
                </span>
              </div>
            )}
            {!hasEnded && (
              <div className="flex items-center gap-1 text-primary">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Tap to play</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Expanded game view
  return (
    <div className="flex justify-center my-4 message-appear">
      <div className="bg-card border border-border rounded-2xl p-4 max-w-md w-full shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" />
            {gameNames[gameSession.game_type]}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(false)}
            className="text-xs"
          >
            Minimize
          </Button>
        </div>
        
        <div className="bg-background rounded-xl p-3">
          {gameSession.game_type === 'tictactoe' && (
            <TicTacToe
              onClose={() => setIsExpanded(false)}
              player1={player1Name}
              player2={player2Name}
              currentUserId={currentUserId}
              player1Id={gameSession.player1_id}
              player2Id={gameSession.player2_id || ''}
              gameState={localGameState}
              onStateChange={handleGameStateChange}
              onGameEnd={handleGameEnd}
            />
          )}
          {gameSession.game_type === 'rps' && (
            <RockPaperScissors
              onClose={() => setIsExpanded(false)}
              player1={player1Name}
              player2={player2Name}
              currentUserId={currentUserId}
              player1Id={gameSession.player1_id}
              player2Id={gameSession.player2_id || ''}
              gameState={localGameState}
              onStateChange={handleGameStateChange}
              onGameEnd={handleGameEnd}
            />
          )}
          {gameSession.game_type === 'memory' && (
            <MemoryGame
              onClose={() => setIsExpanded(false)}
              player1={player1Name}
              player2={player2Name}
              currentUserId={currentUserId}
              player1Id={gameSession.player1_id}
              player2Id={gameSession.player2_id || ''}
              gameState={localGameState}
              onStateChange={handleGameStateChange}
              onGameEnd={handleGameEnd}
            />
          )}
          {gameSession.game_type === 'snake' && (
            <SnakeGame
              onClose={() => setIsExpanded(false)}
              player1={player1Name}
              currentUserId={currentUserId}
              player1Id={gameSession.player1_id}
              onGameEnd={handleGameEnd}
            />
          )}
          {gameSession.game_type === 'connect4' && (
            <Connect4
              onClose={() => setIsExpanded(false)}
              player1={player1Name}
              player2={player2Name}
              currentUserId={currentUserId}
              player1Id={gameSession.player1_id}
              player2Id={gameSession.player2_id || ''}
              gameState={localGameState}
              onStateChange={handleGameStateChange}
              onGameEnd={handleGameEnd}
            />
          )}
          {gameSession.game_type === 'wordguess' && (
            <WordGuess
              onClose={() => setIsExpanded(false)}
              player1={player1Name}
              currentUserId={currentUserId}
              player1Id={gameSession.player1_id}
              onGameEnd={handleGameEnd}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GameMessageCard;
