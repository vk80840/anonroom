import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TicTacToe from '@/components/games/TicTacToe';
import RockPaperScissors from '@/components/games/RockPaperScissors';
import MemoryGame from '@/components/games/MemoryGame';

interface GameMessageProps {
  gameType: 'tictactoe' | 'rps' | 'memory';
  playerName: string;
  onClose: () => void;
}

const GameMessage = ({ gameType, playerName, onClose }: GameMessageProps) => {
  return (
    <div className="flex justify-center my-4 message-appear">
      <div className="bg-card border border-border rounded-2xl p-4 max-w-md w-full shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-muted-foreground font-medium">
            🎮 {playerName} started a game
          </span>
          <Button variant="ghost" size="icon" onClick={onClose} className="w-6 h-6">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="bg-background rounded-xl p-3">
          {gameType === 'tictactoe' && (
            <TicTacToe onClose={onClose} player1={playerName} />
          )}
          {gameType === 'rps' && (
            <RockPaperScissors onClose={onClose} player1={playerName} />
          )}
          {gameType === 'memory' && (
            <MemoryGame onClose={onClose} player1={playerName} />
          )}
        </div>
      </div>
    </div>
  );
};

export default GameMessage;
