import React from 'react';

const GameGrid = ({ grid, shots, onCellClick, isPlayerGrid, disabled }) => {
  const getCellStyle = (row, col) => {
    const isShot = shots[row][col];
    const hasShip = grid[row][col] !== null;
    
    let className = 'w-8 h-8 border border-slate-600 flex items-center justify-center text-xs rounded transition-all duration-200 ';
    let content = '';
    
    if (isShot) {
      if (hasShip) {
        className += 'bg-red-500 text-white shadow-lg';
        content = '💥';
      } else {
        className += 'bg-slate-400 text-white';
        content = '💧';
      }
    } else if (isPlayerGrid && hasShip) {
      className += 'bg-green-500 text-white';
      content = '🚢';
    } else {
      className += 'bg-blue-500/60 hover:bg-blue-400/80';
      if (!isPlayerGrid && !disabled) {
        className += ' cursor-crosshair hover:scale-110';
      }
    }
    
    return { className, content };
  };

  return (
    <div className="inline-block bg-slate-800/50 p-4 rounded-xl">
      <div className="grid grid-cols-11 gap-1">
        {/* Header row */}
        <div></div>
        {[1,2,3,4,5,6,7,8,9,10].map(num => (
          <div key={num} className="w-8 h-8 flex items-center justify-center text-white font-bold text-sm">
            {num}
          </div>
        ))}
        
        {/* Grid rows */}
        {grid.map((row, r) => (
          <React.Fragment key={r}>
            <div className="w-8 h-8 flex items-center justify-center text-white font-bold text-sm">
              {String.fromCharCode(65 + r)}
            </div>
            {row.map((cell, c) => {
              const style = getCellStyle(r, c);
              return (
                <button
                  key={`${r}-${c}`}
                  className={style.className}
                  onClick={() => !disabled && onCellClick(r, c)}
                  disabled={disabled || shots[r][c]}
                  aria-label={`Grid position ${String.fromCharCode(65 + r)}${c + 1}`}
                >
                  {style.content}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default GameGrid;
