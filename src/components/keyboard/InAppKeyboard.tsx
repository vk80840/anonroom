import { useState } from 'react';
import { Smile, ChevronLeft, ChevronRight, Delete, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface InAppKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

type KeyboardMode = 'letters' | 'numbers1' | 'numbers2' | 'emoji';

const letterRows = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

const numberRows1 = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['+', '×', '÷', '=', '/', '_', '<', '>', '[', ']'],
  ['@', '#', '₹', '%', '^', '&', '*', '(', ')'],
  ['-', "'", '"', ':', ';', ',', '?', '!', '.'],
];

const numberRows2 = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['`', '~', '\\', '|', '{', '}', '€', '£', '¥', '$'],
  ['•', '○', '●', '□', '■', '♠', '♥', '◇', '♣'],
  ['☆', '■', '¤', '«', '»', 'i', '¿', '°', '.'],
];

const emojiRows = [
  ['😀', '😍', '🌹', '😊', '🤔', '👍', '😬', '👍', '🙌', '🎊', '✨', '🧧', '💝'],
  ['🎁', '❤️', '🌹', '😌', '🎂', '✂️', '🤙', '☠️', '🎄', '🎈', '🤣', '🗣️', '🦋'],
  ['🌽', '🥰', '❌', '8️⃣', '7️⃣', '6️⃣', '5️⃣', '4️⃣', '3️⃣', '2️⃣', '1️⃣', '🚃', '🚲'],
];

const InAppKeyboard = ({ value, onChange, onSubmit, onClose }: InAppKeyboardProps) => {
  const [mode, setMode] = useState<KeyboardMode>('letters');
  const [shift, setShift] = useState(false);
  const { playClick } = useSoundEffects();

  const handleKeyPress = (key: string) => {
    playClick();
    const newKey = shift && mode === 'letters' ? key.toUpperCase() : key;
    onChange(value + newKey);
    if (shift) setShift(false);
  };

  const handleBackspace = () => {
    playClick();
    onChange(value.slice(0, -1));
  };

  const handleSpace = () => {
    playClick();
    onChange(value + ' ');
  };

  const handleEnter = () => {
    playClick();
    onSubmit();
  };

  const toggleMode = () => {
    playClick();
    if (mode === 'letters') setMode('numbers1');
    else if (mode === 'numbers1') setMode('numbers2');
    else if (mode === 'numbers2') setMode('letters');
  };

  const getRows = () => {
    if (mode === 'emoji') return emojiRows;
    if (mode === 'numbers1') return numberRows1;
    if (mode === 'numbers2') return numberRows2;
    return letterRows;
  };

  const baseKeyClass = "flex items-center justify-center rounded-lg font-semibold text-lg transition-all active:scale-95 select-none";
  const letterKeyClass = cn(baseKeyClass, "bg-gradient-to-b from-primary/90 to-primary text-primary-foreground min-w-[2rem] h-12 flex-1");
  const numberKeyClass = cn(baseKeyClass, "bg-gradient-to-b from-primary/80 to-primary/90 text-primary-foreground min-w-[2rem] h-11 flex-1");
  const actionKeyClass = cn(baseKeyClass, "bg-muted text-foreground px-4 h-12");
  const spaceKeyClass = cn(baseKeyClass, "bg-gradient-to-b from-primary to-primary/90 text-primary-foreground h-12 flex-1");

  const rows = getRows();

  return (
    <div className="bg-background border-t border-border p-2 animate-in slide-in-from-bottom duration-200">
      {/* Input preview */}
      <div className="bg-input border border-border rounded-lg p-3 mb-2 min-h-[3rem] flex items-center">
        <span className="text-foreground font-mono text-sm flex-1 break-all">
          {value || <span className="text-muted-foreground">Type your message...</span>}
        </span>
        <span className="w-0.5 h-5 bg-primary animate-pulse" />
      </div>

      {/* Keyboard */}
      <div className="space-y-1.5">
        {mode === 'emoji' ? (
          // Emoji mode
          <>
            <div className="flex gap-2 justify-center mb-2">
              {['🕐', '😊', '🐻', '🍴', '🏠', '❄️', '📱', '⁉️', '🚩'].map((cat, i) => (
                <button key={i} className="p-2 hover:bg-primary/20 rounded-lg transition-colors text-lg">
                  {cat}
                </button>
              ))}
            </div>
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 justify-center">
                {row.map((emoji, keyIndex) => (
                  <button
                    key={keyIndex}
                    onClick={() => handleKeyPress(emoji)}
                    className="p-2 hover:bg-primary/20 rounded-lg transition-all active:scale-95 text-2xl"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ))}
          </>
        ) : mode === 'letters' ? (
          // Letter mode
          <>
            {/* Number row hint */}
            <div className="flex gap-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((key, i) => (
                <button
                  key={i}
                  onClick={() => handleKeyPress(key)}
                  className={cn(numberKeyClass, "bg-gradient-to-b from-orange-500 to-orange-600")}
                >
                  <span className="text-xs opacity-70">{['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'][i]}</span>
                  <span className="ml-0.5">{key}</span>
                </button>
              ))}
              <button onClick={handleBackspace} className={cn(actionKeyClass, "min-w-[3rem]")}>
                Del
              </button>
            </div>

            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 justify-center">
                {rowIndex === 2 && (
                  <button
                    onClick={() => { playClick(); setShift(!shift); }}
                    className={cn(actionKeyClass, shift ? "bg-primary text-primary-foreground" : "")}
                  >
                    ⇧
                  </button>
                )}
                {row.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    className={letterKeyClass}
                  >
                    {shift ? key.toUpperCase() : key}
                  </button>
                ))}
                {rowIndex === 1 && (
                  <button onClick={handleEnter} className={cn(actionKeyClass, "min-w-[3rem]")}>
                    <CornerDownLeft className="w-5 h-5" />
                  </button>
                )}
                {rowIndex === 2 && (
                  <button onClick={handleBackspace} className={cn(actionKeyClass)}>
                    <Delete className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </>
        ) : (
          // Numbers mode
          <>
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1">
                {row.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    className={cn(
                      rowIndex === 0 ? cn(numberKeyClass, "bg-gradient-to-b from-orange-500 to-orange-600") : letterKeyClass
                    )}
                  >
                    {key}
                  </button>
                ))}
                {rowIndex === 0 && (
                  <button onClick={handleBackspace} className={cn(actionKeyClass, "min-w-[3rem]")}>
                    Del
                  </button>
                )}
                {rowIndex === 1 && (
                  <button onClick={handleBackspace} className={cn(actionKeyClass)}>
                    <Delete className="w-5 h-5" />
                  </button>
                )}
                {rowIndex === 2 && (
                  <button onClick={handleEnter} className={cn(actionKeyClass)}>
                    <CornerDownLeft className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </>
        )}

        {/* Bottom row */}
        <div className="flex gap-1">
          <button onClick={() => { playClick(); setShift(!shift); }} className={cn(actionKeyClass)}>
            {mode === 'numbers1' ? '2/2' : mode === 'numbers2' ? '1/2' : '⇧'}
          </button>
          <button onClick={toggleMode} className={cn(actionKeyClass)}>
            {mode === 'letters' ? '!#1' : 'ABC'}
          </button>
          <button onClick={handleSpace} className={spaceKeyClass}>
            English(India)
          </button>
          <button
            onClick={() => { playClick(); setMode(mode === 'emoji' ? 'letters' : 'emoji'); }}
            className={cn(actionKeyClass)}
          >
            <Smile className="w-5 h-5" />
          </button>
          <button onClick={() => {}} className={cn(actionKeyClass)}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => {}} className={cn(actionKeyClass)}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InAppKeyboard;
