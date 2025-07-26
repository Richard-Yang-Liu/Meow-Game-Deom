// DOM
const grid = document.getElementById('Block-grid');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const restartBtn = document.getElementById('restart-btn');
const confirmResetBtn = document.getElementById('confirm-reset-btn');
const cancelResetBtn = document.getElementById('cancel-reset-btn');
const pauseOverlay = document.getElementById('pause-overlay');
const gameOverModal = document.getElementById('game-over-modal');
const resetModal = document.getElementById('reset-modal');
const countdownEl = document.getElementById('countdown');
const highScoreDisplay = document.getElementById("high-score");
const nextGrid = document.getElementById("next-tetromino");
const nextGridCells = [];
const cellElements = [];

// Statement
let board;
let currentPiece = null;
let nextPiece = null;
let score = 0;
let gameInterval = null;
let gamePaused = false;
let gameOver = false;
let gameStarted = false;
let pausedForReset = false;
let highScore = parseInt(localStorage.getItem("Block-high-score")) || 0;
highScoreDisplay.textContent = highScore;

// Block Shapes
const tetrominoShapes = {
  'I': [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  'J': [[1,0,0],[1,1,1],[0,0,0]],
  'L': [[0,0,1],[1,1,1],[0,0,0]],
  'O': [[0,1,1],[0,1,1],[0,0,0]],
  'S': [[0,1,1],[1,1,0],[0,0,0]],
  'Z': [[1,1,0],[0,1,1],[0,0,0]],
  'T': [[0,1,0],[1,1,1],[0,0,0]]
};

let tetrominoSequence = [];

// New Block
function generateSequence() {
  const tetrominos = ['I','J','L','O','S','T','Z'];
  while (tetrominos.length) {
    const rand = Math.floor(Math.random() * tetrominos.length);
    tetrominoSequence.push(tetrominos.splice(rand, 1)[0]);
  }
}

// Next Block
function getNextTetromino() {
  if (tetrominoSequence.length === 0) generateSequence();
    const name = tetrominoSequence.pop();
    const matrix = tetrominoShapes[name].map(row => [...row]);
    const row = name === 'I' ? -1 : -2;
    const col = Math.floor((10 - matrix[0].length) / 2);
    return { name, matrix, row, col };
}

function displayNextTetromino() {
  nextGridCells.forEach(cell => cell.className = 'cell');
  const matrix = tetrominoShapes[nextPiece.name];
  const offsetR = Math.floor((4 - matrix.length) / 2);
  const offsetC = Math.floor((4 - matrix[0].length) / 2);
  matrix.forEach((row, r) => {
    row.forEach((val, c) => {
      if (val) {
        const idx = (r + offsetR) * 4 + (c + offsetC);
        if (nextGridCells[idx]) {
          nextGridCells[idx].classList.add(`block-${nextPiece.name}`);
        }
      }
    });
  });
}

// Rotate Block
function rotate(matrix) {
  const N = matrix.length;
  return matrix.map((row, i) => row.map((_, j) => matrix[N - 1 - j][i]));
}

// Check Place
function isValidMove(matrix, r, c) {
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (!matrix[i][j]) continue;
      const newR = r + i, newC = c + j;
      if (newC < 0 || newC >= 10 || newR >= 20) return false;
      if (newR >= 0 && board[newR][newC]) return false;
    }
  }
  return true;
}

// Fix Block
function placeTetromino() {
  currentPiece.matrix.forEach((row, i) => {
    row.forEach((val, j) => {
      if (val) {
        const r = currentPiece.row + i;
        const c = currentPiece.col + j;
        if (r < 0) gameOver = true;
        else board[r][c] = currentPiece.name;
      }
    });
  });
  currentPiece = null;
}

// Erase Row
function clearLines() {
  let cleared = 0;
  for (let r = 0; r < 20; r++) {
    if (board[r].every(cell => cell !== null)) {
      board.splice(r, 1);
      board.unshift(Array(10).fill(null));
      cleared++;
      r--;
    }
  }
  if (cleared) {
    score += cleared * 10;
    scoreDisplay.textContent = score;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("tetris-high-score", highScore);
      highScoreDisplay.textContent = highScore;
    }
  }
}

// Board
function renderBoard() {
  for (let r = 0; r < 20; r++) {
    for (let c = 0; c < 10; c++) {
      const cell = cellElements[r][c];
      cell.className = 'cell';
      if (board[r][c]) cell.classList.add(`block-${board[r][c]}`);
    }
  }
  if (currentPiece) {
    currentPiece.matrix.forEach((row, i) => {
      row.forEach((val, j) => {
        if (val) {
          const r = currentPiece.row + i;
          const c = currentPiece.col + j;
          if (r >= 0 && r < 20 && c >= 0 && c < 10) {
            cellElements[r][c].classList.add(`block-${currentPiece.name}`);
          }
        }
      });
    });
  }
}

// Automatic Drop
function dropPiece() {
  if (!currentPiece) return;
  if (isValidMove(currentPiece.matrix, currentPiece.row + 1, currentPiece.col)) {
    currentPiece.row++;
  } else {
    placeTetromino();
    if (gameOver) return endGame();
    clearLines();
    currentPiece = nextPiece;
    nextPiece = getNextTetromino();
    displayNextTetromino();
    if (!isValidMove(currentPiece.matrix, currentPiece.row, currentPiece.col)) return endGame();
  }
  renderBoard();
}

// Gameloop
function startGameLoop() {
  gameInterval = setInterval(dropPiece, 1000);
}

// Pause and Start 
function togglePause() {
  if (!gameStarted || gameOver) return;
  const pauseText = pauseBtn.querySelector('.button_text');
  if (!gamePaused) {
    gamePaused = true;
    clearInterval(gameInterval);
    pauseOverlay.style.display = 'flex';
    if (pauseText) pauseText.textContent = 'Resume';
  } else {
    gamePaused = false;
    pauseOverlay.style.display = 'none';
    if (pauseText) pauseText.textContent = 'Pause';
    startGameLoop();
  }
}

// Game Over
function endGame() {
  clearInterval(gameInterval);
  gameOver = true;
  finalScoreDisplay.textContent = score;
  gameOverModal.style.display = 'flex';
}

// Reset Game
function resetGame() {
  clearInterval(gameInterval);
  board = Array.from({ length: 20 }, () => Array(10).fill(null));
  score = 0;
  gameOver = false;
  gamePaused = false;
  pausedForReset = false;
  const pauseText = pauseBtn.querySelector('.button_text');
  if (pauseText) pauseText.textContent = 'Pause';
  tetrominoSequence = [];
  createNextGrid();
  currentPiece = getNextTetromino();
  nextPiece = getNextTetromino();
  displayNextTetromino();
  renderBoard();
  gameStarted = true;
  pauseOverlay.style.display = resetModal.style.display = gameOverModal.style.display = 'none';
  countdownEl.style.display = 'none';
  startCountdown();
}

// New Game
function initGame() {
    board = Array.from({ length: 20 }, () => Array(10).fill(null));
    for (let r = 0; r < 20; r++) {
        cellElements[r] = [];
        for (let c = 0; c < 10; c++) {
        const div = document.createElement('div');
        div.classList.add('cell');
        grid.appendChild(div);
        cellElements[r][c] = div;
        }
    }
    createNextGrid();
    currentPiece = getNextTetromino();
    nextPiece = getNextTetromino();
    displayNextTetromino();
    startCountdown();
}

// Create Block
function createNextGrid() {
  nextGrid.innerHTML = '';
  nextGridCells.length = 0;
  for (let i = 0; i < 16; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    nextGrid.appendChild(cell);
    nextGridCells.push(cell);
  }
}

// Countdown
function startCountdown() {
  let count = 3;
  countdownEl.textContent = count;
  countdownEl.style.display = 'block';
  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownEl.textContent = count;
    } else if (count === 0) {
      countdownEl.textContent = 'Go!';
    } else {
      clearInterval(interval);
      countdownEl.style.display = 'none';
      gameStarted = true;
      renderBoard();
      startGameLoop();
    }
  }, 1000);
}

// Control
document.addEventListener('keydown', (e) => {
  if (!gameStarted || gameOver || gamePaused) return;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "W", "a", "A", "s", "S", "d", "D"].includes(e.key)) e.preventDefault();
  switch (e.key) {
    case 'ArrowLeft':
    case 'a':
    case 'A':
      if (isValidMove(currentPiece.matrix, currentPiece.row, currentPiece.col - 1)) currentPiece.col--;
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      if (isValidMove(currentPiece.matrix, currentPiece.row, currentPiece.col + 1)) currentPiece.col++;
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      if (isValidMove(currentPiece.matrix, currentPiece.row + 1, currentPiece.col)) currentPiece.row++;
      else {
        placeTetromino();
        if (gameOver) return endGame();
        clearLines();
        currentPiece = nextPiece;
        nextPiece = getNextTetromino();
        displayNextTetromino();
        if (!isValidMove(currentPiece.matrix, currentPiece.row, currentPiece.col)) return endGame();
      }
      break;
    case 'ArrowUp':
    case 'w':
    case 'W': {
      const rotated = rotate(currentPiece.matrix);
      if (isValidMove(rotated, currentPiece.row, currentPiece.col)) currentPiece.matrix = rotated;
      break;
    }
    case 'p':
    case 'P':
      togglePause();
      break;
  }
  renderBoard();
});

pauseBtn.onclick = togglePause;

resetBtn.onclick = () => {
  if (!gameOver) {
    if (!gamePaused) togglePause();
    resetModal.style.display = 'flex';
  } else {
    resetGame();
  }
};

confirmResetBtn.onclick = () => {
  pauseOverlay.style.display = 'none';
  resetModal.style.display = 'none';
  resetGame();
};

cancelResetBtn.onclick = () => {
  resetModal.style.display = 'none';
  togglePause();
};

restartBtn.onclick = () => {
  pauseOverlay.style.display = 'none';
  resetModal.style.display = 'none';
  gameOverModal.style.display = 'none';
  gamePaused = false;
  pausedForReset = false;
  const pauseText = pauseBtn.querySelector('.button_text');
  if (pauseText) pauseText.textContent = 'Pause';
  resetGame();
};

document.getElementById('resume-btn').onclick = togglePause;

window.addEventListener('DOMContentLoaded', initGame);

setInterval(() => {
  if (nextGridCells.length !== 16) {
    createNextGrid();
    displayNextTetromino();
  }
}, 5000);
