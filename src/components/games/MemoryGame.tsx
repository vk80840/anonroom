import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MemoryGameProps {
  onClose: () => void;
  player1: string;
  player2?: string;
  currentUserId: string;
  player1Id: string;
  player2Id?: string;
  gameState?: { cards: Card[]; currentPlayer: 1 | 2; scores: { player1: number; player2: number } };
  onStateChange?: (state: any) => void;
  onGameEnd?: (winnerId: string | null) => void;
  isDisabled?: boolean;
}

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

const EMOJIS = ['🎮', '🎲', '🎯', '🏆', '⭐', '💎', '🔥', '💡'];

const createInitialCards = (): Card[] => {
  return [...EMOJIS, ...EMOJIS]
    .sort(() => Math.random() - 0.5)
    .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
};

const MemoryGame = ({ 
  onClose, 
  player1, 
  player2 = 'Player 2', 
  currentUserId, 
  player1Id, 
  player2Id,
  gameState,
  onStateChange,
  onGameEnd,
  isDisabled = false
}: MemoryGameProps) => {
  const [cards, setCards] = useState<Card[]>(gameState?.cards || createInitialCards());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(gameState?.currentPlayer || 1);
  const [scores, setScores] = useState(gameState?.scores || { player1: 0, player2: 0 });
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (gameState) {
      setCards(gameState.cards || createInitialCards());
      setCurrentPlayer(gameState.currentPlayer || 1);
      setScores(gameState.scores || { player1: 0, player2: 0 });
    }
  }, [gameState]);

  const initGame = () => {
    const newCards = createInitialCards();
    setCards(newCards);
    setFlipped([]);
    setCurrentPlayer(1);
    setScores({ player1: 0, player2: 0 });
    setGameOver(false);
    onStateChange?.({ cards: newCards, currentPlayer: 1, scores: { player1: 0, player2: 0 } });
  };

  const isMyTurn = () => {
    if (isDisabled) return false;
    if (currentPlayer === 1 && currentUserId === player1Id) return true;
    if (currentPlayer === 2 && currentUserId === player2Id) return true;
    return false;
  };

  const handleClick = (id: number) => {
    if (flipped.length === 2 || cards[id].flipped || cards[id].matched || isDisabled) return;
    if (!isMyTurn()) return;

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      
      if (cards[first].emoji === cards[second].emoji) {
        setTimeout(() => {
          const matchedCards = newCards.map(c => 
            c.id === first || c.id === second ? { ...c, matched: true } : c
          );
          setCards(matchedCards);
          setFlipped([]);
          
          const newScores = currentPlayer === 1 
            ? { ...scores, player1: scores.player1 + 1 }
            : { ...scores, player2: scores.player2 + 1 };
          setScores(newScores);
          
          onStateChange?.({ cards: matchedCards, currentPlayer, scores: newScores });
          
          if (matchedCards.every(c => c.matched)) {
            setGameOver(true);
            const winnerId = newScores.player1 > newScores.player2 ? player1Id : 
                            newScores.player2 > newScores.player1 ? player2Id : null;
            onGameEnd?.(winnerId || null);
          }
        }, 300);
      } else {
        setTimeout(() => {
          const resetCards = newCards.map(c => 
            c.id === first || c.id === second ? { ...c, flipped: false } : c
          );
          setCards(resetCards);
          setFlipped([]);
          const nextPlayer = currentPlayer === 1 ? 2 : 1;
          setCurrentPlayer(nextPlayer);
          onStateChange?.({ cards: resetCards, currentPlayer: nextPlayer, scores });
        }, 800);
      }
    } else {
      onStateChange?.({ cards: newCards, currentPlayer, scores });
    }
  };

  const currentPlayerName = currentPlayer === 1 ? player1 : player2;
  const winner = scores.player1 > scores.player2 ? player1 : 
                 scores.player2 > scores.player1 ? player2 : 'Tie';
  const waitingForOpponent = !isMyTurn() && !gameOver && !isDisabled;

  return (
    <div className="bg-card border border-border rounded-xl p-4 max-w-xs mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground">Memory Match</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </div>
      
      <div className="text-center mb-3 space-y-1">
        <p className="text-sm text-muted-foreground">
          {player1}: {scores.player1} | {player2}: {scores.player2}
        </p>
        {!gameOver && (
          <p className={cn(
            "text-xs font-medium",
            waitingForOpponent || isDisabled ? "text-muted-foreground" : "text-primary"
          )}>
            {isDisabled ? 'Game ended' : waitingForOpponent ? `Waiting for ${currentPlayerName}...` : "Your turn"}
          </p>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => handleClick(card.id)}
            disabled={!isMyTurn() || card.flipped || card.matched || flipped.length === 2 || isDisabled}
            className={cn(
              "w-12 h-12 rounded-lg text-xl flex items-center justify-center transition-all duration-200",
              card.flipped || card.matched
                ? "bg-primary/20 border-2 border-primary"
                : "bg-secondary border-2 border-border hover:border-primary/50",
              (!isMyTurn() || isDisabled) && !card.flipped && !card.matched && "opacity-50 cursor-not-allowed"
            )}
          >
            {(card.flipped || card.matched) ? card.emoji : '?'}
          </button>
        ))}
      </div>

      {gameOver && (
        <p className="text-center font-bold mb-2 text-foreground">
          🎉 {winner === 'Tie' ? "It's a tie!" : `${winner} wins!`}
        </p>
      )}

      {!isDisabled && (
        <Button onClick={initGame} className="w-full">
          {gameOver ? 'Play Again' : 'Restart'}
        </Button>
      )}
    </div>
  );
};

export default MemoryGame;
