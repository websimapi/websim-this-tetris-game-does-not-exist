const { useState, useEffect, useRef } = React;

const App = () => {
  const [room, setRoom] = useState(null);
  const [activeTab, setActiveTab] = useState('generator');
  const [isGenerating, setIsGenerating] = useState(false);
  const [creatorUsername, setCreatorUsername] = useState('');
  const [formData, setFormData] = useState({
    theme: '',
    difficulty: 'medium',
    uniqueFeature: ''
  });
  const [latestGame, setLatestGame] = useState(null);
  const tetrisGeneratorRef = useRef(null);
  
  useEffect(() => {
    // Initialize the WebSocket connection
    const newRoom = new WebsimSocket();
    setRoom(newRoom);
    
    // Initialize the Tetris Generator
    tetrisGeneratorRef.current = new TetrisGenerator();
    
    // Get creator username
    async function fetchCreatorUsername() {
      try {
        const creator = await window.websim.getCreatedBy();
        setCreatorUsername(creator.username);
      } catch (error) {
        console.error('Error getting creator username:', error);
      }
    }
    
    fetchCreatorUsername();
    
    return () => {
      // Cleanup on unmount
      if (newRoom) {
        // Close connection if needed
      }
    };
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleGenerateGame = async (e) => {
    e.preventDefault();
    
    if (!formData.theme || !formData.uniqueFeature) {
      alert('Please fill out all required fields');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Generate the game using AI
      const generatedGame = await tetrisGeneratorRef.current.generateTetrisGame({
        ...formData,
        creatorUsername
      });
      
      // Store in the database
      await room.collection('tetrisGame').create({
        id: generatedGame.id,
        title: generatedGame.title,
        description: generatedGame.description,
        theme: generatedGame.theme,
        difficulty: generatedGame.difficulty,
        uniqueFeature: generatedGame.uniqueFeature,
        aiMessages: generatedGame.aiMessages,
        mechanics: generatedGame.mechanics,
        blockThemes: generatedGame.blockThemes,
        blockTextures: generatedGame.blockTextures
      });
      
      // Set as latest game
      setLatestGame(generatedGame);
      
      // Switch to the game tab
      setActiveTab('game');
    } catch (error) {
      console.error('Error generating game:', error);
      alert('Failed to generate game. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (!room) {
    return (
      <div className="loading-indicator">
        <svg width="50" height="50" viewBox="0 0 50 50">
          <rect x="0" y="0" width="10" height="10" fill="#ff6b6b">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0s" />
          </rect>
          <rect x="20" y="0" width="10" height="10" fill="#ff6b6b">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.1s" />
          </rect>
          <rect x="40" y="0" width="10" height="10" fill="#ff6b6b">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.2s" />
          </rect>
          <rect x="0" y="20" width="10" height="10" fill="#ff6b6b">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.9s" />
          </rect>
          <rect x="40" y="20" width="10" height="10" fill="#ff6b6b">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.3s" />
          </rect>
          <rect x="0" y="40" width="10" height="10" fill="#ff6b6b">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.8s" />
          </rect>
          <rect x="20" y="40" width="10" height="10" fill="#ff6b6b">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.7s" />
          </rect>
          <rect x="40" y="40" width="10" height="10" fill="#ff6b6b">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.6s" />
          </rect>
        </svg>
        <p>Connecting to server...</p>
      </div>
    );
  }
  
  return (
    <div className="app-container">
      <header className="header">
        <h1>This Tetris Game Does Not Exist</h1>
        <p>Generate unique AI-created Tetris games with custom themes and mechanics</p>
      </header>
      
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'generator' ? 'active' : ''}`}
          onClick={() => setActiveTab('generator')}
        >
          Generator
        </button>
        <button 
          className={`tab-button ${activeTab === 'game' ? 'active' : ''}`}
          onClick={() => setActiveTab('game')}
          disabled={!latestGame}
        >
          Play Game
        </button>
        <button 
          className={`tab-button ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          Gallery
        </button>
      </div>
      
      {activeTab === 'generator' && (
        <div className="generator-section">
          <form className="generator-form" onSubmit={handleGenerateGame}>
            <div className="form-group">
              <label htmlFor="theme">Theme</label>
              <input
                type="text"
                id="theme"
                name="theme"
                value={formData.theme}
                onChange={handleInputChange}
                placeholder="e.g., Space, Underwater, Cyberpunk, Candy Land"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                required
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="extreme">Extreme</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="uniqueFeature">Unique Feature or Twist</label>
              <textarea
                id="uniqueFeature"
                name="uniqueFeature"
                value={formData.uniqueFeature}
                onChange={handleInputChange}
                placeholder="Describe a unique twist or feature for your Tetris game"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Tetris Game'}
            </button>
          </form>
          
          {isGenerating && (
            <div className="loading-indicator">
              <svg width="50" height="50" viewBox="0 0 50 50">
                <rect x="0" y="0" width="10" height="10" fill="#ff6b6b">
                  <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0s" />
                </rect>
                <rect x="20" y="0" width="10" height="10" fill="#ff6b6b">
                  <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.1s" />
                </rect>
                <rect x="40" y="0" width="10" height="10" fill="#ff6b6b">
                  <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.2s" />
                </rect>
                <rect x="0" y="20" width="10" height="10" fill="#ff6b6b">
                  <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.9s" />
                </rect>
                <rect x="40" y="20" width="10" height="10" fill="#ff6b6b">
                  <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.3s" />
                </rect>
                <rect x="0" y="40" width="10" height="10" fill="#ff6b6b">
                  <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.8s" />
                </rect>
                <rect x="20" y="40" width="10" height="10" fill="#ff6b6b">
                  <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.7s" />
                </rect>
                <rect x="40" y="40" width="10" height="10" fill="#ff6b6b">
                  <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.6s" />
                </rect>
              </svg>
              <p>Generating your unique Tetris game...<br/>This may take a minute or two</p>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'game' && latestGame && (
        <GameComponent game={latestGame} />
      )}
      
      {activeTab === 'game' && !latestGame && (
        <div className="no-game-message">
          <h3>No game generated yet</h3>
          <p>Go to the Generator tab to create your first game!</p>
          <button 
            className="tab-button"
            onClick={() => setActiveTab('generator')}
          >
            Go to Generator
          </button>
        </div>
      )}
      
      {activeTab === 'gallery' && (
        <GalleryComponent room={room} />
      )}
    </div>
  );
};

const GameComponent = ({ game }) => {
  const gameContainerRef = useRef(null);
  const tetrisEngineRef = useRef(null);
  const [gameStats, setGameStats] = useState({ score: 0, level: 1, lines: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  useEffect(() => {
    if (gameContainerRef.current) {
      // Initialize tetris engine with the game config
      tetrisEngineRef.current = new TetrisEngine({
        width: 10,
        height: 20,
        blockSize: window.innerWidth < 600 ? 25 : 30,
        blockTextures: game.blockTextures,
        aiMessages: game.aiMessages,
        dropSpeed: game.mechanics.dropSpeed,
        scoringSystem: game.mechanics.scoringSystem,
        onGameOver: (score, level, lines) => {
          setGameOver(true);
          setGameStats({ score, level, lines });
        },
        onScoreChange: (score, level, lines) => {
          setGameStats({ score, level, lines });
        }
      });
      
      // Append the canvas to the container
      gameContainerRef.current.appendChild(tetrisEngineRef.current.getCanvasElement());
      
      // Start the game
      tetrisEngineRef.current.startGame();
    }
    
    // Handle window resize
    const handleResize = () => {
      if (tetrisEngineRef.current) {
        // You could potentially resize the canvas here if needed
        // For now, we're just pausing the game if it becomes too small
        if (window.innerWidth < 320) {
          if (!isPaused) {
            tetrisEngineRef.current.pauseGame();
            setIsPaused(true);
          }
        } else if (isPaused) {
          tetrisEngineRef.current.resumeGame();
          setIsPaused(false);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (tetrisEngineRef.current) {
        tetrisEngineRef.current.pauseGame();
      }
    };
  }, [game, isPaused]);
  
  const handleRestartGame = () => {
    if (tetrisEngineRef.current) {
      tetrisEngineRef.current.startGame();
      setGameOver(false);
    }
  };
  
  const handlePauseResume = () => {
    if (tetrisEngineRef.current) {
      if (isPaused) {
        tetrisEngineRef.current.resumeGame();
      } else {
        tetrisEngineRef.current.pauseGame();
      }
      setIsPaused(!isPaused);
    }
  };
  
  return (
    <div className="game-section">
      <h2>{game.title}</h2>
      <p>{game.description}</p>
      
      <div className="game-controls">
        <button onClick={handlePauseResume} className="control-button">
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button onClick={handleRestartGame} className="control-button">
          Restart
        </button>
      </div>
      
      <div className="tetris-stats">
        <div>Score: {gameStats.score}</div>
        <div>Level: {gameStats.level}</div>
        <div>Lines: {gameStats.lines}</div>
      </div>
      
      <div className="tetris-container" ref={gameContainerRef}>
        <div className={`tetris-overlay ${gameOver ? 'visible' : ''}`}>
          <h3>Game Over</h3>
          <p>Final Score: {gameStats.score}</p>
          <button onClick={handleRestartGame}>Play Again</button>
        </div>
        
        <div className={`tetris-overlay ${isPaused && !gameOver ? 'visible' : ''}`}>
          <h3>Game Paused</h3>
          <button onClick={handlePauseResume}>Resume</button>
        </div>
      </div>
      
      <div className="game-instructions">
        <h3>Controls</h3>
        <ul>
          <li>Left/Right Arrow: Move piece</li>
          <li>Up Arrow: Rotate piece</li>
          <li>Down Arrow: Soft drop</li>
          <li>Spacebar: Hard drop</li>
          <li>Mobile: Swipe left/right to move, swipe up to rotate, swipe down for soft drop, double tap for hard drop</li>
        </ul>
      </div>
      
      <div className="game-info">
        <h3>AI Commentary</h3>
        <div className="ai-message">
          {tetrisEngineRef.current?.getCurrentAiMessage() || game.aiMessages[0]}
        </div>
        
        <h3>Block Themes</h3>
        <ul>
          {Object.entries(game.blockThemes).map(([blockType, description]) => (
            <li key={blockType}>
              <strong>{blockType}:</strong> {description}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Render the app
ReactDOM.render(<App />, document.getElementById('root'));

