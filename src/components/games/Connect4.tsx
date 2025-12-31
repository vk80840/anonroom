import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Connect4Props {
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

const ROWS = 6;
const COLS = 7;

type Cell = null | 'red' | 'yellow';
type Board = Cell[][];

const createEmptyBoard = (): Board => 
  Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

const Connect4 = ({ 
  onClose, 
  player1, 
  player2 = 'Player 2', 
  currentUserId, 
  player1Id, 
  player2Id,
  gameState,
  onStateChange,
  onGameEnd 
}: Connect4Props) => {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<'red' | 'yellow'>('red');
  const [winner, setWinner] = useState<'red' | 'yellow' | 'draw' | null>(null);
  const [winningCells, setWinningCells] = useState<[number, number][]>([]);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  useEffect(() => {
    if (gameState && Object.keys(gameState).length > 0) {
      if (gameState.board) setBoard(gameState.board);
      if (gameState.currentPlayer) setCurrentPlayer(gameState.currentPlayer);
      if (gameState.winner) setWinner(gameState.winner);
      if (gameState.winningCells) setWinningCells(gameState.winningCells);
    }
  }, [gameState]);

  const checkWin = (board: Board, row: number, col: number, player: Cell): [number, number][] | null => {
    if (!player) return null;
    
    const directions = [
      [[0, 1], [0, -1]], // horizontal
      [[1, 0], [-1, 0]], // vertical
      [[1, 1], [-1, -1]], // diagonal 1
      [[1, -1], [-1, 1]], // diagonal 2
    ];

    for (const [dir1, dir2] of directions) {
      const cells: [number, number][] = [[row, col]];
      
      // Check direction 1
      let r = row + dir1[0], c = col + dir1[1];
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        cells.push([r, c]);
        r += dir1[0];
        c += dir1[1];
      }
      
      // Check direction 2
      r = row + dir2[0];
      c = col + dir2[1];
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        cells.push([r, c]);
        r += dir2[0];
        c += dir2[1];
      }
      
      if (cells.length >= 4) return cells;
    }
    
    return null;
  };

  const isMyTurn = () => {
    if (!player2Id) return currentPlayer === 'red';
    if (currentPlayer === 'red') return currentUserId === player1Id;
    return currentUserId === player2Id;
  };

  const dropPiece = (col: number) => {
    if (winner || !isMyTurn()) return;

    // Find the lowest empty row
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!board[r][col]) {
        row = r;
        break;
      }
    }

    if (row === -1) return; // Column is full

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);

    const winning = checkWin(newBoard, row, col, currentPlayer);
    if (winning) {
      setWinner(currentPlayer);
      setWinningCells(winning);
      const winnerId = currentPlayer === 'red' ? player1Id : (player2Id || null);
      onGameEnd?.(winnerId);
      onStateChange?.({ board: newBoard, currentPlayer, winner: currentPlayer, winningCells: winning });
      return;
    }

    // Check for draw
    if (newBoard.every(row => row.every(cell => cell !== null))) {
      setWinner('draw');
      onGameEnd?.(null);
      onStateChange?.({ board: newBoard, currentPlayer, winner: 'draw', winningCells: [] });
      return;
    }

    const nextPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
    setCurrentPlayer(nextPlayer);
    onStateChange?.({ board: newBoard, currentPlayer: nextPlayer, winner: null, winningCells: [] });
  };

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer('red');
    setWinner(null);
    setWinningCells([]);
    onStateChange?.({ board: createEmptyBoard(), currentPlayer: 'red', winner: null, winningCells: [] });
  };

  const isWinningCell = (row: number, col: number) => 
    winningCells.some(([r, c]) => r === row && c === col);

  return (
    <div className="text-center">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500" />
          <span className="text-sm text-foreground">{player1}</span>
        </div>
        <div className="text-xs text-muted-foreground">vs</div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">{player2}</span>
          <div className="w-4 h-4 rounded-full bg-yellow-400" />
        </div>
      </div>

      {/* Status */}
      <div className="mb-3 text-sm">
        {winner === 'draw' ? (
          <span className="text-muted-foreground font-medium">It's a draw!</span>
        ) : winner ? (
          <span className="text-primary font-bold">
            {winner === 'red' ? player1 : player2} wins! 🎉
          </span>
        ) : (
          <span className={`font-medium ${isMyTurn() ? 'text-primary' : 'text-muted-foreground'}`}>
            {isMyTurn() ? "Your turn" : `${currentPlayer === 'red' ? player1 : player2}'s turn`}
            <span className={`ml-2 inline-block w-3 h-3 rounded-full ${currentPlayer === 'red' ? 'bg-red-500' : 'bg-yellow-400'}`} />
          </span>
        )}
      </div>

      {/* Board */}
      <div className="inline-block bg-primary/90 p-2 rounded-lg">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, colIndex) => (
              <button
                key={colIndex}
                onClick={() => dropPiece(colIndex)}
                onMouseEnter={() => setHoveredCol(colIndex)}
                onMouseLeave={() => setHoveredCol(null)}
                disabled={!!winner || !isMyTurn()}
                className={`
                  w-10 h-10 m-0.5 rounded-full border-2 transition-all
                  ${cell === 'red' ? 'bg-red-500 border-red-600' : 
                    cell === 'yellow' ? 'bg-yellow-400 border-yellow-500' : 
                    'bg-background border-border'}
                  ${isWinningCell(rowIndex, colIndex) ? 'ring-2 ring-white animate-pulse' : ''}
                  ${!winner && isMyTurn() && hoveredCol === colIndex && !cell ? 'ring-2 ring-white/50' : ''}
                  disabled:cursor-not-allowed
                `}
              />
            ))}
          </div>
        ))}
      </div>

      {winner && (
        <div className="mt-4">
          <Button size="sm" onClick={resetGame}>Play Again</Button>
        </div>
      )}
    </div>
  );
};

export default Connect4;
