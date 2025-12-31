import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TicTacToe from '@/components/games/TicTacToe';
import RockPaperScissors from '@/components/games/RockPaperScissors';
import MemoryGame from '@/components/games/MemoryGame';

interface GameMessageProps {
  gameType: 'tictactoe' | 'rps' | 'memory';
  playerName: string;
  player2Name?: string; // For DMs - the other person
  members?: { user_id: string; username: string }[]; // For group chats/channels - FCFS
  onClose: () => void;
}

const GameMessage = ({ gameType, playerName, player2Name, members, onClose }: GameMessageProps) => {
  // Determine player 2 based on context
  // DM: player2Name is the other person
  // Group/Channel: FCFS - first other member becomes player 2
  const getPlayer2 = () => {
    if (player2Name) return player2Name;
    if (members && members.length > 0) {
      const otherMembers = members.filter(m => m.username !== playerName);
      return otherMembers.length > 0 ? otherMembers[0].username : 'Waiting...';
    }
    return 'Player 2';
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
            <TicTacToe onClose={onClose} player1={playerName} player2={player2} />
          )}
          {gameType === 'rps' && (
            <RockPaperScissors onClose={onClose} player1={playerName} player2={player2} />
          )}
          {gameType === 'memory' && (
            <MemoryGame onClose={onClose} player1={playerName} player2={player2} />
          )}
        </div>
      </div>
    </div>
  );
};

export default GameMessage;