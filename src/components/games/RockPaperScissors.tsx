import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface RockPaperScissorsProps {
  onClose: () => void;
  player1: string;
  player2?: string;
}

type Choice = 'rock' | 'paper' | 'scissors' | null;

const choices: { id: Choice; emoji: string; beats: Choice }[] = [
  { id: 'rock', emoji: '🪨', beats: 'scissors' },
  { id: 'paper', emoji: '📄', beats: 'rock' },
  { id: 'scissors', emoji: '✂️', beats: 'paper' },
];

const RockPaperScissors = ({ onClose, player1, player2 = 'Player 2' }: RockPaperScissorsProps) => {
  const [player1Choice, setPlayer1Choice] = useState<Choice>(null);
  const [player2Choice, setPlayer2Choice] = useState<Choice>(null);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [result, setResult] = useState<string | null>(null);
  const [score, setScore] = useState({ player1: 0, player2: 0 });

  const determineWinner = (p1: Choice, p2: Choice) => {
    if (!p1 || !p2) return null;
    if (p1 === p2) return 'tie';
    const p1Data = choices.find(c => c.id === p1)!;
    return p1Data.beats === p2 ? 'player1' : 'player2';
  };

  const play = (choice: Choice) => {
    if (!choice) return;
    
    if (currentPlayer === 1) {
      setPlayer1Choice(choice);
      setCurrentPlayer(2);
    } else {
      setPlayer2Choice(choice);
      
      const winner = determineWinner(player1Choice!, choice);
      
      if (winner === 'tie') {
        setResult("It's a tie! 🤝");
      } else if (winner === 'player1') {
        setResult(`${player1} wins! 🎉`);
        setScore(s => ({ ...s, player1: s.player1 + 1 }));
      } else {
        setResult(`${player2} wins! 🎉`);
        setScore(s => ({ ...s, player2: s.player2 + 1 }));
      }
    }
  };

  const reset = () => {
    setPlayer1Choice(null);
    setPlayer2Choice(null);
    setCurrentPlayer(1);
    setResult(null);
  };

  const currentPlayerName = currentPlayer === 1 ? player1 : player2;

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
          <p className="text-center text-sm mb-3 text-foreground font-medium">
            {currentPlayerName}'s turn to choose
          </p>
          {player1Choice && (
            <p className="text-center text-xs text-muted-foreground mb-2">
              {player1} has chosen (hidden)
            </p>
          )}
          <div className="flex justify-center gap-3 mb-4">
            {choices.map(c => (
              <button
                key={c.id}
                onClick={() => play(c.id)}
                className="w-16 h-16 text-3xl rounded-xl border-2 border-border hover:border-primary hover:bg-primary/10 transition-all"
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
      
      <Button onClick={reset} className="w-full">
        {result ? 'Play Again' : 'Waiting for choices...'}
      </Button>
    </div>
  );
};

export default RockPaperScissors;