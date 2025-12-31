import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface SnakeGameProps {
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

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const GRID_SIZE = 15;
const INITIAL_SPEED = 150;

const SnakeGame = ({ onClose, player1, currentUserId, player1Id, onGameEnd }: SnakeGameProps) => {
  const [snake, setSnake] = useState<Position[]>([{ x: 7, y: 7 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snake-highscore');
    return saved ? parseInt(saved) : 0;
  });
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const directionRef = useRef(direction);

  const generateFood = useCallback((snakeBody: Position[]) => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snakeBody.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake([{ x: 7, y: 7 }]);
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setFood(generateFood([{ x: 7, y: 7 }]));
    setGameOver(false);
    setScore(0);
    setGameStarted(true);
    setIsPaused(false);
  };

  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        const dir = directionRef.current;

        switch (dir) {
          case 'UP': head.y -= 1; break;
          case 'DOWN': head.y += 1; break;
          case 'LEFT': head.x -= 1; break;
          case 'RIGHT': head.x += 1; break;
        }

        // Check wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameOver(true);
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('snake-highscore', score.toString());
          }
          onGameEnd?.(null);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
          setGameOver(true);
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('snake-highscore', score.toString());
          }
          onGameEnd?.(null);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, INITIAL_SPEED - Math.min(score, 100));
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, isPaused, food, score, highScore, generateFood, onGameEnd]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted) return;
      
      const key = e.key.toLowerCase();
      const currentDir = directionRef.current;
      
      if ((key === 'arrowup' || key === 'w') && currentDir !== 'DOWN') {
        directionRef.current = 'UP';
        setDirection('UP');
      } else if ((key === 'arrowdown' || key === 's') && currentDir !== 'UP') {
        directionRef.current = 'DOWN';
        setDirection('DOWN');
      } else if ((key === 'arrowleft' || key === 'a') && currentDir !== 'RIGHT') {
        directionRef.current = 'LEFT';
        setDirection('LEFT');
      } else if ((key === 'arrowright' || key === 'd') && currentDir !== 'LEFT') {
        directionRef.current = 'RIGHT';
        setDirection('RIGHT');
      } else if (key === ' ') {
        setIsPaused(p => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted]);

  const handleTouch = (dir: Direction) => {
    const currentDir = directionRef.current;
    if (
      (dir === 'UP' && currentDir !== 'DOWN') ||
      (dir === 'DOWN' && currentDir !== 'UP') ||
      (dir === 'LEFT' && currentDir !== 'RIGHT') ||
      (dir === 'RIGHT' && currentDir !== 'LEFT')
    ) {
      directionRef.current = dir;
      setDirection(dir);
    }
  };

  return (
    <div className="text-center">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm font-medium text-foreground">🐍 Snake</div>
        <div className="flex gap-4 text-xs">
          <span className="text-muted-foreground">Score: <span className="text-primary font-bold">{score}</span></span>
          <span className="text-muted-foreground">Best: <span className="text-amber-500 font-bold">{highScore}</span></span>
        </div>
      </div>

      <div 
        className="relative mx-auto bg-card border border-border rounded-lg overflow-hidden"
        style={{ width: GRID_SIZE * 20, height: GRID_SIZE * 20 }}
      >
        {/* Grid */}
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-background/50"
            style={{
              width: 19,
              height: 19,
              left: (i % GRID_SIZE) * 20,
              top: Math.floor(i / GRID_SIZE) * 20,
            }}
          />
        ))}
        
        {/* Snake */}
        {snake.map((seg, i) => (
          <div
            key={i}
            className={`absolute rounded-sm transition-all duration-75 ${i === 0 ? 'bg-primary' : 'bg-primary/70'}`}
            style={{
              width: 18,
              height: 18,
              left: seg.x * 20 + 1,
              top: seg.y * 20 + 1,
            }}
          />
        ))}
        
        {/* Food */}
        <div
          className="absolute text-lg flex items-center justify-center"
          style={{
            width: 20,
            height: 20,
            left: food.x * 20,
            top: food.y * 20,
          }}
        >
          🍎
        </div>

        {/* Overlays */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
            <div className="text-4xl mb-2">🐍</div>
            <p className="text-foreground font-medium mb-3">Snake Game</p>
            <Button size="sm" onClick={resetGame}>Start Game</Button>
            <p className="text-xs text-muted-foreground mt-2">Use arrows or WASD to move</p>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
            <p className="text-xl font-bold text-destructive mb-2">Game Over!</p>
            <p className="text-foreground mb-3">Score: {score}</p>
            <Button size="sm" onClick={resetGame}>Play Again</Button>
          </div>
        )}

        {isPaused && !gameOver && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <p className="text-xl font-bold text-foreground">Paused</p>
          </div>
        )}
      </div>

      {/* Touch controls */}
      {gameStarted && !gameOver && (
        <div className="mt-4 grid grid-cols-3 gap-2 max-w-32 mx-auto">
          <div />
          <Button size="sm" variant="outline" onTouchStart={() => handleTouch('UP')} onClick={() => handleTouch('UP')}>↑</Button>
          <div />
          <Button size="sm" variant="outline" onTouchStart={() => handleTouch('LEFT')} onClick={() => handleTouch('LEFT')}>←</Button>
          <Button size="sm" variant="outline" onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</Button>
          <Button size="sm" variant="outline" onTouchStart={() => handleTouch('RIGHT')} onClick={() => handleTouch('RIGHT')}>→</Button>
          <div />
          <Button size="sm" variant="outline" onTouchStart={() => handleTouch('DOWN')} onClick={() => handleTouch('DOWN')}>↓</Button>
          <div />
        </div>
      )}
    </div>
  );
};

export default SnakeGame;
