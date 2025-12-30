import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RockPaperScissorsProps {
  onClose: () => void;
  player1: string;
}

type Choice = 'rock' | 'paper' | 'scissors' | null;

const choices: { id: Choice; emoji: string; beats: Choice }[] = [
  { id: 'rock', emoji: '🪨', beats: 'scissors' },
  { id: 'paper', emoji: '📄', beats: 'rock' },
  { id: 'scissors', emoji: '✂️', beats: 'paper' },
];

const RockPaperScissors = ({ onClose, player1 }: RockPaperScissorsProps) => {
  const [playerChoice, setPlayerChoice] = useState<Choice>(null);
  const [botChoice, setBotChoice] = useState<Choice>(null);
  const [result, setResult] = useState<string | null>(null);
  const [score, setScore] = useState({ player: 0, bot: 0 });

  const play = (choice: Choice) => {
    if (!choice) return;
    
    const bot = choices[Math.floor(Math.random() * 3)].id;
    setPlayerChoice(choice);
    setBotChoice(bot);
    
    const playerData = choices.find(c => c.id === choice)!;
    
    if (choice === bot) {
      setResult("It's a tie! 🤝");
    } else if (playerData.beats === bot) {
      setResult(`${player1} wins! 🎉`);
      setScore(s => ({ ...s, player: s.player + 1 }));
    } else {
      setResult('Bot wins! 🤖');
      setScore(s => ({ ...s, bot: s.bot + 1 }));
    }
  };

  const reset = () => {
    setPlayerChoice(null);
    setBotChoice(null);
    setResult(null);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 max-w-xs mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground">Rock Paper Scissors</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </div>
      
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">
          {player1}: {score.player} | Bot: {score.bot}
        </p>
      </div>
      
      {!result ? (
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
      ) : (
        <div className="text-center mb-4">
          <div className="flex justify-center gap-4 mb-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{player1}</p>
              <span className="text-4xl">{choices.find(c => c.id === playerChoice)?.emoji}</span>
            </div>
            <span className="text-2xl self-center">vs</span>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Bot</p>
              <span className="text-4xl">{choices.find(c => c.id === botChoice)?.emoji}</span>
            </div>
          </div>
          <p className="text-lg font-semibold text-foreground">{result}</p>
        </div>
      )}
      
      <Button onClick={reset} className="w-full">
        {result ? 'Play Again' : 'Choose your move!'}
      </Button>
    </div>
  );
};

export default RockPaperScissors;
