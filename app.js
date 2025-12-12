const CONFIG = {
  gridSize: 5,
  defaultMines: 3,
  defaultBet: 1.00,
  startingBalance: 200.00,
  maxHistoryPoints: 60,
  houseEdge: 0.01,
  RTP: 0.99,
  minBet: 0.10,
  maxBet: 10000.00
};

const sounds = {
  click: "sounds/click.mp3",
  reveal: "sounds/reveal.mp3",
  mine: "sounds/mine.mp3",
  win: "sounds/win.mp3"
};

const soundCache = {};

function playSound(name) {
  const src = sounds[name];
  if (!src) return;
  let audio = soundCache[name];
  if (!audio) {
    audio = new Audio(src);
    soundCache[name] = audio;
  }
  try {
    audio.currentTime = 0;
    audio.play();
  } catch {}
}

// DOM Elements
const gridEl = document.getElementById("grid");
const balanceAmountEl = document.getElementById("balance-amount");
const betInput = document.getElementById("bet-input");
const betPreview = document.getElementById("bet-preview");
const betBtn = document.getElementById("bet-btn");
const randomBtn = document.getElementById("random-btn");
const minesSelect = document.getElementById("mines-select");
const gemsDisplay = document.getElementById("gems-display");
const profitLabel = document.getElementById("profit-label");
const profitAmount = document.getElementById("profit-amount");
const autoInfo = document.getElementById("auto-info");
const tabButtons = document.querySelectorAll(".tab-btn");
const betActionButtons = document.querySelectorAll("[data-bet-action]");
const addBtn = document.getElementById("add-money-btn");
const addPopup = document.getElementById("add-money-popup");
const addQuickButtons = document.querySelectorAll(".add-popup-btn[data-add]");
const addCustomInput = document.getElementById("add-custom-input");
const addCustomBtn = document.getElementById("add-custom-btn");
const statsPanel = document.getElementById("stats-panel");
const statsClose = document.getElementById("stats-close");
const statsOpen = document.getElementById("stats-open");
const statsRefresh = document.getElementById("stats-refresh");
const statsProfit = document.getElementById("stats-profit");
const statsWagered = document.getElementById("stats-wagered");
const statsWins = document.getElementById("stats-wins");
const statsLosses = document.getElementById("stats-losses");
const statsChartCanvas = document.getElementById("stats-chart");
const statsChartCtx = statsChartCanvas.getContext("2d");

// Create notification system
const notificationContainer = document.createElement("div");
notificationContainer.className = "notification-container";
document.body.appendChild(notificationContainer);

// Create enhanced stats display
const statsAdvancedContainer = document.createElement("div");
statsAdvancedContainer.className = "stats-advanced";
document.querySelector('.stats-body').appendChild(statsAdvancedContainer);

// Create menu button and panel
const menuBtn = document.createElement("button");
menuBtn.className = "menu-btn";
menuBtn.innerHTML = "🎮 Menu";
document.querySelector(".top-nav-left").appendChild(menuBtn);

const menuPanel = document.createElement("div");
menuPanel.className = "menu-panel hidden";
menuPanel.innerHTML = `
  <div class="menu-header">
    <h3>Demo Games</h3>
    <button class="menu-close">&times;</button>
  </div>

  <div class="menu-games">
    <div class="game-card active" data-game="mines">
      <div class="game-icon">💣</div>
      <div class="game-info">
        <h4>Mines</h4>
        <p>Find gems, avoid mines</p>
      </div>
      <div class="game-badge active">Playing</div>
    </div>

    <div class="game-card" data-game="plinko">
      <div class="game-icon">🎯</div>
      <div class="game-info">
        <h4>Plinko</h4>
        <p>Drop balls for multipliers</p>
      </div>
      <div class="game-badge" style="background:#00C74D;color:#000;">Play Now!</div>
    </div>

    <div class="game-card" data-game="crash">
      <div class="game-icon">🚀</div>
      <div class="game-info">
        <h4>Crash</h4>
        <p>Cash out before it crashes</p>
      </div>
      <div class="game-badge" style="background:#00C74D;color:#000;">Play Now!</div>
    </div>

    <div class="game-card" data-game="limbo">
      <div class="game-icon">🎯</div>
      <div class="game-info">
        <h4>Limbo</h4>
        <p>Instant multiplier game</p>
      </div>
      <div class="game-badge" style="background:#00C74D;color:#000;">Play Now!</div>
    </div>

    <div class="game-card" data-game="dice">
      <div class="game-icon">🎲</div>
      <div class="game-info">
        <h4>Dice</h4>
        <p>Predict dice rolls</p>
      </div>
      <div class="game-badge">Coming Soon</div>
    </div>

    <div class="game-card" data-game="roulette">
      <div class="game-icon">🎡</div>
      <div class="game-info">
        <h4>Roulette</h4>
        <p>Classic wheel betting</p>
      </div>
      <div class="game-badge">Coming Soon</div>
    </div>

    <div class="game-card" data-game="blackjack">
      <div class="game-icon">♠️</div>
      <div class="game-info">
        <h4>Blackjack</h4>
        <p>Beat the dealer</p>
      </div>
      <div class="game-badge">Coming Soon</div>
    </div>
  </div>

  <div class="menu-footer">
    <button class="btn dark small" id="toggle-sounds">🔇 Sounds Off</button>
    <button class="btn dark small" id="reset-stats">Reset Stats</button>
  </div>
`;
document.body.appendChild(menuPanel);

// Create quick bet buttons
const quickBetContainer = document.createElement("div");
quickBetContainer.className = "quick-bets";
quickBetContainer.innerHTML = `
  <div class="quick-bets-label">Quick Bets</div>
  <div class="quick-bets-buttons">
    <button class="quick-bet-btn" data-bet="0.10">$0.10</button>
    <button class="quick-bet-btn" data-bet="0.50">$0.50</button>
    <button class="quick-bet-btn" data-bet="1.00">$1.00</button>
    <button class="quick-bet-btn" data-bet="5.00">$5.00</button>
    <button class="quick-bet-btn" data-bet="10.00">$10.00</button>
  </div>
`;
document.querySelector('.panel-left .panel-body').insertBefore(quickBetContainer, document.querySelector('.form-group:nth-child(3)'));

// Create hotkeys info
const hotkeysInfo = document.createElement("div");
hotkeysInfo.className = "hotkeys-info";
hotkeysInfo.innerHTML = `
  <div class="hotkeys-title">Hotkeys</div>
  <div class="hotkeys-grid">
    <div class="hotkey-item">
      <kbd>Space</kbd>
      <span>Start/Cashout</span>
    </div>
    <div class="hotkey-item">
      <kbd>R</kbd>
      <span>Random Pick</span>
    </div>
    <div class="hotkey-item">
      <kbd>½</kbd>/<kbd>2×</kbd>
      <span>Bet Actions</span>
    </div>
    <div class="hotkey-item">
      <kbd>M</kbd>
      <span>Toggle Menu</span>
    </div>
  </div>
`;
document.querySelector('.panel-footer').insertBefore(hotkeysInfo, document.querySelector('.footer-text'));

// Game state
const state = {
  balance: CONFIG.startingBalance,
  inRound: false,
  tiles: [],
  minesIndices: new Set(),
  revealedSafe: 0,
  betAmount: CONFIG.defaultBet,
  lockedBetAmount: CONFIG.defaultBet,
  minesCount: CONFIG.defaultMines,
  cashoutMultiplier: 1.00,
  roundHistory: [],
  currentRoundId: 0,
  canCashout: false,
  soundsEnabled: true,
  hotkeysEnabled: true,
  stats: {
    profit: 0,
    wagered: 0,
    wins: 0,
    losses: 0,
    history: [],
    highestMultiplier: 0,
    totalRounds: 0,
    bestProfitStreak: 0,
    currentStreak: 0,
    biggestWin: 0,
    biggestLoss: 0,
    totalPlayTime: 0,
    sessionStartTime: Date.now(),
    fastestCashout: null,
    highestRiskWin: 0
  }
};

// ==================== NOTIFICATION SYSTEM ====================

function showNotification(message, type = 'info', duration = 4000) {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-icon">${getNotificationIcon(type)}</div>
    <div class="notification-content">${message}</div>
    <button class="notification-close">&times;</button>
  `;
  
  notificationContainer.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 10);
  
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  });
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }
  }, duration);
}

function getNotificationIcon(type) {
  switch(type) {
    case 'success': return '✓';
    case 'warning': return '⚠';
    case 'error': return '✕';
    default: return 'ℹ';
  }
}

// ==================== CORE MATH FUNCTIONS ====================

function calculateMultiplier() {
  const totalTiles = CONFIG.gridSize * CONFIG.gridSize;
  const totalSafeTiles = totalTiles - state.minesCount;
  
  if (state.revealedSafe >= totalSafeTiles) {
    return 1.00;
  }
  
  const remainingSafeTiles = totalSafeTiles - state.revealedSafe;
  const totalRemainingTiles = totalTiles - state.revealedSafe;
  
  if (totalRemainingTiles === 0 || remainingSafeTiles <= 0) {
    return 1.00;
  }
  
  const probabilitySafe = remainingSafeTiles / totalRemainingTiles;
  
  // Special case for 1 mine (higher multipliers)
  if (state.minesCount === 1) {
    const baseMultiplier = 1 / probabilitySafe;
    return Math.max(1.00, baseMultiplier * CONFIG.RTP);
  }
  
  const fairMultiplier = 1 / probabilitySafe;
  return Math.max(1.00, fairMultiplier * CONFIG.RTP);
}

function calculateNextSafeProbability() {
  const totalTiles = CONFIG.gridSize * CONFIG.gridSize;
  const totalSafeTiles = totalTiles - state.minesCount;
  const remainingSafeTiles = totalSafeTiles - state.revealedSafe;
  const totalRemainingTiles = totalTiles - state.revealedSafe;
  
  if (totalRemainingTiles === 0) return 0;
  return remainingSafeTiles / totalRemainingTiles;
}

function calculateExpectedValue() {
  const multiplier = calculateMultiplier();
  const probability = calculateNextSafeProbability();
  return (multiplier * probability) - 1;
}

function calculateRiskLevel() {
  const probability = calculateNextSafeProbability() * 100;
  if (probability >= 80) return { level: 'Low', color: '#00C74D', emoji: '😊' };
  if (probability >= 60) return { level: 'Medium', color: '#F5A623', emoji: '😐' };
  if (probability >= 40) return { level: 'High', color: '#FF7A00', emoji: '😰' };
  if (probability >= 20) return { level: 'Very High', color: '#FF4141', emoji: '😨' };
  return { level: 'Extreme', color: '#FF0000', emoji: '😱' };
}

// ==================== UTILITY FUNCTIONS ====================

function formatMoney(v) {
  return v.toFixed(2);
}

function updateBalanceUI() {
  balanceAmountEl.textContent = formatMoney(state.balance);
  balanceAmountEl.style.transform = 'scale(1.1)';
  setTimeout(() => balanceAmountEl.style.transform = 'scale(1)', 200);
}

function updateBetPreview() {
  const bet = state.betAmount;
  betPreview.textContent = "$" + formatMoney(bet);
}

function updateGems() {
  const totalTiles = CONFIG.gridSize * CONFIG.gridSize;
  const gems = totalTiles - state.minesCount;
  gemsDisplay.value = gems;
}

function buildMinesOptions() {
  minesSelect.innerHTML = '';
  const maxMines = CONFIG.gridSize * CONFIG.gridSize - 1;
  
  // Start from 1 mine instead of 3
  const commonMines = [1, 3, 5, 10, 15, 20, 24];
  
  commonMines.forEach(count => {
    if (count <= maxMines) {
      const opt = document.createElement("option");
      opt.value = count;
      opt.textContent = `${count} mine${count !== 1 ? 's' : ''}`;
      if (count === CONFIG.defaultMines) opt.selected = true;
      minesSelect.appendChild(opt);
    }
  });
  
  if (maxMines > commonMines[commonMines.length - 1]) {
    const opt = document.createElement("option");
    opt.disabled = true;
    opt.textContent = "──────────";
    minesSelect.appendChild(opt);
    
    for (let i = commonMines[commonMines.length - 1] + 1; i <= maxMines; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = `${i} mines`;
      minesSelect.appendChild(opt);
    }
  }
}

function buildGrid() {
  gridEl.innerHTML = "";
  state.tiles = [];
  const totalTiles = CONFIG.gridSize * CONFIG.gridSize;
  
  for (let i = 0; i < totalTiles; i++) {
    const tile = document.createElement("div");
    tile.className = "grid-tile disabled";
    tile.dataset.index = i;
    tile.innerHTML = `
      <div class="tile-content">
        <div class="tile-number">${i + 1}</div>
        <div class="tile-mine-count hidden"></div>
      </div>
    `;
    tile.addEventListener("click", () => handleTileClick(i));
    gridEl.appendChild(tile);
    state.tiles.push(tile);
  }
}

function resetTilesForRound() {
  state.tiles.forEach((t, i) => {
    t.className = "grid-tile";
    t.innerHTML = `
      <div class="tile-content">
        <div class="tile-number">${i + 1}</div>
        <div class="tile-mine-count hidden"></div>
      </div>
    `;
    t.style.animation = '';
    t.style.opacity = '1';
    t.style.transform = '';
  });
}

// ==================== NEW FEATURES ====================

function showMineCounts() {
  if (state.minesCount > 1) return; // Only for 1 mine mode
  
  state.tiles.forEach((tile, idx) => {
    if (tile.classList.contains("revealed-safe")) {
      const mineCount = document.createElement("div");
      mineCount.className = "tile-mine-count";
      mineCount.textContent = "0⚡";
      tile.querySelector('.tile-content').appendChild(mineCount);
    }
  });
}

function calculateTileRisk(index) {
  // Calculate how risky a tile is based on proximity to mines
  if (state.minesIndices.has(index)) return 0;
  
  const gridSize = CONFIG.gridSize;
  const row = Math.floor(index / gridSize);
  const col = index % gridSize;
  let mineNeighbors = 0;
  
  // Check all 8 directions
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
        const neighborIdx = newRow * gridSize + newCol;
        if (state.minesIndices.has(neighborIdx)) {
          mineNeighbors++;
        }
      }
    }
  }
  
  return mineNeighbors;
}

function highlightSafeTiles() {
  if (!state.inRound || state.revealedSafe === 0) return;
  
  const riskLevel = calculateRiskLevel();
  if (riskLevel.level === 'Extreme') {
    // Highlight safest tiles when risk is extreme
    const safeTiles = [];
    state.tiles.forEach((tile, idx) => {
      if (!tile.classList.contains("revealed-safe") && 
          !tile.classList.contains("revealed-mine") &&
          !state.minesIndices.has(idx)) {
        safeTiles.push({
          index: idx,
          risk: calculateTileRisk(idx)
        });
      }
    });
    
    // Sort by lowest risk (fewest mine neighbors)
    safeTiles.sort((a, b) => a.risk - b.risk);
    
    // Highlight top 3 safest tiles
    safeTiles.slice(0, 3).forEach(tile => {
      const tileEl = state.tiles[tile.index];
      tileEl.style.boxShadow = '0 0 15px rgba(0, 199, 77, 0.5)';
      tileEl.style.border = '2px solid #00C74D';
    });
  }
}

function updateTileNumbers() {
  if (state.minesCount === 1) {
    state.tiles.forEach((tile, idx) => {
      const numberEl = tile.querySelector('.tile-number');
      if (numberEl) {
        numberEl.style.opacity = '0.5';
        numberEl.style.fontSize = '10px';
      }
    });
  }
}

// ==================== BET AMOUNT CONTROL ====================

function lockBetControls() {
  betInput.disabled = true;
  betInput.classList.add('disabled');
  
  betActionButtons.forEach(btn => {
    btn.disabled = true;
    btn.classList.add('disabled');
  });
  
  minesSelect.disabled = true;
  minesSelect.classList.add('disabled');
  
  // Disable quick bet buttons
  document.querySelectorAll('.quick-bet-btn').forEach(btn => {
    btn.disabled = true;
    btn.classList.add('disabled');
  });
}

function unlockBetControls() {
  betInput.disabled = false;
  betInput.classList.remove('disabled');
  
  betActionButtons.forEach(btn => {
    btn.disabled = false;
    btn.classList.remove('disabled');
  });
  
  minesSelect.disabled = false;
  minesSelect.classList.remove('disabled');
  
  // Enable quick bet buttons
  document.querySelectorAll('.quick-bet-btn').forEach(btn => {
    btn.disabled = false;
    btn.classList.remove('disabled');
  });
}

// ==================== GAME LOGIC ====================

function startRound() {
  const bet = parseFloat(state.betAmount);
  
  if (isNaN(bet) || bet < CONFIG.minBet) {
    showNotification(`Minimum bet is $${CONFIG.minBet}`, 'warning');
    return;
  }
  
  if (bet > state.balance) {
    showNotification('Insufficient balance', 'error');
    return;
  }
  
  if (state.soundsEnabled) playSound("click");
  state.inRound = true;
  state.revealedSafe = 0;
  state.minesIndices = new Set();
  state.currentRoundId = Date.now();
  state.canCashout = false;
  state.lockedBetAmount = bet;
  state.roundStartTime = Date.now();
  
  betBtn.textContent = "Cashout";
  betBtn.disabled = true;
  betBtn.classList.add('disabled');
  randomBtn.disabled = false;
  
  lockBetControls();
  
  resetTilesForRound();
  
  // Place mines randomly
  const totalTiles = CONFIG.gridSize * CONFIG.gridSize;
  const availableIndices = Array.from({ length: totalTiles }, (_, i) => i);
  
  // Shuffle and pick mine positions
  for (let i = availableIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
  }
  
  state.minesIndices = new Set(availableIndices.slice(0, state.minesCount));
  
  // Deduct bet and update stats
  state.balance -= bet;
  state.stats.wagered += bet;
  state.stats.totalRounds += 1;
  
  state.roundHistory = [{
    action: 'bet',
    amount: bet,
    time: Date.now()
  }];
  
  updateBalanceUI();
  updateProfitPreview();
  updateAdvancedStats();
  updateStatsUI();
  drawStatsChart();
  updateTileNumbers();
  
  showNotification(`Round started! Bet: $${formatMoney(bet)} | ${state.minesCount} mine${state.minesCount !== 1 ? 's' : ''}`, 'info');
}

function endRound(win, reason = '') {
  const roundTime = Date.now() - state.roundStartTime;
  
  // Update fastest cashout if applicable
  if (win && state.revealedSafe > 0) {
    if (!state.stats.fastestCashout || roundTime < state.stats.fastestCashout.time) {
      state.stats.fastestCashout = {
        time: roundTime,
        mines: state.minesCount,
        multiplier: calculateMultiplier()
      };
    }
  }
  
  // Update highest risk win
  if (win) {
    const riskLevel = calculateRiskLevel();
    if (riskLevel.level === 'Extreme' || riskLevel.level === 'Very High') {
      const profit = (state.lockedBetAmount * calculateMultiplier()) - state.lockedBetAmount;
      if (profit > state.stats.highestRiskWin) {
        state.stats.highestRiskWin = profit;
      }
    }
  }
  
  state.inRound = false;
  betBtn.textContent = "Bet";
  betBtn.disabled = false;
  betBtn.classList.remove('disabled');
  randomBtn.disabled = true;
  
  unlockBetControls();
  
  state.tiles.forEach(t => {
    t.classList.add("disabled");
    t.style.opacity = '0.7';
    t.style.boxShadow = '';
    t.style.border = '';
  });
  
  const roundResult = {
    id: state.currentRoundId,
    win: win,
    bet: state.lockedBetAmount,
    mines: state.minesCount,
    revealed: state.revealedSafe,
    multiplier: calculateMultiplier(),
    profit: win ? (state.lockedBetAmount * calculateMultiplier()) - state.lockedBetAmount : -state.lockedBetAmount,
    timestamp: Date.now(),
    duration: roundTime
  };
  
  if (win) {
    if (state.soundsEnabled) playSound("win");
    if (!reason) reason = 'Cashout';
    
    let emoji = '💰';
    if (calculateMultiplier() > 5) emoji = '🎉';
    if (calculateMultiplier() > 10) emoji = '🔥';
    if (calculateMultiplier() > 20) emoji = '🚀';
    
    showNotification(`${emoji} ${reason}! ${calculateMultiplier().toFixed(2)}x | Profit: +$${formatMoney(roundResult.profit)}`, 'success', 5000);
  }
}

function revealAllMines(clickedMineIndex = null) {
  state.tiles.forEach((tile, idx) => {
    if (state.minesIndices.has(idx)) {
      tile.classList.add("revealed-mine");
      tile.style.animation = idx === clickedMineIndex ? 'mineExplode 0.6s ease-out' : 'mineReveal 0.5s ease-out';
      
      if (!tile.querySelector(".grid-tile-badge")) {
        const badge = document.createElement("div");
        badge.className = "grid-tile-badge";
        badge.textContent = "💣";
        tile.appendChild(badge);
      }
    }
  });
}

function handleTileClick(index) {
  if (!state.inRound) return;
  
  const tile = state.tiles[index];
  if (tile.classList.contains("revealed-safe") || tile.classList.contains("revealed-mine")) {
    return;
  }
  
  // Enable cashout after first successful tile click
  if (!state.canCashout) {
    state.canCashout = true;
    betBtn.disabled = false;
    betBtn.classList.remove('disabled');
  }
  
  if (state.minesIndices.has(index)) {
    // Hit a mine
    if (state.soundsEnabled) playSound("mine");
    tile.classList.add("revealed-mine");
    tile.style.animation = 'mineExplode 0.6s ease-out';
    
    const badge = document.createElement("div");
    badge.className = "grid-tile-badge";
    badge.textContent = "💣";
    tile.appendChild(badge);
    
    setTimeout(() => revealAllMines(index), 100);
    
    // Update stats
    state.stats.losses += 1;
    const lossAmount = state.lockedBetAmount;
    state.stats.profit -= lossAmount;
    state.stats.currentStreak = 0;
    
    if (lossAmount > state.stats.biggestLoss) {
      state.stats.biggestLoss = lossAmount;
    }
    
    const currentMultiplier = calculateMultiplier();
    if (currentMultiplier > state.stats.highestMultiplier) {
      state.stats.highestMultiplier = currentMultiplier;
    }
    
    pushProfitHistory();
    updateAdvancedStats();
    updateStatsUI();
    drawStatsChart();
    
    state.roundHistory.push({
      action: 'mine_hit',
      index: index,
      multiplier: currentMultiplier,
      time: Date.now()
    });
    
    endRound(false, 'Mine hit!');
    
    showNotification(`💥 Mine hit at ${currentMultiplier.toFixed(2)}x! Loss: -$${formatMoney(lossAmount)}`, 'error', 5000);
    
  } else {
    // Safe tile
    if (state.soundsEnabled) playSound("reveal");
    tile.classList.add("revealed-safe");
    tile.style.animation = 'safeReveal 0.4s ease-out';
    
    const badge = document.createElement("div");
    badge.className = "grid-tile-badge";
    badge.textContent = "💎";
    tile.appendChild(badge);
    
    state.revealedSafe += 1;
    
    // Show mine count for 1 mine mode
    if (state.minesCount === 1) {
      const mineCount = calculateTileRisk(index);
      if (mineCount > 0) {
        const countBadge = document.createElement("div");
        countBadge.className = "tile-mine-count";
        countBadge.textContent = `${mineCount}⚡`;
        tile.querySelector('.tile-content').appendChild(countBadge);
      }
    }
    
    const currentMultiplier = calculateMultiplier();
    const probability = calculateNextSafeProbability() * 100;
    const riskLevel = calculateRiskLevel();
    
    profitLabel.innerHTML = `Profit (${currentMultiplier.toFixed(2)}x | <span style="color:${riskLevel.color}">${riskLevel.emoji} ${probability.toFixed(1)}%</span>)`;
    
    profitAmount.textContent = "$" + formatMoney(state.lockedBetAmount * currentMultiplier);
    
    profitAmount.style.transform = 'scale(1.15)';
    setTimeout(() => profitAmount.style.transform = 'scale(1)', 300);
    
    state.roundHistory.push({
      action: 'safe_reveal',
      index: index,
      multiplier: currentMultiplier,
      safeCount: state.revealedSafe,
      time: Date.now()
    });
    
    // Highlight safe tiles if risk is high
    highlightSafeTiles();
    
    // Check if all safe tiles have been revealed
    const totalSafeTiles = (CONFIG.gridSize * CONFIG.gridSize) - state.minesCount;
    if (state.revealedSafe >= totalSafeTiles) {
      setTimeout(() => {
        if (state.inRound) {
          cashout(true, '🎊 All gems found!');
        }
      }, 500);
    }
  }
}

function randomPick() {
  if (!state.inRound) return;
  
  if (state.soundsEnabled) playSound("click");
  const totalTiles = CONFIG.gridSize * CONFIG.gridSize;
  const unrevealedIndices = [];
  
  for (let i = 0; i < totalTiles; i++) {
    const tile = state.tiles[i];
    if (tile.classList.contains("revealed-safe") || tile.classList.contains("revealed-mine")) {
      continue;
    }
    unrevealedIndices.push(i);
  }
  
  if (unrevealedIndices.length === 0) {
    showNotification('No tiles left to pick!', 'warning');
    return;
  }
  
  const picks = Math.min(3, unrevealedIndices.length);
  const shuffled = [...unrevealedIndices].sort(() => Math.random() - 0.5);
  
  showNotification(`🎲 Randomly picking ${picks} tiles (risky!)`, 'warning', 2000);
  
  shuffled.slice(0, picks).forEach((idx, i) => {
    setTimeout(() => {
      handleTileClick(idx);
    }, i * 400);
  });
}

function updateProfitPreview() {
  if (!state.inRound) {
    const probability = ((CONFIG.gridSize * CONFIG.gridSize - state.minesCount) / (CONFIG.gridSize * CONFIG.gridSize)) * 100;
    const riskLevel = calculateRiskLevel();
    profitLabel.innerHTML = `Profit (1.00x | <span style="color:${riskLevel.color}">${riskLevel.emoji} ${probability.toFixed(1)}% initial</span>)`;
    profitAmount.textContent = "$" + formatMoney(state.betAmount);
    return;
  }
  
  const multiplier = calculateMultiplier();
  const payout = state.lockedBetAmount * multiplier;
  const probability = calculateNextSafeProbability() * 100;
  const riskLevel = calculateRiskLevel();
  
  profitLabel.innerHTML = `Profit (${multiplier.toFixed(2)}x | <span style="color:${riskLevel.color}">${riskLevel.emoji} ${probability.toFixed(1)}%</span>)`;
  profitAmount.textContent = "$" + formatMoney(payout);
}

function cashout(auto = false, reason = '') {
  if (!state.inRound || !state.canCashout) {
    if (!state.canCashout && state.inRound) {
      showNotification('Reveal at least one gem before cashing out!', 'warning');
    }
    return;
  }
  
  const multiplier = calculateMultiplier();
  const payout = state.lockedBetAmount * multiplier;
  const profit = payout - state.lockedBetAmount;
  
  // Add payout to balance
  state.balance += payout;
  
  // Update stats
  state.stats.wins += 1;
  state.stats.profit += profit;
  state.stats.currentStreak += 1;
  
  if (state.stats.currentStreak > state.stats.bestProfitStreak) {
    state.stats.bestProfitStreak = state.stats.currentStreak;
  }
  
  if (profit > state.stats.biggestWin) {
    state.stats.biggestWin = profit;
  }
  
  if (multiplier > state.stats.highestMultiplier) {
    state.stats.highestMultiplier = multiplier;
  }
  
  state.roundHistory.push({
    action: 'cashout',
    multiplier: multiplier,
    payout: payout,
    profit: profit,
    time: Date.now()
  });
  
  pushProfitHistory();
  updateBalanceUI();
  updateAdvancedStats();
  updateStatsUI();
  drawStatsChart();
  
  endRound(true, reason || 'Cashout');
  
  const cashoutMessage = auto ? 
    `${reason} at ${multiplier.toFixed(2)}x` : 
    `💸 Cashed out at ${multiplier.toFixed(2)}x`;
  
  showNotification(
    `${cashoutMessage}<br>Payout: $${formatMoney(payout)} | Profit: +$${formatMoney(profit)}`,
    'success',
    6000
  );
}

// ==================== ENHANCED STATISTICS ====================

function updateAdvancedStats() {
  const totalGames = state.stats.wins + state.stats.losses;
  const winRate = totalGames > 0 ? (state.stats.wins / totalGames * 100).toFixed(1) : '0.0';
  
  const sessionTime = Date.now() - state.stats.sessionStartTime;
  const hours = Math.floor(sessionTime / (1000 * 60 * 60));
  const minutes = Math.floor((sessionTime % (1000 * 60 * 60)) / (1000 * 60));
  
  const avgBet = totalGames > 0 ? state.stats.wagered / totalGames : 0;
  const expectedValue = calculateExpectedValue();
  
  const fastestCashoutText = state.stats.fastestCashout ? 
    `${(state.stats.fastestCashout.time / 1000).toFixed(2)}s` : 'N/A';
  
  const highestRiskWinText = state.stats.highestRiskWin > 0 ? 
    `+$${formatMoney(state.stats.highestRiskWin)}` : 'N/A';
  
  statsAdvancedContainer.innerHTML = `
    <div class="stats-advanced-grid">
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Win Rate</div>
        <div class="stats-advanced-value">${winRate}%</div>
        <div class="stats-advanced-sub">${state.stats.wins}W : ${state.stats.losses}L</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Highest Multiplier</div>
        <div class="stats-advanced-value">${state.stats.highestMultiplier.toFixed(2)}x</div>
        <div class="stats-advanced-sub">Best Streak: ${state.stats.bestProfitStreak}</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Biggest Win</div>
        <div class="stats-advanced-value positive">+$${formatMoney(state.stats.biggestWin)}</div>
        <div class="stats-advanced-sub">Risk Win: ${highestRiskWinText}</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Avg Bet</div>
        <div class="stats-advanced-value">$${formatMoney(avgBet)}</div>
        <div class="stats-advanced-sub">Fastest: ${fastestCashoutText}</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Current Streak</div>
        <div class="stats-advanced-value ${state.stats.currentStreak > 0 ? 'positive' : 'negative'}">${state.stats.currentStreak}</div>
        <div class="stats-advanced-sub">EV: ${expectedValue > 0 ? '+' : ''}${(expectedValue * 100).toFixed(1)}%</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Total Rounds</div>
        <div class="stats-advanced-value">${state.stats.totalRounds}</div>
        <div class="stats-advanced-sub">Session: ${hours}h ${minutes}m</div>
      </div>
    </div>
  `;
}

function pushProfitHistory() {
  state.stats.history.push(state.stats.profit);
  if (state.stats.history.length > CONFIG.maxHistoryPoints) {
    state.stats.history.shift();
  }
}

function updateStatsUI() {
  statsProfit.textContent = "$" + formatMoney(state.stats.profit);
  statsProfit.classList.toggle("positive", state.stats.profit >= 0);
  statsProfit.classList.toggle("negative", state.stats.profit < 0);
  
  statsWagered.textContent = "$" + formatMoney(state.stats.wagered);
  statsWins.textContent = state.stats.wins.toString();
  statsLosses.textContent = state.stats.losses.toString();
}

function drawStatsChart() {
  const ctx = statsChartCtx;
  const w = statsChartCanvas.width;
  const h = statsChartCanvas.height;
  
  ctx.clearRect(0, 0, w, h);
  
  ctx.fillStyle = "#0F212E";
  ctx.fillRect(0, 0, w, h);
  
  const values = state.stats.history;
  if (!values.length) {
    ctx.fillStyle = "#A7B3C3";
    ctx.font = "11px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("No rounds yet", w / 2, h / 2);
    return;
  }
  
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(0, ...values);
  const range = maxVal - minVal || 1;
  const pad = 10;
  const usableW = w - pad * 2;
  const usableH = h - pad * 2;
  
  const zeroY = pad + (1 - (0 - minVal) / range) * usableH;
  ctx.beginPath();
  ctx.moveTo(pad, zeroY);
  ctx.lineTo(pad + usableW, zeroY);
  ctx.strokeStyle = "rgba(167, 179, 195, 0.4)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
  
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = pad + (i / Math.max(values.length - 1, 1)) * usableW;
    const y = pad + (1 - (v - minVal) / range) * usableH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  
  const lastVal = values[values.length - 1];
  const up = lastVal >= 0;
  ctx.strokeStyle = up ? "#00C74D" : "#FF4141";
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = pad + (i / Math.max(values.length - 1, 1)) * usableW;
    const y = pad + (1 - (v - minVal) / range) * usableH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(pad + usableW, h - pad);
  ctx.lineTo(pad, h - pad);
  ctx.closePath();
  
  const grad = ctx.createLinearGradient(0, pad, 0, h);
  if (up) {
    grad.addColorStop(0, "rgba(0, 199, 77, 0.45)");
    grad.addColorStop(1, "rgba(15, 33, 46, 0)");
  } else {
    grad.addColorStop(0, "rgba(255, 65, 65, 0.45)");
    grad.addColorStop(1, "rgba(15, 33, 46, 0)");
  }
  ctx.fillStyle = grad;
  ctx.fill();
  
  if (values.length > 0) {
    ctx.fillStyle = up ? "#00C74D" : "#FF4141";
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "right";
    ctx.fillText(`$${formatMoney(lastVal)}`, w - pad, Math.max(20, zeroY - 5));
  }
}

// ==================== MENU SYSTEM ====================

function toggleMenu() {
  menuPanel.classList.toggle("hidden");
  if (state.soundsEnabled) playSound("click");
}

function setupMenu() {
  menuBtn.addEventListener("click", toggleMenu);

  menuPanel.querySelector(".menu-close").addEventListener("click", () => {
    menuPanel.classList.add("hidden");
  });

  menuPanel.querySelectorAll(".game-card").forEach(card => {
    card.addEventListener("click", () => {
      const game = card.dataset.game;

      // Already on Mines
      if (game === "mines") return;

      if (game === "plinko") {
        window.open("https://plinko-web-game.netlify.app/", "_blank");
        return;
      }

      if (game === "crash") {
        window.location.href = "https://tenorii23.github.io/Stake_Crash_Demo/";
        return;
      }

      if (game === "limbo") {
        window.location.href = "https://tenorii23.github.io/Stake_Limbo_Demo/";
        return;
      }

      showNotification(
        `🎮 ${card.querySelector("h4").textContent} coming soon!`,
        "info",
        3000
      );
    });
  });

  document.getElementById("toggle-sounds").addEventListener("click", () => {
    state.soundsEnabled = !state.soundsEnabled;
    const btn = document.getElementById("toggle-sounds");
    btn.textContent = state.soundsEnabled ? "🔇 Sounds Off" : "🔊 Sounds On";
    showNotification(
      state.soundsEnabled ? "Sounds enabled" : "Sounds disabled",
      "info",
      1500
    );
  });

  document.getElementById("reset-stats").addEventListener("click", () => {
    if (confirm("Reset all statistics? This cannot be undone.")) {
      state.stats = {
        profit: 0,
        wagered: 0,
        wins: 0,
        losses: 0,
        history: [],
        highestMultiplier: 0,
        totalRounds: 0,
        bestProfitStreak: 0,
        currentStreak: 0,
        biggestWin: 0,
        biggestLoss: 0,
        totalPlayTime: 0,
        sessionStartTime: Date.now(),
        fastestCashout: null,
        highestRiskWin: 0
      };
      updateAdvancedStats();
      updateStatsUI();
      drawStatsChart();
      showNotification("Statistics reset", "info", 2000);
    }
  });

  document.addEventListener("click", e => {
    if (!menuPanel.contains(e.target) && !menuBtn.contains(e.target)) {
      menuPanel.classList.add("hidden");
    }
  });
}


// ==================== HOTKEYS ====================

function setupHotkeys() {
  document.addEventListener('keydown', (e) => {
    if (!state.hotkeysEnabled) return;
    
    switch(e.key.toLowerCase()) {
      case ' ':
        e.preventDefault();
        if (!state.inRound) {
          startRound();
        } else if (state.canCashout) {
          cashout(false);
        }
        break;
        
      case 'r':
        if (state.inRound && !randomBtn.disabled) {
          e.preventDefault();
          randomPick();
        }
        break;
        
      case 'm':
        e.preventDefault();
        toggleMenu();
        break;
        
      case '½':
      case '2':
        if (!state.inRound) {
          e.preventDefault();
          const action = e.key === '½' ? 'half' : 'double';
          const btn = document.querySelector(`[data-bet-action="${action}"]`);
          if (btn) btn.click();
        }
        break;
    }
  });
}

// ==================== EVENT HANDLERS ====================

function onBetInputChange() {
  if (state.inRound) {
    betInput.value = formatMoney(state.lockedBetAmount);
    showNotification('Cannot change bet during a round', 'warning');
    return;
  }
  
  const v = parseFloat(betInput.value);
  if (isNaN(v) || v < CONFIG.minBet) {
    state.betAmount = CONFIG.minBet;
    betInput.value = CONFIG.minBet.toFixed(2);
  } else if (v > state.balance) {
    state.betAmount = Math.min(state.balance, CONFIG.maxBet);
    betInput.value = formatMoney(state.betAmount);
    showNotification(`Bet cannot exceed balance of $${formatMoney(state.balance)}`, 'warning');
  } else {
    state.betAmount = v;
  }
  updateBetPreview();
  updateProfitPreview();
}

function attachEvents() {
  betInput.addEventListener("input", onBetInputChange);
  
  betBtn.addEventListener("click", () => {
    if (!state.inRound) {
      startRound();
    } else {
      cashout(false);
    }
  });
  
  randomBtn.addEventListener("click", randomPick);
  
  minesSelect.addEventListener("change", () => {
    if (state.inRound) {
      minesSelect.value = state.minesCount;
      showNotification('Cannot change mines during a round', 'warning');
      return;
    }
    
    if (state.soundsEnabled) playSound("click");
    state.minesCount = parseInt(minesSelect.value, 10) || CONFIG.defaultMines;
    updateGems();
    updateProfitPreview();
    
    showNotification(`💣 Mines set to ${state.minesCount}`, 'info', 2000);
  });
  
  betActionButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (state.inRound) {
        showNotification('Cannot change bet during a round', 'warning');
        return;
      }
      
      if (state.soundsEnabled) playSound("click");
      let bet = state.betAmount;
      
      if (btn.dataset.betAction === "half") bet /= 2;
      if (btn.dataset.betAction === "double") bet *= 2;
      
      bet = Math.max(CONFIG.minBet, parseFloat(bet.toFixed(2)));
      
      if (bet > state.balance) {
        bet = Math.min(state.balance, CONFIG.maxBet);
        showNotification(`Bet cannot exceed balance of $${formatMoney(state.balance)}`, 'warning');
      }
      
      state.betAmount = bet;
      betInput.value = bet.toFixed(2);
      updateBetPreview();
      updateProfitPreview();
      
      showNotification(`🎯 Bet set to $${formatMoney(bet)}`, 'info', 1500);
    });
  });
  
  // Quick bet buttons
  document.querySelectorAll('.quick-bet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.inRound) {
        showNotification('Cannot change bet during a round', 'warning');
        return;
      }
      
      const bet = parseFloat(btn.dataset.bet);
      if (bet > state.balance) {
        showNotification(`Bet cannot exceed balance of $${formatMoney(state.balance)}`, 'warning');
        return;
      }
      
      state.betAmount = bet;
      betInput.value = bet.toFixed(2);
      updateBetPreview();
      updateProfitPreview();
      
      if (state.soundsEnabled) playSound("click");
      showNotification(`⚡ Quick bet: $${formatMoney(bet)}`, 'info', 1500);
    });
  });
  
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;
      if (state.soundsEnabled) playSound("click");
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      autoInfo.classList.toggle("hidden", btn.dataset.tab !== "auto");
      
      if (btn.dataset.tab === "auto") {
        showNotification("🤖 Auto mode is visual only in this demo", 'info', 3000);
      }
    });
  });
  
  addBtn.addEventListener("click", e => {
    e.stopPropagation();
    if (state.soundsEnabled) playSound("click");
    addPopup.classList.toggle("hidden");
  });
  
  addQuickButtons.forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      if (state.soundsEnabled) playSound("click");
      const amt = parseFloat(btn.dataset.add);
      if (!isNaN(amt) && amt > 0) {
        state.balance += amt;
        updateBalanceUI();
        addPopup.classList.add("hidden");
        showNotification(`💰 Added $${formatMoney(amt)} to balance`, 'success', 2000);
      }
    });
  });
  
  addCustomBtn.addEventListener("click", e => {
    e.stopPropagation();
    if (state.soundsEnabled) playSound("click");
    const v = parseFloat(addCustomInput.value);
    if (!isNaN(v) && v > 0) {
      state.balance += v;
      updateBalanceUI();
      addCustomInput.value = "";
      addPopup.classList.add("hidden");
      showNotification(`💰 Added $${formatMoney(v)} to balance`, 'success', 2000);
    } else {
      showNotification('Please enter a valid amount', 'error', 2000);
    }
  });
  
  document.addEventListener("click", () => {
    addPopup.classList.add("hidden");
  });
  
  addPopup.addEventListener("click", e => {
    e.stopPropagation();
  });
  
  statsClose.addEventListener("click", () => {
    if (state.soundsEnabled) playSound("click");
    statsPanel.classList.add("hidden");
    statsOpen.classList.remove("hidden");
  });
  
  statsOpen.addEventListener("click", () => {
    if (state.soundsEnabled) playSound("click");
    statsPanel.classList.remove("hidden");
    statsOpen.classList.add("hidden");
  });
  
  statsRefresh.addEventListener("click", () => {
    if (state.soundsEnabled) playSound("click");
    if (confirm("Reset all statistics? This cannot be undone.")) {
      state.stats = {
        profit: 0,
        wagered: 0,
        wins: 0,
        losses: 0,
        history: [],
        highestMultiplier: 0,
        totalRounds: 0,
        bestProfitStreak: 0,
        currentStreak: 0,
        biggestWin: 0,
        biggestLoss: 0,
        totalPlayTime: 0,
        sessionStartTime: Date.now(),
        fastestCashout: null,
        highestRiskWin: 0
      };
      updateAdvancedStats();
      updateStatsUI();
      drawStatsChart();
      showNotification('Statistics reset', 'info', 2000);
    }
  });
  
  // Setup menu and hotkeys
  setupMenu();
  setupHotkeys();
}

// ==================== INITIALIZATION ====================

function init() {
  state.balance = CONFIG.startingBalance;
  state.betAmount = CONFIG.defaultBet;
  state.minesCount = CONFIG.defaultMines;
  
  updateBalanceUI();
  betInput.value = CONFIG.defaultBet.toFixed(2);
  updateBetPreview();
  buildMinesOptions();
  updateGems();
  buildGrid();
  updateProfitPreview();
  updateAdvancedStats();
  updateStatsUI();
  drawStatsChart();
  attachEvents();
  

  const styleSheet = document.createElement("style");
  styleSheet.textContent = enhancedCSS;
  document.head.appendChild(styleSheet);
}

document.addEventListener("DOMContentLoaded", init);