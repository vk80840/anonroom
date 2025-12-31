import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TicTacToeProps {
  onClose: () => void;
  player1: string;
  player2?: string;
  currentUserId: string;
  player1Id: string;
  player2Id?: string;
  gameState?: { board: (string | null)[]; isPlayer1Turn: boolean };
  onStateChange?: (state: { board: (string | null)[]; isPlayer1Turn: boolean }) => void;
  onGameEnd?: (winnerId: string | null) => void;
  isDisabled?: boolean;
}

const TicTacToe = ({ 
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
}: TicTacToeProps) => {
  const [board, setBoard] = useState<(string | null)[]>(gameState?.board || Array(9).fill(null));
  const [isPlayer1Turn, setIsPlayer1Turn] = useState(gameState?.isPlayer1Turn ?? true);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (gameState) {
      setBoard(gameState.board || Array(9).fill(null));
      setIsPlayer1Turn(gameState.isPlayer1Turn ?? true);
    }
  }, [gameState]);

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(cell => cell !== null);

  const isMyTurn = () => {
    if (isDisabled) return false;
    if (isPlayer1Turn && currentUserId === player1Id) return true;
    if (!isPlayer1Turn && currentUserId === player2Id) return true;
    return false;
  };

  const handleClick = (i: number) => {
    if (board[i] || winner || gameOver || isDisabled) return;
    if (!isMyTurn()) return;
    
    const newBoard = [...board];
    newBoard[i] = isPlayer1Turn ? 'X' : 'O';
    const newIsPlayer1Turn = !isPlayer1Turn;
    
    setBoard(newBoard);
    setIsPlayer1Turn(newIsPlayer1Turn);
    
    onStateChange?.({ board: newBoard, isPlayer1Turn: newIsPlayer1Turn });
    
    const newWinner = calculateWinner(newBoard);
    if (newWinner || newBoard.every(cell => cell !== null)) {
      setGameOver(true);
      if (newWinner) {
        const winnerId = newWinner === 'X' ? player1Id : player2Id;
        onGameEnd?.(winnerId || null);
      } else {
        onGameEnd?.(null);
      }
    }
  };

  const resetGame = () => {
    const newState = { board: Array(9).fill(null), isPlayer1Turn: true };
    setBoard(newState.board);
    setIsPlayer1Turn(newState.isPlayer1Turn);
    setGameOver(false);
    onStateChange?.(newState);
  };

  const currentPlayer = isPlayer1Turn ? player1 : player2;
  const winnerName = winner === 'X' ? player1 : player2;
  const waitingForOpponent = !isMyTurn() && !winner && !isDraw && !isDisabled;

  const status = isDisabled
    ? (winner ? `${winnerName} won!` : isDraw ? "It's a draw!" : 'Game ended')
    : winner 
    ? `🎉 ${winnerName} wins!`
    : isDraw 
    ? "It's a draw!"
    : waitingForOpponent
    ? `Waiting for ${currentPlayer}...`
    : `Your turn (${isPlayer1Turn ? 'X' : 'O'})`;

  return (
    <div className="bg-card border border-border rounded-xl p-4 max-w-xs mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground">Tic Tac Toe</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </div>
      
      <div className="text-center mb-2">
        <p className="text-xs text-muted-foreground">{player1} (X) vs {player2} (O)</p>
      </div>
      
      <p className={cn(
        "text-sm text-center mb-3",
        waitingForOpponent || isDisabled ? "text-muted-foreground" : "text-primary font-medium"
      )}>
        {status}
      </p>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={!isMyTurn() || !!cell || !!winner || gameOver || isDisabled}
            className={cn(
              "w-16 h-16 rounded-lg border-2 text-2xl font-bold transition-all",
              cell === 'X' ? 'text-primary border-primary/50 bg-primary/10' : 
              cell === 'O' ? 'text-accent border-accent/50 bg-accent/10' : 
              'border-border hover:border-primary/30 bg-background',
              (!isMyTurn() || isDisabled) && !cell && 'opacity-50 cursor-not-allowed'
            )}
          >
            {cell}
          </button>
        ))}
      </div>
      
      {!isDisabled && <Button onClick={resetGame} className="w-full">Play Again</Button>}
    </div>
  );
};

export default TicTacToe;
