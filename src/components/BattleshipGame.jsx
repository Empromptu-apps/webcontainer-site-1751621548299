import React, { useState, useEffect } from 'react';
import GameGrid from './GameGrid';
import GameLog from './GameLog';
import ApiDebugger from './ApiDebugger';

const BattleshipGame = () => {
  const [playerGrid, setPlayerGrid] = useState(Array(10).fill().map(() => Array(10).fill(null)));
  const [aiGrid, setAiGrid] = useState(Array(10).fill().map(() => Array(10).fill(null)));
  const [playerShots, setPlayerShots] = useState(Array(10).fill().map(() => Array(10).fill(false)));
  const [aiShots, setAiShots] = useState(Array(10).fill().map(() => Array(10).fill(false)));
  const [gameState, setGameState] = useState('setup');
  const [currentPlayer, setCurrentPlayer] = useState('player');
  const [agentId, setAgentId] = useState(null);
  const [gameLog, setGameLog] = useState([]);
  const [playerShips, setPlayerShips] = useState([]);
  const [aiShips, setAiShips] = useState([]);
  const [apiCalls, setApiCalls] = useState([]);
  const [gameDataObject, setGameDataObject] = useState(null);

  const ships = [
    { name: 'Carrier', size: 5 },
    { name: 'Battleship', size: 4 },
    { name: 'Cruiser', size: 3 },
    { name: 'Submarine', size: 3 },
    { name: 'Destroyer', size: 2 }
  ];

  const logApiCall = (method, endpoint, data, response) => {
    const timestamp = new Date().toLocaleTimeString();
    setApiCalls(prev => [...prev, {
      timestamp,
      method,
      endpoint,
      data,
      response,
      id: Date.now()
    }]);
  };

  // Initialize AI agent
  useEffect(() => {
    const initializeAI = async () => {
      try {
        const requestData = {
          instructions: `You are Admiral AI, a strategic Battleship opponent. You should:
          1. Make intelligent shooting decisions based on previous hits and misses
          2. When you hit a ship, systematically search adjacent squares to sink it
          3. Provide brief, engaging naval commentary on moves
          4. Keep track of the game state and adapt your strategy
          5. Be a good sport - congratulate good moves and acknowledge defeats
          
          Always respond with JSON in this format:
          {
            "shot": "A5",
            "commentary": "Taking a shot at the center - let's see what we find!",
            "strategy": "random" or "hunting" or "targeting"
          }`,
          agent_name: "Admiral AI"
        };

        const response = await fetch('/api_tools/create-agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer wy3n6iu9fqmcolquko'
          },
          body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        logApiCall('POST', '/api_tools/create-agent', requestData, data);
        setAgentId(data.agent_id);
      } catch (error) {
        console.error('Failed to initialize AI:', error);
        logApiCall('POST', '/api_tools/create-agent', {}, { error: error.message });
      }
    };
    initializeAI();
  }, []);

  // Auto-place ships randomly
  const placeShipsRandomly = async () => {
    const newPlayerGrid = Array(10).fill().map(() => Array(10).fill(null));
    const newAiGrid = Array(10).fill().map(() => Array(10).fill(null));
    const newPlayerShips = [];
    const newAiShips = [];

    const placeShip = (grid, shipList, ship) => {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        const horizontal = Math.random() < 0.5;
        const row = Math.floor(Math.random() * 10);
        const col = Math.floor(Math.random() * 10);
        
        if (canPlaceShip(grid, row, col, ship.size, horizontal)) {
          const shipCells = [];
          for (let i = 0; i < ship.size; i++) {
            const r = horizontal ? row : row + i;
            const c = horizontal ? col + i : col;
            grid[r][c] = ship.name;
            shipCells.push([r, c]);
          }
          shipList.push({ ...ship, cells: shipCells, hits: 0 });
          placed = true;
        }
        attempts++;
      }
    };

    const canPlaceShip = (grid, row, col, size, horizontal) => {
      if (horizontal) {
        if (col + size > 10) return false;
        for (let i = 0; i < size; i++) {
          if (grid[row][col + i] !== null) return false;
        }
      } else {
        if (row + size > 10) return false;
        for (let i = 0; i < size; i++) {
          if (grid[row + i][col] !== null) return false;
        }
      }
      return true;
    };

    ships.forEach(ship => {
      placeShip(newPlayerGrid, newPlayerShips, ship);
      placeShip(newAiGrid, newAiShips, ship);
    });

    setPlayerGrid(newPlayerGrid);
    setAiGrid(newAiGrid);
    setPlayerShips(newPlayerShips);
    setAiShips(newAiShips);
    setGameState('playing');
    setGameLog(['🚢 Ships deployed! Battle begins!']);

    // Store game data
    const gameData = {
      playerShips: newPlayerShips,
      aiShips: newAiShips,
      timestamp: new Date().toISOString()
    };

    try {
      const requestData = {
        created_object_name: 'battleship_game_data',
        data_type: 'strings',
        input_data: [JSON.stringify(gameData)]
      };

      const response = await fetch('/api_tools/input_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer wy3n6iu9fqmcolquko'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      logApiCall('POST', '/api_tools/input_data', requestData, data);
      setGameDataObject('battleship_game_data');
    } catch (error) {
      console.error('Failed to store game data:', error);
    }
  };

  // Handle player shot
  const handlePlayerShot = async (row, col) => {
    if (gameState !== 'playing' || currentPlayer !== 'player' || playerShots[row][col]) return;

    const newPlayerShots = [...playerShots];
    newPlayerShots[row][col] = true;
    setPlayerShots(newPlayerShots);

    const hit = aiGrid[row][col] !== null;
    const coordinate = `${String.fromCharCode(65 + row)}${col + 1}`;
    
    let message = `🎯 You shot ${coordinate} - `;
    if (hit) {
      message += 'HIT! 💥';
      const shipName = aiGrid[row][col];
      const ship = aiShips.find(s => s.name === shipName);
      if (ship) {
        ship.hits++;
        if (ship.hits === ship.size) {
          message += ` ${shipName} SUNK! 🔥`;
        }
      }
    } else {
      message += 'Miss 💧';
    }

    setGameLog(prev => [...prev, message]);
    
    // Check win condition
    if (aiShips.every(ship => ship.hits === ship.size)) {
      setGameState('gameOver');
      setGameLog(prev => [...prev, '🏆 Victory! You sunk all enemy ships!']);
      return;
    }

    setCurrentPlayer('ai');
    setTimeout(handleAITurn, 1000);
  };

  // Handle AI turn
  const handleAITurn = async () => {
    if (!agentId) return;

    try {
      const gameStateInfo = {
        playerShots: playerShots.map((row, r) => 
          row.map((shot, c) => shot ? (aiGrid[r][c] ? 'hit' : 'miss') : 'unknown')
        ),
        aiShots: aiShots.map((row, r) => 
          row.map((shot, c) => shot ? (playerGrid[r][c] ? 'hit' : 'miss') : 'unknown')
        ),
        lastPlayerShot: gameLog[gameLog.length - 1]
      };

      const requestData = {
        agent_id: agentId,
        message: `Game state: ${JSON.stringify(gameStateInfo)}. Make your next move!`
      };

      const response = await fetch('/api_tools/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer wy3n6iu9fqmcolquko'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      logApiCall('POST', '/api_tools/chat', requestData, data);
      
      let aiMove;
      try {
        aiMove = JSON.parse(data.response);
      } catch {
        aiMove = {
          shot: generateRandomShot(),
          commentary: "Taking my shot!",
          strategy: "random"
        };
      }

      // Parse AI shot
      const shotMatch = aiMove.shot.match(/([A-J])(\d+)/);
      if (shotMatch) {
        const row = shotMatch[1].charCodeAt(0) - 65;
        const col = parseInt(shotMatch[2]) - 1;
        
        if (row >= 0 && row < 10 && col >= 0 && col < 10 && !aiShots[row][col]) {
          const newAiShots = [...aiShots];
          newAiShots[row][col] = true;
          setAiShots(newAiShots);

          const hit = playerGrid[row][col] !== null;
          let message = `🤖 AI shot ${aiMove.shot} - `;
          
          if (hit) {
            message += 'HIT on your ship! 💥';
            const shipName = playerGrid[row][col];
            const ship = playerShips.find(s => s.name === shipName);
            if (ship) {
              ship.hits++;
              if (ship.hits === ship.size) {
                message += ` Your ${shipName} is SUNK! 🔥`;
              }
            }
          } else {
            message += 'Miss 💧';
          }

          setGameLog(prev => [...prev, message, `💭 AI: ${aiMove.commentary}`]);

          // Check AI win condition
          if (playerShips.every(ship => ship.hits === ship.size)) {
            setGameState('gameOver');
            setGameLog(prev => [...prev, '💀 Defeat! AI sunk all your ships!']);
            return;
          }
        }
      }
    } catch (error) {
      console.error('AI turn error:', error);
      logApiCall('POST', '/api_tools/chat', {}, { error: error.message });
    }

    setCurrentPlayer('player');
  };

  const generateRandomShot = () => {
    let row, col;
    do {
      row = Math.floor(Math.random() * 10);
      col = Math.floor(Math.random() * 10);
    } while (aiShots[row][col]);
    
    return `${String.fromCharCode(65 + row)}${col + 1}`;
  };

  const resetGame = () => {
    setPlayerGrid(Array(10).fill().map(() => Array(10).fill(null)));
    setAiGrid(Array(10).fill().map(() => Array(10).fill(null)));
    setPlayerShots(Array(10).fill().map(() => Array(10).fill(false)));
    setAiShots(Array(10).fill().map(() => Array(10).fill(false)));
    setGameState('setup');
    setCurrentPlayer('player');
    setGameLog([]);
    setPlayerShips([]);
    setAiShips([]);
  };

  const showRawData = async () => {
    if (!gameDataObject) return;
    
    try {
      const response = await fetch(`/api_tools/return_data/${gameDataObject}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer wy3n6iu9fqmcolquko'
        }
      });
      
      const data = await response.json();
      logApiCall('GET', `/api_tools/return_data/${gameDataObject}`, {}, data);
      alert(`Raw Game Data:\n${data.text_value}`);
    } catch (error) {
      console.error('Failed to retrieve data:', error);
    }
  };

  const deleteGameData = async () => {
    if (!gameDataObject) return;
    
    try {
      const response = await fetch(`/api_tools/objects/${gameDataObject}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer wy3n6iu9fqmcolquko'
        }
      });
      
      const data = await response.json();
      logApiCall('DELETE', `/api_tools/objects/${gameDataObject}`, {}, data);
      setGameDataObject(null);
      alert('Game data deleted successfully!');
    } catch (error) {
      console.error('Failed to delete data:', error);
    }
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            ⚓ BATTLESHIP ⚓
          </h1>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {gameDataObject && (
              <>
                <button 
                  onClick={showRawData}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 shadow-lg"
                  aria-label="Show raw API data"
                >
                  📊 Show Raw Data
                </button>
                <button 
                  onClick={deleteGameData}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 shadow-lg"
                  aria-label="Delete game data"
                >
                  🗑️ Delete Data
                </button>
              </>
            )}
          </div>
        </div>

        {/* Setup Phase */}
        {gameState === 'setup' && (
          <div className="text-center mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-white mb-4">Deploy Your Fleet</h2>
              <p className="text-white/80 mb-6">
                Ships will be automatically placed on both grids. Ready for battle?
              </p>
              <button 
                onClick={placeShipsRandomly}
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                aria-label="Deploy fleet and start battle"
              >
                🚢 Deploy Fleet & Start Battle!
              </button>
            </div>
          </div>
        )}

        {/* Game Phase */}
        {gameState !== 'setup' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
            {/* Player Grid */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-2xl font-bold text-white text-center mb-4">
                🛡️ Your Fleet
              </h3>
              <GameGrid 
                grid={playerGrid}
                shots={aiShots}
                onCellClick={() => {}}
                isPlayerGrid={true}
                disabled={true}
              />
            </div>

            {/* AI Grid */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-2xl font-bold text-white text-center mb-4">
                🎯 Enemy Waters
              </h3>
              <GameGrid 
                grid={aiGrid}
                shots={playerShots}
                onCellClick={handlePlayerShot}
                isPlayerGrid={false}
                disabled={gameState !== 'playing' || currentPlayer !== 'player'}
              />
            </div>
          </div>
        )}

        {/* Game Status */}
        <div className="text-center mb-8">
          {gameState === 'playing' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-md mx-auto">
              <p className="text-xl font-bold text-white">
                {currentPlayer === 'player' ? '🎯 Your turn - Click to fire!' : '🤖 AI is thinking...'}
              </p>
            </div>
          )}
          
          {gameState === 'gameOver' && (
            <button 
              onClick={resetGame}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              aria-label="Start new battle"
            >
              🔄 New Battle
            </button>
          )}
        </div>

        {/* Game Log and API Debugger */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <GameLog gameLog={gameLog} />
          <ApiDebugger apiCalls={apiCalls} />
        </div>
      </div>
    </div>
  );
};

export default BattleshipGame;
