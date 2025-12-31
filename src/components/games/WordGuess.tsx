import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface WordGuessProps {
  onClose: () => void;
  player1: string;
  player2?: string;
  currentUserId: string;
  player1Id: string;
  player2Id?: string;
  gameState?: any;
  onStateChange?: (state: any) => void;
  onGameEnd?: (winnerId: string | null) => void;
}

const WORDS = [
  'REACT', 'WORLD', 'SUPER', 'HAPPY', 'DREAM', 'LIGHT', 'MUSIC', 'BRAIN', 
  'CLOUD', 'BEACH', 'SMILE', 'SWIFT', 'PIXEL', 'MAGIC', 'SPARK', 'FLAME',
  'OCEAN', 'STORM', 'GRACE', 'NOBLE', 'CRISP', 'VIVID', 'BLOOM', 'FROST'
];

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

type LetterState = 'correct' | 'present' | 'absent' | 'empty';

const WordGuess = ({ onClose, player1, currentUserId, player1Id, onGameEnd }: WordGuessProps) => {
  const [targetWord, setTargetWord] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shake, setShake] = useState(false);
  const [letterStates, setLetterStates] = useState<Record<string, LetterState>>({});

  const maxGuesses = 6;
  const wordLength = 5;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      if (e.key === 'Enter') {
        submitGuess();
      } else if (e.key === 'Backspace') {
        setCurrentGuess(prev => prev.slice(0, -1));
      } else if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < wordLength) {
        setCurrentGuess(prev => prev + e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, gameOver]);

  const getLetterState = (guess: string, index: number): LetterState => {
    const letter = guess[index];
    if (targetWord[index] === letter) return 'correct';
    if (targetWord.includes(letter)) return 'present';
    return 'absent';
  };

  const updateLetterStates = (guess: string) => {
    const newStates = { ...letterStates };
    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i];
      const state = getLetterState(guess, i);
      // Only upgrade state, never downgrade
      if (state === 'correct') {
        newStates[letter] = 'correct';
      } else if (state === 'present' && newStates[letter] !== 'correct') {
        newStates[letter] = 'present';
      } else if (!newStates[letter]) {
        newStates[letter] = 'absent';
      }
    }
    setLetterStates(newStates);
  };

  const submitGuess = () => {
    if (currentGuess.length !== wordLength) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    updateLetterStates(currentGuess);

    if (currentGuess === targetWord) {
      setWon(true);
      setGameOver(true);
      onGameEnd?.(player1Id);
    } else if (newGuesses.length >= maxGuesses) {
      setGameOver(true);
      onGameEnd?.(null);
    }

    setCurrentGuess('');
  };

  const handleKeyPress = (key: string) => {
    if (gameOver) return;
    
    if (key === 'ENTER') {
      submitGuess();
    } else if (key === '⌫') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < wordLength) {
      setCurrentGuess(prev => prev + key);
    }
  };

  const resetGame = () => {
    setTargetWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setWon(false);
    setLetterStates({});
  };

  const getKeyColor = (key: string): string => {
    if (key === 'ENTER' || key === '⌫') return 'bg-muted';
    const state = letterStates[key];
    if (state === 'correct') return 'bg-green-500 text-white';
    if (state === 'present') return 'bg-yellow-500 text-white';
    if (state === 'absent') return 'bg-muted-foreground/30 text-muted-foreground';
    return 'bg-muted hover:bg-muted/80';
  };

  const getCellColor = (state: LetterState): string => {
    if (state === 'correct') return 'bg-green-500 border-green-500 text-white';
    if (state === 'present') return 'bg-yellow-500 border-yellow-500 text-white';
    if (state === 'absent') return 'bg-muted-foreground/30 border-muted-foreground/30 text-foreground';
    return 'border-border';
  };

  return (
    <div className="text-center">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm font-medium text-foreground">📝 Word Guess</div>
        <div className="text-xs text-muted-foreground">
          {guesses.length}/{maxGuesses} attempts
        </div>
      </div>

      {/* Board */}
      <div className="space-y-1 mb-4">
        {Array(maxGuesses).fill(null).map((_, rowIndex) => {
          const guess = guesses[rowIndex];
          const isCurrentRow = rowIndex === guesses.length;
          const displayWord = guess || (isCurrentRow ? currentGuess.padEnd(wordLength, ' ') : '     ');

          return (
            <div 
              key={rowIndex} 
              className={`flex justify-center gap-1 ${isCurrentRow && shake ? 'animate-shake' : ''}`}
            >
              {displayWord.split('').map((letter, letterIndex) => {
                const state: LetterState = guess ? getLetterState(guess, letterIndex) : 'empty';
                return (
                  <div
                    key={letterIndex}
                    className={`
                      w-10 h-10 flex items-center justify-center 
                      text-lg font-bold border-2 rounded
                      ${guess ? getCellColor(state) : 'border-border'}
                      ${isCurrentRow && letter !== ' ' ? 'border-primary' : ''}
                      transition-all duration-300
                    `}
                  >
                    {letter !== ' ' ? letter : ''}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Result */}
      {gameOver && (
        <div className="mb-4">
          {won ? (
            <p className="text-green-500 font-bold">
              🎉 You got it in {guesses.length}!
            </p>
          ) : (
            <p className="text-destructive font-bold">
              The word was: <span className="text-primary">{targetWord}</span>
            </p>
          )}
          <Button size="sm" onClick={resetGame} className="mt-2">
            Play Again
          </Button>
        </div>
      )}

      {/* Keyboard */}
      <div className="space-y-1">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {row.map(key => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                disabled={gameOver}
                className={`
                  ${key.length > 1 ? 'px-2 text-xs' : 'w-8'} 
                  h-10 rounded font-medium transition-colors
                  ${getKeyColor(key)}
                  disabled:opacity-50
                `}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WordGuess;
