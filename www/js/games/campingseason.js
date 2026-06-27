// Camping Season Game Module
// Handles all Camping Season specific functionality

class CampingSeasonGame {
  constructor() {
    this.currentPhase = "setup"; // setup, gameplay
    this.gameConfig = null;
    this.configVisible = false;
    this.bagVisible = false;
    this.currentSeason = 1;
    this.currentPhaseNum = 1;
    this.pulledTokens = [];
    this.gameState = null;
  }

  // ===== UI INITIALIZATION =====

  init() {
    this.setupUI();
  }

  setupUI() {
    const container = document.getElementById("campingseason-content");
    if (!container) return;

    this.showMainMenu();
  }

  showMainMenu() {
    const container = document.getElementById("campingseason-content");
    if (!container) return;

    container.innerHTML = `
      <div class="rail-baron-container">
        <h2>Camping Season</h2>
        <p class="subtitle">A campground-building game companion</p>

        <div class="rail-baron-menu">
          <button class="rail-baron-menu-btn" id="cs-btn-setup-play">
            <span class="menu-icon">🏕️</span>
            <span class="menu-title">Setup + Play</span>
            <span class="menu-desc">Configure game setup and manage your Guest Bag</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById("cs-btn-setup-play")?.addEventListener("click", () => {
      this.showSetupPlay();
    });
  }

  showSetupPlay() {
    const container = document.getElementById("campingseason-content");
    if (!container) return;

    const savedGameConfig = this.gameConfig;
    const savedPhase = this.currentPhase;
    const savedGameState = this.gameState;

    container.innerHTML = `
      <div class="rail-baron-container">
        <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; align-items: center;">
          <button class="back-button" id="cs-back-to-menu">← Back to Menu</button>
          <button class="back-button" id="cs-toggle-config-btn" style="display: none; background: var(--secondary-color);">Config</button>
          <button class="back-button" id="cs-toggle-bag-btn" style="display: none; background: var(--secondary-color);">Guest Bag</button>
        </div>

        <!-- Setup Section -->
        <div class="roll-section" id="cs-setup-section">
          <h3>Game Setup</h3>

          <div class="setting-item">
            <label for="cs-player-count">Number of Players:</label>
            <select id="cs-player-count" class="setting-input">
              <option value="2">2 Players</option>
              <option value="3">3 Players</option>
              <option value="4">4 Players</option>
            </select>
          </div>

          <button class="btn btn-primary" id="cs-start-game-btn">Next</button>
        </div>

        <!-- Game Summary (shown after setup) -->
        <div class="roll-section" id="cs-game-summary" style="display: none;">
          <div class="card-header-with-button">
            <h3>Game Configuration</h3>
            <button class="btn btn-secondary" id="cs-reset-setup-btn-config" style="background: #ea4335; color: white; padding: 8px 16px; font-size: 0.9rem;">Reset</button>
          </div>
          <div id="cs-game-summary-content"></div>
        </div>

        <!-- Gameplay Section (shown after Start Game) -->
        <div class="roll-section" id="cs-gameplay-section" style="display: none;">
          <div class="card-header-with-button">
            <h3>Game in Progress</h3>
            <button class="btn btn-secondary" id="cs-reset-setup-btn-gameplay" style="background: #ea4335; color: white; padding: 8px 16px; font-size: 0.9rem;">Reset</button>
          </div>
          <div id="cs-gameplay-info"></div>
          <div id="cs-gameplay-actions"></div>
        </div>
      </div>
    `;

    document.getElementById("cs-back-to-menu")?.addEventListener("click", () => {
      this.showMainMenu();
    });

    document.getElementById("cs-toggle-config-btn")?.addEventListener("click", () => {
      this.toggleConfiguration();
    });

    document.getElementById("cs-toggle-bag-btn")?.addEventListener("click", () => {
      this.toggleBag();
    });

    document.getElementById("cs-start-game-btn")?.addEventListener("click", () => {
      this.startGameplay();
    });

    document.getElementById("cs-reset-setup-btn-config")?.addEventListener("click", () => {
      this.resetGame();
    });

    document.getElementById("cs-reset-setup-btn-gameplay")?.addEventListener("click", () => {
      this.resetGame();
    });

    // Restore game state if it existed
    if (savedGameState) {
      this.gameState = savedGameState;
      this.currentPhase = savedPhase;

      const setupSection = document.getElementById("cs-setup-section");
      if (setupSection) setupSection.style.display = "none";

      const toggleConfigBtn = document.getElementById("cs-toggle-config-btn");
      const toggleBagBtn = document.getElementById("cs-toggle-bag-btn");

      if (savedPhase === "gameplay") {
        if (toggleConfigBtn) toggleConfigBtn.style.display = "inline-block";
        if (toggleBagBtn) toggleBagBtn.style.display = "inline-block";

        this.displayGameSummary();
        this.displayGuestBag();

        const gameSummary = document.getElementById("cs-game-summary");
        const gameplaySection = document.getElementById("cs-gameplay-section");
        if (gameSummary) gameSummary.style.display = this.configVisible ? "block" : "none";
        if (gameplaySection) gameplaySection.style.display = this.bagVisible ? "block" : "none";
      } else {
        if (toggleConfigBtn) toggleConfigBtn.style.display = "inline-block";
        const gameSummary = document.getElementById("cs-game-summary");
        if (gameSummary) gameSummary.style.display = "none";
      }
    }
  }

  // ===== GAME LOGIC =====

  startGameplay() {
    const playerCount = parseInt(document.getElementById("cs-player-count").value);

    // Create initial guest bag: 4 Tent, 4 Camper, 1 Premium Camper, 1 Cabin, 2 Maintenance, 2 Project, 1 Amenity
    const initialBag = [
      "Tent", "Tent", "Tent", "Tent",
      "Camper", "Camper", "Camper", "Camper",
      "PremiumCamper",
      "Cabin",
      "Maintenance", "Maintenance",
      "Project", "Project",
      "Amenity"
    ];

    this.gameState = {
      playerCount: playerCount,
      guestBag: [...initialBag],
      currentSeason: 1,
      currentPhase: 1,
      pulledTokens: [],
      capacity: 3,
      money: 100, // $100k
      maintenanceTracker: 0,
      amenitiesInPlay: [],
      endGameBonusCard: null,
      campgroundTiles: [],
      projectTokens: 4,
    };

    this.currentPhase = "gameplay";
    this.currentSeason = 1;
    this.currentPhaseNum = 1;

    // Hide setup, show gameplay
    const setupSection = document.getElementById("cs-setup-section");
    if (setupSection) setupSection.style.display = "none";

    const gameSummary = document.getElementById("cs-game-summary");
    if (gameSummary) gameSummary.style.display = "block";

    const gameplaySection = document.getElementById("cs-gameplay-section");
    if (gameplaySection) gameplaySection.style.display = "block";

    this.displayGameSummary();
    this.displayGuestBag();
  }

  toggleConfiguration() {
    const gameSummary = document.getElementById("cs-game-summary");
    if (gameSummary) {
      if (gameSummary.style.display === "none") {
        gameSummary.style.display = "block";
        this.configVisible = true;
      } else {
        gameSummary.style.display = "none";
        this.configVisible = false;
      }
    }
  }

  toggleBag() {
    const gameplaySection = document.getElementById("cs-gameplay-section");
    if (gameplaySection) {
      if (gameplaySection.style.display === "none") {
        gameplaySection.style.display = "block";
        this.bagVisible = true;
      } else {
        gameplaySection.style.display = "none";
        this.bagVisible = false;
      }
    }
  }

  resetGame() {
    this.gameState = null;
    this.currentPhase = "setup";
    this.currentSeason = 1;
    this.currentPhaseNum = 1;
    this.pulledTokens = [];
    this.showMainMenu();
  }

  displayGameSummary() {
    const summaryContent = document.getElementById("cs-game-summary-content");
    if (!summaryContent || !this.gameState) return;

    const state = this.gameState;
    summaryContent.innerHTML = `
      <div class="card" style="margin-bottom: 15px;">
        <h4>Game Info</h4>
        <p><strong>Players:</strong> ${state.playerCount}</p>
        <p><strong>Season:</strong> ${state.currentSeason} / 6</p>
        <p><strong>Phase:</strong> ${this.getPhaseName(state.currentPhase)}</p>
        <p><strong>Money:</strong> $${state.money}k</p>
        <p><strong>Capacity:</strong> ${state.capacity}</p>
        <p><strong>Project Tokens:</strong> ${state.projectTokens}</p>
      </div>
    `;
  }

  displayGuestBag() {
    const gameplayInfo = document.getElementById("cs-gameplay-info");
    const gameplayActions = document.getElementById("cs-gameplay-actions");
    if (!gameplayInfo || !gameplayActions || !this.gameState) return;

    const state = this.gameState;

    // Count tokens by type
    const tokenCounts = {};
    state.guestBag.forEach((token) => {
      tokenCounts[token] = (tokenCounts[token] || 0) + 1;
    });

    const totalTokens = state.guestBag.length;

    // Build token display
    let tokensHTML = '<div class="guest-bag-tokens" style="display: flex; flex-wrap: wrap; gap: 10px; margin: 15px 0;">';

    const tokenIcons = {
      Tent: "⛺",
      Camper: "🚐",
      PremiumCamper: "🚚",
      Cabin: "🏠",
      Maintenance: "🔧",
      Project: "📋",
      Amenity: "🎴"
    };

    const tokenColors = {
      Tent: "#4CAF50",
      Camper: "#9E9E9E",
      PremiumCamper: "#9C27B0",
      Cabin: "#FF9800",
      Maintenance: "#607D8B",
      Project: "#795548",
      Amenity: "#E91E63"
    };

    Object.keys(tokenCounts).forEach((tokenType) => {
      const count = tokenCounts[tokenType];
      const icon = tokenIcons[tokenType] || "🔹";
      const color = tokenColors[tokenType] || "#333";
      const name = this.getTokenName(tokenType);

      tokensHTML += `
        <div class="token-display" style="background: ${color}20; border: 2px solid ${color}; border-radius: 8px; padding: 10px; text-align: center; min-width: 80px;">
          <div style="font-size: 24px; margin-bottom: 5px;">${icon}</div>
          <div style="font-size: 12px; font-weight: bold; color: ${color};">${name}</div>
          <div style="font-size: 16px; margin-top: 5px;">x${count}</div>
        </div>
      `;
    });

    tokensHTML += '</div>';

    gameplayInfo.innerHTML = `
      <h4>Guest Bag (${totalTokens} tokens)</h4>
      <p style="color: var(--text-light); margin-bottom: 10px;">
        Capacity: ${state.capacity} camping tokens will be drawn this phase.
        Maintenance, Amenity, and Project tokens are special tokens that do not count toward capacity.
      </p>
      ${tokensHTML}
    `;

    // Build action buttons
    let actionsHTML = '<div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px;">';

    actionsHTML += `
      <button class="btn btn-primary" id="cs-btn-draw-tokens">
        🎲 Draw Tokens (Phase 5)
      </button>
      <button class="btn btn-secondary" id="cs-btn-add-tent">
        + Add Tent
      </button>
      <button class="btn btn-secondary" id="cs-btn-add-camper">
        + Add Camper
      </button>
      <button class="btn btn-secondary" id="cs-btn-add-premium">
        + Add Premium Camper
      </button>
      <button class="btn btn-secondary" id="cs-btn-add-cabin">
        + Add Cabin
      </button>
      <button class="btn btn-secondary" id="cs-btn-add-maintenance">
        + Add Maintenance
      </button>
      <button class="btn btn-secondary" id="cs-btn-add-project">
        + Add Project
      </button>
      <button class="btn btn-secondary" id="cs-btn-add-amenity">
        + Add Amenity
      </button>
      <button class="btn btn-secondary" id="cs-btn-remove-tent">
        - Remove Tent
      </button>
      <button class="btn btn-secondary" id="cs-btn-remove-camper">
        - Remove Camper
      </button>
      <button class="btn btn-secondary" id="cs-btn-remove-premium">
        - Remove Premium Camper
      </button>
      <button class="btn btn-secondary" id="cs-btn-remove-cabin">
        - Remove Cabin
      </button>
      <button class="btn btn-secondary" id="cs-btn-remove-maintenance">
        - Remove Maintenance
      </button>
      <button class="btn btn-secondary" id="cs-btn-remove-project">
        - Remove Project
      </button>
      <button class="btn btn-secondary" id="cs-btn-remove-amenity">
        - Remove Amenity
      </button>
      <button class="btn btn-secondary" id="cs-btn-shuffle-bag">
        🔀 Shuffle Bag
      </button>
      <button class="btn btn-secondary" id="cs-btn-next-phase">
        Next Phase →
      </button>
    `;

    actionsHTML += '</div>';

    gameplayActions.innerHTML = actionsHTML;

    // Attach event listeners
    document.getElementById("cs-btn-draw-tokens")?.addEventListener("click", () => {
      this.drawTokens();
    });

    document.getElementById("cs-btn-add-tent")?.addEventListener("click", () => {
      this.addToken("Tent");
    });

    document.getElementById("cs-btn-add-camper")?.addEventListener("click", () => {
      this.addToken("Camper");
    });

    document.getElementById("cs-btn-add-premium")?.addEventListener("click", () => {
      this.addToken("PremiumCamper");
    });

    document.getElementById("cs-btn-add-cabin")?.addEventListener("click", () => {
      this.addToken("Cabin");
    });

    document.getElementById("cs-btn-add-maintenance")?.addEventListener("click", () => {
      this.addToken("Maintenance");
    });

    document.getElementById("cs-btn-add-project")?.addEventListener("click", () => {
      this.addToken("Project");
    });

    document.getElementById("cs-btn-add-amenity")?.addEventListener("click", () => {
      this.addToken("Amenity");
    });

    document.getElementById("cs-btn-remove-tent")?.addEventListener("click", () => {
      this.removeToken("Tent");
    });

    document.getElementById("cs-btn-remove-camper")?.addEventListener("click", () => {
      this.removeToken("Camper");
    });

    document.getElementById("cs-btn-remove-premium")?.addEventListener("click", () => {
      this.removeToken("PremiumCamper");
    });

    document.getElementById("cs-btn-remove-cabin")?.addEventListener("click", () => {
      this.removeToken("Cabin");
    });

    document.getElementById("cs-btn-remove-maintenance")?.addEventListener("click", () => {
      this.removeToken("Maintenance");
    });

    document.getElementById("cs-btn-remove-project")?.addEventListener("click", () => {
      this.removeToken("Project");
    });

    document.getElementById("cs-btn-remove-amenity")?.addEventListener("click", () => {
      this.removeToken("Amenity");
    });

    document.getElementById("cs-btn-shuffle-bag")?.addEventListener("click", () => {
      this.shuffleBag();
    });

    document.getElementById("cs-btn-next-phase")?.addEventListener("click", () => {
      this.nextPhase();
    });
  }

  addToken(tokenType) {
    if (!this.gameState) return;
    this.gameState.guestBag.push(tokenType);
    this.displayGuestBag();
  }

  removeToken(tokenType) {
    if (!this.gameState) return;
    const index = this.gameState.guestBag.indexOf(tokenType);
    if (index > -1) {
      this.gameState.guestBag.splice(index, 1);
    }
    this.displayGuestBag();
  }

  shuffleBag() {
    if (!this.gameState) return;
    const bag = [...this.gameState.guestBag];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.gameState.guestBag = bag;
    this.displayGuestBag();
  }

  drawTokens() {
    if (!this.gameState) return;

    const state = this.gameState;
    const capacity = state.capacity;
    const drawnTokens = [];
    const remainingBag = [...state.guestBag];

    // Draw up to capacity camping tokens
    let drawnCount = 0;
    const specialTokens = [];

    while (drawnCount < capacity && remainingBag.length > 0) {
      const token = remainingBag.shift();
      if (token === "Maintenance" || token === "Amenity" || token === "Project") {
        specialTokens.push(token);
      } else {
        drawnTokens.push(token);
        drawnCount++;
      }
    }

    // Update bag
    state.guestBag = remainingBag;

    // Show draw modal
    this.showDrawModal(drawnTokens, specialTokens, remainingBag);
  }

  showDrawModal(drawnTokens, specialTokens, remainingBag) {
    const tokenNames = {
      Tent: "Tent",
      Camper: "Camper",
      PremiumCamper: "Premium Camper",
      Cabin: "Cabin",
      Maintenance: "Maintenance",
      Amenity: "Amenity",
      Project: "Project"
    };

    const tokenIcons = {
      Tent: "⛺",
      Camper: "🚐",
      PremiumCamper: "🚚",
      Cabin: "🏠",
      Maintenance: "🔧",
      Amenity: "🎴",
      Project: "📋"
    };

    let tokensHTML = '<div class="drawn-tokens-grid">';

    // Drawn camping tokens
    drawnTokens.forEach((token, index) => {
      const name = tokenNames[token];
      const icon = tokenIcons[token];
      tokensHTML += `
        <div class="drawn-token-card" data-token="${token}" data-index="${index}" data-type="drawn">
          <img src="./assets/campingseason/tiles/${token}.png" alt="${name}" class="drawn-token-image">
          <div style="position: absolute; bottom: 5px; right: 5px; background: rgba(0,0,0,0.5); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px;">${index + 1}</div>
        </div>
      `;
    });

    // Special tokens
    specialTokens.forEach((token, index) => {
      const name = tokenNames[token];
      const icon = tokenIcons[token];
      tokensHTML += `
        <div class="drawn-token-card" data-token="${token}" data-index="${index}" data-type="special">
          <img src="./assets/campingseason/tiles/${token}.png" alt="${name}" class="drawn-token-image">
          <div style="position: absolute; bottom: 5px; right: 5px; background: rgba(0,0,0,0.5); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px;">${index + 1}</div>
        </div>
      `;
    });

    tokensHTML += '</div>';

    const modalHTML = `
      <div class="dice-modal show" id="cs-draw-modal">
        <div class="dice-modal-overlay"></div>
        <div class="dice-modal-content" style="max-width: 700px; max-height: 85vh; overflow-y: auto;">
          <button class="btn btn-secondary" id="cs-close-draw-modal" style="width: 100%; margin-bottom: 20px;">
            ← Return
          </button>
          <h3>Drawn Tokens</h3>
          <p style="color: var(--text-light); margin-bottom: 15px;">
            Click to take tokens. Taken tokens will be removed from the bag.
          </p>
          ${tokensHTML}
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const modal = document.getElementById("cs-draw-modal");
    const overlay = modal.querySelector(".dice-modal-overlay");
    const closeBtn = document.getElementById("cs-close-draw-modal");

    const takenTokens = new Set();

    const drawnTokenCards = modal.querySelectorAll(".drawn-token-card");
    drawnTokenCards.forEach((card) => {
      card.addEventListener("click", () => {
        const token = card.getAttribute("data-token");
        const index = parseInt(card.getAttribute("data-index"));
        const tokenKey = `${token}-${index}`;

        if (takenTokens.has(tokenKey)) {
          card.style.opacity = "1";
          takenTokens.delete(tokenKey);
          this.gameState.guestBag.push(token);
        } else {
          card.style.opacity = "0.3";
          takenTokens.add(tokenKey);
          const bagIndex = this.gameState.guestBag.indexOf(token);
          if (bagIndex > -1) {
            this.gameState.guestBag.splice(bagIndex, 1);
          }
        }

        this.displayGuestBag();
      });
    });

    const closeModal = () => {
      modal.remove();
    };

    overlay.addEventListener("click", closeModal);
    closeBtn.addEventListener("click", closeModal);
  }

  nextPhase() {
    if (!this.gameState) return;

    const state = this.gameState;

    if (state.currentPhase < 6) {
      state.currentPhase++;
    } else {
      // End of season - move to next season
      state.currentSeason++;
      state.currentPhase = 1;

      // Return pulled tokens to bag
      state.guestBag.push(...state.pulledTokens);
      state.pulledTokens = [];

      if (state.currentSeason > 6) {
        alert("Game complete! Final season finished.");
        return;
      }
    }

    this.currentSeason = state.currentSeason;
    this.currentPhaseNum = state.currentPhase;

    this.displayGameSummary();
    this.displayGuestBag();
  }

  // ===== HELPERS =====

  getTokenName(tokenType) {
    const names = {
      Tent: "Tent",
      Camper: "Camper",
      PremiumCamper: "Premium Camper",
      Cabin: "Cabin",
      Maintenance: "Maintenance",
      Amenity: "Amenity",
      Project: "Project"
    };
    return names[tokenType] || tokenType;
  }

  getPhaseName(phaseNum) {
    const phaseNames = {
      1: "Winter Upkeep",
      2: "Play Amenity Card",
      3: "Draw New Season Card",
      4: "Roll Maintenance Die",
      5: "Draw from Guest Bag",
      6: "Earn Money & Gain Points"
    };
    return phaseNames[phaseNum] || `Phase ${phaseNum}`;
  }
}

// Create global instance
window.CampingSeasonGame = new CampingSeasonGame();
