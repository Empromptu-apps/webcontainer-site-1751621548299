import React, { useState } from 'react';

const ApiDebugger = ({ apiCalls }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (apiCalls.length === 0) return null;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left text-xl font-bold text-white mb-4 flex items-center justify-between hover:text-primary-300 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="api-debug-content"
      >
        🔧 API Debug Log
        <span className="text-sm">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>
      
      {isExpanded && (
        <div 
          id="api-debug-content"
          className="bg-slate-900/50 rounded-xl p-4 max-h-64 overflow-y-auto space-y-3"
        >
          {apiCalls.map((call) => (
            <div 
              key={call.id} 
              className="text-xs bg-white/5 rounded p-3 border-l-2 border-yellow-400"
            >
              <div className="text-yellow-300 font-mono mb-1">
                [{call.timestamp}] {call.method} {call.endpoint}
              </div>
              <details className="text-white/80">
                <summary className="cursor-pointer hover:text-white">
                  Request/Response
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <strong className="text-blue-300">Request:</strong>
                    <pre className="bg-slate-800 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(call.data, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <strong className="text-green-300">Response:</strong>
                    <pre className="bg-slate-800 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(call.response, null, 2)}
                    </pre>
                  </div>
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiDebugger;
