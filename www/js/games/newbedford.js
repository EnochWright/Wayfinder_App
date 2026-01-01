// New Bedford Game Module
// Handles all New Bedford specific functionality

class NewBedfordGame {
  constructor() {
    this.currentPhase = "setup"; // setup, gameplay, scoring
    this.gameConfig = null;
    this.configVisible = false;
    this.buildingsVisible = false;
  }

  // ===== DATA METHODS =====

  // Parse cost code (e.g., "3W" -> "3 Wood", "2F" -> "2 Food")
  parseCostCode(code) {
      const resourceMap = {
          'W': 'Wood',
          'F': 'Food',
          'B': 'Brick',
          'M': 'Money',
          'G': 'Goods'
      };
      
      const match = code.match(/^(\d+)([A-Z])$/);
      if (match) {
          const amount = match[1];
          const resource = resourceMap[match[2]] || match[2];
          return `${amount} ${resource}`;
      }
      return code; // Return as-is if doesn't match pattern
  }

  // Get buildings from data manager
  async getBuildings() {
    // Load buildings data if not already loaded
    if (!window.dataManager.isLoaded("newbedford", "buildings")) {
      await window.dataManager.loadGameData(
        "newbedford",
        "buildings",
        "./data/newbedford-buildings.json"
      );
    }
    return window.dataManager.getData("newbedford", "buildings");
  }

  // ===== UI INITIALIZATION =====

  // Initialize the New Bedford page
  init() {
    console.log("Initializing New Bedford game...");
    this.setupUI();
  }

  setupUI() {
    const container = document.getElementById("newbedford-content");
    if (!container) {
      // Fallback to old event listeners if container doesn't exist
      this.setupEventListeners();
      return;
    }

    this.showMainMenu();
  }

  showMainMenu() {
    const container = document.getElementById("newbedford-content");
    if (!container) return;

    container.innerHTML = `
            <div class="rail-baron-container">
                <h2>New Bedford</h2>
                
                <div class="rail-baron-menu">
                    <button class="rail-baron-menu-btn" id="btn-setup-play">
                        <span class="menu-icon">🎮</span>
                        <span class="menu-title">Setup + Play</span>
                        <span class="menu-desc">Configure game setup and/or use app to play</span>
                    </button>
                    
                    <button class="rail-baron-menu-btn" id="btn-score-calc">
                        <span class="menu-icon">🧮</span>
                        <span class="menu-title">Score Calculator</span>
                        <span class="menu-desc">Calculate final game scores</span>
                    </button>
                    
                    <button class="rail-baron-menu-btn" id="btn-buildings">
                        <span class="menu-icon">🏛️</span>
                        <span class="menu-title">Buildings Reference</span>
                        <span class="menu-desc">View all buildings with details</span>
                    </button>
                </div>
            </div>
        `;

    // Attach menu button listeners
    document.getElementById("btn-setup-play")?.addEventListener("click", () => {
      this.showSetupPlay();
    });
    
    document.getElementById("btn-buildings")?.addEventListener("click", () => {
      this.showBuildingsReference();
    });
    
    document.getElementById("btn-score-calc")?.addEventListener("click", () => {
      this.showScoreCalculator();
    });
  }

  showSetupPlay() {
    const container = document.getElementById("newbedford-content");
    if (!container) return;

    // Save current game state before rebuilding
    const savedGameConfig = this.gameConfig;
    const savedPhase = this.currentPhase;

    container.innerHTML = `
            <div class="rail-baron-container">
                <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; align-items: center;">
                    <button class="back-button" id="back-to-menu">← Back to Menu</button>
                    <button class="back-button" id="toggle-config-btn" style="display: none; background: var(--secondary-color);">Config</button>
                    <button class="back-button" id="toggle-buildings-btn" style="display: none; background: var(--secondary-color);">Buildings</button>
                </div>
               
                
                <div class="roll-section" id="setup-section">
                    <h3>Game Setup <button type="button" class="help-btn" id="game-setup-help" title="How does building selection work?">?</button></h3>
                    
                    <!-- Expansion Selection (Radio Buttons) -->
                    <div class="setting-item">
                        <label class="setting-label">Expansion:</label>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" name="expansion" value="base" class="setting-radio" checked>
                                Base Game
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="expansion" value="rising-tide" class="setting-radio">
                                Base Game + Rising Tide
                            </label>
                        </div>
                    </div>
                    
                    <!-- Player Count -->
                    <div class="setting-item">
                        <label for="player-count">Number of Players:</label>
                        <select id="player-count" class="setting-input">
                            <option value="2">2 Players</option>
                            <option value="3">3 Players</option>
                            <option value="4">4 Players</option>
                            <option value="5" disabled>5 Players (Rising Tide only)</option>
                        </select>
                    </div>
                    
                    <!-- Rising Tide Options (shown when Rising Tide is selected) -->
                    <div id="rising-tide-options" style="display: none;">
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="ships-log-checkbox" class="setting-checkbox">
                                Use Ship's Log
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="variant-setup-checkbox" class="setting-checkbox">
                                Use Variant Setup
                                <button type="button" class="help-btn" id="variant-setup-help" title="What is Variant Setup?">?</button>
                            </label>
                        </div>
                    </div>
                    
                    <!-- 2 Player Variant (shown when 2 players selected) -->
                    <div id="two-player-options" style="display: none;">
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="two-player-variant-checkbox" class="setting-checkbox">
                                Use 2-Player Variant Rules
                                <button type="button" class="help-btn" id="two-player-variant-help" title="What is 2-Player Variant?">?</button>
                            </label>
                        </div>
                    </div>
                    
                    <!-- 4 Player Variant (shown when 4 players selected AND Rising Tide) -->
                    <div id="four-player-options" style="display: none;">
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="four-player-variant-checkbox" class="setting-checkbox">
                                Use 4-Player Variant Rules
                                <button type="button" class="help-btn" id="four-player-variant-help" title="What is 4-Player Variant?">?</button>
                            </label>
                        </div>
                    </div>
                    
                    <!-- White Whale Promos (Checkboxes) -->
                    <div class="setting-item">
                        <label class="setting-label">White Whale Promos:</label>
                        <div class="checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="promo" value="ambergris" class="setting-checkbox">
                                Ambergris
                                <button type="button" class="help-btn" id="ambergris-help" title="What is Ambergris?">?</button>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="promo" value="blue-whale" class="setting-checkbox">
                                Blue Whale
                                <button type="button" class="help-btn" id="blue-whale-help" title="What is Blue Whale?">?</button>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="promo" value="castaway" class="setting-checkbox">
                                Castaway
                                <button type="button" class="help-btn" id="castaway-help" title="What is Castaway?">?</button>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="promo" value="white-whale" class="setting-checkbox">
                                White Whale
                                <button type="button" class="help-btn" id="white-whale-help" title="What is White Whale?">?</button>
                            </label>
                        </div>
                    </div>
                    
                    <!-- AI Captains -->
                    <div class="setting-item">
                        <label for="ai-captains">Lonely Ocean - AI Captains:</label>
                        <select id="ai-captains" class="setting-input">
                            <option value="0">None</option>
                            <option value="1">1 AI Captain</option>
                            <option value="2">2 AI Captains</option>
                            <option value="3">3 AI Captains</option>
                            <option value="4">4 AI Captains</option>
                        </select>
                    </div>
                    
                    <!-- Turner's Mill Option (shown when AI Captains > 0) -->
                    <div id="turners-mill-options" style="display: none;">
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="turners-mill-checkbox" class="setting-checkbox">
                                Use Turner's Mill?
                                <button type="button" class="help-btn" id="turners-mill-help" title="What is Turner's Mill?">?</button>
                            </label>
                        </div>
                    </div>
                    
                    <!-- Show Buildings Button -->
                    <button class="btn btn-primary" id="start-game-btn">Next</button>
                </div>
                
                <!-- Game Summary (shown after setup) -->
                <div class="roll-section" id="game-summary" style="display: none;">
                    <div class="card-header-with-button">
                        <h3>Game Configuration</h3>
                        <button class="btn btn-secondary" id="reset-setup-btn-config" style="background: #ea4335; color: white; padding: 8px 16px; font-size: 0.9rem;">Reset</button>
                    </div>
                    <div id="game-summary-content"></div>
                </div>
                
                <!-- Buildings Section -->
                <div class="roll-section" id="buildings-section" style="display: none;">
                    <div class="card-header-with-button">
                        <h3>Buildings</h3>
                    </div>
                    <div id="buildings-list"></div>
                    <button class="btn btn-primary" id="start-game-btn-final" style="width: 100%; margin-top: 20px;">Start Game</button>
                </div>
                
                <!-- Gameplay Section (shown after Start Game) -->
                <div class="roll-section" id="gameplay-section" style="display: none;">
                    <h3>Game in Progress</h3>
                    <p>Gameplay features coming soon...</p>
                </div>
            </div>
        `;

    // Attach back button listener
    document.getElementById("back-to-menu")?.addEventListener("click", () => {
      this.showMainMenu();
    });

    // Attach toggle buttons listeners
    document
      .getElementById("toggle-config-btn")
      ?.addEventListener("click", () => {
        this.toggleConfiguration();
      });

    document
      .getElementById("toggle-buildings-btn")
      ?.addEventListener("click", () => {
        this.toggleBuildings();
      });

    // Attach Start Game button listener
    document
      .getElementById("start-game-btn-final")
      ?.addEventListener("click", () => {
        this.startGameplay();
      });

    this.setupEventListeners();

    // Restore game state if it existed
    if (savedGameConfig) {
      this.gameConfig = savedGameConfig;
      this.currentPhase = savedPhase;

      // Hide setup section
      const setupSection = document.getElementById("setup-section");
      if (setupSection) setupSection.style.display = "none";

      // Show appropriate buttons based on phase
      const toggleConfigBtn = document.getElementById("toggle-config-btn");
      const toggleBuildingsBtn = document.getElementById(
        "toggle-buildings-btn"
      );

      if (savedPhase === "gameplay") {
        // In gameplay - show toggle buttons
        if (toggleConfigBtn) toggleConfigBtn.style.display = "inline-block";
        if (toggleBuildingsBtn)
          toggleBuildingsBtn.style.display = "inline-block";

        // Rebuild game summary and buildings (but don't show them)
        this.displayGameSummary();
        this.displayBuildings();

        // Restore visibility state from instance variables
        const gameSummary = document.getElementById("game-summary");
        const buildingsSection = document.getElementById("buildings-section");
        if (gameSummary)
          gameSummary.style.display = this.configVisible ? "block" : "none";
        if (buildingsSection)
          buildingsSection.style.display = this.buildingsVisible
            ? "block"
            : "none";

        // Rebuild and show gameplay section
        this.rebuildGameplaySection();
      } else {
        // In setup - show config button
        if (toggleConfigBtn) toggleConfigBtn.style.display = "inline-block";

        // Show game summary and buildings
        this.displayGameSummary();
        this.displayBuildings();

        // Hide config by default
        const gameSummary = document.getElementById("game-summary");
        if (gameSummary) gameSummary.style.display = "none";
      }
    }
  }

  async showBuildingsReference() {
      const container = document.getElementById('newbedford-content');
      if (!container) return;

      container.innerHTML = `
          <div class="rail-baron-container">
              <button class="back-button" id="back-to-menu-buildings">← Back to Menu</button>
              <h2>Buildings Reference</h2>
              <p class="subtitle">All buildings with complete details</p>
              
              <div class="roll-section">
                  <div id="buildings-reference-list" style="display: flex; flex-direction: column; gap: 12px;"></div>
              </div>
          </div>
      `;

      // Attach back button listener
      document.getElementById('back-to-menu-buildings')?.addEventListener('click', () => {
          this.showMainMenu();
      });

      // Load and display all buildings
      const allBuildings = await this.getBuildings();
      
      // Sort buildings by type then alphabetically
      const sortedBuildings = [...allBuildings].sort((a, b) => {
          const typeOrder = { 'action': 1, 'ships-log': 2, 'lonely-ocean': 3, 'victory': 4 };
          const typeA = typeOrder[a.type] || 99;
          const typeB = typeOrder[b.type] || 99;
          
          if (typeA !== typeB) {
              return typeA - typeB;
          }
          
          return a.name.localeCompare(b.name);
      });

      const buildingsList = document.getElementById('buildings-reference-list');
      if (!buildingsList) return;

      // Create building cards
      sortedBuildings.forEach(building => {
          const buildingCard = document.createElement('div');
          buildingCard.className = 'building-card';
          
          // Add special class based on type
          if (building.type === 'action') {
              buildingCard.classList.add('building-card-action');
          } else if (building.type === 'victory') {
              buildingCard.classList.add('building-card-victory');
          } else if (building.type === 'ships-log') {
              buildingCard.classList.add('building-card-ships-log');
          } else if (building.type === 'lonely-ocean') {
              buildingCard.classList.add('building-card-lonely-ocean');
          }
          
          buildingCard.innerHTML = `
              <div class="building-header">
                  <h4>${building.name}</h4>
                  <span class="building-type building-type-${building.type}">${building.type}</span>
              </div>
              <div class="building-details">
                  <p><strong>Players:</strong> ${building.players}${building.usable2p ? ' (2P Variant)' : ''}${building.usable4p ? ' (4P Variant)' : ''}</p>
                  <p><strong>Game:</strong> ${building.game === 'base' ? 'Base Game' : 'Rising Tide'}</p>
                  <p><strong>Points:</strong> ${building.points}${building.points === '1+' ? ' (variable - see benefit)' : ''}</p>
                  ${building.cost && building.cost.length > 0 ? `<p><strong>Cost:</strong> ${building.cost.map(c => this.parseCostCode(c)).join(', ')}</p>` : ''}
                  ${building.benefit ? `<p><strong>Benefit:</strong> ${building.benefit}</p>` : ''}
              </div>
          `;
          buildingsList.appendChild(buildingCard);
      });
  }

  async showScoreCalculator() {
      const container = document.getElementById('newbedford-content');
      if (!container) return;

      // Initialize whale counts and building count
      this.whaleScores = {
          rightWhales: 0,
          bowheadWhales: 0,
          spermWhales: 0,
          blueWhale: 0,
          whiteWhale: 0
      };
      this.totalBuildings = 0;
      this.totalMoney = 0;

      container.innerHTML = `
          <div class="rail-baron-container">
              <button class="back-button" id="back-to-menu-score">← Back to Menu</button>
              <h2>Score Calculator</h2>
              
              <div class="roll-section">
                  <h3>Whale Tokens</h3>
                  <div class="dice-value-selector" style="margin-bottom: 15px;">
                      <label>Right Whales (1 point each):</label>
                      <button class="dice-value-btn" id="right-whales-btn">
                          <span class="dice-value-display" id="right-whales-value">0</span>
                      </button>
                  </div>
                  <div class="dice-value-selector" style="margin-bottom: 15px;">
                      <label>Bowhead Whales (2 points each):</label>
                      <button class="dice-value-btn" id="bowhead-whales-btn">
                          <span class="dice-value-display" id="bowhead-whales-value">0</span>
                      </button>
                  </div>
                  <div class="dice-value-selector" style="margin-bottom: 15px;">
                      <label>Sperm Whales (4 points each):</label>
                      <button class="dice-value-btn" id="sperm-whales-btn">
                          <span class="dice-value-display" id="sperm-whales-value">0</span>
                      </button>
                  </div>
                  <div class="dice-value-selector" style="margin-bottom: 15px;">
                      <label>Blue Whale (6 points):</label>
                      <button class="dice-value-btn" id="blue-whale-btn">
                          <span class="dice-value-display" id="blue-whale-value">0</span>
                      </button>
                  </div>
                  <div class="dice-value-selector" style="margin-bottom: 15px;">
                      <label>White Whale (4 points):</label>
                      <button class="dice-value-btn" id="white-whale-btn">
                          <span class="dice-value-display" id="white-whale-value">0</span>
                      </button>
                  </div>
              </div>
              
              <div class="roll-section">
                  <h3>Buildings</h3>
                  <div class="dice-value-selector">
                      <label>Total Buildings Owned:</label>
                      <button class="dice-value-btn" id="total-buildings-btn">
                          <span class="dice-value-display" id="total-buildings-value">0</span>
                      </button>
                  </div>
              </div>
              
              <div class="roll-section">
                  <h3>Victory Buildings</h3>
                  <p style="color: var(--text-light); margin-bottom: 15px;">Click any Victory Buildings you own:</p>
                  <div id="victory-buildings-list"></div>
              </div>
              
              <div class="roll-section">
                  <h3>Money</h3>
                  <div class="dice-value-selector">
                      <label>Total Money ($5 = 1 point):</label>
                      <button class="dice-value-btn" id="total-money-btn">
                          <span class="dice-value-display" id="total-money-value">$0</span>
                      </button>
                  </div>
              </div>
              
              <button class="btn btn-primary" id="calculate-score-btn" style="width: 100%; margin-top: 0px; margin-bottom: 20px;">Calculate Score</button>
              
              <div class="roll-section" id="score-result" style="display: none;">
                  <h3>Final Score</h3>
                  <div id="score-breakdown"></div>
                  <button class="btn btn-secondary" id="reset-score-btn" style="width: 100%; margin-top: 20px; background: #ea4335;">
                      Reset Score
                  </button>
              </div>
          </div>
      `;

      // Attach back button listener
      document.getElementById('back-to-menu-score')?.addEventListener('click', () => {
          this.showMainMenu();
      });

      // Attach whale button listeners
      this.attachWhaleButtonListeners();
      
      // Attach buildings button listener
      const buildingsBtn = document.getElementById('total-buildings-btn');
      if (buildingsBtn) {
          buildingsBtn.addEventListener('click', () => {
              this.showBuildingsPickerModal();
          });
      }
      
      // Attach money button listener
      const moneyBtn = document.getElementById('total-money-btn');
      if (moneyBtn) {
          moneyBtn.addEventListener('click', () => {
              this.showMoneyPickerModal();
          });
      }

      // Load victory buildings and ships-log buildings with variable scoring (like Newspaper)
      const allBuildings = await this.getBuildings();
      const scoringBuildings = allBuildings.filter(b =>
          b.type === 'victory' || (b.type === 'ships-log' && b.points === '1+')
      ).sort((a, b) => a.name.localeCompare(b.name));
      
      const victoryList = document.getElementById('victory-buildings-list');
      if (victoryList) {
          scoringBuildings.forEach(building => {
              const buildingBtn = document.createElement('button');
              buildingBtn.className = 'building-select-btn';
              buildingBtn.setAttribute('data-building-id', building.id);
              buildingBtn.setAttribute('data-building-name', building.name);
              buildingBtn.setAttribute('data-building-points', building.points);
              buildingBtn.setAttribute('data-building-benefit', building.benefit);
              buildingBtn.innerHTML = `
                  <div>
                      <strong>${building.name}</strong> (${building.points} points)
                      <br><span style="font-size: 0.9rem; color: var(--text-light);">${building.benefit}</span>
                  </div>
              `;
              buildingBtn.addEventListener('click', () => {
                  this.handleVictoryBuildingClick(building);
              });
              victoryList.appendChild(buildingBtn);
          });
      }

      // Attach calculate button listener
      document.getElementById('calculate-score-btn')?.addEventListener('click', () => {
          this.calculateFinalScore();
      });
      
      // Attach reset score button listener
      document.getElementById('reset-score-btn')?.addEventListener('click', () => {
          this.resetScore();
      });
  }

  resetScore() {
      // Reset all values
      this.whaleScores = {
          rightWhales: 0,
          bowheadWhales: 0,
          spermWhales: 0,
          blueWhale: 0,
          whiteWhale: 0
      };
      this.totalBuildings = 0;
      this.totalMoney = 0;
      
      // Update displays
      document.getElementById('right-whales-value').textContent = '0';
      document.getElementById('bowhead-whales-value').textContent = '0';
      document.getElementById('sperm-whales-value').textContent = '0';
      document.getElementById('blue-whale-value').textContent = '0';
      document.getElementById('white-whale-value').textContent = '0';
      document.getElementById('total-buildings-value').textContent = '0';
      document.getElementById('total-money-value').textContent = '$0';
      
      // Deselect all victory buildings
      document.querySelectorAll('.building-select-btn.selected').forEach(btn => {
          btn.classList.remove('selected');
          btn.removeAttribute('data-variable-count');
      });
      
      // Hide score result
      const scoreResult = document.getElementById('score-result');
      if (scoreResult) {
          scoreResult.style.display = 'none';
      }
  }

  attachWhaleButtonListeners() {
      const whaleButtons = [
          { id: 'right-whales', key: 'rightWhales', name: 'Right Whales', points: 1, max: 36 },
          { id: 'bowhead-whales', key: 'bowheadWhales', name: 'Bowhead Whales', points: 2, max: 20 },
          { id: 'sperm-whales', key: 'spermWhales', name: 'Sperm Whales', points: 4, max: 4 },
          { id: 'blue-whale', key: 'blueWhale', name: 'Blue Whale', points: 6, max: 1 },
          { id: 'white-whale', key: 'whiteWhale', name: 'White Whale', points: 4, max: 1 }
      ];

      whaleButtons.forEach(whale => {
          const btn = document.getElementById(`${whale.id}-btn`);
          if (btn) {
              btn.addEventListener('click', () => {
                  this.showWhalePickerModal(whale);
              });
          }
      });
  }

  showWhalePickerModal(whale) {
      const currentValue = this.whaleScores[whale.key];
      const maxValue = whale.max || 36;
      
      const modalHTML = `
          <div class="dice-modal show" id="whale-picker-modal">
              <div class="dice-modal-overlay"></div>
              <div class="dice-modal-content" style="max-height: 85vh; display: flex; flex-direction: column;">
                  <h3 style="margin: 0 0 10px 0;">${whale.name}</h3>
                  <p style="text-align: center; font-size: 1.1rem; color: var(--text-light); margin-bottom: 15px;">
                      ${whale.points} point${whale.points !== 1 ? 's' : ''} ${maxValue > 1 ? 'each' : ''}
                  </p>
                  <div style="overflow-y: auto; flex: 1; margin-bottom: 15px; padding-top: 2px;">
                      <div class="whale-picker-grid">
                          ${Array.from({length: maxValue + 1}, (_, i) => `
                              <button class="dice-picker-btn ${i === currentValue ? 'selected' : ''}" data-value="${i}">
                                  ${i}
                              </button>
                          `).join('')}
                      </div>
                  </div>
                  <button class="btn btn-secondary" id="close-whale-picker" style="width: 100%;">
                      Done
                  </button>
              </div>
          </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);

      const modal = document.getElementById('whale-picker-modal');
      const overlay = modal.querySelector('.dice-modal-overlay');
      const closeBtn = document.getElementById('close-whale-picker');
      const pickerBtns = modal.querySelectorAll('.dice-picker-btn');

      pickerBtns.forEach(btn => {
          btn.addEventListener('click', () => {
              const value = parseInt(btn.getAttribute('data-value'));
              this.whaleScores[whale.key] = value;
              
              // Update display
              const displayElement = document.getElementById(`${whale.id}-value`);
              if (displayElement) {
                  displayElement.textContent = value;
              }

              // Update button selection
              pickerBtns.forEach(b => b.classList.remove('selected'));
              btn.classList.add('selected');
          });
      });

      const closeModal = () => {
          modal.remove();
      };

      overlay.addEventListener('click', closeModal);
      closeBtn.addEventListener('click', closeModal);
  }

  showBuildingsPickerModal() {
      const currentValue = this.totalBuildings;
      const maxValue = 20;
      
      const modalHTML = `
          <div class="dice-modal show" id="buildings-picker-modal">
              <div class="dice-modal-overlay"></div>
              <div class="dice-modal-content" style="max-height: 85vh; display: flex; flex-direction: column;">
                  <h3 style="margin: 0 0 10px 0;">Total Buildings Owned</h3>
                  <p style="text-align: center; font-size: 1.1rem; color: var(--text-light); margin-bottom: 15px;">
                      1 point each
                  </p>
                  <div style="overflow-y: auto; flex: 1; margin-bottom: 15px; padding-top: 2px;">
                      <div class="whale-picker-grid">
                          ${Array.from({length: maxValue + 1}, (_, i) => `
                              <button class="dice-picker-btn ${i === currentValue ? 'selected' : ''}" data-value="${i}">
                                  ${i}
                              </button>
                          `).join('')}
                      </div>
                  </div>
                  <button class="btn btn-secondary" id="close-buildings-picker" style="width: 100%;">
                      Done
                  </button>
              </div>
          </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);

      const modal = document.getElementById('buildings-picker-modal');
      const overlay = modal.querySelector('.dice-modal-overlay');
      const closeBtn = document.getElementById('close-buildings-picker');
      const pickerBtns = modal.querySelectorAll('.dice-picker-btn');

      pickerBtns.forEach(btn => {
          btn.addEventListener('click', () => {
              const value = parseInt(btn.getAttribute('data-value'));
              this.totalBuildings = value;
              
              // Update display
              const displayElement = document.getElementById('total-buildings-value');
              if (displayElement) {
                  displayElement.textContent = value;
              }

              // Update button selection
              pickerBtns.forEach(b => b.classList.remove('selected'));
              btn.classList.add('selected');
          });
      });

      const closeModal = () => {
          modal.remove();
      };

      overlay.addEventListener('click', closeModal);
      closeBtn.addEventListener('click', closeModal);
  }

  showMoneyPickerModal() {
      const currentValue = this.totalMoney;
      
      const modalHTML = `
          <div class="dice-modal show" id="money-picker-modal">
              <div class="dice-modal-overlay"></div>
              <div class="dice-modal-content" style="max-height: 85vh; display: flex; flex-direction: column;">
                  <h3 style="margin: 0 0 10px 0;">Total Money</h3>
                  <p style="text-align: center; font-size: 1.1rem; color: var(--text-light); margin-bottom: 15px;">
                      $5 = 1 point
                  </p>
                  <div style="overflow-y: auto; overflow-x: hidden; flex: 1; margin-bottom: 15px; padding-top: 2px;">
                      <div class="money-picker-grid">
                          ${Array.from({length: 11}, (_, i) => {
                              const value = i * 5;
                              return `
                                  <button class="dice-picker-btn ${value === currentValue ? 'selected' : ''}" data-value="${value}">
                                      $${value}
                                  </button>
                              `;
                          }).join('')}
                      </div>
                  </div>
                  <button class="btn btn-secondary" id="close-money-picker" style="width: 100%;">
                      Done
                  </button>
              </div>
          </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);

      const modal = document.getElementById('money-picker-modal');
      const overlay = modal.querySelector('.dice-modal-overlay');
      const closeBtn = document.getElementById('close-money-picker');
      const pickerBtns = modal.querySelectorAll('.dice-picker-btn');

      pickerBtns.forEach(btn => {
          btn.addEventListener('click', () => {
              const value = parseInt(btn.getAttribute('data-value'));
              this.totalMoney = value;
              
              // Update display
              const displayElement = document.getElementById('total-money-value');
              if (displayElement) {
                  displayElement.textContent = `$${value}`;
              }

              // Update button selection
              pickerBtns.forEach(b => b.classList.remove('selected'));
              btn.classList.add('selected');
          });
      });

      const closeModal = () => {
          modal.remove();
      };

      overlay.addEventListener('click', closeModal);
      closeBtn.addEventListener('click', closeModal);
  }

  handleVictoryBuildingClick(building) {
      // Buildings that use values already on the page (auto-calculate)
      // Candleworks: 6, Counting House: 13, Dressmaker: 17, Municipal Office: 32
      const autoCalculateBuildings = [6, 13, 17, 32];
      
      // Buildings that need additional input
      const variableBuildings = {
          33: { type: 'shipsLogPages', label: 'Ship\'s Log Pages', max: 20 }, // Newspaper
          36: { type: 'dhmgBuildings', label: 'Buildings with DHMG Symbol', max: 20 }, // Publishing House
          40: { type: 'goods', label: 'Goods', max: 20 } // Salvage Yard
      };

      if (autoCalculateBuildings.includes(building.id)) {
          // Just toggle selection - will auto-calculate using existing values
          const btn = document.querySelector(`[data-building-id="${building.id}"]`);
          if (btn) {
              btn.classList.toggle('selected');
          }
      } else if (variableBuildings[building.id]) {
          this.showVariableBuildingModal(building, variableBuildings[building.id]);
      } else {
          // Fixed point building - just toggle selection
          const btn = document.querySelector(`[data-building-id="${building.id}"]`);
          if (btn) {
              btn.classList.toggle('selected');
          }
      }
  }

  showVariableBuildingModal(building, variableInfo) {
      const btn = document.querySelector(`[data-building-id="${building.id}"]`);
      const isSelected = btn?.classList.contains('selected');
      const currentValue = parseInt(btn?.getAttribute('data-variable-count') || 0);
      const maxValue = variableInfo.max || 20;
      
      const modalHTML = `
          <div class="dice-modal show" id="variable-building-modal">
              <div class="dice-modal-overlay"></div>
              <div class="dice-modal-content" style="max-height: 85vh; display: flex; flex-direction: column;">
                  <h3 style="margin: 0 0 10px 0;">${building.name}</h3>
                  <p style="color: var(--text-light); margin-bottom: 15px; line-height: 1.6; text-align: center;">
                      ${building.benefit}
                  </p>
                  <p style="text-align: center; font-size: 1.1rem; color: var(--text-color); margin-bottom: 15px; font-weight: 600;">
                      How many ${variableInfo.label}?
                  </p>
                  <div style="overflow-y: auto; flex: 1; margin-bottom: 15px; padding-top: 2px;">
                      <div class="whale-picker-grid">
                          ${Array.from({length: maxValue + 1}, (_, i) => `
                              <button class="dice-picker-btn ${i === currentValue ? 'selected' : ''}" data-value="${i}">
                                  ${i}
                              </button>
                          `).join('')}
                      </div>
                  </div>
                  <div style="display: flex; gap: 8px; width: 100%;">
                      ${isSelected ? `
                      <button class="btn btn-secondary" id="remove-variable" style="flex: 1; background: #ea4335; min-width: 0; padding: 12px 8px; font-size: 0.95rem;">
                          Remove
                      </button>
                      ` : ''}
                      <button class="btn btn-secondary" id="cancel-variable" style="flex: 1; min-width: 0; padding: 12px 8px; font-size: 0.95rem;">
                          Cancel
                      </button>
                      <button class="btn btn-primary" id="confirm-variable" style="flex: 1; min-width: 0; padding: 12px 8px; font-size: 0.95rem;">
                          Confirm
                      </button>
                  </div>
              </div>
          </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);

      const modal = document.getElementById('variable-building-modal');
      const overlay = modal.querySelector('.dice-modal-overlay');
      const cancelBtn = document.getElementById('cancel-variable');
      const confirmBtn = document.getElementById('confirm-variable');
      const removeBtn = document.getElementById('remove-variable');
      const pickerBtns = modal.querySelectorAll('.dice-picker-btn');
      
      let selectedValue = currentValue;

      pickerBtns.forEach(pickerBtn => {
          pickerBtn.addEventListener('click', () => {
              selectedValue = parseInt(pickerBtn.getAttribute('data-value'));
              
              // Update button selection
              pickerBtns.forEach(b => b.classList.remove('selected'));
              pickerBtn.classList.add('selected');
          });
      });

      const closeModal = () => {
          modal.remove();
      };

      cancelBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', closeModal);

      if (removeBtn) {
          removeBtn.addEventListener('click', () => {
              if (btn) {
                  btn.classList.remove('selected');
                  btn.removeAttribute('data-variable-count');
              }
              closeModal();
          });
      }

      confirmBtn.addEventListener('click', () => {
          if (btn) {
              btn.classList.add('selected');
              btn.setAttribute('data-variable-count', selectedValue);
          }
          closeModal();
      });
  }

  calculateFinalScore() {
      // Get whale points from stored values
      const rightWhales = this.whaleScores.rightWhales;
      const bowheadWhales = this.whaleScores.bowheadWhales;
      const spermWhales = this.whaleScores.spermWhales;
      const blueWhale = this.whaleScores.blueWhale;
      const whiteWhale = this.whaleScores.whiteWhale;
      
      // Get building count from stored value
      const totalBuildings = this.totalBuildings;
      
      // Get money from stored value
      const totalMoney = this.totalMoney;
      
      // Get selected victory buildings
      const selectedVictoryBuildings = [];
      document.querySelectorAll('.building-select-btn.selected').forEach(btn => {
          const buildingId = btn.getAttribute('data-building-id');
          const buildingName = btn.getAttribute('data-building-name');
          const buildingPoints = btn.getAttribute('data-building-points');
          const variableCount = parseInt(btn.getAttribute('data-variable-count') || 0);
          
          selectedVictoryBuildings.push({
              id: buildingId,
              name: buildingName,
              points: buildingPoints,
              variableCount: variableCount
          });
      });
      
      // Calculate whale points
      const whalePoints = (rightWhales * 1) + (bowheadWhales * 2) + (spermWhales * 4) +
                         (blueWhale * 6) + (whiteWhale * 4);
      
      const buildingPoints = totalBuildings;
      const moneyPoints = Math.floor(totalMoney / 5);
      
      // Calculate victory building points
      let victoryPoints = 0;
      let victoryBreakdown = [];
      
      selectedVictoryBuildings.forEach(vb => {
          let points = 0;
          const buildingId = parseInt(vb.id);
          
          // Handle variable scoring buildings
          if (buildingId === 6) {
              // Candleworks: 1 point per Sperm Whale (use value from page)
              const count = spermWhales;
              points = count;
              victoryBreakdown.push(`${vb.name}: ${points} pts (${count} Sperm Whales)`);
          } else if (buildingId === 13) {
              // Counting House: 1 point per 2 Right Whales (use value from page)
              const count = rightWhales;
              points = Math.floor(count / 2);
              victoryBreakdown.push(`${vb.name}: ${points} pts (${count} Right Whales)`);
          } else if (buildingId === 17) {
              // Dressmaker: 1 point per 2 Bowhead Whales (use value from page)
              const count = bowheadWhales;
              points = Math.floor(count / 2);
              victoryBreakdown.push(`${vb.name}: ${points} pts (${count} Bowhead Whales)`);
          } else if (buildingId === 32) {
              // Municipal Office: 1 point per 4 buildings (use value from page)
              const count = totalBuildings;
              points = Math.floor(count / 4);
              victoryBreakdown.push(`${vb.name}: ${points} pts (${count} Buildings)`);
          } else if (buildingId === 33) {
              // Newspaper: 1 point per 2 Ship's Log pages (needs user input)
              points = Math.floor(vb.variableCount / 2);
              victoryBreakdown.push(`${vb.name}: ${points} pts (${vb.variableCount} Ship's Log Pages)`);
          } else if (buildingId === 36) {
              // Publishing House: 1 point per DHMG Symbol building (needs user input)
              points = vb.variableCount;
              victoryBreakdown.push(`${vb.name}: ${points} pts (${vb.variableCount} DHMG Buildings)`);
          } else if (buildingId === 40) {
              // Salvage Yard: 1 point per 2 Goods (needs user input)
              points = Math.floor(vb.variableCount / 2);
              victoryBreakdown.push(`${vb.name}: ${points} pts (${vb.variableCount} Goods)`);
          } else {
              // Fixed point buildings (includes Mansion, Seamen's Bethel, Shanty, etc.)
              // Subtract 1 because the base building point is already counted in "Total Buildings"
              points = Math.max(0, (parseInt(vb.points) || 0) - 1);
              victoryBreakdown.push(`${vb.name}: ${points} pts`);
          }
          
          victoryPoints += points;
      });
      
      const totalScore = whalePoints + buildingPoints + victoryPoints + moneyPoints;
      
      // Display results
      const scoreResult = document.getElementById('score-result');
      const scoreBreakdown = document.getElementById('score-breakdown');
      
      if (scoreResult && scoreBreakdown) {
          let whaleBreakdown = [];
          if (rightWhales > 0) whaleBreakdown.push(`${rightWhales} Right (${rightWhales * 1})`);
          if (bowheadWhales > 0) whaleBreakdown.push(`${bowheadWhales} Bowhead (${bowheadWhales * 2})`);
          if (spermWhales > 0) whaleBreakdown.push(`${spermWhales} Sperm (${spermWhales * 4})`);
          if (blueWhale > 0) whaleBreakdown.push(`${blueWhale} Blue Whale (6)`);
          if (whiteWhale > 0) whaleBreakdown.push(`${whiteWhale} White Whale (4)`);
          
          scoreBreakdown.innerHTML = `
              <div class="summary-item">
                  <span class="summary-label">Whale Points:</span>
                  <span class="summary-value">${whalePoints}</span>
              </div>
              ${whaleBreakdown.length > 0 ? `
              <div style="font-size: 0.9rem; color: var(--text-light); margin-left: 20px; margin-bottom: 10px;">
                  ${whaleBreakdown.join(', ')}
              </div>
              ` : ''}
              <div class="summary-item">
                  <span class="summary-label">Building Points:</span>
                  <span class="summary-value">${buildingPoints}</span>
              </div>
              <div class="summary-item">
                  <span class="summary-label">Victory Building Points:</span>
                  <span class="summary-value">${victoryPoints}</span>
              </div>
              ${victoryBreakdown.length > 0 ? `
              <div style="font-size: 0.9rem; color: var(--text-light); margin-left: 20px; margin-bottom: 10px;">
                  ${victoryBreakdown.join('<br>')}
              </div>
              ` : ''}
              <div class="summary-item">
                  <span class="summary-label">Money Points:</span>
                  <span class="summary-value">${moneyPoints} ($${totalMoney})</span>
              </div>
              <div class="summary-item" style="border-top: 3px solid var(--primary-color); padding-top: 15px; margin-top: 15px;">
                  <span class="summary-label" style="font-size: 1.3rem;">TOTAL SCORE:</span>
                  <span class="summary-value" style="font-size: 1.5rem; font-weight: bold;">${totalScore}</span>
              </div>
          `;
          scoreResult.style.display = 'block';
          scoreResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
  }

  // ===== EVENT HANDLERS =====

  // Set up event listeners for New Bedford page
  setupEventListeners() {
    // Expansion radio buttons - show/hide Rising Tide options and enable/disable 5 players
    const expansionRadios = document.querySelectorAll(
      'input[name="expansion"]'
    );
    expansionRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        this.handleExpansionChange();
        this.handleFourPlayerVariantVisibility();
      });
    });

    // Player count - show/hide variant options and update AI Captains
    const playerCount = document.getElementById("player-count");
    if (playerCount) {
      playerCount.addEventListener("change", () => {
        this.handlePlayerCountChange();
        this.handleFourPlayerVariantVisibility();
        this.updateAICaptainsOptions();
        this.handleTurnersMillVisibility();
      });
    }

    // AI Captains - show/hide Turner's Mill option
    const aiCaptainsSelect = document.getElementById("ai-captains");
    if (aiCaptainsSelect) {
      aiCaptainsSelect.addEventListener("change", () => {
        this.handleTurnersMillVisibility();
      });
    }

    // Start Game button
    const startGameBtn = document.getElementById("start-game-btn");
    if (startGameBtn) {
      startGameBtn.addEventListener("click", () => this.startGame());
    }

    // Reset Setup button (in config section)
    const resetSetupBtn = document.getElementById("reset-setup-btn-config");
    if (resetSetupBtn) {
      resetSetupBtn.addEventListener("click", () => this.resetSetup());
    }

    // Game Setup Help button
    const gameSetupHelpBtn = document.getElementById("game-setup-help");
    if (gameSetupHelpBtn) {
      gameSetupHelpBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.showGameSetupModal();
      });
    }

    // Variant Setup Help button
    const variantSetupHelpBtn = document.getElementById("variant-setup-help");
    if (variantSetupHelpBtn) {
      variantSetupHelpBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.showVariantSetupModal();
      });
    }

    // 2-Player Variant Help button
    const twoPlayerVariantHelpBtn = document.getElementById(
      "two-player-variant-help"
    );
    if (twoPlayerVariantHelpBtn) {
      twoPlayerVariantHelpBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.showTwoPlayerVariantModal();
      });
    }

    // 4-Player Variant Help button
    const fourPlayerVariantHelpBtn = document.getElementById(
      "four-player-variant-help"
    );
    if (fourPlayerVariantHelpBtn) {
      fourPlayerVariantHelpBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.showFourPlayerVariantModal();
      });
    }

    // White Whale Promo Help buttons
    const ambergrisHelpBtn = document.getElementById("ambergris-help");
    if (ambergrisHelpBtn) {
      ambergrisHelpBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.showPromoModal("ambergris");
      });
    }

    const blueWhaleHelpBtn = document.getElementById("blue-whale-help");
    if (blueWhaleHelpBtn) {
      blueWhaleHelpBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.showPromoModal("blue-whale");
      });
    }

    const castawayHelpBtn = document.getElementById("castaway-help");
    if (castawayHelpBtn) {
      castawayHelpBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.showPromoModal("castaway");
      });
    }

    const whiteWhaleHelpBtn = document.getElementById("white-whale-help");
    if (whiteWhaleHelpBtn) {
      whiteWhaleHelpBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.showPromoModal("white-whale");
      });
    }

    // Turner's Mill Help button
    const turnersMillHelpBtn = document.getElementById("turners-mill-help");
    if (turnersMillHelpBtn) {
      turnersMillHelpBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.showTurnersMillModal();
      });
    }

    // Initialize on load
    this.handleExpansionChange();
    this.handleFourPlayerVariantVisibility();
    this.updateAICaptainsOptions();
    this.handleTurnersMillVisibility();
  }

  // Handle expansion selection change
  handleExpansionChange() {
    const expansionRadio = document.querySelector(
      'input[name="expansion"]:checked'
    );
    const risingTideOptions = document.getElementById("rising-tide-options");
    const playerCountSelect = document.getElementById("player-count");
    const fivePlayerOption =
      playerCountSelect?.querySelector('option[value="5"]');

    if (expansionRadio && risingTideOptions) {
      const isRisingTide = expansionRadio.value === "rising-tide";

      // Show/hide Rising Tide options
      risingTideOptions.style.display = isRisingTide ? "block" : "none";

      // Enable/disable 5 player option
      if (fivePlayerOption) {
        fivePlayerOption.disabled = !isRisingTide;
        fivePlayerOption.textContent = isRisingTide
          ? "5 Players"
          : "5 Players (Rising Tide only)";

        // If 5 players is currently selected and we switch to base game, change to 4 players
        if (!isRisingTide && playerCountSelect.value === "5") {
          playerCountSelect.value = "4";
          this.handlePlayerCountChange();
          this.updateAICaptainsOptions();
        }
      }
    }
  }

  // Handle player count change
  handlePlayerCountChange() {
    const playerCount = document.getElementById("player-count");
    const twoPlayerOptions = document.getElementById("two-player-options");

    if (playerCount && twoPlayerOptions) {
      if (playerCount.value === "2") {
        twoPlayerOptions.style.display = "block";
      } else {
        twoPlayerOptions.style.display = "none";
      }
    }
  }

  // Handle 4-player variant visibility (only show when 4 players AND Rising Tide selected)
  handleFourPlayerVariantVisibility() {
    const playerCount = document.getElementById("player-count");
    const expansionRadio = document.querySelector(
      'input[name="expansion"]:checked'
    );
    const fourPlayerOptions = document.getElementById("four-player-options");

    if (playerCount && expansionRadio && fourPlayerOptions) {
      const isFourPlayers = playerCount.value === "4";
      const isRisingTide = expansionRadio.value === "rising-tide";

      if (isFourPlayers && isRisingTide) {
        fourPlayerOptions.style.display = "block";
      } else {
        fourPlayerOptions.style.display = "none";
      }
    }
  }

  // Handle Turner's Mill visibility (only show when AI Captains > 0)
  handleTurnersMillVisibility() {
    const aiCaptainsSelect = document.getElementById("ai-captains");
    const turnersMillOptions = document.getElementById("turners-mill-options");

    if (aiCaptainsSelect && turnersMillOptions) {
      const aiCaptains = parseInt(aiCaptainsSelect.value);

      if (aiCaptains > 0) {
        turnersMillOptions.style.display = "block";
      } else {
        turnersMillOptions.style.display = "none";
      }
    }
  }

  // Update AI Captains options based on player count
  updateAICaptainsOptions() {
    const playerCount = parseInt(
      document.getElementById("player-count")?.value || 2
    );
    const aiCaptainsSelect = document.getElementById("ai-captains");

    if (!aiCaptainsSelect) return;

    const maxAI = playerCount - 1;
    const currentValue = parseInt(aiCaptainsSelect.value);

    // Clear and rebuild options
    aiCaptainsSelect.innerHTML = "";

    for (let i = 0; i <= maxAI; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent =
        i === 0 ? "None" : `${i} AI Captain${i > 1 ? "s" : ""}`;
      aiCaptainsSelect.appendChild(option);
    }

    // Restore previous value if still valid, otherwise set to 0
    if (currentValue <= maxAI) {
      aiCaptainsSelect.value = currentValue;
    } else {
      aiCaptainsSelect.value = 0;
    }
  }

  // Start the game with selected configuration
  startGame() {
    // Gather all configuration
    const expansionRadio = document.querySelector(
      'input[name="expansion"]:checked'
    );
    const expansion = expansionRadio?.value;
    const playerCount = parseInt(
      document.getElementById("player-count")?.value
    );
    const shipsLog = document.getElementById("ships-log-checkbox")?.checked;
    const variantSetup = document.getElementById(
      "variant-setup-checkbox"
    )?.checked;
    const twoPlayerVariant = document.getElementById(
      "two-player-variant-checkbox"
    )?.checked;
    const fourPlayerVariant = document.getElementById(
      "four-player-variant-checkbox"
    )?.checked;
    const aiCaptains = parseInt(document.getElementById("ai-captains")?.value);
    const turnersMill = document.getElementById(
      "turners-mill-checkbox"
    )?.checked;

    // Get selected promos from checkboxes
    const promoCheckboxes = document.querySelectorAll(
      'input[name="promo"]:checked'
    );
    const selectedPromos = Array.from(promoCheckboxes).map((cb) => cb.value);

    // Store configuration
    this.gameConfig = {
      expansion,
      playerCount,
      shipsLog: expansion === "rising-tide" ? shipsLog : false,
      variantSetup: expansion === "rising-tide" ? variantSetup : false,
      twoPlayerVariant: playerCount === 2 ? twoPlayerVariant : false,
      fourPlayerVariant:
        playerCount === 4 && expansion === "rising-tide"
          ? fourPlayerVariant
          : false,
      promos: selectedPromos,
      aiCaptains,
      turnersMill: aiCaptains > 0 ? turnersMill : false,
    };

    console.log("Game configuration:", this.gameConfig);

    // Hide the setup section
    const setupSection = document.getElementById("setup-section");
    if (setupSection) {
      setupSection.style.display = "none";
    }

    // Display game summary (but hide it by default)
    this.displayGameSummary();
    const gameSummary = document.getElementById("game-summary");
    if (gameSummary) {
      gameSummary.style.display = "none";
    }

    // Display buildings based on configuration
    this.displayBuildings();

    // Show Config button
    const toggleConfigBtn = document.getElementById("toggle-config-btn");
    if (toggleConfigBtn) toggleConfigBtn.style.display = "inline-block";
  }

  // Reset setup - go back to setup form
  resetSetup() {
    // Show the setup section
    const setupSection = document.getElementById("setup-section");
    if (setupSection) {
      setupSection.style.display = "block";
    }

    // Hide game summary, buildings section, and gameplay section
    const gameSummary = document.getElementById("game-summary");
    const buildingsSection = document.getElementById("buildings-section");
    const gameplaySection = document.getElementById("gameplay-section");

    if (gameSummary) {
      gameSummary.style.display = "none";
    }

    if (buildingsSection) {
      buildingsSection.style.display = "none";
    }

    if (gameplaySection) {
      gameplaySection.style.display = "none";
    }

    // Hide all top navigation buttons
    const toggleConfigBtn = document.getElementById("toggle-config-btn");
    const toggleBuildingsBtn = document.getElementById("toggle-buildings-btn");

    if (toggleConfigBtn) toggleConfigBtn.style.display = "none";
    if (toggleBuildingsBtn) toggleBuildingsBtn.style.display = "none";

    // Reset game phase to setup
    this.currentPhase = "setup";

    // Clear game configuration
    this.gameConfig = null;

    // Scroll to top of setup form
    setupSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ===== GAME SETUP METHODS =====

  // Display game configuration summary
  displayGameSummary() {
    const gameSummary = document.getElementById("game-summary");
    const summaryContent = document.getElementById("game-summary-content");

    if (!gameSummary || !summaryContent || !this.gameConfig) return;

    // Build summary HTML
    let html = "";

    html += `<div class="summary-item">
            <span class="summary-label">Expansion:</span>
            <span class="summary-value">${
              this.gameConfig.expansion === "rising-tide"
                ? "Base + Rising Tide"
                : "Base Game"
            }</span>
        </div>`;

    html += `<div class="summary-item">
            <span class="summary-label">Players:</span>
            <span class="summary-value">${this.gameConfig.playerCount}</span>
        </div>`;

    if (
      this.gameConfig.expansion === "rising-tide" &&
      this.gameConfig.shipsLog
    ) {
      html += `<div class="summary-item">
                <span class="summary-label">Ship's Log:</span>
                <span class="summary-value">Enabled</span>
            </div>`;
    }

    if (
      this.gameConfig.expansion === "rising-tide" &&
      this.gameConfig.variantSetup
    ) {
      html += `<div class="summary-item">
                <span class="summary-label">Variant Setup:</span>
                <span class="summary-value">Enabled</span>
            </div>`;
    }

    if (this.gameConfig.playerCount === 2 && this.gameConfig.twoPlayerVariant) {
      html += `<div class="summary-item">
                <span class="summary-label">2-Player Variant:</span>
                <span class="summary-value">Enabled</span>
            </div>`;
    }

    if (
      this.gameConfig.playerCount === 4 &&
      this.gameConfig.fourPlayerVariant
    ) {
      html += `<div class="summary-item">
                <span class="summary-label">4-Player Variant:</span>
                <span class="summary-value">Enabled</span>
            </div>`;
    }

    if (this.gameConfig.promos.length > 0) {
      html += `<div class="summary-item">
                <span class="summary-label">Promos:</span>
                <span class="summary-value">${this.gameConfig.promos
                  .map((p) =>
                    p.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())
                  )
                  .join(", ")}</span>
            </div>`;
    }

    if (this.gameConfig.aiCaptains > 0) {
      html += `<div class="summary-item">
                <span class="summary-label">AI Captains:</span>
                <span class="summary-value">${this.gameConfig.aiCaptains}</span>
            </div>`;
    }

    if (this.gameConfig.aiCaptains > 0 && this.gameConfig.turnersMill) {
      html += `<div class="summary-item">
                <span class="summary-label">Turner's Mill:</span>
                <span class="summary-value">Enabled</span>
            </div>`;
    }

    summaryContent.innerHTML = html;
    // Only auto-show if not in gameplay phase
    if (this.currentPhase !== "gameplay") {
      gameSummary.style.display = "block";
      gameSummary.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  // Randomly select buildings from pool
  selectRandomBuildings(buildingPool, actionCount, victoryCount) {
    // Separate action, ships-log, lonely-ocean, and victory buildings
    const actionBuildings = buildingPool.filter((b) => b.type === "action");
    const shipsLogBuildings = buildingPool.filter(
      (b) => b.type === "ships-log"
    );
    const lonelyOceanBuildings = buildingPool.filter(
      (b) => b.type === "lonely-ocean"
    );
    const victoryBuildings = buildingPool.filter((b) => b.type === "victory");

    // If using variant setup, don't enforce half-and-half split
    if (
      this.gameConfig.variantSetup &&
      this.gameConfig.expansion === "rising-tide"
    ) {
      // Random mix - just select randomly from pools
      const selectedActions = this.shuffleArray([...actionBuildings]).slice(
        0,
        actionCount
      );
      const selectedVictory = this.shuffleArray([...victoryBuildings]).slice(
        0,
        victoryCount
      );
      // Only include ships-log if enabled
      const selectedShipsLog = this.gameConfig.shipsLog
        ? shipsLogBuildings
        : [];
      // Only include lonely-ocean (Turner's Mill) if enabled
      const selectedLonelyOcean = this.gameConfig.turnersMill
        ? lonelyOceanBuildings
        : [];
      return [
        ...selectedActions,
        ...selectedShipsLog,
        ...selectedLonelyOcean,
        ...selectedVictory,
      ];
    }

    // Standard setup - enforce half base, half expansion if using Rising Tide
    if (this.gameConfig.expansion === "rising-tide") {
      // Split action buildings by game
      const baseActions = actionBuildings.filter((b) => b.game === "base");
      const expansionActions = actionBuildings.filter(
        (b) => b.game === "rising-tide"
      );

      // Split victory buildings by game
      const baseVictory = victoryBuildings.filter((b) => b.game === "base");
      const expansionVictory = victoryBuildings.filter(
        (b) => b.game === "rising-tide"
      );

      // Select half from each (including victory in the split)
      const halfActions = Math.floor(actionCount / 2);
      const halfVictory = Math.floor(victoryCount / 2);

      const selectedBaseActions = this.shuffleArray([...baseActions]).slice(
        0,
        halfActions
      );
      const selectedExpActions = this.shuffleArray([...expansionActions]).slice(
        0,
        actionCount - halfActions
      );

      const selectedBaseVictory = this.shuffleArray([...baseVictory]).slice(
        0,
        halfVictory
      );
      const selectedExpVictory = this.shuffleArray([...expansionVictory]).slice(
        0,
        victoryCount - halfVictory
      );

      // Only include ships-log if enabled
      const selectedShipsLog = this.gameConfig.shipsLog
        ? shipsLogBuildings
        : [];
      // Only include lonely-ocean (Turner's Mill) if enabled
      const selectedLonelyOcean = this.gameConfig.turnersMill
        ? lonelyOceanBuildings
        : [];
      return [
        ...selectedBaseActions,
        ...selectedExpActions,
        ...selectedShipsLog,
        ...selectedLonelyOcean,
        ...selectedBaseVictory,
        ...selectedExpVictory,
      ];
    }

    // Base game only - just select randomly
    const selectedActions = this.shuffleArray([...actionBuildings]).slice(
      0,
      actionCount
    );
    const selectedVictory = this.shuffleArray([...victoryBuildings]).slice(
      0,
      victoryCount
    );
    // Only include ships-log if enabled
    const selectedShipsLog = this.gameConfig.shipsLog ? shipsLogBuildings : [];
    // Only include lonely-ocean (Turner's Mill) if enabled
    const selectedLonelyOcean = this.gameConfig.turnersMill
      ? lonelyOceanBuildings
      : [];
    return [
      ...selectedActions,
      ...selectedShipsLog,
      ...selectedLonelyOcean,
      ...selectedVictory,
    ];
  }

  // Shuffle array helper (Fisher-Yates shuffle)
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Create ocean bag based on player count and promos
  createOceanBag() {
    const oceanBag = [];

    // Determine player count for bag (5 players use 4-player amount)
    const bagPlayerCount =
      this.gameConfig.playerCount === 5 ? 4 : this.gameConfig.playerCount;

    // Check if Blue Whale promo is used (affects whale counts)
    const hasBlueWhale = this.gameConfig.promos.includes("blue-whale");

    // Add base whales and sea tokens per player
    // 1 Sperm Whale per player
    for (let i = 0; i < bagPlayerCount; i++) {
      oceanBag.push("SW"); // Sperm Whale
    }

    // 4 Empty Sea Tokens per player
    for (let i = 0; i < bagPlayerCount * 4; i++) {
      oceanBag.push("ES"); // Empty Sea
    }

    // 5 Bowhead Whales per player (minus 2 if Blue Whale is used)
    const bowheadCount = bagPlayerCount * 5 - (hasBlueWhale ? 2 : 0);
    for (let i = 0; i < bowheadCount; i++) {
      oceanBag.push("BW"); // Bowhead Whale
    }

    // 9 Right Whales per player (minus 2 if Blue Whale is used)
    const rightWhaleCount = bagPlayerCount * 9 - (hasBlueWhale ? 2 : 0);
    for (let i = 0; i < rightWhaleCount; i++) {
      oceanBag.push("RW"); // Right Whale
    }

    // Add White Whale promo tiles if selected
    if (this.gameConfig.promos.includes("ambergris")) {
      oceanBag.push("AM"); // Ambergris
    }
    if (hasBlueWhale) {
      oceanBag.push("BlW"); // Blue Whale
    }
    if (this.gameConfig.promos.includes("castaway")) {
      oceanBag.push("CA"); // Castaway
    }
    if (this.gameConfig.promos.includes("white-whale")) {
      oceanBag.push("WW"); // White Whale
    }

    return oceanBag;
  }

  // Display buildings based on game configuration
  async displayBuildings() {
    const buildingsSection = document.getElementById("buildings-section");
    const buildingsList = document.getElementById("buildings-list");

    if (!buildingsList || !this.gameConfig) {
      console.log("Cannot display buildings: missing configuration");
      return;
    }

    // Get all buildings
    const allBuildings = await this.getBuildings();

    // Determine building counts based on player count
    // Total = actionCount + victoryCount
    let actionCount, victoryCount;
    switch (this.gameConfig.playerCount) {
      case 2:
        actionCount = 8;
        victoryCount = 4;
        break;
      case 3:
        actionCount = 16;
        victoryCount = 4;
        break;
      case 4:
        actionCount = 16;
        victoryCount = 4;
        break;
      case 5:
        actionCount = 20;
        victoryCount = 5;
        break;
      default:
        actionCount = 8;
        victoryCount = 4;
    }

    // Filter buildings based on game configuration to create the pool
    let buildingPool = allBuildings.filter((building) => {
      // Filter by expansion
      if (
        this.gameConfig.expansion === "base" &&
        building.game === "rising-tide"
      ) {
        return false;
      }

      // Filter by 2-player variant
      if (this.gameConfig.playerCount === 2) {
        if (this.gameConfig.twoPlayerVariant) {
          // If using 2-player variant, include buildings for 2 players OR marked as usable2p
          if (building.players === 2) {
            return true; // Always include 2-player buildings
          }
          if (building.players === 3 && building.usable2p) {
            return true; // Include 3-player buildings marked as usable in 2p variant
          }
          return false; // Exclude everything else
        } else {
          // If not using variant, only include buildings for exactly 2 players
          if (building.players !== 2) {
            return false;
          }
        }
      } else if (
        this.gameConfig.playerCount === 4 &&
        this.gameConfig.fourPlayerVariant
      ) {
        // 4-player variant: include 4-player buildings OR 5-player buildings marked as usable4p
        if (building.players === 4) {
          return true; // Always include 4-player buildings
        }
        if (building.players === 5 && building.usable4p) {
          return true; // Include 5-player buildings marked as usable in 4p variant
        }
        if (building.players < 4) {
          return true; // Include buildings for fewer players
        }
        return false; // Exclude other 5-player buildings
      } else {
        // For other player counts, filter by player count normally
        if (building.players > this.gameConfig.playerCount) {
          return false;
        }
      }

      // Filter by Ship's Log
      if (!this.gameConfig.shipsLog && building.type === "ships-log") {
        return false;
      }

      // Filter by Turner's Mill (Lonely Ocean type)
      if (!this.gameConfig.turnersMill && building.type === "lonely-ocean") {
        return false;
      }

      return true;
    });

    // Randomly select buildings from the pool
    let filteredBuildings = this.selectRandomBuildings(
      buildingPool,
      actionCount,
      victoryCount
    );

    // Store selected building IDs in game config
    this.gameConfig.selectedBuildings = filteredBuildings.map((b) => b.id);

    // Create ocean bag
    this.gameConfig.oceanBag = this.createOceanBag();

    console.log("Selected building IDs:", this.gameConfig.selectedBuildings);
    console.log("Ocean Bag:", this.gameConfig.oceanBag);

    // Clear previous content
    buildingsList.innerHTML = "";

    if (filteredBuildings.length === 0) {
      buildingsList.innerHTML =
        "<p>No buildings available for this configuration.</p>";
      if (buildingsSection) buildingsSection.style.display = "block";
      return;
    }

    // Sort buildings: Action first, then Ships-Log, then Lonely Ocean, then Victory, alphabetically within each type
    filteredBuildings.sort((a, b) => {
      // Define type order
      const typeOrder = {
        action: 1,
        "ships-log": 2,
        "lonely-ocean": 3,
        victory: 4,
      };
      const typeA = typeOrder[a.type] || 99;
      const typeB = typeOrder[b.type] || 99;

      // First sort by type
      if (typeA !== typeB) {
        return typeA - typeB;
      }

      // Then sort alphabetically within same type
      return a.name.localeCompare(b.name);
    });

    // Create building cards
    filteredBuildings.forEach((building) => {
      const buildingCard = document.createElement("div");
      buildingCard.className = "building-card";

      // Add special class for victory, ships-log, and lonely-ocean buildings
      if (building.type === "victory") {
        buildingCard.classList.add("building-card-victory");
      } else if (building.type === "ships-log") {
        buildingCard.classList.add("building-card-ships-log");
      } else if (building.type === "lonely-ocean") {
        buildingCard.classList.add("building-card-lonely-ocean");
      }

      buildingCard.innerHTML = `
                <div class="building-header">
                    <h4>${building.name}</h4>
                    <span class="building-type building-type-${
                      building.type
                    }">${building.type}</span>
                </div>
                <div class="building-content">
                    <div class="building-details">
                        <p><strong>Players:</strong> ${building.players}${
        building.usable2p ? " (2P Variant)" : ""
      }</p>
                        <p><strong>Game:</strong> ${
                          building.game === "base" ? "Base Game" : "Rising Tide"
                        }</p>
                    </div>
                    <div class="building-checkbox-wrapper">
                        <input type="checkbox" id="building-check-${
                          building.id
                        }" class="building-found-checkbox">
                    </div>
                </div>
            `;
      buildingsList.appendChild(buildingCard);
    });

    // Add count summary before the grid
    const countSummary = document.createElement("p");
    countSummary.style.cssText =
      "text-align: center; font-weight: 600; color: var(--primary-color); margin-bottom: 20px; font-size: 1.1rem; grid-column: 1 / -1;";
    countSummary.textContent = `Total Buildings: ${filteredBuildings.length}`;
    buildingsList.appendChild(countSummary);

    // Show/hide Start Game button based on phase
    const startGameBtn = document.getElementById("start-game-btn-final");
    if (startGameBtn) {
      if (this.currentPhase === "gameplay") {
        startGameBtn.style.display = "none";
      } else {
        startGameBtn.style.display = "block";
      }
    }

    // Show the buildings section (only if not in gameplay phase during restoration)
    if (buildingsSection && this.currentPhase !== "gameplay") {
      buildingsSection.style.display = "block";
      buildingsSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  // ===== MODAL METHODS =====

  // Show Game Setup Modal
  showGameSetupModal() {
    // Create modal HTML
    const modalHTML = `
            <div class="dice-modal show" id="game-setup-modal">
                <div class="dice-modal-overlay"></div>
                <div class="dice-modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                    <h3>Building Selection Logic</h3>
                    <p style="color: var(--text-color); line-height: 1.8; font-size: 0.95rem; text-align: left; margin: 20px 0;">
                        When setting up a game, the system first determines how many buildings are needed based on player count: 2 players need 8 action and 4 victory buildings, 3-4 players need 16 action and 4 victory buildings, and 5 players need 20 action and 5 victory buildings. The building pool is filtered by expansion (base game only includes base buildings, while Rising Tide includes both). For 2-player games without the variant, only 2-player buildings are included; with the 2-player variant enabled, 3-player buildings marked as usable2p are added to the pool. For 4-player games with Rising Tide and the 4-player variant enabled, 5-player buildings marked as usable4p are added to the pool. Ships-log buildings are only included if the Ship's Log option is checked, and when included, all ships-log buildings are added (not randomly selected). For standard Rising Tide setup, the system randomly selects half the action buildings from base game and half from the expansion, and does the same for victory buildings. If the variant setup option is enabled, buildings are randomly selected without enforcing the half-and-half split. The final selection is sorted with action buildings first (alphabetically), then ships-log buildings (alphabetically), then victory buildings (alphabetically), with victory buildings displayed in green and ships-log buildings in light brown.
                    </p>
                    <button class="btn btn-primary" id="close-game-setup-modal" style="width: 100%; margin-top: 10px;">
                        Got it!
                    </button>
                </div>
            </div>
        `;

    // Add modal to body
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Add event listeners
    const modal = document.getElementById("game-setup-modal");
    const overlay = modal.querySelector(".dice-modal-overlay");
    const closeBtn = document.getElementById("close-game-setup-modal");

    const closeModal = () => {
      modal.remove();
    };

    overlay.addEventListener("click", closeModal);
    closeBtn.addEventListener("click", closeModal);
  }

  // Show Variant Setup Modal
  showVariantSetupModal() {
    // Create modal HTML
    const modalHTML = `
            <div class="dice-modal show" id="variant-setup-modal">
                <div class="dice-modal-overlay"></div>
                <div class="dice-modal-content">
                    <h3>Variant Setup</h3>
                    <p style="color: var(--text-color); line-height: 1.8; font-size: 1rem; text-align: center; margin: 20px 0;">
                        Uses a random mix between Base and Rising Tide expansion. Does not follow the standard Rising Tide setup of half Base and half expansions buildings.
                    </p>
                    <button class="btn btn-primary" id="close-variant-modal" style="width: 100%; margin-top: 10px;">
                        Got it!
                    </button>
                </div>
            </div>
        `;

    // Add modal to body
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Add event listeners
    const modal = document.getElementById("variant-setup-modal");
    const overlay = modal.querySelector(".dice-modal-overlay");
    const closeBtn = document.getElementById("close-variant-modal");

    const closeModal = () => {
      modal.remove();
    };

    overlay.addEventListener("click", closeModal);
    closeBtn.addEventListener("click", closeModal);
  }

  // Show 2-Player Variant Modal
  showTwoPlayerVariantModal() {
    // Create modal HTML
    const modalHTML = `
            <div class="dice-modal show" id="two-player-variant-modal">
                <div class="dice-modal-overlay"></div>
                <div class="dice-modal-content">
                    <h3>2-Player Variant Rules</h3>
                    <p style="color: var(--text-color); line-height: 1.8; font-size: 1rem; text-align: center; margin: 20px 0;">
                        Uses some 3 player tiles in 2 player game.
                    </p>
                    <p style="color: var(--text-color); line-height: 1.8; font-size: 0.95rem; text-align: center; margin: 10px 0;">
                        <strong>Per rulebook, excludes:</strong><br>
                        Post Office, Inn, Chemist Shop, Fairhaven Bridge, and Storehouse.
                    </p>
                    <button class="btn btn-primary" id="close-two-player-modal" style="width: 100%; margin-top: 10px;">
                        Got it!
                    </button>
                </div>
            </div>
        `;

    // Add modal to body
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Add event listeners
    const modal = document.getElementById("two-player-variant-modal");
    const overlay = modal.querySelector(".dice-modal-overlay");
    const closeBtn = document.getElementById("close-two-player-modal");

    const closeModal = () => {
      modal.remove();
    };

    overlay.addEventListener("click", closeModal);
    closeBtn.addEventListener("click", closeModal);
  }

  // Show 4-Player Variant Modal
  showFourPlayerVariantModal() {
    // Create modal HTML
    const modalHTML = `
            <div class="dice-modal show" id="four-player-variant-modal">
                <div class="dice-modal-overlay"></div>
                <div class="dice-modal-content">
                    <h3>4-Player Variant Rules</h3>
                    <p style="color: var(--text-color); line-height: 1.8; font-size: 1rem; text-align: center; margin: 20px 0;">
                        Includes 5-player buildings in the building pool for 4-player games.
                    </p>
                    <p style="color: var(--text-color); line-height: 1.8; font-size: 0.95rem; text-align: center; margin: 10px 0;">
                        <strong>Adds to pool:</strong><br>
                        Almshouse, College, Empty Lot, and Fire House.
                    </p>
                    <button class="btn btn-primary" id="close-four-player-modal" style="width: 100%; margin-top: 10px;">
                        Got it!
                    </button>
                </div>
            </div>
        `;

    // Add modal to body
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Add event listeners
    const modal = document.getElementById("four-player-variant-modal");
    const overlay = modal.querySelector(".dice-modal-overlay");
    const closeBtn = document.getElementById("close-four-player-modal");

    const closeModal = () => {
      modal.remove();
    };

    overlay.addEventListener("click", closeModal);
    closeBtn.addEventListener("click", closeModal);
  }

  // Show White Whale Promo Modal
  showPromoModal(promoType) {
    const promoInfo = {
      ambergris: {
        title: "Ambergris",
        description:
          "Ambergris is worth no points. Instead, it earns $8 when the ship carrying it Returns. This money may be used to pay for whales on the same ship. Money is not received until the ship Returns.",
      },
      "blue-whale": {
        title: "Blue Whale",
        description:
          "Blue Whale costs $12 to lay and is worth 6 points. It requires 2 less tokens of Right and Bowhead whales to be removed from the ocean bag during setup.",
      },
      castaway: {
        title: "Castaway",
        description: "Castaway promo tile information coming soon.",
      },
      "white-whale": {
        title: "White Whale",
        description: "White Whale promo tile information coming soon.",
      },
    };

    const promo = promoInfo[promoType];

    // Create modal HTML
    const modalHTML = `
            <div class="dice-modal show" id="promo-modal">
                <div class="dice-modal-overlay"></div>
                <div class="dice-modal-content">
                    <h3>${promo.title}</h3>
                    <p style="color: var(--text-color); line-height: 1.8; font-size: 1rem; text-align: center; margin: 20px 0;">
                        ${promo.description}
                    </p>
                    <button class="btn btn-primary" id="close-promo-modal" style="width: 100%; margin-top: 10px;">
                        Got it!
                    </button>
                </div>
            </div>
        `;

    // Add modal to body
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Add event listeners
    const modal = document.getElementById("promo-modal");
    const overlay = modal.querySelector(".dice-modal-overlay");
    const closeBtn = document.getElementById("close-promo-modal");

    const closeModal = () => {
      modal.remove();
    };

    overlay.addEventListener("click", closeModal);
    closeBtn.addEventListener("click", closeModal);
  }

  // Show Turner's Mill Modal
  showTurnersMillModal() {
    // Create modal HTML
    const modalHTML = `
            <div class="dice-modal show" id="turners-mill-modal">
                <div class="dice-modal-overlay"></div>
                <div class="dice-modal-content">
                    <h3>Turner's Mill</h3>
                    <p style="color: var(--text-color); line-height: 1.8; font-size: 1rem; text-align: center; margin: 20px 0;">
                        <strong>Cost:</strong> 2 wood, 2 food
                    </p>
                    <p style="color: var(--text-color); line-height: 1.8; font-size: 1rem; text-align: center; margin: 10px 0;">
                        <strong>Benefit:</strong> Repeat the action of the Captain's last worker. Pay the normal cost of the action plus $1.
                    </p>
                    <button class="btn btn-primary" id="close-turners-mill-modal" style="width: 100%; margin-top: 10px;">
                        Got it!
                    </button>
                </div>
            </div>
        `;

    // Add modal to body
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Add event listeners
    const modal = document.getElementById("turners-mill-modal");
    const overlay = modal.querySelector(".dice-modal-overlay");
    const closeBtn = document.getElementById("close-turners-mill-modal");

    const closeModal = () => {
      modal.remove();
    };

    overlay.addEventListener("click", closeModal);
    closeBtn.addEventListener("click", closeModal);
  }

  // ===== UI TOGGLE METHODS =====

  // Toggle Configuration visibility
  toggleConfiguration() {
    const gameSummary = document.getElementById("game-summary");
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

  // Toggle Buildings visibility
  toggleBuildings() {
    const buildingsSection = document.getElementById("buildings-section");
    const startGameBtn = document.getElementById("start-game-btn-final");

    if (buildingsSection) {
      if (buildingsSection.style.display === "none") {
        buildingsSection.style.display = "block";
        this.buildingsVisible = true;

        // Hide Start Game button if we're in gameplay phase
        if (this.currentPhase === "gameplay" && startGameBtn) {
          startGameBtn.style.display = "none";
        }
      } else {
        buildingsSection.style.display = "none";
        this.buildingsVisible = false;
      }
    }
  }

  // ===== GAMEPLAY METHODS =====

  // Gameplay Phase - Start the actual game
  startGameplay() {
    this.currentPhase = "gameplay";
    console.log("Starting New Bedford gameplay phase");

    // Hide configuration and buildings
    const gameSummary = document.getElementById("game-summary");
    const buildingsSection = document.getElementById("buildings-section");

    if (gameSummary) {
      gameSummary.style.display = "none";
      this.configVisible = false;
    }
    if (buildingsSection) {
      buildingsSection.style.display = "none";
      this.buildingsVisible = false;
    }

    // Show toggle buttons
    const toggleConfigBtn = document.getElementById("toggle-config-btn");
    const toggleBuildingsBtn = document.getElementById("toggle-buildings-btn");

    if (toggleConfigBtn) toggleConfigBtn.style.display = "inline-block";
    if (toggleBuildingsBtn) toggleBuildingsBtn.style.display = "inline-block";

    // Build gameplay section
    this.rebuildGameplaySection();
  }

  // Rebuild gameplay section (for state restoration and initial gameplay)
  rebuildGameplaySection() {
    // Build ocean tokens display
    const gameplaySection = document.getElementById("gameplay-section");
    if (gameplaySection) {
      const tokenTypes = [
        { abbr: "SW", name: "Sperm Whale", image: "SW.jpg" },
        { abbr: "BW", name: "Bowhead Whale", image: "BW.jpg" },
        { abbr: "RW", name: "Right Whale", image: "RW.jpg" },
        { abbr: "ES", name: "Empty Sea", image: "ES.jpg" },
      ];

      // Add promo tokens if selected
      if (this.gameConfig.promos.includes("ambergris")) {
        tokenTypes.push({ abbr: "AM", name: "Ambergris", image: "AM.jpg" });
      }
      if (this.gameConfig.promos.includes("blue-whale")) {
        tokenTypes.push({ abbr: "BlW", name: "Blue Whale", image: "BlW.jpg" });
      }
      if (this.gameConfig.promos.includes("castaway")) {
        tokenTypes.push({ abbr: "CA", name: "Castaway", image: "CA.jpg" });
      }
      if (this.gameConfig.promos.includes("white-whale")) {
        tokenTypes.push({ abbr: "WW", name: "White Whale", image: "WW.jpg" });
      }

      const totalTokens = this.gameConfig.oceanBag.length;

      let tokensHTML = '<div class="ocean-tokens-grid">';
      tokenTypes.forEach((token) => {
        const count = this.gameConfig.oceanBag.filter(
          (t) => t === token.abbr
        ).length;
        const percentage =
          totalTokens > 0 ? ((count / totalTokens) * 100).toFixed(1) : 0;
        tokensHTML += `
                    <div class="ocean-token-card" data-token="${token.abbr}" style="cursor: pointer;">
                        <img src="./assets/newbedford/tiles/${token.image}" alt="${token.name}" class="token-image">
                        <div class="token-info">
                            <h4>${token.name}</h4>
                            <p class="token-count">Count: ${count} (${percentage}%)</p>
                        </div>
                    </div>
                `;
      });
      tokensHTML += "</div>";

      // Generate ships dropdown based on player count
      const maxShips = this.gameConfig.playerCount * 2;
      let shipsOptions = "";
      for (let i = 0; i <= maxShips; i++) {
        shipsOptions += `<option value="${i}">${i} Ship${
          i !== 1 ? "s" : ""
        }</option>`;
      }

      gameplaySection.innerHTML = `
                <h3>Play</h3>
                <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; background: var(--background-color); padding: 20px; border-radius: 12px;">
                    <label for="ships-at-sea" style="font-weight: 600; color: var(--text-color); font-size: 1.1rem;">Ships at Sea:</label>
                    <select id="ships-at-sea" class="setting-input" style="padding: 12px 20px; font-size: 1rem; min-width: 150px;">
                        ${shipsOptions}
                    </select>
                    <button class="btn btn-primary" id="draw-tokens-btn" style="padding: 12px 30px; font-size: 1rem;">Go</button>
                </div>
                ${tokensHTML}
            `;

      gameplaySection.style.display = "block";

      // Add click listeners to token cards
      const tokenCards = gameplaySection.querySelectorAll(".ocean-token-card");
      tokenCards.forEach((card) => {
        card.addEventListener("click", () => {
          const tokenAbbr = card.getAttribute("data-token");
          this.showTokenModal(tokenAbbr);
        });
      });

      // Add click listener to draw tokens button
      const drawTokensBtn = document.getElementById("draw-tokens-btn");
      if (drawTokensBtn) {
        drawTokensBtn.addEventListener("click", () => {
          const shipsAtSea = parseInt(
            document.getElementById("ships-at-sea")?.value || 0
          );
          this.drawTokens(shipsAtSea);
        });
      }
    }
  }

  // Show token adjustment modal
  showTokenModal(tokenAbbr) {
    const tokenNames = {
      SW: "Sperm Whale",
      BW: "Bowhead Whale",
      RW: "Right Whale",
      ES: "Empty Sea",
      AM: "Ambergris",
      BlW: "Blue Whale",
      CA: "Castaway",
      WW: "White Whale",
    };

    const tokenName = tokenNames[tokenAbbr];
    const currentCount = this.gameConfig.oceanBag.filter(
      (t) => t === tokenAbbr
    ).length;

    const modalHTML = `
            <div class="dice-modal show" id="token-modal">
                <div class="dice-modal-overlay"></div>
                <div class="dice-modal-content">
                    <img src="./assets/newbedford/tiles/${tokenAbbr}.jpg" alt="${tokenName}" style="width: 100%; max-width: 225px; border-radius: 8px; margin: 0 auto 20px; display: block;">
                    <h3>${tokenName}</h3>
                    <p style="text-align: center; font-size: 1.5rem; font-weight: 600; color: var(--primary-color); margin: 20px 0;">
                        Count: <span id="token-modal-count">${currentCount}</span>
                    </p>
                    <div style="display: flex; gap: 15px; justify-content: center; margin: 20px 0;">
                        <button class="btn btn-secondary" id="token-decrease" style="font-size: 1.5rem; padding: 15px 0; flex: 1; max-width: 100px;">−</button>
                        <button class="btn btn-primary" id="token-increase" style="font-size: 1.5rem; padding: 15px 0; flex: 1; max-width: 100px;">+</button>
                    </div>
                    <button class="btn btn-secondary" id="close-token-modal" style="width: 100%; margin-top: 10px;">
                        Close
                    </button>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const modal = document.getElementById("token-modal");
    const overlay = modal.querySelector(".dice-modal-overlay");
    const closeBtn = document.getElementById("close-token-modal");
    const decreaseBtn = document.getElementById("token-decrease");
    const increaseBtn = document.getElementById("token-increase");
    const countDisplay = document.getElementById("token-modal-count");

    let modalCount = currentCount;

    const updateCount = (change) => {
      modalCount = Math.max(0, modalCount + change);
      countDisplay.textContent = modalCount;

      // Update ocean bag
      if (change > 0) {
        this.gameConfig.oceanBag.push(tokenAbbr);
      } else if (change < 0) {
        const index = this.gameConfig.oceanBag.indexOf(tokenAbbr);
        if (index > -1) {
          this.gameConfig.oceanBag.splice(index, 1);
        }
      }

      // Refresh the gameplay display
      this.refreshGameplayDisplay();
    };

    decreaseBtn.addEventListener("click", () => updateCount(-1));
    increaseBtn.addEventListener("click", () => updateCount(1));

    const closeModal = () => {
      modal.remove();
    };

    overlay.addEventListener("click", closeModal);
    closeBtn.addEventListener("click", closeModal);
  }

  // Draw tokens from ocean bag
  drawTokens(shipsAtSea) {
    const tokensToDraw = shipsAtSea + 1;

    console.log("=== DRAWING TOKENS ===");
    console.log("Ships at sea:", shipsAtSea);
    console.log("Tokens to draw:", tokensToDraw);
    console.log("Ocean bag before shuffle:", [...this.gameConfig.oceanBag]);

    // Shuffle the ocean bag
    const shuffledBag = this.shuffleArray([...this.gameConfig.oceanBag]);
    console.log("Ocean bag after shuffle:", [...shuffledBag]);

    // Draw tokens
    const drawnTokens = shuffledBag.slice(0, tokensToDraw);
    console.log("Drawn tokens:", drawnTokens);

    // Show draw modal
    this.showDrawModal(drawnTokens);
  }

  // Show modal with drawn tokens
  showDrawModal(drawnTokens) {
    const tokenNames = {
      SW: "Sperm Whale",
      BW: "Bowhead Whale",
      RW: "Right Whale",
      ES: "Empty Sea",
      AM: "Ambergris",
      BlW: "Blue Whale",
      CA: "Castaway",
      WW: "White Whale",
    };

    let tokensHTML = '<div class="drawn-tokens-grid">';
    drawnTokens.forEach((tokenAbbr, index) => {
      const tokenName = tokenNames[tokenAbbr];
      tokensHTML += `
                <div class="drawn-token-card" data-token="${tokenAbbr}" data-index="${index}">
                    <img src="./assets/newbedford/tiles/${tokenAbbr}.jpg" alt="${tokenName}" class="drawn-token-image">
                </div>
            `;
    });
    tokensHTML += "</div>";

    const modalHTML = `
            <div class="dice-modal show" id="draw-modal">
                <div class="dice-modal-overlay"></div>
                <div class="dice-modal-content" style="max-width: 700px; max-height: 85vh; overflow-y: auto;">
                    <button class="btn btn-secondary" id="close-draw-modal" style="width: 100%; margin-bottom: 20px;">
                        ← Return
                    </button>
                    <h3>Drawn Tokens</h3>
                    ${tokensHTML}
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const modal = document.getElementById("draw-modal");
    const overlay = modal.querySelector(".dice-modal-overlay");
    const closeBtn = document.getElementById("close-draw-modal");

    // Track which tokens have been taken
    const takenTokens = new Set();

    // Add click listeners to drawn tokens
    const drawnTokenCards = modal.querySelectorAll(".drawn-token-card");
    drawnTokenCards.forEach((card) => {
      card.addEventListener("click", () => {
        const tokenAbbr = card.getAttribute("data-token");
        const index = parseInt(card.getAttribute("data-index"));
        const tokenKey = `${tokenAbbr}-${index}`;

        if (takenTokens.has(tokenKey)) {
          // Un-take the token
          card.style.opacity = "1";
          takenTokens.delete(tokenKey);

          // Add back to ocean bag
          this.gameConfig.oceanBag.push(tokenAbbr);
          console.log(
            `Added ${tokenAbbr} back to ocean bag. Total in bag:`,
            this.gameConfig.oceanBag.length
          );
        } else {
          // Take the token
          card.style.opacity = "0.3";
          takenTokens.add(tokenKey);

          // Remove from ocean bag
          const bagIndex = this.gameConfig.oceanBag.indexOf(tokenAbbr);
          if (bagIndex > -1) {
            this.gameConfig.oceanBag.splice(bagIndex, 1);
            console.log(
              `Removed ${tokenAbbr} from ocean bag. Remaining in bag:`,
              this.gameConfig.oceanBag.length
            );
          }
        }

        // Update the gameplay display
        this.refreshGameplayDisplay();
      });
    });

    const closeModal = () => {
      modal.remove();
    };

    overlay.addEventListener("click", closeModal);
    closeBtn.addEventListener("click", closeModal);
  }

  // Refresh gameplay display (update token counts)
  refreshGameplayDisplay() {
    const gameplaySection = document.getElementById("gameplay-section");
    if (!gameplaySection || this.currentPhase !== "gameplay") return;

    const totalTokens = this.gameConfig.oceanBag.length;

    // Update each token card's count
    const tokenCards = gameplaySection.querySelectorAll(".ocean-token-card");
    tokenCards.forEach((card) => {
      const tokenAbbr = card.getAttribute("data-token");
      const count = this.gameConfig.oceanBag.filter(
        (t) => t === tokenAbbr
      ).length;
      const percentage =
        totalTokens > 0 ? ((count / totalTokens) * 100).toFixed(1) : 0;

      const countElement = card.querySelector(".token-count");
      if (countElement) {
        countElement.textContent = `Count: ${count} (${percentage}%)`;
      }
    });
  }
}

// Create global instance
window.NewBedfordGame = new NewBedfordGame();