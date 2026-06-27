// Container board game â€“ app controller

const APP_STATE = {
  gameState: null,
  humanPlayerIdx: 0,
};

Object.defineProperty(window, 'APP_GAME_STATE', {
  get() { return APP_STATE.gameState; }
});

// â”€â”€ Setup screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showSetupScreen() {
  const root = document.getElementById('container-automa-root');
  root.innerHTML = `
    <div class="setup-screen">
      <div class="setup-logo">Container</div>
      <h2>Solo / Automa Play Assistant</h2>

      <div class="setup-section">
        <label>Human Players</label>
        <div class="toggle-group" id="human-count">
          <button class="toggle-btn active" data-val="1" onclick="setSetup('human', 1)">1</button>
          <button class="toggle-btn" data-val="2" onclick="setSetup('human', 2)">2</button>
        </div>
      </div>

      <div class="setup-section">
        <label>Automa Players</label>
        <div class="toggle-group" id="ai-count">
          <button class="toggle-btn" data-val="1" onclick="setSetup('ai', 1)">1</button>
          <button class="toggle-btn active" data-val="2" onclick="setSetup('ai', 2)">2</button>
          <button class="toggle-btn" data-val="3" onclick="setSetup('ai', 3)">3</button>
          <button class="toggle-btn" data-val="4" onclick="setSetup('ai', 4)">4</button>
        </div>
        <div id="player-count-msg" class="count-msg">Total: 3 players</div>
      </div>

      <div class="setup-section">
        <label>Game Length</label>
        <div class="toggle-group" id="game-length">
          <button class="toggle-btn" data-val="short" onclick="setSetup('length', 'short')">Short</button>
          <button class="toggle-btn active" data-val="standard" onclick="setSetup('length', 'standard')">Standard</button>
          <button class="toggle-btn" data-val="extended" onclick="setSetup('length', 'extended')">Extended</button>
        </div>
      </div>

      <div class="setup-section" id="color-pick-section">
        <label>Player Color <span class="setup-optional">(optional)</span></label>
        <div id="color-pick-content"></div>
      </div>

      <div class="setup-section">
        <label>Sitting Order</label>
        <div id="seat-order-content"></div>
      </div>

      <div class="setup-section">
        <label>Game Variant</label>
        <div class="variant-toggle-row">
          <button class="toggle-btn variant-btn" id="variant-classic" onclick="toggleClassic()">Classic Variant</button>
          <span class="variant-hint" id="classic-hint"></span>
        </div>
      </div>

      <div class="setup-section" id="modules-section">
        <label>Expansion Modules <span class="setup-optional">(optional)</span></label>
        <div class="module-toggles">
          <button class="toggle-btn mod-btn" id="mod-truck" onclick="toggleModule('truckCompanies')">Truck Companies</button>
          <button class="toggle-btn mod-btn" id="mod-luxury" onclick="toggleModule('luxuryContainers')">Luxury Containers</button>
          <button class="toggle-btn mod-btn" id="mod-loans" onclick="toggleModule('playerLoans')">Player Loans</button>
        </div>
        <div class="module-hints" id="module-hints"></div>
      </div>

      <button class="start-btn" onclick="startGame()">Start Game</button>

      <div class="setup-credit">Created by <a href="https://enochwright.com" target="_blank" rel="noopener">Enoch Wright</a></div>

    </div>
  `;

  window._setup = { human: 1, ai: 2, length: 'standard', modules: {}, playerColors: [null, null], seatOrder: ['h0','ai0','ai1'] };
  renderColorPicker();
  renderSittingOrder();

  const MODULE_HINTS = {
    truckCompanies:   'Factory buyers pay $1 freight. Own truck companies to collect fees or waive your own.',
    luxuryContainers: 'Trade 2 containers for 1 gold (free action). Gold scores as any color at game end.',
    playerLoans:      'Opponents can loan you money with incentive bids. Interest goes to the lender.',
  };

  window.toggleClassic = function() {
    window._setup.modules = window._setup.modules || {};
    window._setup.modules.classic = !window._setup.modules.classic;
    const on = !!window._setup.modules.classic;
    document.getElementById('variant-classic')?.classList.toggle('active', on);
    document.getElementById('classic-hint').textContent = on
      ? 'No Off-Shore Bank, no auctions, no bluff bids. Interest to supply. Min $1 delivery bids.'
      : '';
    // Hide expansion modules when Classic is active (incompatible)
    const modSection = document.getElementById('modules-section');
    if (modSection) modSection.style.display = on ? 'none' : '';
    if (on) window._setup.modules = { classic: true }; // clear any selected expansions
  };

  window.toggleModule = function(key) {
    window._setup.modules = window._setup.modules || {};
    window._setup.modules[key] = !window._setup.modules[key];
    const idMap = { truckCompanies: 'mod-truck', luxuryContainers: 'mod-luxury', playerLoans: 'mod-loans' };
    document.getElementById(idMap[key])?.classList.toggle('active', !!window._setup.modules[key]);
    // Update hints â€” skip 'classic' key which has no hint entry
    const active = Object.entries(window._setup.modules).filter(([k, v]) => v && k !== 'classic').map(([k]) => k);
    const hintsEl = document.getElementById('module-hints');
    if (hintsEl) {
      hintsEl.innerHTML = active.map(k => `<div class="module-hint-item">${MODULE_HINTS[k]}</div>`).join('');
    }
  };
}

window.setSetup = function(key, val) {
  window._setup[key] = val;
  const groupId = key === 'human' ? 'human-count' : key === 'ai' ? 'ai-count' : 'game-length';
  document.querySelectorAll(`#${groupId} .toggle-btn`).forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === String(val));
  });
  const total = (window._setup.human || 1) + (window._setup.ai || 2);
  const msgEl = document.getElementById('player-count-msg');
  if (msgEl) {
    msgEl.textContent = `Total: ${total} players${total >= 3 && total <= 5 ? '' : ' (need 3â€“5)'}`;
    msgEl.style.color = (total >= 3 && total <= 5) ? '#27ae60' : '#e74c3c';
  }
  if (key === 'human') renderColorPicker();
  if (key === 'human' || key === 'ai') {
    // Reset seat order to default when counts change
    const h = window._setup.human || 1;
    const a = window._setup.ai || 2;
    const order = [];
    for (let i = 0; i < h; i++) order.push(`h${i}`);
    for (let i = 0; i < a; i++) order.push(`ai${i}`);
    window._setup.seatOrder = order;
    renderSittingOrder();
  }
};

function renderColorPicker() {
  const el = document.getElementById('color-pick-content');
  if (!el) return;
  const humanCount = window._setup.human || 1;
  const chosen = window._setup.playerColors || [null, null];
  let html = '';
  for (let h = 0; h < humanCount; h++) {
    const label = humanCount === 1 ? 'Your color' : `Player ${h + 1}`;
    const swatches = PLAYER_CSS.map((hex, i) => {
      const takenByOther = chosen.some((c, j) => j !== h && c === i);
      const isChosen = chosen[h] === i;
      return `<button class="color-swatch${isChosen ? ' chosen' : ''}${takenByOther ? ' taken' : ''}"
        style="background:${hex}" onclick="pickColor(${h},${i})"
        ${takenByOther ? 'disabled' : ''} title="${PLAYER_CSS_NAME[i]}"></button>`;
    }).join('');
    const chosenName = chosen[h] != null ? `<span class="color-pick-chosen" style="color:${PLAYER_CSS[chosen[h]]}">${PLAYER_CSS_NAME[chosen[h]]}</span>` : `<span class="color-pick-chosen muted">Random</span>`;
    const clearBtn = chosen[h] != null ? `<button class="link-btn" onclick="pickColor(${h},null)" style="margin-left:8px">Clear</button>` : '';
    html += `<div class="color-pick-row">
      <span class="color-pick-label">${label}</span>
      <div class="color-swatches">${swatches}</div>
      <div class="color-pick-footer">${chosenName}${clearBtn}</div>
    </div>`;
  }
  el.innerHTML = html;
}

window.pickColor = function(playerIdx, colorIdx) {
  if (!window._setup.playerColors) window._setup.playerColors = [null, null];
  window._setup.playerColors[playerIdx] = colorIdx;
  renderColorPicker();
  renderSittingOrder();
};

function renderSittingOrder() {
  const el = document.getElementById('seat-order-content');
  if (!el) return;
  const order = window._setup.seatOrder || [];
  const n = order.length;

  // Compute AI color preview: colors not taken by humans (in index order, matching initGame)
  const humanPicked = new Set((window._setup.playerColors || []).filter(c => c != null));
  const aiColorIdxList = [0,1,2,3,4].filter(i => !humanPicked.has(i));

  const rows = order.map((role, idx) => {
    const isHuman = role.startsWith('h');
    const localIdx = isHuman ? parseInt(role.slice(1)) : parseInt(role.slice(2));
    const colorIdx = isHuman
      ? (window._setup.playerColors?.[localIdx] ?? null)
      : (aiColorIdxList[localIdx] ?? null);
    const dotColor = colorIdx != null ? PLAYER_CSS[colorIdx] : '#888';
    const colorLabel = colorIdx != null ? PLAYER_CSS_NAME[colorIdx] : '?';
    const name = isHuman ? `${colorLabel} Player` : `${colorLabel} Automa`;
    return `<div class="seat-row">
      <span class="seat-num">${idx + 1}</span>
      <span class="seat-dot" style="background:${dotColor}"></span>
      <span class="seat-name">${name}</span>
      <span class="seat-type-badge">${isHuman ? 'Human' : 'Automa'}</span>
      <div class="seat-btns">
        ${idx > 0   ? `<button class="seat-move-btn" onclick="moveSeat(${idx},-1)">â–²</button>` : `<span class="seat-move-ph"></span>`}
        ${idx < n-1 ? `<button class="seat-move-btn" onclick="moveSeat(${idx}, 1)">â–¼</button>` : `<span class="seat-move-ph"></span>`}
      </div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="seat-order-header">
      <span class="seat-order-hint">First seat goes first each round</span>
      <button class="action-btn secondary" style="font-size:0.82em;padding:5px 11px" onclick="randomizeSeatOrder()">â†º Randomize</button>
    </div>
    <div class="seat-order-list">${rows}</div>`;
}

window.moveSeat = function(idx, dir) {
  const order = window._setup.seatOrder;
  const j = idx + dir;
  if (j < 0 || j >= order.length) return;
  [order[idx], order[j]] = [order[j], order[idx]];
  renderSittingOrder();
};

window.randomizeSeatOrder = function() {
  const arr = [...(window._setup.seatOrder || [])];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  window._setup.seatOrder = arr;
  renderSittingOrder();
};

window.startGame = function() {
  const setup = window._setup || { human: 1, ai: 2, length: 'standard', modules: {} };
  const total = (setup.human || 1) + (setup.ai || 2);
  if (total < 3 || total > 5) { alert('Need 3â€“5 total players'); return; }

  // Player Loans requires at least 2 humans or UI makes no sense
  if (setup.modules?.playerLoans && (setup.human || 1) < 2 && (setup.ai || 2) === 0) {
    // Fine - AI can also offer loans
  }

  try {
    const state = initGame(
      setup.human, setup.ai,
      setup.length || 'standard',
      setup.modules || {},
      setup.playerColors || [],
      setup.seatOrder || null
    );
    APP_STATE.gameState = state;
    APP_STATE.humanPlayerIdx = 0;

    showGameScreen();
    render(state);
    showSetupWalkthrough(state);
  } catch(e) {
    alert('Error starting game: ' + e.message);
    console.error(e);
  }
};

// â”€â”€ Game screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showGameScreen() {
  const root = document.getElementById('container-automa-root');
  root.innerHTML = `
    <div id="header" class="header"></div>

    <div class="tab-bar">
      <button class="tab-btn active" onclick="showTab('tab-island')">Islands</button>
      <button class="tab-btn" onclick="showTab('tab-my-board')">Player</button>
      <button class="tab-btn" onclick="showTab('tab-opponents')">Opponents</button>
      <button class="tab-btn" onclick="showTab('tab-log')">Log</button>
    </div>

    <div class="tab-content">
      <div id="tab-island" class="tab active">
        <div id="bank-board" class="board-section"></div>
        <div id="island-board" class="board-section"></div>
      </div>
      <div id="tab-opponents" class="tab">
        <div id="opponents"></div>
      </div>
      <div id="tab-my-board" class="tab">
        <div id="my-board"></div>
      </div>
      <div id="tab-log" class="tab">
        <div id="game-log" class="game-log"></div>
      </div>
    </div>

    <div id="action-area" class="action-area"></div>
    <div id="modal" class="modal-overlay"></div>
  `;
}

// â”€â”€ Setup walkthrough â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showSetupWalkthrough(state) {
  const LOT_ROMAN = ['I', 'II', 'III'];
  const players = state.players;

  const playerRows = players.map(p => `
    <div class="walk-player-row">
      <span class="player-dot" style="background:${p.cssColor}"></span>
      <span style="color:${p.cssColor};font-weight:700">${p.name}</span>
      <span class="walk-note-inline">${p.isAI ? 'Automa' : 'Human'}</span>
    </div>`).join('');

  const factoryRows = players.map(p => `
    <div class="walk-player-row">
      <span class="player-dot" style="background:${p.cssColor}"></span>
      <span>${p.name}: ${pill([p.factories[0]])} <strong>${COLOR_LABEL[p.factories[0]]}</strong> factory â€” place 1 ${COLOR_LABEL[p.factories[0]]} container in your <strong>$2 factory lot</strong></span>
    </div>`).join('');

  const cardRows = players.map(p => {
    if (p.isAI) {
      return `<div class="walk-player-row">
        <span class="player-dot" style="background:${p.cssColor}"></span>
        <span>${p.name} â€” <em class="muted">app tracks their scoring card</em></span>
      </div>`;
    }
    return `<div class="walk-player-row">
      <span class="player-dot" style="background:${p.cssColor}"></span>
      <span style="color:${p.cssColor};font-weight:700">${p.name}</span>
    </div>`;
  }).join('');

  const bankLotRows = state.bank.containerLots.map((lot, i) => `
    <div class="walk-supply-row">
      Container Lot <strong>${LOT_ROMAN[i]}</strong>: ${lot.length ? pill(lot) + ' ' + lot.map(c => COLOR_LABEL[c]).join(', ') : '<em>empty</em>'}
    </div>`).join('');

  const supplyRows = COLORS.map(c => `<span>${COLOR_LABEL[c]}: ${state.containerSupply[c]}</span>`).join(' &nbsp;Â·&nbsp; ');
  const factSupplyRows = COLORS.map(c => `<span>${COLOR_LABEL[c]}: ${state.factorySupply[c]}</span>`).join(' &nbsp;Â·&nbsp; ');

  let expansionHtml = '';
  if (state.modules.truckCompanies) {
    expansionHtml += `<div class="walk-section">
      <div class="walk-section-title">Truck Companies</div>
      <ul class="walk-list">
        <li>Give each player their <strong>board extension</strong>.</li>
        <li>Each player has <strong>3 truck tokens</strong> â€” keep them ready to place on board extensions.</li>
        <li>All companies start <strong>independent</strong> (no owners).</li>
        <li>When you buy from an opponent's factory, place <strong>$1</strong> in your own trucking area.</li>
        <li>The owner of your trucking company collects that money next time <em>they</em> make a factory purchase.</li>
      </ul>
    </div>`;
  }
  if (state.modules.luxuryContainers) {
    expansionHtml += `<div class="walk-section">
      <div class="walk-section-title">Luxury Containers</div>
      <ul class="walk-list">
        <li>Place <strong>10 gold containers</strong> near the bank as the gold supply.</li>
        <li>Gold containers can be acquired as a free action once per turn.</li>
      </ul>
    </div>`;
  }
  if (state.modules.playerLoans) {
    expansionHtml += `<div class="walk-section">
      <div class="walk-section-title">Player Loans</div>
      <ul class="walk-list">
        <li>No extra physical setup â€” the app tracks loan offers and interest.</li>
      </ul>
    </div>`;
  }

  const modal = document.getElementById('modal');
  modal.innerHTML = `
    <div class="modal-content walk-modal">
      <h3>Board Setup</h3>

      <div class="walk-section">
        <div class="walk-section-title">Players & Token Colors</div>
        ${playerRows}
        <p class="walk-note">Each player takes their matching colored ship and player board. 
        Each player should take a player aid and place 1 warehouse from the supply on the warehouse slot 1 of their player board.</p>
      </div>

      <div class="walk-section">
        <div class="walk-section-title">Starting Factories & Containers</div>
        ${factoryRows}
        <p class="walk-note">Place your factory tile on factory slot 1 of your player board.</p>
      </div>

      <div class="walk-section">
        <div class="walk-section-title">Starting Cash</div>
        <p>Each player takes <strong>$20</strong> from the bank supply.</p>
      </div>

      ${state.modules?.classic ? `
      <div class="walk-section">
        <div class="walk-section-title">Classic Variant â€” No Off-Shore Bank</div>
        <p class="walk-note">Do not set up the Off-Shore Bank board, auction tokens, bid tiles, or bluff cards. Place the Bank Loan cards near the cash supply.</p>
      </div>` : `
      <div class="walk-section">
        <div class="walk-section-title">Off-Shore Bank â€” Container Lots</div>
        ${bankLotRows}
        <p class="walk-note">Bank cash lots start at: Lot I = $1, Lot II = $2, Lot III = $3.</p>
      </div>`}

      <div class="walk-section">
        <div class="walk-section-title">Supply Piles</div>
        <div class="walk-supply-row"><strong>Containers:</strong> ${supplyRows}</div>
        <div class="walk-supply-row"><strong>Factories:</strong> ${factSupplyRows}</div>
        <div class="walk-supply-row"><strong>Warehouses:</strong> ${state.warehouseSupply} tiles in supply</div>
      </div>

      <div class="walk-section">
        <div class="walk-section-title">Ships</div>
        <p>All ships start in the <strong>Ocean</strong> area.</p>
      </div>

      ${expansionHtml}

      <button class="start-btn" onclick="startPrivateCardReveal()">Ready to Play â†’</button>
    </div>
  `;

  const humanPlayers = players.filter(p => !p.isAI);

  window.startPrivateCardReveal = function() {
    if (humanPlayers.length === 0) {
      document.getElementById('modal').innerHTML = '';
      APP_processNextTurn();
      return;
    }
    showPrivateCardStep(0);
  };

  function showPrivateCardStep(idx) {
    if (idx >= humanPlayers.length) {
      document.getElementById('modal').innerHTML = '';
      APP_processNextTurn();
      return;
    }
    const p = humanPlayers[idx];
    const card = p.scoringCard;
    const isLast = idx === humanPlayers.length - 1;
    const cardVals = COLORS.map(c => {
      const valStr = c === card.twoValue
        ? `<strong style="color:#27ae60">$10 / $5</strong>`
        : `$${card.values[c]}`;
      return `${pill([c])} ${COLOR_LABEL[c]}: ${valStr}`;
    }).join('<br>');

    document.getElementById('modal').innerHTML = `
      <div class="modal-content">
        <div id="card-pass-prompt">
          <h3 style="color:${p.cssColor}">Pass to ${p.name}</h3>
          <p class="muted" style="margin-bottom:16px">Shield screen from others â€” only you should see this.</p>
          <button class="start-btn" id="btn-reveal-card">Tap to reveal my scoring card</button>
        </div>
        <div id="card-reveal-area" style="display:none">
          <h3 style="color:${p.cssColor}">${p.name}</h3>
          <div class="walk-section-title">Your Card: <strong>${card.label}</strong></div>
          <div style="line-height:2.2;font-size:1.05em">${cardVals}</div>
          <p class="walk-note" style="margin-top:10px">The color showing <strong>$10 / $5</strong> scores $10 each if you had all 5 container colors, or $5 each if you were missing any.</p>
          <button class="start-btn" style="margin-top:16px" onclick="showPrivateCardStep(${idx + 1})">${isLast ? 'Done â€” Start Game' : 'Done â€” Pass to Next Player'}</button>
        </div>
      </div>
    `;
    document.getElementById('btn-reveal-card').onclick = function() {
      document.getElementById('card-pass-prompt').style.display = 'none';
      document.getElementById('card-reveal-area').style.display = 'block';
    };
  }

  window.showPrivateCardStep = showPrivateCardStep;
}

window.showTab = function(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById(tabId);
  tab?.classList.add('active');
  tab?.scrollTo(0, 0);
  event.target.classList.add('active');
};

// â”€â”€ Game loop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Expansion: Luxury Containers â€” before game ends, ask each human to choose gold color.
function APP_collectGoldChoices(state, humans, onDone) {
  if (humans.length === 0) { onDone(); return; }
  const player = humans[0];
  const remaining = humans.slice(1);
  const goldOnIsland = player.islandContainers.filter(c => c === 'gold');
  if (goldOnIsland.length === 0) { APP_collectGoldChoices(state, remaining, onDone); return; }

  const btnHtml = COLORS.map(c =>
    `<button class="color-btn" style="background:${COLOR_HEX[c]};color:#fff"
      onclick="chooseGoldColor(${player.id},'${c}')">${COLOR_LABEL[c]}</button>`
  ).join('');

  const modal = document.getElementById('modal');
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${player.name} â€” Choose Gold Color</h3>
      <p>You have <strong>${goldOnIsland.length}</strong> gold container${goldOnIsland.length !== 1 ? 's' : ''} on Container Island.
      Choose one color â€” all your gold containers will score as that color.</p>
      <div class="color-btn-row">${btnHtml}</div>
    </div>
  `;
  window.chooseGoldColor = function(playerId, color) {
    state.players[playerId].goldColor = color;
    document.getElementById('modal').innerHTML = '';
    APP_collectGoldChoices(state, remaining, onDone);
  };
}

function APP_processNextTurn() {
  const state = APP_STATE.gameState;
  if (!state) return;

  // Game over â€” handle deferred gold color choices before computing final scores
  if (state.gameOver && !state.scores) {
    const humansWithGold = state.modules?.luxuryContainers
      ? state.players.filter(p => !p.isAI && !p.goldColor && p.islandContainers.some(c => c === 'gold'))
      : [];
    APP_collectGoldChoices(state, humansWithGold, () => {
      computeFinalScores(state);
      render(state);
    });
    return;
  }

  if (state.gameOver) return;

  const player = currentPlayer(state);

  if (state.phase === 'delivery_auction') {
    render(state);
    return;
  }

  if (state.phase === 'turn_start') {
    if (player.isAI) {
      // Automa handles its own start-of-turn internally (for instruction generation)
      setTimeout(() => APP_runAITurn(), 400);
    } else {
      const startResult = processStartOfTurn(state);
      state.phase = 'action_select';
      const hasNotification = startResult.bankWinType
        || startResult.truckCompanyWon != null
        || startResult.bankInterest > 0
        || startResult.playerLoanPayments.length > 0
        || startResult.emergencyLoanTaken;
      if (hasNotification) {
        render(state);
        showBankWinModal(startResult, state, () => render(state));
      } else {
        render(state);
      }
    }
    return;
  }

  if (state.phase === 'action_select') {
    if (player.isAI) {
      setTimeout(() => APP_runAITurn(), 400);
    } else {
      render(state);
    }
  }
}

// Build human-readable steps for start-of-turn mechanics (read state BEFORE processStartOfTurn mutates it)
function buildStartOfTurnSteps(state, aiId) {
  const ai = state.players[aiId];
  const bank = state.bank;
  const steps = [];

  if (totalLoans(ai) > 0) {
    const interest = totalLoans(ai);
    const canAfford = ai.cash >= interest;
    const instrs = [];
    if (!canAfford) {
      instrs.push(`Automa cannot afford interest â€” first take a <strong>loan card</strong> and collect <strong>$10</strong> from supply.`);
    }
    instrs.push(
      `Take <strong>$${interest}</strong> from Automa's cash.`,
      state.modules?.classic
        ? `Return <strong>$${interest}</strong> to the supply.`
        : `Distribute to Off-Shore Bank cash lots: ${describeBankDistribution(bank, interest)}.`
    );
    steps.push({ title: `Pay Loan Interest â€” $${interest}`, instructions: instrs });
  }

  if (bank.containerAuction && bank.containerAuction.bidderId === aiId) {
    const a = bank.containerAuction;
    const lotName = ['I','II','III'][a.lotIdx];
    const containers = bank.containerLots[a.lotIdx] || [];
    steps.push({
      title: `Win Bank Auction â€” Container Lot ${lotName}`,
      instructions: [
        `Automa wins Container Lot <strong>${lotName}</strong> (bid was $${a.amount}).`,
        `Pay <strong>$${a.amount}</strong> from the bid tile to bank cash lots: ${describeBankDistribution(bank, a.amount)}.`,
        `Take <strong>${containers.length}</strong> container${containers.length !== 1 ? 's' : ''} from Lot ${lotName}: <strong>${containers.map(c => COLOR_LABEL[c]).join(', ') || '(none)'}</strong>.`,
        `Place them in Automa's <strong>holding area</strong> on the Off-Shore Bank board.`,
        `Return the auction token and bid tile to the supply.`
      ]
    });
  }

  if (bank.truckAuction && bank.truckAuction.bidderId === aiId && state.modules?.truckCompanies) {
    const a = bank.truckAuction;
    const target = state.players[a.targetPlayerId];
    const isOwnCompany = a.targetPlayerId === aiId;
    const fundInArea = target.truckingFund || 0;
    const instrs = [
      `Automa wins ${isOwnCompany ? 'its own' : `<strong>${target.name}'s</strong>`} Truck Company (bid $${a.amount}).`,
      `Pay <strong>$${a.amount}</strong> from the bid tile to bank cash lots: ${describeBankDistribution(bank, a.amount)}.`,
    ];
    if (fundInArea > 0) {
      instrs.push(`Collect <strong>$${fundInArea}</strong> from <strong>${target.name}'s trucking area</strong> â€” add to Automa's cash.`);
    }
    instrs.push(
      `Place one of Automa's trucks on <strong>${target.name}'s board extension</strong>.`,
      `Return the auction token to the supply.`,
      isOwnCompany
        ? `Automa now owns its own company â€” no $1 freight fee when buying from factories.`
        : `From now on, when <strong>${target.name}</strong> makes a Factory Purchase, Automa gets $1 directly.`,
    );
    steps.push({
      title: `Win Truck Company â€” ${isOwnCompany ? 'Own' : target.name + "'s"} Company`,
      instructions: instrs,
    });
  }

  if (bank.cashAuction && bank.cashAuction.bidderId === aiId) {
    const a = bank.cashAuction;
    const lotName = ['I','II','III'][a.lotIdx];
    const cashAmt = bank.cashLots[a.lotIdx];
    steps.push({
      title: `Win Bank Auction â€” Cash Lot ${lotName}`,
      instructions: [
        `Automa wins Cash Lot <strong>${lotName}</strong>.`,
        `Remove Automa's bid containers from the tile â†’ distribute to bank container lots: ${describeBankContainerDistribution(bank, a.containers)}.`,
        `Take <strong>$${cashAmt}</strong> from Cash Lot ${lotName} and add to Automa's cash.`,
        `Return the auction token and bid tile to the supply.`
      ]
    });
  }

  return steps;
}

function APP_runAITurn() {
  const state = APP_STATE.gameState;
  if (!state || state.gameOver) return;
  const player = currentPlayer(state);
  if (!player.isAI) return;

  // Build start-of-turn instruction steps BEFORE processStartOfTurn mutates state
  let startSteps = [];
  if (state.phase === 'turn_start') {
    startSteps = buildStartOfTurnSteps(state, player.id);
    processStartOfTurn(state);
    state.phase = 'action_select';
  }

  // Plan and execute all AI actions
  const { steps, triggerDelivery } = aiTakeTurn(state, player.id);

  const allSteps = [...startSteps, ...steps];

  render(state);

  showAutomaModal(player.name, allSteps, () => {
    if (triggerDelivery && state.deliveryAuction) {
      // Delivery auction begins â€” show bidding UI
      render(state);
    } else if (state.gameOver) {
      render(state);
    } else {
      // If no actions were taken (steps.length === 1 with 'No Actions' placeholder and phase is still action_select)
      if (state.phase === 'action_select') {
        advanceTurn(state);
      }
      setTimeout(() => APP_processNextTurn(), 150);
    }
  });
}

// Called by UI handlers after a human action completes.
function APP_processNextIfAI(state) {
  if (state.gameOver) { render(state); return; }
  if (state.phase === 'turn_start' || currentPlayer(state).isAI) {
    setTimeout(() => APP_processNextTurn(), 200);
  }
}
