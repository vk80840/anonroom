import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MemoryGameProps {
  onClose: () => void;
  player1: string;
}

const EMOJIS = ['🎮', '🎲', '🎯', '🏆', '⭐', '💎', '🔥', '💡'];

const MemoryGame = ({ onClose, player1 }: MemoryGameProps) => {
  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const shuffled = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setCards(shuffled);
    setFlipped([]);
    setMoves(0);
    setGameOver(false);
  };

  const handleClick = (id: number) => {
    if (flipped.length === 2 || cards[id].flipped || cards[id].matched) return;

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      
      if (cards[first].emoji === cards[second].emoji) {
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === first || c.id === second ? { ...c, matched: true } : c
          ));
          setFlipped([]);
          
          // Check win
          const allMatched = cards.filter(c => c.id !== first && c.id !== second && !c.matched).length === 0;
          if (allMatched) setGameOver(true);
        }, 300);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === first || c.id === second ? { ...c, flipped: false } : c
          ));
          setFlipped([]);
        }, 800);
      }
    }
  };

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.matched)) {
      setGameOver(true);
    }
  }, [cards]);

  return (
    <div className="bg-card border border-border rounded-xl p-4 max-w-xs mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground">Memory Match</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </div>
      
      <div className="text-center mb-3">
        <p className="text-sm text-muted-foreground">Moves: {moves}</p>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => handleClick(card.id)}
            className={cn(
              "w-12 h-12 rounded-lg text-xl flex items-center justify-center transition-all duration-200",
              card.flipped || card.matched
                ? "bg-primary/20 border-2 border-primary"
                : "bg-secondary border-2 border-border hover:border-primary/50"
            )}
          >
            {(card.flipped || card.matched) ? card.emoji : '?'}
          </button>
        ))}
      </div>

      {gameOver && (
        <p className="text-center font-bold mb-2 text-foreground">
          🎉 You won in {moves} moves!
        </p>
      )}

      <Button onClick={initGame} className="w-full">
        {gameOver ? 'Play Again' : 'Restart'}
      </Button>
    </div>
  );
};

export default MemoryGame;
