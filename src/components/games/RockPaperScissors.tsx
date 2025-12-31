import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RockPaperScissorsProps {
  onClose: () => void;
  player1: string;
  player2?: string;
  currentUserId: string;
  player1Id: string;
  player2Id?: string;
  gameState?: { player1Choice: Choice; player2Choice: Choice; currentPlayer: 1 | 2; score: { player1: number; player2: number } };
  onStateChange?: (state: any) => void;
  onGameEnd?: (winnerId: string | null) => void;
  isDisabled?: boolean;
}

type Choice = 'rock' | 'paper' | 'scissors' | null;

const choices: { id: Choice; emoji: string; beats: Choice }[] = [
  { id: 'rock', emoji: '🪨', beats: 'scissors' },
  { id: 'paper', emoji: '📄', beats: 'rock' },
  { id: 'scissors', emoji: '✂️', beats: 'paper' },
];

const RockPaperScissors = ({ 
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
}: RockPaperScissorsProps) => {
  const [player1Choice, setPlayer1Choice] = useState<Choice>(gameState?.player1Choice || null);
  const [player2Choice, setPlayer2Choice] = useState<Choice>(gameState?.player2Choice || null);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(gameState?.currentPlayer || 1);
  const [result, setResult] = useState<string | null>(null);
  const [score, setScore] = useState(gameState?.score || { player1: 0, player2: 0 });

  useEffect(() => {
    if (gameState) {
      setPlayer1Choice(gameState.player1Choice);
      setPlayer2Choice(gameState.player2Choice);
      setCurrentPlayer(gameState.currentPlayer || 1);
      setScore(gameState.score || { player1: 0, player2: 0 });
      
      if (gameState.player1Choice && gameState.player2Choice) {
        const winner = determineWinner(gameState.player1Choice, gameState.player2Choice);
        if (winner === 'tie') {
          setResult("It's a tie! 🤝");
        } else if (winner === 'player1') {
          setResult(`${player1} wins! 🎉`);
        } else {
          setResult(`${player2} wins! 🎉`);
        }
      }
    }
  }, [gameState, player1, player2]);

  const determineWinner = (p1: Choice, p2: Choice) => {
    if (!p1 || !p2) return null;
    if (p1 === p2) return 'tie';
    const p1Data = choices.find(c => c.id === p1)!;
    return p1Data.beats === p2 ? 'player1' : 'player2';
  };

  const isMyTurn = () => {
    if (isDisabled) return false;
    if (currentPlayer === 1 && currentUserId === player1Id) return true;
    if (currentPlayer === 2 && currentUserId === player2Id) return true;
    return false;
  };

  const play = (choice: Choice) => {
    if (!choice || !isMyTurn() || isDisabled) return;
    
    if (currentPlayer === 1) {
      setPlayer1Choice(choice);
      setCurrentPlayer(2);
      onStateChange?.({ player1Choice: choice, player2Choice: null, currentPlayer: 2, score });
    } else {
      setPlayer2Choice(choice);
      
      const winner = determineWinner(player1Choice!, choice);
      let newScore = { ...score };
      
      if (winner === 'tie') {
        setResult("It's a tie! 🤝");
      } else if (winner === 'player1') {
        setResult(`${player1} wins! 🎉`);
        newScore = { ...score, player1: score.player1 + 1 };
        onGameEnd?.(player1Id);
      } else {
        setResult(`${player2} wins! 🎉`);
        newScore = { ...score, player2: score.player2 + 1 };
        onGameEnd?.(player2Id || null);
      }
      
      setScore(newScore);
      onStateChange?.({ player1Choice, player2Choice: choice, currentPlayer: 2, score: newScore });
    }
  };

  const reset = () => {
    setPlayer1Choice(null);
    setPlayer2Choice(null);
    setCurrentPlayer(1);
    setResult(null);
    onStateChange?.({ player1Choice: null, player2Choice: null, currentPlayer: 1, score });
  };

  const currentPlayerName = currentPlayer === 1 ? player1 : player2;
  const waitingForOpponent = !isMyTurn() && !result && !isDisabled;

  return (
    <div className="bg-card border border-border rounded-xl p-4 max-w-xs mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground">Rock Paper Scissors</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </div>
      
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">
          {player1}: {score.player1} | {player2}: {score.player2}
        </p>
      </div>
      
      {!result ? (
        <>
          <p className={cn(
            "text-center text-sm mb-3 font-medium",
            waitingForOpponent || isDisabled ? "text-muted-foreground" : "text-primary"
          )}>
            {isDisabled 
              ? 'Game ended'
              : waitingForOpponent 
              ? `Waiting for ${currentPlayerName}...`
              : "Your turn to choose"
            }
          </p>
          {player1Choice && currentPlayer === 2 && (
            <p className="text-center text-xs text-muted-foreground mb-2">
              {player1} has chosen (hidden)
            </p>
          )}
          <div className="flex justify-center gap-3 mb-4">
            {choices.map(c => (
              <button
                key={c.id}
                onClick={() => play(c.id)}
                disabled={!isMyTurn() || isDisabled}
                className={cn(
                  "w-16 h-16 text-3xl rounded-xl border-2 border-border transition-all",
                  isMyTurn() && !isDisabled
                    ? "hover:border-primary hover:bg-primary/10" 
                    : "opacity-50 cursor-not-allowed"
                )}
              >
                {c.emoji}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center mb-4">
          <div className="flex justify-center gap-4 mb-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{player1}</p>
              <span className="text-4xl">{choices.find(c => c.id === player1Choice)?.emoji}</span>
            </div>
            <span className="text-2xl self-center">vs</span>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{player2}</p>
              <span className="text-4xl">{choices.find(c => c.id === player2Choice)?.emoji}</span>
            </div>
          </div>
          <p className="text-lg font-semibold text-foreground">{result}</p>
        </div>
      )}
      
      {!isDisabled && (
        <Button onClick={reset} className="w-full">
          {result ? 'Play Again' : 'Waiting for choices...'}
        </Button>
      )}
    </div>
  );
};

export default RockPaperScissors;
