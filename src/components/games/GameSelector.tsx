import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Gamepad2 } from 'lucide-react';
import TicTacToe from './TicTacToe';
import RockPaperScissors from './RockPaperScissors';
import MemoryGame from './MemoryGame';

interface GameSelectorProps {
  playerName: string;
  onSendMessage?: (message: string) => void;
}

type GameType = 'none' | 'tictactoe' | 'rps' | 'memory';

const games = [
  { id: 'tictactoe' as GameType, name: 'Tic Tac Toe', emoji: '⭕' },
  { id: 'rps' as GameType, name: 'Rock Paper Scissors', emoji: '✂️' },
  { id: 'memory' as GameType, name: 'Memory Match', emoji: '🧠' },
];

const GameSelector = ({ playerName, onSendMessage }: GameSelectorProps) => {
  const [showGames, setShowGames] = useState(false);
  const [activeGame, setActiveGame] = useState<GameType>('none');

  const startGame = (game: GameType) => {
    setActiveGame(game);
    setShowGames(false);
    const gameName = games.find(g => g.id === game)?.name;
    onSendMessage?.(`🎮 ${playerName} started playing ${gameName}!`);
  };

  const closeGame = () => {
    setActiveGame('none');
  };

  if (activeGame !== 'none') {
    return (
      <div className="mb-4">
        {activeGame === 'tictactoe' && (
          <TicTacToe onClose={closeGame} player1={playerName} />
        )}
        {activeGame === 'rps' && (
          <RockPaperScissors onClose={closeGame} player1={playerName} />
        )}
        {activeGame === 'memory' && (
          <MemoryGame onClose={closeGame} player1={playerName} />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowGames(!showGames)}
        className="text-muted-foreground hover:text-foreground"
      >
        <Gamepad2 className="w-5 h-5" />
      </Button>
      
      {showGames && (
        <div className="absolute bottom-12 left-0 bg-card border border-border rounded-xl p-3 shadow-lg min-w-48 z-50">
          <p className="text-xs text-muted-foreground mb-2 font-semibold">Play a Game</p>
          <div className="space-y-1">
            {games.map(game => (
              <button
                key={game.id}
                onClick={() => startGame(game.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 text-foreground text-sm transition-colors"
              >
                <span>{game.emoji}</span>
                <span>{game.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameSelector;
