class TetrisEngine {
  constructor(config) {
    // Game board
    this.width = config.width || 10;
    this.height = config.height || 20;
    this.blockSize = config.blockSize || 30;
    this.board = Array(this.height).fill().map(() => Array(this.width).fill(0));
    
    // Game state
    this.isRunning = false;
    this.gameOver = false;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    
    // Current and next piece
    this.currentPiece = null;
    this.nextPiece = null;
    
    // Game timing
    this.dropInterval = 1000; // ms
    this.dropCounter = 0;
    this.lastTime = 0;
    
    // Textures
    this.blockTextures = config.blockTextures || [];
    
    // Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width * this.blockSize;
    this.canvas.height = this.height * this.blockSize;
    this.canvas.classList.add('tetris-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Messages from AI
    this.aiMessages = config.aiMessages || [];
    this.currentAiMessage = '';
    this.messageInterval = null;
    
    // Game mechanics
    this.dropSpeed = config.dropSpeed || 1;
    this.scoringSystem = config.scoringSystem || {
      1: 100,   // 1 line
      2: 300,   // 2 lines
      3: 500,   // 3 lines
      4: 800    // 4 lines (tetris)
    };
    
    // Tetromino shapes and their rotations
    this.tetrominos = {
      I: {
        shape: [
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [0, 0, 0, 0],
          [0, 0, 0, 0]
        ],
        color: 1
      },
      J: {
        shape: [
          [2, 0, 0],
          [2, 2, 2],
          [0, 0, 0]
        ],
        color: 2
      },
      L: {
        shape: [
          [0, 0, 3],
          [3, 3, 3],
          [0, 0, 0]
        ],
        color: 3
      },
      O: {
        shape: [
          [4, 4],
          [4, 4]
        ],
        color: 4
      },
      S: {
        shape: [
          [0, 5, 5],
          [5, 5, 0],
          [0, 0, 0]
        ],
        color: 5
      },
      T: {
        shape: [
          [0, 6, 0],
          [6, 6, 6],
          [0, 0, 0]
        ],
        color: 6
      },
      Z: {
        shape: [
          [7, 7, 0],
          [0, 7, 7],
          [0, 0, 0]
        ],
        color: 7
      }
    };
    
    // Event handlers
    this.onGameOver = config.onGameOver || (() => {});
    this.onScoreChange = config.onScoreChange || (() => {});
    
    // Preload textures
    this.textureImages = [];
    if (this.blockTextures && this.blockTextures.length) {
      this.preloadTextures();
    }
    
    // Initialize input handlers
    this.initInputHandlers();
  }
  
  preloadTextures() {
    this.textureImages = this.blockTextures.map(url => {
      const img = new Image();
      img.src = url;
      return img;
    });
  }
  
  initInputHandlers() {
    document.addEventListener('keydown', e => {
      if (!this.isRunning || this.gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          this.moveCurrentPiece(-1, 0);
          break;
        case 'ArrowRight':
          this.moveCurrentPiece(1, 0);
          break;
        case 'ArrowDown':
          this.moveCurrentPiece(0, 1);
          this.score += 1;
          this.onScoreChange(this.score, this.level, this.lines);
          break;
        case 'ArrowUp':
          this.rotateCurrentPiece();
          break;
        case ' ':
          this.hardDrop();
          break;
      }
    });
    
    // Touch controls for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    this.canvas.addEventListener('touchstart', e => {
      if (!this.isRunning || this.gameOver) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      e.preventDefault();
    }, { passive: false });
    
    this.canvas.addEventListener('touchmove', e => {
      if (!this.isRunning || this.gameOver) return;
      
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const diffX = touchX - touchStartX;
      const diffY = touchY - touchStartY;
      
      // Determine if horizontal or vertical swipe
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > 30) {
          this.moveCurrentPiece(1, 0);
          touchStartX = touchX;
        } else if (diffX < -30) {
          this.moveCurrentPiece(-1, 0);
          touchStartX = touchX;
        }
      } else {
        // Vertical swipe
        if (diffY > 30) {
          this.moveCurrentPiece(0, 1);
          this.score += 1;
          this.onScoreChange(this.score, this.level, this.lines);
          touchStartY = touchY;
        } else if (diffY < -30) {
          this.rotateCurrentPiece();
          touchStartY = touchY;
        }
      }
      
      e.preventDefault();
    }, { passive: false });
    
    this.canvas.addEventListener('touchend', e => {
      // Double tap detection for hard drop
      const now = Date.now();
      const timeSinceLast = now - (this.lastTap || 0);
      if (timeSinceLast < 300 && timeSinceLast > 0) {
        this.hardDrop();
      }
      this.lastTap = now;
      e.preventDefault();
    }, { passive: false });
  }
  
  startGame() {
    if (this.isRunning) return;
    
    // Reset game state
    this.board = Array(this.height).fill().map(() => Array(this.width).fill(0));
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.dropInterval = 1000 / this.dropSpeed;
    
    // Create first piece
    this.createNewPiece();
    this.currentPiece = this.nextPiece;
    this.createNewPiece();
    
    // Start AI messages
    this.startAiMessages();
    
    // Start game loop
    this.isRunning = true;
    this.lastTime = 0;
    requestAnimationFrame(this.update.bind(this));
    
    // Update score display
    this.onScoreChange(this.score, this.level, this.lines);
  }
  
  pauseGame() {
    this.isRunning = false;
    
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
      this.messageInterval = null;
    }
  }
  
  resumeGame() {
    if (!this.gameOver) {
      this.isRunning = true;
      this.lastTime = 0;
      requestAnimationFrame(this.update.bind(this));
      this.startAiMessages();
    }
  }
  
  startAiMessages() {
    if (this.aiMessages && this.aiMessages.length) {
      this.currentAiMessage = this.aiMessages[Math.floor(Math.random() * this.aiMessages.length)];
      
      this.messageInterval = setInterval(() => {
        this.currentAiMessage = this.aiMessages[Math.floor(Math.random() * this.aiMessages.length)];
      }, 15000); // New message every 15 seconds
    }
  }
  
  update(time) {
    if (!this.isRunning) return;
    
    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    
    this.dropCounter += deltaTime;
    if (this.dropCounter > this.dropInterval) {
      this.dropCounter = 0;
      this.moveCurrentPiece(0, 1);
    }
    
    this.draw();
    
    requestAnimationFrame(this.update.bind(this));
  }
  
  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw board
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.board[y][x]) {
          this.drawBlock(x, y, this.board[y][x]);
        }
      }
    }
    
    // Draw current piece
    if (this.currentPiece) {
      this.currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            this.drawBlock(
              x + this.currentPiece.pos.x,
              y + this.currentPiece.pos.y,
              this.currentPiece.color
            );
          }
        });
      });
    }
    
    // Draw grid
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= this.width; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.blockSize, 0);
      this.ctx.lineTo(x * this.blockSize, this.canvas.height);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= this.height; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.blockSize);
      this.ctx.lineTo(this.canvas.width, y * this.blockSize);
      this.ctx.stroke();
    }
  }
  
  drawBlock(x, y, colorIndex) {
    // Position for the block
    const xPos = x * this.blockSize;
    const yPos = y * this.blockSize;
    
    if (this.textureImages.length && this.textureImages[colorIndex - 1]?.complete) {
      // Use texture if available and loaded
      this.ctx.drawImage(
        this.textureImages[colorIndex - 1],
        xPos,
        yPos,
        this.blockSize,
        this.blockSize
      );
    } else {
      // Fallback to solid color
      const colors = [
        '#00f0f0', // cyan - I
        '#0000f0', // blue - J
        '#f0a000', // orange - L
        '#f0f000', // yellow - O
        '#00f000', // green - S
        '#a000f0', // purple - T
        '#f00000'  // red - Z
      ];
      
      this.ctx.fillStyle = colors[colorIndex - 1] || '#fff';
      this.ctx.fillRect(xPos, yPos, this.blockSize, this.blockSize);
      
      // Add highlight
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(xPos, yPos, this.blockSize, 5);
      this.ctx.fillRect(xPos, yPos, 5, this.blockSize);
      
      // Add shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fillRect(xPos + this.blockSize - 5, yPos, 5, this.blockSize);
      this.ctx.fillRect(xPos, yPos + this.blockSize - 5, this.blockSize, 5);
    }
    
    // Add border to distinguish blocks
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.strokeRect(xPos, yPos, this.blockSize, this.blockSize);
  }
  
  createNewPiece() {
    const pieces = Object.keys(this.tetrominos);
    const tetromino = this.tetrominos[pieces[Math.floor(Math.random() * pieces.length)]];
    
    this.nextPiece = {
      pos: {
        x: Math.floor(this.width / 2) - Math.floor(tetromino.shape[0].length / 2),
        y: 0
      },
      shape: tetromino.shape,
      color: tetromino.color
    };
    
    // Check if game over
    if (this.checkCollision(this.nextPiece)) {
      this.gameOver = true;
      this.isRunning = false;
      this.onGameOver(this.score, this.level, this.lines);
      
      if (this.messageInterval) {
        clearInterval(this.messageInterval);
        this.messageInterval = null;
      }
    }
  }
  
  moveCurrentPiece(moveX, moveY) {
    this.currentPiece.pos.x += moveX;
    this.currentPiece.pos.y += moveY;
    
    if (this.checkCollision(this.currentPiece)) {
      this.currentPiece.pos.x -= moveX;
      this.currentPiece.pos.y -= moveY;
      
      if (moveY > 0) {
        this.lockPiece();
        this.clearLines();
        this.createNewPiece();
        this.currentPiece = this.nextPiece;
        this.createNewPiece();
      }
    }
  }
  
  rotateCurrentPiece() {
    const originalShape = this.currentPiece.shape;
    
    // Create rotated shape
    const rotated = [];
    for (let y = 0; y < originalShape[0].length; y++) {
      const newRow = [];
      for (let x = originalShape.length - 1; x >= 0; x--) {
        newRow.push(originalShape[x][y]);
      }
      rotated.push(newRow);
    }
    
    // Temporarily set the rotated shape
    this.currentPiece.shape = rotated;
    
    // Check for collision and try wall kicks
    const wallKickOffsets = [
      { x: 0, y: 0 },   // Original position
      { x: 1, y: 0 },   // Right
      { x: -1, y: 0 },  // Left
      { x: 0, y: -1 },  // Up
      { x: 1, y: -1 },  // Right-up
      { x: -1, y: -1 }  // Left-up
    ];
    
    let validRotation = false;
    
    for (const offset of wallKickOffsets) {
      // Apply offset
      this.currentPiece.pos.x += offset.x;
      this.currentPiece.pos.y += offset.y;
      
      // Check if valid
      if (!this.checkCollision(this.currentPiece)) {
        validRotation = true;
        break;
      }
      
      // Remove offset
      this.currentPiece.pos.x -= offset.x;
      this.currentPiece.pos.y -= offset.y;
    }
    
    // If no valid rotation found, revert back to original shape
    if (!validRotation) {
      this.currentPiece.shape = originalShape;
    }
  }
  
  hardDrop() {
    while (!this.checkCollision({
      pos: {
        x: this.currentPiece.pos.x,
        y: this.currentPiece.pos.y + 1
      },
      shape: this.currentPiece.shape
    })) {
      this.currentPiece.pos.y++;
      this.score += 2; // More points for hard drop
    }
    
    this.lockPiece();
    this.clearLines();
    this.createNewPiece();
    this.currentPiece = this.nextPiece;
    this.createNewPiece();
    
    this.onScoreChange(this.score, this.level, this.lines);
  }
  
  checkCollision(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] !== 0) {
          const boardX = piece.pos.x + x;
          const boardY = piece.pos.y + y;
          
          // Check boundaries
          if (
            boardX < 0 ||
            boardX >= this.width ||
            boardY >= this.height ||
            (boardY >= 0 && this.board[boardY][boardX])
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }
  
  lockPiece() {
    this.currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const boardY = this.currentPiece.pos.y + y;
          if (boardY >= 0) { // Only if piece is on the board
            this.board[boardY][this.currentPiece.pos.x + x] = this.currentPiece.color;
          }
        }
      });
    });
  }
  
  clearLines() {
    let linesCleared = 0;
    
    for (let y = this.height - 1; y >= 0; y--) {
      if (this.board[y].every(value => value !== 0)) {
        // Remove the line
        this.board.splice(y, 1);
        // Add a new empty line at the top
        this.board.unshift(Array(this.width).fill(0));
        // Increment line count and check same line again
        linesCleared++;
        y++;
      }
    }
    
    if (linesCleared > 0) {
      // Update score
      this.score += this.scoringSystem[linesCleared] * this.level;
      this.lines += linesCleared;
      
      // Update level
      this.level = Math.floor(this.lines / 10) + 1;
      
      // Update drop speed
      this.dropInterval = 1000 / (this.dropSpeed * (1 + (this.level - 1) * 0.1));
      
      // Update score display
      this.onScoreChange(this.score, this.level, this.lines);
    }
  }
  
  getCanvasElement() {
    return this.canvas;
  }
  
  getCurrentAiMessage() {
    return this.currentAiMessage;
  }
}

