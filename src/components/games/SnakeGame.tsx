import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface SnakeGameProps {
  onClose: () => void;
  player1: string;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const GRID_SIZE = 15;
const CELL_SIZE = 18;

const SnakeGame = ({ onClose, player1 }: SnakeGameProps) => {
  const [snake, setSnake] = useState<Position[]>([{ x: 7, y: 7 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateFood = useCallback((currentSnake: Position[]) => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    return newFood;
  }, []);

  const startGame = () => {
    setSnake([{ x: 7, y: 7 }]);
    setDirection('RIGHT');
    setFood(generateFood([{ x: 7, y: 7 }]));
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isPlaying]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const moveSnake = () => {
      setSnake(prev => {
        const head = { ...prev[0] };
        
        switch (direction) {
          case 'UP': head.y -= 1; break;
          case 'DOWN': head.y += 1; break;
          case 'LEFT': head.x -= 1; break;
          case 'RIGHT': head.x += 1; break;
        }

        // Check wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameOver(true);
          setIsPlaying(false);
          return prev;
        }

        // Check self collision
        if (prev.some(seg => seg.x === head.x && seg.y === head.y)) {
          setGameOver(true);
          setIsPlaying(false);
          return prev;
        }

        const newSnake = [head, ...prev];

        // Check food
        if (head.x === food.x && head.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, 150);
    return () => clearInterval(interval);
  }, [direction, food, gameOver, generateFood, isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'hsl(var(--background))';
    ctx.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);

    // Draw grid
    ctx.strokeStyle = 'hsl(var(--border))';
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw snake
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.7)';
      ctx.fillRect(seg.x * CELL_SIZE + 1, seg.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    });

    // Draw food
    ctx.fillStyle = 'hsl(var(--accent))';
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }, [snake, food]);

  return (
    <div className="bg-card border border-border rounded-xl p-4 max-w-xs mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground">Snake</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </div>
      
      <div className="text-center mb-2">
        <p className="text-sm text-muted-foreground">Score: {score}</p>
      </div>

      <div className="flex justify-center mb-4">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="border border-border rounded-lg"
        />
      </div>

      {gameOver && (
        <p className="text-center font-bold mb-2 text-foreground">
          Game Over! Score: {score}
        </p>
      )}

      <Button onClick={startGame} className="w-full">
        {isPlaying ? 'Restart' : gameOver ? 'Play Again' : 'Start Game'}
      </Button>
      
      <p className="text-xs text-muted-foreground text-center mt-2">
        Use arrow keys to move
      </p>
    </div>
  );
};

export default SnakeGame;
