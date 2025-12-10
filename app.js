const CONFIG = {
  gridSize: 5,
  defaultMines: 3,
  defaultBet: 1.00,
  startingBalance: 200.00,
  maxHistoryPoints: 60,
  houseEdge: 0.01,
  RTP: 0.99,
  minBet: 0.10,
  maxBet: 10000.00 // Increased max bet
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
    sessionStartTime: Date.now()
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

// Add notification CSS
const notificationCSS = `
.notification-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 350px;
}

.notification {
  background: #132439;
  border: 1px solid #1A2C3D;
  border-radius: 6px;
  padding: 12px 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  transform: translateX(120%);
  transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  overflow: hidden;
}

.notification.show {
  transform: translateX(0);
}

.notification-icon {
  font-size: 18px;
  font-weight: bold;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.notification-success .notification-icon {
  background: rgba(0, 199, 77, 0.15);
  color: #00C74D;
}

.notification-warning .notification-icon {
  background: rgba(245, 166, 35, 0.15);
  color: #F5A623;
}

.notification-error .notification-icon {
  background: rgba(255, 65, 65, 0.15);
  color: #FF4141;
}

.notification-info .notification-icon {
  background: rgba(167, 179, 195, 0.15);
  color: #A7B3C3;
}

.notification-content {
  flex: 1;
  font-size: 13px;
  line-height: 1.4;
  color: #FFFFFF;
}

.notification-close {
  background: transparent;
  border: none;
  color: #A7B3C3;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-close:hover {
  color: #FFFFFF;
}
`;

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
  
  const commonMines = [3, 5, 10, 15, 20, 24];
  
  commonMines.forEach(count => {
    if (count <= maxMines) {
      const opt = document.createElement("option");
      opt.value = count;
      opt.textContent = `${count} mines`;
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
      </div>
    `;
    t.style.animation = '';
    t.style.opacity = '1';
  });
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
  
  playSound("click");
  state.inRound = true;
  state.revealedSafe = 0;
  state.minesIndices = new Set();
  state.currentRoundId = Date.now();
  state.canCashout = false;
  state.lockedBetAmount = bet;
  
  betBtn.textContent = "Cashout";
  betBtn.disabled = true;
  betBtn.classList.add('disabled');
  randomBtn.disabled = false;
  
  lockBetControls();
  
  resetTilesForRound();
  
  // Place mines randomly - FIXED: Store positions properly
  const totalTiles = CONFIG.gridSize * CONFIG.gridSize;
  const availableIndices = Array.from({ length: totalTiles }, (_, i) => i);
  
  // Shuffle and pick mine positions
  for (let i = availableIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
  }
  
  state.minesIndices = new Set(availableIndices.slice(0, state.minesCount));
  
  // DEBUG: Log mine positions (remove in production)
  console.log("Mine positions:", Array.from(state.minesIndices));
  
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
  
  showNotification(`Round started! Bet: $${formatMoney(bet)} | Mines: ${state.minesCount}`, 'info');
}

function endRound(win, reason = '') {
  state.inRound = false;
  betBtn.textContent = "Bet";
  betBtn.disabled = false;
  betBtn.classList.remove('disabled');
  randomBtn.disabled = true;
  
  unlockBetControls();
  
  state.tiles.forEach(t => {
    t.classList.add("disabled");
    t.style.opacity = '0.7';
  });
  
  const roundResult = {
    id: state.currentRoundId,
    win: win,
    bet: state.lockedBetAmount,
    mines: state.minesCount,
    revealed: state.revealedSafe,
    multiplier: calculateMultiplier(),
    profit: win ? (state.lockedBetAmount * calculateMultiplier()) - state.lockedBetAmount : -state.lockedBetAmount,
    timestamp: Date.now()
  };
  
  if (win) {
    playSound("win");
    if (!reason) reason = 'Cashout';
    showNotification(`${reason}! Multiplier: ${calculateMultiplier().toFixed(2)}x | Profit: +$${formatMoney(roundResult.profit)}`, 'success', 5000);
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
    playSound("mine");
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
    
    showNotification(`Mine hit at ${currentMultiplier.toFixed(2)}x! Loss: -$${formatMoney(lossAmount)}`, 'error', 5000);
    
  } else {
    // Safe tile
    playSound("reveal");
    tile.classList.add("revealed-safe");
    tile.style.animation = 'safeReveal 0.4s ease-out';
    
    const badge = document.createElement("div");
    badge.className = "grid-tile-badge";
    badge.textContent = "💎";
    tile.appendChild(badge);
    
    state.revealedSafe += 1;
    
    const currentMultiplier = calculateMultiplier();
    const probability = calculateNextSafeProbability() * 100;
    
    // Update profit display
    let riskColor;
    if (probability >= 70) riskColor = '#00C74D';
    else if (probability >= 50) riskColor = '#F5A623';
    else if (probability >= 30) riskColor = '#FF7A00';
    else riskColor = '#FF4141';
    
    profitLabel.innerHTML = `Profit (${currentMultiplier.toFixed(2)}x | <span style="color:${riskColor}">${probability.toFixed(1)}% safe</span>)`;
    
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
    
    // FIXED: Check if all safe tiles have been revealed and auto-cashout
    const totalSafeTiles = (CONFIG.gridSize * CONFIG.gridSize) - state.minesCount;
    if (state.revealedSafe >= totalSafeTiles) {
      setTimeout(() => {
        if (state.inRound) {
          cashout(true, 'All gems found!');
        }
      }, 500);
    }
  }
}

function randomPick() {
  if (!state.inRound) return;
  
  playSound("click");
  const totalTiles = CONFIG.gridSize * CONFIG.gridSize;
  const unrevealedIndices = [];
  
  // Find ALL unrevealed tiles (including mines)
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
  
  // Pick 3 RANDOM tiles (could be mines or gems)
  const picks = Math.min(3, unrevealedIndices.length);
  
  // Shuffle all unrevealed indices
  const shuffled = [...unrevealedIndices].sort(() => Math.random() - 0.5);
  
  showNotification(`Randomly picking ${picks} tiles (risky!)`, 'warning', 2000);
  
  // Pick tiles with risk
  let pickedIndices = shuffled.slice(0, picks);
  
  // Process picks sequentially
  pickedIndices.forEach((idx, i) => {
    setTimeout(() => {
      handleTileClick(idx);
    }, i * 400);
  });
}

function updateProfitPreview() {
  if (!state.inRound) {
    const probability = ((CONFIG.gridSize * CONFIG.gridSize - state.minesCount) / (CONFIG.gridSize * CONFIG.gridSize)) * 100;
    profitLabel.textContent = `Profit (1.00x | ${probability.toFixed(1)}% initial safety)`;
    profitAmount.textContent = "$" + formatMoney(state.betAmount);
    return;
  }
  
  const multiplier = calculateMultiplier();
  const payout = state.lockedBetAmount * multiplier;
  const probability = calculateNextSafeProbability() * 100;
  
  let riskColor;
  if (probability >= 70) riskColor = '#00C74D';
  else if (probability >= 50) riskColor = '#F5A623';
  else if (probability >= 30) riskColor = '#FF7A00';
  else riskColor = '#FF4141';
  
  profitLabel.innerHTML = `Profit (${multiplier.toFixed(2)}x | <span style="color:${riskColor}">${probability.toFixed(1)}% safe</span>)`;
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
    `Cashed out at ${multiplier.toFixed(2)}x`;
  
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
        <div class="stats-advanced-sub">Biggest Loss: -$${formatMoney(state.stats.biggestLoss)}</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Avg Bet</div>
        <div class="stats-advanced-value">$${formatMoney(avgBet)}</div>
        <div class="stats-advanced-sub">Session: ${hours}h ${minutes}m</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Current Streak</div>
        <div class="stats-advanced-value ${state.stats.currentStreak > 0 ? 'positive' : 'negative'}">${state.stats.currentStreak}</div>
        <div class="stats-advanced-sub">EV: ${expectedValue > 0 ? '+' : ''}${(expectedValue * 100).toFixed(1)}%</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Total Rounds</div>
        <div class="stats-advanced-value">${state.stats.totalRounds}</div>
        <div class="stats-advanced-sub">Wagered: $${formatMoney(state.stats.wagered)}</div>
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
    
    playSound("click");
    state.minesCount = parseInt(minesSelect.value, 10) || CONFIG.defaultMines;
    updateGems();
    updateProfitPreview();
    
    showNotification(`Mines set to ${state.minesCount}`, 'info', 2000);
  });
  
  betActionButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (state.inRound) {
        showNotification('Cannot change bet during a round', 'warning');
        return;
      }
      
      playSound("click");
      let bet = state.betAmount;
      
      if (btn.dataset.betAction === "half") bet /= 2;
      if (btn.dataset.betAction === "double") bet *= 2;
      
      bet = Math.max(CONFIG.minBet, parseFloat(bet.toFixed(2)));
      
      // Check if new bet exceeds balance
      if (bet > state.balance) {
        bet = Math.min(state.balance, CONFIG.maxBet);
        showNotification(`Bet cannot exceed balance of $${formatMoney(state.balance)}`, 'warning');
      }
      
      state.betAmount = bet;
      betInput.value = bet.toFixed(2);
      updateBetPreview();
      updateProfitPreview();
      
      showNotification(`Bet set to $${formatMoney(bet)}`, 'info', 1500);
    });
  });
  
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;
      playSound("click");
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      autoInfo.classList.toggle("hidden", btn.dataset.tab !== "auto");
      
      if (btn.dataset.tab === "auto") {
        showNotification("Auto mode is visual only in this demo", 'info', 3000);
      }
    });
  });
  
  addBtn.addEventListener("click", e => {
    e.stopPropagation();
    playSound("click");
    addPopup.classList.toggle("hidden");
  });
  
  addQuickButtons.forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      playSound("click");
      const amt = parseFloat(btn.dataset.add);
      if (!isNaN(amt) && amt > 0) {
        state.balance += amt;
        updateBalanceUI();
        addPopup.classList.add("hidden");
        showNotification(`Added $${formatMoney(amt)} to balance`, 'success', 2000);
      }
    });
  });
  
  addCustomBtn.addEventListener("click", e => {
    e.stopPropagation();
    playSound("click");
    const v = parseFloat(addCustomInput.value);
    if (!isNaN(v) && v > 0) {
      state.balance += v;
      updateBalanceUI();
      addCustomInput.value = "";
      addPopup.classList.add("hidden");
      showNotification(`Added $${formatMoney(v)} to balance`, 'success', 2000);
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
    playSound("click");
    statsPanel.classList.add("hidden");
    statsOpen.classList.remove("hidden");
  });
  
  statsOpen.addEventListener("click", () => {
    playSound("click");
    statsPanel.classList.remove("hidden");
    statsOpen.classList.add("hidden");
  });
  
  statsRefresh.addEventListener("click", () => {
    playSound("click");
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
        sessionStartTime: Date.now()
      };
      updateAdvancedStats();
      updateStatsUI();
      drawStatsChart();
      showNotification('Statistics reset', 'info', 2000);
    }
  });
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
  
  // Add CSS for enhanced features
  const enhancedCSS = `
  ${notificationCSS}
  
  @keyframes mineExplode {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.3); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes mineReveal {
    0% { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes safeReveal {
    0% { transform: scale(0.9); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  .tile-content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .tile-number {
    font-size: 11px;
    color: rgba(167, 179, 195, 0.3);
    font-weight: 600;
  }
  
  .grid-tile.revealed-safe .tile-number,
  .grid-tile.revealed-mine .tile-number {
    display: none;
  }
  
  .btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .stats-advanced {
    margin-top: 15px;
  }
  
  .stats-advanced-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .stats-advanced-card {
    background: #0C1824;
    border: 1px solid #1A2C3D;
    border-radius: 6px;
    padding: 8px;
  }
  
  .stats-advanced-label {
    font-size: 10px;
    color: #A7B3C3;
    margin-bottom: 2px;
  }
  
  .stats-advanced-value {
    font-size: 12px;
    font-weight: 600;
    color: #FFFFFF;
  }
  
  .stats-advanced-value.positive {
    color: #00C74D;
  }
  
  .stats-advanced-value.negative {
    color: #FF4141;
  }
  
  .stats-advanced-sub {
    font-size: 9px;
    color: #A7B3C3;
    margin-top: 2px;
  }
  
  #bet-input.disabled,
  .select-input.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #0a131f;
  }
  
  .bet-input-wrap.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn.mini.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  `;
  
  const styleSheet = document.createElement("style");
  styleSheet.textContent = enhancedCSS;
  document.head.appendChild(styleSheet);
}

document.addEventListener("DOMContentLoaded", init);