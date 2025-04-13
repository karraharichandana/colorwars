import React, { useState, useEffect } from "react";
import "./App.css";

const GRID_SIZE = 6;

const createEmptyGrid = () => {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({ count: 0, color: null }))
  );
};

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [grid, setGrid] = useState(() => createEmptyGrid());
  const [currentPlayer, setCurrentPlayer] = useState("red");
  const [winner, setWinner] = useState(null);
  const [moveCount, setMoveCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("color-war-game");
    if (saved) {
      const { savedGrid, savedPlayer, savedWinner, savedMoveCount } = JSON.parse(saved);
      const isEmpty = savedGrid.every(row => row.every(cell => cell.color === null));
      if (savedWinner || !isEmpty) {
        resetGame();
      } else {
        setGrid(savedGrid);
        setCurrentPlayer(savedPlayer);
        setWinner(null);
        setMoveCount(savedMoveCount || 0);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("color-war-game", JSON.stringify({
      savedGrid: grid,
      savedPlayer: currentPlayer,
      savedWinner: winner,
      savedMoveCount: moveCount,
    }));
  }, [grid, currentPlayer, winner, moveCount]);

  const handleClick = (row, col) => {
    if (winner) return;
    const cell = grid[row][col];
    if (cell.color === null || cell.color === currentPlayer) {
      updateCell(row, col);
    }
  };

  const checkWinner = (gridState, moves) => {
    if (moves < 2) return null;
    const colors = new Set();
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (gridState[r][c].color) {
          colors.add(gridState[r][c].color);
        }
      }
    }
    return colors.size === 1 && colors.size > 0 ? [...colors][0] : null;
  };

  const updateCell = (row, col) => {
    const gridCopy = grid.map(row => row.map(cell => ({ ...cell })));
    const newMoveCount = moveCount + 1;
    setMoveCount(newMoveCount);
    let newGrid = gridCopy;
    newGrid[row][col].count += 1;
    newGrid[row][col].color = currentPlayer;
    newGrid = handleExplosions(newGrid);
    setGrid(newGrid);
    const win = checkWinner(newGrid, newMoveCount);
    if (win) {
      setWinner(win);
      return;
    }
    setCurrentPlayer(currentPlayer === "red" ? "blue" : "red");
  };

  const handleExplosions = (gridState) => {
    const queue = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (gridState[r][c].count >= 4) {
          queue.push([r, c]);
        }
      }
    }
    while (queue.length > 0) {
      const [row, col] = queue.shift();
      const cell = gridState[row][col];
      const owner = cell.color;
      gridState[row][col] = { count: 0, color: null };
      const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
      for (let [dr, dc] of directions) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
          gridState[nr][nc].count += 1;
          gridState[nr][nc].color = owner;
          if (gridState[nr][nc].count >= 4 && !queue.some(([r, c]) => r === nr && c === nc)) {
            queue.push([nr, nc]);
          }
        }
      }
    }
    return gridState;
  };

  const resetGame = () => {
    const emptyGrid = createEmptyGrid();
    setGrid(emptyGrid);
    setCurrentPlayer("red");
    setWinner(null);
    setMoveCount(0);
    localStorage.removeItem("color-war-game");
  };

  return (
    <div className={darkMode ? "app dark" : "app"}>
      <header>
        <h1>Color War Game</h1>
        <button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
        <button onClick={resetGame}>Reset</button>
        <h2>
          Current Player:{" "}
          <span style={{ color: currentPlayer }}>{currentPlayer}</span>
        </h2>
      </header>
      <div className="grid">
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="cell"
              onClick={() => handleClick(rowIndex, colIndex)}
            >
              {cell.count > 0 && (
                <div className="dot-container">
                  {Array.from({ length: cell.count }).map((_, index) => (
                    <div
                      key={index}
                      className="dot-item"
                      style={{
                        backgroundColor: "white", // The dot itself is white
                        borderRadius: "50%", // Circle shape for the dot
                        width: "20px", // Size of the dot
                        height: "20px", // Size of the dot
                        boxShadow: `0 0 5px 2px ${cell.color}`, // Glowing effect
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {winner && (
        <div className="modal">
          <div className="modal-content">
            <h2>{winner.toUpperCase()} Wins!</h2>
            <button onClick={resetGame}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
