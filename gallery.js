const GalleryComponent = ({ room }) => {
  const [games, setGames] = React.useState([]);
  const [selectedGame, setSelectedGame] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    // Subscribe to game collection changes
    const unsubscribe = room.collection('tetrisGame').subscribe(updatedGames => {
      // Sort games by creation date (newest first)
      const sortedGames = [...updatedGames].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setGames(sortedGames);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [room]);
  
  const handlePlayGame = (game) => {
    setSelectedGame(game);
  };
  
  const handleCloseModal = () => {
    setSelectedGame(null);
  };
  
  if (loading) {
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
        <p>Loading gallery...</p>
      </div>
    );
  }
  
  if (games.length === 0) {
    return (
      <div className="gallery-empty">
        <h3>No Tetris games created yet</h3>
        <p>Be the first to generate a unique Tetris game!</p>
      </div>
    );
  }
  
  return (
    <div className="gallery-container">
      <div className="gallery">
        {games.map(game => (
          <div key={game.id} className="gallery-item">
            <img 
              src={game.blockTextures?.[0] || 'https://via.placeholder.com/300x200?text=No+Image'} 
              alt={game.title} 
              className="gallery-item-image" 
            />
            <div className="gallery-item-content">
              <h3 className="gallery-item-title">{game.title}</h3>
              <p className="gallery-item-description">{game.description}</p>
              <div className="gallery-item-meta">
                <span>Theme: {game.theme}</span>
                <span>Difficulty: {game.difficulty}</span>
              </div>
              <button className="play-button" onClick={() => handlePlayGame(game)}>
                Play Game
              </button>
              <div className="creator-info">
                Created by: {game.username}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedGame && (
        <GameModal game={selectedGame} onClose={handleCloseModal} />
      )}
    </div>
  );
};

const GameModal = ({ game, onClose }) => {
  const gameContainerRef = React.useRef(null);
  const tetrisEngineRef = React.useRef(null);
  const [gameStats, setGameStats] = React.useState({ score: 0, level: 1, lines: 0 });
  const [gameOver, setGameOver] = React.useState(false);
  
  React.useEffect(() => {
    if (gameContainerRef.current) {
      // Initialize tetris engine with the game config
      tetrisEngineRef.current = new TetrisEngine({
        width: 10,
        height: 20,
        blockSize: 30,
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
    
    return () => {
      if (tetrisEngineRef.current) {
        tetrisEngineRef.current.pauseGame();
      }
    };
  }, [game]);
  
  const handleRestartGame = () => {
    tetrisEngineRef.current.startGame();
    setGameOver(false);
  };
  
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="game-container">
          <h2>{game.title}</h2>
          <p>{game.description}</p>
          
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
      </div>
    </div>
  );
};

