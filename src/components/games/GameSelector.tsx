import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Gamepad2, X } from 'lucide-react';
import TicTacToe from './TicTacToe';
import RockPaperScissors from './RockPaperScissors';
import MemoryGame from './MemoryGame';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface GameSelectorProps {
  playerName: string;
  onSendMessage?: (message: string) => void;
  onGameStart?: () => void;
  onGameEnd?: () => void;
}

type GameType = 'none' | 'tictactoe' | 'rps' | 'memory';

const games = [
  { id: 'tictactoe' as GameType, name: 'Tic Tac Toe', emoji: '⭕' },
  { id: 'rps' as GameType, name: 'Rock Paper Scissors', emoji: '✂️' },
  { id: 'memory' as GameType, name: 'Memory Match', emoji: '🧠' },
];

interface GameSelectorInternalProps extends GameSelectorProps {
  activeGame: GameType;
  setActiveGame: (game: GameType) => void;
}

export const GameDisplay = ({ playerName, onSendMessage, activeGame, setActiveGame }: GameSelectorInternalProps) => {
  const closeGame = () => {
    setActiveGame('none');
  };

  if (activeGame === 'none') return null;

  return (
    <div className="border-b border-border bg-card/30 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-end mb-2">
          <Button variant="ghost" size="icon" onClick={closeGame} className="w-8 h-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
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
    </div>
  );
};

const GameSelector = ({ playerName, onSendMessage, onGameStart, onGameEnd }: GameSelectorProps) => {
  const [showGames, setShowGames] = useState(false);
  const [activeGame, setActiveGame] = useState<GameType>('none');
  const { playClick } = useSoundEffects();

  const startGame = (game: GameType) => {
    playClick();
    setActiveGame(game);
    setShowGames(false);
    const gameName = games.find(g => g.id === game)?.name;
    onSendMessage?.(`🎮 ${playerName} started playing ${gameName}!`);
    onGameStart?.();
  };

  const handleCloseGame = () => {
    setActiveGame('none');
    onGameEnd?.();
  };

  return (
    <>
      {/* Game Display - Renders above the input area in chat */}
      {activeGame !== 'none' && (
        <GameDisplay 
          playerName={playerName}
          onSendMessage={onSendMessage}
          activeGame={activeGame}
          setActiveGame={handleCloseGame as any}
        />
      )}
      
      {/* Game Button */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            playClick();
            setShowGames(!showGames);
          }}
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
    </>
  );
};

export default GameSelector;
