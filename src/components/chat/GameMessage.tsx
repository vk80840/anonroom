import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TicTacToe from '@/components/games/TicTacToe';
import RockPaperScissors from '@/components/games/RockPaperScissors';
import MemoryGame from '@/components/games/MemoryGame';

interface GameMessageProps {
  gameType: 'tictactoe' | 'rps' | 'memory';
  playerName: string;
  playerId: string;
  currentUserId: string;
  player2Name?: string;
  player2Id?: string;
  members?: { user_id: string; username: string }[];
  onClose: () => void;
}

const GameMessage = ({ gameType, playerName, playerId, currentUserId, player2Name, player2Id, members, onClose }: GameMessageProps) => {
  const getPlayer2 = () => {
    if (player2Name) return { name: player2Name, id: player2Id || '' };
    if (members && members.length > 0) {
      const otherMembers = members.filter(m => m.user_id !== playerId);
      if (otherMembers.length > 0) return { name: otherMembers[0].username, id: otherMembers[0].user_id };
    }
    return { name: 'Waiting...', id: '' };
  };

  const player2 = getPlayer2();

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
            <TicTacToe onClose={onClose} player1={playerName} player2={player2.name} currentUserId={currentUserId} player1Id={playerId} player2Id={player2.id} />
          )}
          {gameType === 'rps' && (
            <RockPaperScissors onClose={onClose} player1={playerName} player2={player2.name} currentUserId={currentUserId} player1Id={playerId} player2Id={player2.id} />
          )}
          {gameType === 'memory' && (
            <MemoryGame onClose={onClose} player1={playerName} player2={player2.name} currentUserId={currentUserId} player1Id={playerId} player2Id={player2.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default GameMessage;