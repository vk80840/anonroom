import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GuessTheWordProps {
  onClose: () => void;
  onSendHint?: (hint: string) => void;
  player1: string;
}

const WORDS = [
  'apple', 'beach', 'cloud', 'dance', 'eagle', 'flame', 'grape', 'happy',
  'image', 'jazzy', 'koala', 'lemon', 'magic', 'noble', 'ocean', 'piano',
  'queen', 'river', 'smile', 'tiger', 'unity', 'vivid', 'water', 'xenon',
  'youth', 'zebra', 'brave', 'charm', 'dream', 'earth', 'frost', 'ghost',
  'heart', 'ivory', 'jelly', 'karma', 'light', 'money', 'night', 'orbit'
];

const GuessTheWord = ({ onClose, onSendHint, player1 }: GuessTheWordProps) => {
  const [word, setWord] = useState('');
  const [guessed, setGuessed] = useState<string[]>([]);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(6);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWord(randomWord);
  }, []);

  const displayWord = word.split('').map(letter => 
    guessed.includes(letter.toLowerCase()) ? letter : '_'
  ).join(' ');

  const handleGuess = () => {
    const g = guess.toLowerCase().trim();
    if (!g) return;
    
    if (g.length === 1) {
      // Single letter guess
      if (!guessed.includes(g)) {
        setGuessed([...guessed, g]);
        if (!word.toLowerCase().includes(g)) {
          const newAttempts = attempts - 1;
          setAttempts(newAttempts);
          if (newAttempts <= 0) {
            setGameOver(true);
          }
        }
      }
    } else if (g === word.toLowerCase()) {
      // Full word guess - correct
      setWon(true);
      setGameOver(true);
      onSendHint?.(`🎉 ${player1} guessed the word: ${word}!`);
    } else {
      // Full word guess - wrong
      const newAttempts = attempts - 1;
      setAttempts(newAttempts);
      if (newAttempts <= 0) {
        setGameOver(true);
      }
    }
    setGuess('');
  };

  const isComplete = word.split('').every(letter => guessed.includes(letter.toLowerCase()));
  
  useEffect(() => {
    if (isComplete && !gameOver) {
      setWon(true);
      setGameOver(true);
      onSendHint?.(`🎉 ${player1} guessed the word: ${word}!`);
    }
  }, [isComplete, gameOver, word, player1, onSendHint]);

  const resetGame = () => {
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWord(randomWord);
    setGuessed([]);
    setAttempts(6);
    setGameOver(false);
    setWon(false);
  };

  const sendHintToChat = () => {
    const hint = `🎮 Playing Guess the Word! Word: ${displayWord} (${attempts} attempts left)`;
    onSendHint?.(hint);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 max-w-xs mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground">Guess the Word</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </div>
      
      <div className="text-center mb-4">
        <p className="text-3xl font-mono tracking-widest text-primary mb-2">
          {displayWord}
        </p>
        <p className="text-sm text-muted-foreground">
          Attempts left: {'❤️'.repeat(attempts)}{'🖤'.repeat(6 - attempts)}
        </p>
      </div>
      
      {!gameOver ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
              placeholder="Letter or word..."
              maxLength={20}
              className="bg-input"
            />
            <Button onClick={handleGuess}>Guess</Button>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {guessed.map(letter => (
              <span 
                key={letter}
                className={`px-2 py-1 rounded text-xs font-mono ${
                  word.includes(letter) 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {letter}
              </span>
            ))}
          </div>
          
          {onSendHint && (
            <Button variant="outline" size="sm" onClick={sendHintToChat} className="w-full">
              Share Progress in Chat
            </Button>
          )}
        </div>
      ) : (
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold">
            {won ? '🎉 You won!' : `Game Over! The word was: ${word}`}
          </p>
          <Button onClick={resetGame} className="w-full">Play Again</Button>
        </div>
      )}
    </div>
  );
};

export default GuessTheWord;
