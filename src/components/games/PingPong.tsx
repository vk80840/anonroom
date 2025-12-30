import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface PingPongProps {
  onClose: () => void;
  player1: string;
}

const PingPong = ({ onClose, player1 }: PingPongProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState({ player: 0, bot: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const gameRef = useRef({
    ball: { x: 150, y: 100, dx: 3, dy: 2, radius: 8 },
    playerPaddle: { y: 70, height: 40, width: 8 },
    botPaddle: { y: 70, height: 40, width: 8 },
    canvasWidth: 300,
    canvasHeight: 200,
  });

  const resetBall = useCallback(() => {
    const game = gameRef.current;
    game.ball.x = game.canvasWidth / 2;
    game.ball.y = game.canvasHeight / 2;
    game.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 3;
    game.ball.dy = (Math.random() - 0.5) * 4;
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameOver || !isPlaying) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const game = gameRef.current;
    const { ball, playerPaddle, botPaddle, canvasWidth, canvasHeight } = game;
    
    // Clear canvas
    ctx.fillStyle = 'hsl(var(--background))';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw center line
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'hsl(var(--border))';
    ctx.beginPath();
    ctx.moveTo(canvasWidth / 2, 0);
    ctx.lineTo(canvasWidth / 2, canvasHeight);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Update ball position
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Ball collision with top/bottom
    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= canvasHeight) {
      ball.dy *= -1;
    }
    
    // Bot AI
    const botCenter = botPaddle.y + botPaddle.height / 2;
    if (botCenter < ball.y - 10) {
      botPaddle.y += 2;
    } else if (botCenter > ball.y + 10) {
      botPaddle.y -= 2;
    }
    botPaddle.y = Math.max(0, Math.min(canvasHeight - botPaddle.height, botPaddle.y));
    
    // Ball collision with paddles
    if (ball.x - ball.radius <= 15 && 
        ball.y >= playerPaddle.y && 
        ball.y <= playerPaddle.y + playerPaddle.height) {
      ball.dx = Math.abs(ball.dx);
      ball.dx *= 1.05;
    }
    
    if (ball.x + ball.radius >= canvasWidth - 15 && 
        ball.y >= botPaddle.y && 
        ball.y <= botPaddle.y + botPaddle.height) {
      ball.dx = -Math.abs(ball.dx);
      ball.dx *= 1.05;
    }
    
    // Scoring
    if (ball.x < 0) {
      setScore(s => {
        const newScore = { ...s, bot: s.bot + 1 };
        if (newScore.bot >= 5) setGameOver(true);
        return newScore;
      });
      resetBall();
    }
    if (ball.x > canvasWidth) {
      setScore(s => {
        const newScore = { ...s, player: s.player + 1 };
        if (newScore.player >= 5) setGameOver(true);
        return newScore;
      });
      resetBall();
    }
    
    // Draw paddles
    ctx.fillStyle = 'hsl(var(--primary))';
    ctx.fillRect(5, playerPaddle.y, playerPaddle.width, playerPaddle.height);
    ctx.fillStyle = 'hsl(var(--accent))';
    ctx.fillRect(canvasWidth - 13, botPaddle.y, botPaddle.width, botPaddle.height);
    
    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'hsl(var(--foreground))';
    ctx.fill();
    ctx.closePath();
  }, [gameOver, isPlaying, resetBall]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;
    const interval = setInterval(gameLoop, 1000 / 60);
    return () => clearInterval(interval);
  }, [gameLoop, isPlaying, gameOver]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    gameRef.current.playerPaddle.y = Math.max(0, Math.min(
      gameRef.current.canvasHeight - gameRef.current.playerPaddle.height,
      y - gameRef.current.playerPaddle.height / 2
    ));
  };

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore({ player: 0, bot: 0 });
    resetBall();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 max-w-xs mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground">Ping Pong</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </div>
      
      <div className="text-center mb-2">
        <p className="text-sm text-muted-foreground">
          {player1}: {score.player} | Bot: {score.bot}
        </p>
        <p className="text-xs text-muted-foreground">First to 5 wins!</p>
      </div>
      
      <div className="flex justify-center mb-4">
        <canvas
          ref={canvasRef}
          width={300}
          height={200}
          onMouseMove={handleMouseMove}
          className="border border-border rounded-lg cursor-none bg-background"
        />
      </div>
      
      {gameOver && (
        <p className="text-center font-bold mb-2 text-foreground">
          {score.player >= 5 ? `${player1} wins! 🎉` : 'Bot wins! 🤖'}
        </p>
      )}
      
      <Button onClick={startGame} className="w-full">
        {isPlaying && !gameOver ? 'Restart' : gameOver ? 'Play Again' : 'Start Game'}
      </Button>
    </div>
  );
};

export default PingPong;
