// DOM
const gameGrid = document.getElementById('game-grid');
const gridWidth = 300, gridHeight = 600;
const CAT_WIDTH = 64, CAT_HEIGHT = 64, PLATFORM_WIDTH = 100, PLATFORM_HEIGHT = 30;
const jumpVelocity = -12, moveSpeed = 2.3, gravity = 0.5;
const scrollSpeedBase = 0.5, MOVING_PLATFORM_SPEED = 0.7;
const STAR_SCORE = 100;
let scrollSpeed = scrollSpeedBase;

let cat, platforms, stars, gameOver, gamePaused, gameStarted, animationId;
let score, maxHeight, leftPressed, rightPressed, cameraY;
let level, star, platformGenTargetY;
let maxLevelY = null;

const pauseOverlay = document.getElementById('pause-overlay');
const countdownEl = document.getElementById('countdown');
const mask = document.getElementById('gridMask');
const resetModal = document.getElementById('reset-modal');
const gameOverModal = document.getElementById('game-over-modal');

// Update UI
function updateUI() {
  document.getElementById('score').textContent = score;
  document.getElementById('level').textContent = level;
  document.getElementById('star').textContent = star;
  // -------【同步历史高分显示】-------
  let best = Number(localStorage.getItem('bestScore') || 0);
  document.getElementById('high-score').textContent = best;
}


// Create Platform
function getPlatformGap() {
  const base = 105;
  const rand = Math.random() * 20 - 10;
  return base + rand;
}

let lastSpecialPlatformLevel = -10;
let lastPlatformType = 'rock';
let nextCloudLevel = 100 + Math.floor(Math.random() * 7) + 7;
function getRandomPlatformType(level, lastType) {
  let isSpecialAllowed = (level - lastSpecialPlatformLevel >= 10);
  let type = 'rock'; // 默认rock
  let rnd = Math.random();

  // 不同关卡分段，调整平台概率
  if (level > 300) { // 顶级阶段
    if (rnd < 0.50) type = 'cloud';             // 50%云朵
    else if (rnd < 0.75) type = 'ice';          // 25%冰块
    else if (rnd < 0.95) type = 'rock';         // 20%石台
    else type = 'runningstage';                 // 5%移动台
  } else if (level > 200) {
    if (rnd < 0.32) type = 'cloud';             // 32%云朵
    else if (rnd < 0.55) type = 'ice';          // 23%冰块
    else if (rnd < 0.90) type = 'rock';         // 35%石台
    else type = 'runningstage';                 // 10%移动台
  } else if (level > 120) {
    if (rnd < 0.20) type = 'cloud';             // 20%云朵
    else if (rnd < 0.39) type = 'ice';          // 19%冰块
    else if (rnd < 0.84) type = 'rock';         // 45%石台
    else type = 'runningstage';                 // 16%移动台
  } else if (level > 100) {
    if (rnd < 0.16) type = 'cloud';
    else if (rnd < 0.32) type = 'ice';
    else if (rnd < 0.75) type = 'rock';
    else type = 'runningstage';
  } else if (level > 60) {
    if (rnd < 0.11) type = 'cloud';
    else if (rnd < 0.26) type = 'ice';
    else if (rnd < 0.72) type = 'rock';
    else type = 'runningstage';
  } else if (level > 30) {
    if (rnd < 0.19) type = 'ice';
    else if (rnd < 0.75) type = 'rock';
    else type = 'runningstage';
  } else if (level > 15) {
    if (rnd < 0.13) type = 'ice';
    else type = 'rock';
  }

  // 避免连续重复特殊平台
  if (isSpecialAllowed && type !== 'rock' && type !== lastType) {
    lastSpecialPlatformLevel = level;
  } else if (!isSpecialAllowed) {
    type = 'rock';
  }

  return type;
}

// Cat
class Cat {
  constructor(x, y) {
    document.querySelectorAll('#game-grid #cat').forEach(el => el.remove());

    this.x = x; this.y = y;
    this.width = CAT_WIDTH; this.height = CAT_HEIGHT;
    this.velX = 0; this.velY = 0;
    this.onGround = false; 
    this.lastSteppedPlatform = null;
    this.currentPlatform = null;
    this.coyoteTime = 100; this.coyoteTimer = 0;
    this.el = document.createElement('div');
    this.el.id = 'cat';
    Object.assign(this.el.style, {
      position: 'absolute',
      width: this.width + 'px',
      height: this.height + 'px',
      backgroundImage: 'url(images/cat_spritesheet.png)',
      backgroundSize: `${this.width * 5}px auto`,
      backgroundRepeat: 'no-repeat',
      zIndex: 10, pointerEvents: 'none'
    });
    this.frame = 0;
    this.facingLeft = false;
    gameGrid.appendChild(this.el);
    this.render();
  }

  render() {
    this.el.style.left = this.x + 'px';
    this.el.style.top = (this.y - cameraY + 15) + 'px';
    this.el.style.backgroundPosition = `-${this.width * this.frame}px 0`;
    this.el.style.transform = this.facingLeft ? "scaleX(-1)" : "scaleX(1)";
  }

  update(delta = 16.7) {
    // Downward Speed
    const maxDownwardSpeed = 18;
    if (this.velY > maxDownwardSpeed) this.velY = maxDownwardSpeed;

    if (!this.onGround) this.frame = 2;
    else if (Math.abs(this.velX) > 0.5) this.frame = 1;
    else this.frame = 0;

    // Move
    if (leftPressed) { this.velX = -moveSpeed; this.facingLeft = true; }
    else if (rightPressed) { this.velX = moveSpeed; this.facingLeft = false; }
    else this.velX = 0;
    this.x += this.velX;
    if (this.x < 0) this.x = 0;
    if (this.x > gridWidth - this.width) this.x = gridWidth - this.width;

    // Gravity
    this.velY += gravity;
    this.y += this.velY;

    // Platform Detection
    this.onGround = false; this.currentPlatform = null;
    for (let p of platforms) {
      if (
        this.velY > 0 &&
        this.y + this.height <= p.y + p.height &&
        this.y + this.height + this.velY >= p.y &&
        this.x + this.width > p.x + 20 &&
        this.x < p.x + p.width - 20
      ) {
        if (p.type === 'cloud') {
          if (typeof p.setCloudFrame === 'function') p.setCloudFrame(1);
          this.y = p.y - this.height;
          this.velY = jumpVelocity * 1.1;
          this.coyoteTimer = 0;
          this.onGround = false;
          this.frame = 2;
          this.currentPlatform = p;
          this.render();
          setTimeout(() => { if (typeof p.setCloudFrame === 'function') p.setCloudFrame(0); }, 250);
          return;
        }
        if (p.type === 'ice' && typeof p.onStepped === 'function') p.onStepped();
        this.y = p.y - this.height;
        this.velY = 0;
        this.onGround = true;
        this.coyoteTimer = this.coyoteTime;
        this.currentPlatform = p;

        // Level
        if (this.lastSteppedPlatform !== p) {
          if (!this.lastSteppedPlatform) {
            level = 1;
          } else if (p.y < this.lastSteppedPlatform.y) {
            level++;
          }
          this.lastSteppedPlatform = p;
          updateUI();
          maybeAddStar(level);
        }
        break;
      }
    }

    if (this.onGround && this.frame === 2) {
      this.frame = Math.abs(this.velX) > 0.5 ? 1 : 0;
    }

    // Star
    for (let i = 0; i < stars.length; ++i) {
      let s = stars[i];
      if (
        this.y + this.height > s.y &&
        this.y < s.y + s.size &&
        this.x + this.width > s.x &&
        this.x < s.x + s.size
      ) {
        star++;
        score += STAR_SCORE;
        updateUI();
        s.toRemove = true;
      }
    }

    if (!this.onGround) this.coyoteTimer -= delta;
    else this.coyoteTimer = this.coyoteTime;

    // Follow Platforms
    if (this.onGround && this.currentPlatform && this.currentPlatform.type === 'runningstage') {
      this.x += this.currentPlatform.velX;
      if (this.x < 0) this.x = 0;
      if (this.x > gridWidth - this.width) this.x = gridWidth - this.width;
    }

    // Score
    score = level + star * STAR_SCORE;
    updateUI();
    this.render();
  }

  jump() {
    if (this.onGround || this.coyoteTimer > 0) {
      this.velY = jumpVelocity;
      this.onGround = false;
      this.coyoteTimer = 0;
    }
  }
}

// Platform
class Platform {
  constructor(x, y, type = 'rock') {
    this.x = x; this.y = y;
    this.width = PLATFORM_WIDTH;
    this.height = PLATFORM_HEIGHT;
    this.type = type;
    this.velX = type === 'runningstage'
      ? (Math.random() < 0.5 ? MOVING_PLATFORM_SPEED : -MOVING_PLATFORM_SPEED)
      : 0;
    this.el = document.createElement('div');
    this.el.className = 'platform';
    if (type === 'ice') {
      this.frame = 0;
      this._melting = false;
      this.el.style.backgroundImage = 'url(images/ice.png)';
      this.el.style.backgroundSize = `${PLATFORM_WIDTH * 3}px 100%`;
      this.el.style.backgroundPosition = '0% 0';
    } else if (type === 'cloud') {
      this.frame = 0;
      this.el.style.backgroundImage = 'url(images/cloud.png)';
      this.el.style.backgroundSize = `${PLATFORM_WIDTH * 2}px 100%`; // 两帧
      this.el.style.backgroundPosition = '0% 0';
    } else if (type === 'runningstage') {
      this.el.style.backgroundImage = 'url(images/runningstage.png)';
    } else {
      this.el.style.backgroundImage = 'url(images/rock.png)';
    }
    Object.assign(this.el.style, {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      width: `${this.width}px`,
      height: `${this.height}px`,
      backgroundRepeat: 'no-repeat',
      zIndex: 5
    });
    gameGrid.appendChild(this.el);

    this.stepped = false;
    this.disappearTimeout = null;
    this.toRemove = false;
  }
  update() {
    // 只引用scrollSpeed
    this.y += scrollSpeed;
    if (this.type === 'runningstage') {
      this.x += this.velX;
      if (this.x < 0 || this.x + this.width > gridWidth) {
        this.velX *= -1;
        this.el.style.transform = this.velX < 0 ? "scaleX(-1)" : "scaleX(1)";
      }
    }
    this.el.style.left = this.x + 'px';
    this.el.style.top = this.y + 'px';
  }
  onStepped() {
    if (this.type === 'ice' && !this.stepped) {
      this.stepped = true;
      let meltTime = Math.max(2 - Math.floor(level / 30) * 0.5, 1.5);
      let idx = 0;
      const positions = ['0 0', '100% 0', '200% 0'];
      this.el.style.opacity = 0.8;
      this.el.style.backgroundPosition = positions[idx]; // 确保刚开始是第0帧
      this.disappearTimeout = setInterval(() => {
        idx++;
        if (idx < positions.length) {
          this.el.style.backgroundPosition = positions[idx];
        } else {
          clearInterval(this.disappearTimeout);
          this.toRemove = true;
        }
      }, meltTime * 333);
    }
  }
  setCloudFrame(idx) {
  // idx=0:常态；idx=1:被踩压
    if (this.type === 'cloud') {
      this.frame = idx;
      this.el.style.backgroundPosition = `${-PLATFORM_WIDTH * idx}px 0`;
    }
  }
  remove() {
    if (this.disappearTimeout) clearInterval(this.disappearTimeout);
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
  }
}

// Star
class Star {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 40;
    this.el = document.createElement('div');
    this.el.className = 'star';
    Object.assign(this.el.style, {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      width: `${this.size}px`,
      height: `${this.size}px`,
      backgroundImage: 'url(images/star.png)',
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      zIndex: 7
    });
    gameGrid.appendChild(this.el);
    this.toRemove = false;
  }
  update() {
    this.y += scrollSpeed;
    this.el.style.top = this.y + 'px';
  }
  remove() {
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
  }
}

function maybeAddStar(level) {
  if (level > 0 && level % 30 === 0) {
    const candidate = platforms.filter(
      p => p.type !== 'cloud' && p.type !== 'ice'
    );
    if (candidate.length > 0) {
      const plat = candidate[candidate.length - 1];
      const starObj = new Star(plat.x + plat.width / 2 - 20, plat.y - 45);
      stars.push(starObj);
    }
  }
}

// Create Platform
const SAFE_LEVEL = 150;
const MAX_PLATFORM_X_DIFF = 75; // 可以适当调整
let specialPlatformGap = 0; // 距上一个特殊平台已生成普通平台数量
let specialsInLastBatch = 0; // 当前批次已插入特殊平台数

function generatePlatformsToTop(targetY) {
  let topY = Math.min(...platforms.map(p => p.y));
  let lastType = platforms.length ? platforms[platforms.length - 1].type : null;
  let lastX = platforms.length ? platforms[platforms.length - 1].x : null;
  let platformsGenerated = 0;
  let specialsInCurrentBatch = 0;

  while (topY > targetY) {
    const gap = getPlatformGap();
    let px;

    // 只控制云朵后的平台横向安全距离
    if (
      level >= SAFE_LEVEL &&
      lastType === 'cloud' &&
      lastX !== null
    ) {
      const minX = Math.max(0, lastX - MAX_PLATFORM_X_DIFF);
      const maxX = Math.min(gridWidth - PLATFORM_WIDTH, lastX + MAX_PLATFORM_X_DIFF);
      px = minX + Math.random() * (maxX - minX);
    } else {
      px = Math.random() * (gridWidth - PLATFORM_WIDTH);
    }

    // ---- 特殊平台插入机制（不变） ----
    let forceSpecial = false;
    let specialNeedNum = 0, batchLen = 0;
    if (level <= 120) {
      specialNeedNum = 1; batchLen = 10;
    } else if (level <= 200) {
      specialNeedNum = 1; batchLen = 5;
    } else if (level <= 300) {
      specialNeedNum = 2; batchLen = 5;
    } else {
      specialNeedNum = 0; batchLen = 999;
    }
    if ((platformsGenerated + 1) % batchLen === 0) {
      if (specialsInCurrentBatch < specialNeedNum) forceSpecial = true;
      specialsInCurrentBatch = 0;
    }

    let type;
    if (forceSpecial) {
      let specials = ['cloud', 'ice', 'runningstage'];
      if (level < 30) specials = ['ice'];
      else if (level < 100) specials = ['ice', 'runningstage'];
      do {
        type = specials[Math.floor(Math.random() * specials.length)];
      } while (type === lastType);
      specialsInCurrentBatch++;
    } else {
      type = getRandomPlatformType(level, lastType);
      if (type !== 'rock') specialsInCurrentBatch++;
    }

    platforms.push(new Platform(px, topY - gap, type));
    lastType = type;
    lastX = px;
    topY -= gap;
    platformsGenerated++;
  }
}

let lastTime = performance.now();

function gameLoop(now) {
  const delta = now - lastTime;
  lastTime = now;
  if (!gameStarted || gamePaused || gameOver) return;

  // --- scrollSpeed 只此一处赋值 ---
  scrollSpeed = scrollSpeedBase + Math.floor(level / 30) * 0.1;

  cat.update(delta);
  platforms.forEach(p => p.update());
  stars.forEach(starObj => starObj.update());

  platforms = platforms.filter(p => {
    if (p.y > gridHeight + 100 || p.toRemove) {
      p.remove();
      return false;
    }
    return true;
  });
  stars = stars.filter(starObj => {
    if (starObj.y > gridHeight + 100 || starObj.toRemove) {
      starObj.remove();
      return false;
    }
    return true;
  });

  generatePlatformsToTop(-80);

  if (cat.y > gridHeight) {
    gameOver = true;
    gameOverModal.style.display = 'flex';
    document.getElementById('final-score').textContent = score;

    // -------【高分存储和刷新】-------
    let best = Number(localStorage.getItem('bestScore') || 0);
    if (score > best) {
      localStorage.setItem('bestScore', score);
      best = score; // 更新本地变量
    }
    // 主动更新高分显示
    document.getElementById('high-score').textContent = best;

    return;
  }
  animationId = requestAnimationFrame(gameLoop);
}


// UI
function realStartGame() {
  cameraY = 0;
  score = 0;
  level = 0;
  star = 0;
  maxHeight = gridHeight - CAT_HEIGHT - 30;
  gameGrid.style.transform = `translateY(0px)`;
  platforms = [];
  stars = [];
  lastPlatformType = 'rock';
  lastSpecialPlatformLevel = -10;
  const groundY = gridHeight - PLATFORM_HEIGHT;
  platforms.push(new Platform(0, groundY, 'rock'));
  const firstPlatY = groundY - 120;
  const firstPlatX = Math.random() * (gridWidth - PLATFORM_WIDTH);
  const firstPlat = new Platform(firstPlatX, firstPlatY, 'rock');
  platforms.push(firstPlat);
  let y = firstPlatY - 80;
  for (let i = 0; i < 6; i++) {
    const px = Math.random() * (gridWidth - PLATFORM_WIDTH);
    let type = 'rock';
    platforms.push(new Platform(px, y, type));
    y -= Math.random() * 60 + 80;
  }
  cat = new Cat(firstPlat.x + firstPlat.width / 2 - CAT_WIDTH / 2, firstPlat.y - CAT_HEIGHT);
  cat.lastSteppedPlatform = null;
  cat.velY = 0;
  cat.onGround = true;
  gameStarted = true;
  gameOver = false;
  gamePaused = false;
  updateUI();
  lastTime = performance.now();
  animationId = requestAnimationFrame(gameLoop);
}

function setupGame() {
  gameOver = false;
  gamePaused = false;
  gameStarted = false;
  cancelAnimationFrame(animationId);
  document.querySelectorAll('#game-grid .platform, #game-grid #cat, #game-grid .star').forEach(el => el.remove());
  platforms = [];
  stars = [];
  score = 0;
  level = 0;
  star = 0;
  updateUI();
  countdownEl.style.display = 'none';
  gameOverModal.style.display = 'none';
  gameGrid.style.transform = `translateY(0px)`;
  startCountdown();
}

function startCountdown() {
  let count = 3;
  countdownEl.innerText = count;
  countdownEl.style.display = 'block';
  mask.style.background = 'rgba(0, 0, 0, 0.0)';
  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownEl.innerText = count;
      mask.style.background = `rgba(0, 0, 0, ${0.7 - count * 0.2})`;
    } else if (count === 0) {
      countdownEl.innerText = 'GO!';
      mask.style.background = 'rgba(0, 0, 0, 0.6)';
    } else {
      clearInterval(interval);
      countdownEl.style.display = 'none';
      mask.style.background = 'transparent';
      realStartGame();
    }
  }, 1000);
}

// Control
window.addEventListener('keydown', e => {
  if (!cat || !gameStarted || gamePaused || gameOver) return;
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) leftPressed = true;
  if (['ArrowRight', 'd', 'D'].includes(e.key)) rightPressed = true;
  if (e.code === 'Space') cat.jump();
});
window.addEventListener('keyup', e => {
  if (!cat) return;
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) leftPressed = false;
  if (['ArrowRight', 'd', 'D'].includes(e.key)) rightPressed = false;
});
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('pause-btn')?.addEventListener('click', () => {
    gamePaused = true;
    cancelAnimationFrame(animationId);
    pauseOverlay.style.display = 'flex';
  });
  document.getElementById('resume-btn')?.addEventListener('click', () => {
    pauseOverlay.style.display = 'none';
    gamePaused = false;
    if (gameStarted && !gameOver) animationId = requestAnimationFrame(gameLoop);
  });
  document.getElementById('reset-btn')?.addEventListener('click', () => {
    pauseOverlay.style.display = 'none';
    resetModal.style.display = 'flex';
  });
  document.getElementById('confirm-reset-btn')?.addEventListener('click', () => {
    resetModal.style.display = 'none';
    setupGame();
  });
  document.getElementById('cancel-reset-btn')?.addEventListener('click', () => {
    resetModal.style.display = 'none';
    if (gameStarted) pauseOverlay.style.display = 'flex';
  });
  document.getElementById('restart-btn')?.addEventListener('click', () => {
    gameOverModal.style.display = 'none';
    setupGame();
  });
  setupGame();
});
