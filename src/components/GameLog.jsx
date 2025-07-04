import React from 'react';

const GameLog = ({ gameLog }) => {
  if (gameLog.length === 0) return null;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
      <h4 className="text-xl font-bold text-white mb-4 flex items-center">
        📜 Battle Log
      </h4>
      <div 
        className="bg-slate-900/50 rounded-xl p-4 max-h-64 overflow-y-auto space-y-2"
        role="log"
        aria-live="polite"
        aria-label="Game battle log"
      >
        {gameLog.map((log, index) => (
          <div 
            key={index} 
            className="text-white/90 text-sm p-2 bg-white/5 rounded border-l-2 border-primary-400"
          >
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameLog;
