// New Bedford Game Module
// Handles all New Bedford specific functionality

class NewBedfordGame {
    constructor() {
        this.currentPhase = 'setup'; // setup, gameplay, scoring
        this.gameConfig = null;
    }

    // Get buildings from data manager
    getBuildings() {
        return window.dataManager.getBuildings();
    }

    // Get building by ID
    getBuildingById(id) {
        return this.getBuildings().find(building => building.id === id);
    }

    // Get buildings by type
    getBuildingsByType(type) {
        return this.getBuildings().filter(building => building.type === type);
    }

    // Get buildings by player count
    getBuildingsByPlayerCount(playerCount) {
        return this.getBuildings().filter(building =>
            building.minPlayer <= playerCount && building.maxPlayer >= playerCount
        );
    }

    // Initialize the New Bedford page
    init() {
        console.log('Initializing New Bedford game...');
        this.setupUI();
    }

    setupUI() {
        const container = document.getElementById('newbedford-content');
        if (!container) {
            // Fallback to old event listeners if container doesn't exist
            this.setupEventListeners();
            return;
        }

        this.showMainMenu();
    }

    showMainMenu() {
        const container = document.getElementById('newbedford-content');
        if (!container) return;

        container.innerHTML = `
            <div class="rail-baron-container">
                <h2>🐋 New Bedford</h2>
                <p class="subtitle">Select a tool to get started</p>
                
                <div class="rail-baron-menu">
                    <button class="rail-baron-menu-btn" id="btn-setup-play">
                        <span class="menu-icon">🎮</span>
                        <span class="menu-title">Setup + Play</span>
                        <span class="menu-desc">Configure game and view buildings</span>
                    </button>
                    
                    <button class="rail-baron-menu-btn" id="btn-score-calc" disabled>
                        <span class="menu-icon">🧮</span>
                        <span class="menu-title">Score Calculator</span>
                        <span class="menu-desc">Coming soon</span>
                    </button>
                    
                    <button class="rail-baron-menu-btn" id="btn-rulebook" disabled>
                        <span class="menu-icon">📖</span>
                        <span class="menu-title">Rulebook</span>
                        <span class="menu-desc">Coming soon</span>
                    </button>
                    
                    <button class="rail-baron-menu-btn" id="btn-buildings" disabled>
                        <span class="menu-icon">🏛️</span>
                        <span class="menu-title">Buildings</span>
                        <span class="menu-desc">Coming soon</span>
                    </button>
                </div>
            </div>
        `;

        // Attach menu button listeners
        document.getElementById('btn-setup-play')?.addEventListener('click', () => {
            this.showSetupPlay();
        });
    }

    showSetupPlay() {
        const container = document.getElementById('newbedford-content');
        if (!container) return;

        container.innerHTML = `
            <div class="rail-baron-container">
                <button class="back-button" id="back-to-menu">← Back to Menu</button>
                <h2>Setup + Play</h2>
                <p class="subtitle">Configure your New Bedford game</p>
                
                <div class="roll-section" id="setup-section">
                    <h3>Game Setup</h3>
                    
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
                            <option value="1">1 Player</option>
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
                    </div>
                    
                    <!-- 2 Player Variant (shown when 2 players selected) -->
                    <div id="two-player-options" style="display: none;">
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="two-player-variant-checkbox" class="setting-checkbox">
                                Use 2-Player Variant Rules
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
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="promo" value="blue-whale" class="setting-checkbox">
                                Blue Whale
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="promo" value="castaway" class="setting-checkbox">
                                Castaway
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="promo" value="white-whale" class="setting-checkbox">
                                White Whale
                            </label>
                        </div>
                    </div>
                    
                    <!-- AI Captains -->
                    <div class="setting-item">
                        <label for="ai-captains">AI Captains:</label>
                        <select id="ai-captains" class="setting-input">
                            <option value="0">None</option>
                            <option value="1">1 AI Captain</option>
                            <option value="2">2 AI Captains</option>
                            <option value="3">3 AI Captains</option>
                            <option value="4">4 AI Captains</option>
                        </select>
                    </div>
                    
                    <!-- Start Button -->
                    <button class="btn btn-primary" id="start-game-btn">Start Game</button>
                </div>
                
                <!-- Game Summary (shown after setup) -->
                <div class="roll-section" id="game-summary" style="display: none;">
                    <div class="card-header-with-button">
                        <h3>Game Configuration</h3>
                        <button class="btn btn-secondary" id="reset-setup-btn">Reset Setup</button>
                    </div>
                    <div id="game-summary-content"></div>
                    <button class="btn" id="view-buildings-btn">View Buildings for Setup</button>
                </div>
                
                <!-- Buildings Display -->
                <div class="roll-section" id="buildings-display" style="display: none;">
                    <h3>Buildings for Setup</h3>
                    <div id="buildings-list"></div>
                </div>
            </div>
        `;

        // Attach back button listener
        document.getElementById('back-to-menu')?.addEventListener('click', () => {
            this.showMainMenu();
        });

        this.setupEventListeners();
    }

    // Set up event listeners for New Bedford page
    setupEventListeners() {
        // Expansion radio buttons - show/hide Rising Tide options and enable/disable 5 players
        const expansionRadios = document.querySelectorAll('input[name="expansion"]');
        expansionRadios.forEach(radio => {
            radio.addEventListener('change', () => this.handleExpansionChange());
        });

        // Player count - show/hide 2-player variant option and update AI Captains
        const playerCount = document.getElementById('player-count');
        if (playerCount) {
            playerCount.addEventListener('change', () => {
                this.handlePlayerCountChange();
                this.updateAICaptainsOptions();
            });
        }

        // Start Game button
        const startGameBtn = document.getElementById('start-game-btn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => this.startGame());
        }

        // Reset Setup button
        const resetSetupBtn = document.getElementById('reset-setup-btn');
        if (resetSetupBtn) {
            resetSetupBtn.addEventListener('click', () => this.resetSetup());
        }

        // View Buildings button
        const viewBuildingsBtn = document.getElementById('view-buildings-btn');
        if (viewBuildingsBtn) {
            viewBuildingsBtn.addEventListener('click', () => this.displayBuildings());
        }

        // Initialize on load
        this.handleExpansionChange();
        this.updateAICaptainsOptions();
    }

    // Handle expansion selection change
    handleExpansionChange() {
        const expansionRadio = document.querySelector('input[name="expansion"]:checked');
        const risingTideOptions = document.getElementById('rising-tide-options');
        const playerCountSelect = document.getElementById('player-count');
        const fivePlayerOption = playerCountSelect?.querySelector('option[value="5"]');
        
        if (expansionRadio && risingTideOptions) {
            const isRisingTide = expansionRadio.value === 'rising-tide';
            
            // Show/hide Rising Tide options
            risingTideOptions.style.display = isRisingTide ? 'block' : 'none';
            
            // Enable/disable 5 player option
            if (fivePlayerOption) {
                fivePlayerOption.disabled = !isRisingTide;
                fivePlayerOption.textContent = isRisingTide ? '5 Players' : '5 Players (Rising Tide only)';
                
                // If 5 players is currently selected and we switch to base game, change to 4 players
                if (!isRisingTide && playerCountSelect.value === '5') {
                    playerCountSelect.value = '4';
                    this.handlePlayerCountChange();
                    this.updateAICaptainsOptions();
                }
            }
        }
    }

    // Handle player count change
    handlePlayerCountChange() {
        const playerCount = document.getElementById('player-count');
        const twoPlayerOptions = document.getElementById('two-player-options');
        
        if (playerCount && twoPlayerOptions) {
            if (playerCount.value === '2') {
                twoPlayerOptions.style.display = 'block';
            } else {
                twoPlayerOptions.style.display = 'none';
            }
        }
    }

    // Update AI Captains options based on player count
    updateAICaptainsOptions() {
        const playerCount = parseInt(document.getElementById('player-count')?.value || 1);
        const aiCaptainsSelect = document.getElementById('ai-captains');
        
        if (!aiCaptainsSelect) return;
        
        const maxAI = 4 - playerCount;
        const currentValue = parseInt(aiCaptainsSelect.value);
        
        // Clear and rebuild options
        aiCaptainsSelect.innerHTML = '';
        
        for (let i = 0; i <= maxAI; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i === 0 ? 'None' : `${i} AI Captain${i > 1 ? 's' : ''}`;
            aiCaptainsSelect.appendChild(option);
        }
        
        // Restore previous value if still valid, otherwise set to max
        if (currentValue <= maxAI) {
            aiCaptainsSelect.value = currentValue;
        } else {
            aiCaptainsSelect.value = maxAI;
        }
    }

    // Start the game with selected configuration
    startGame() {
        // Gather all configuration
        const expansionRadio = document.querySelector('input[name="expansion"]:checked');
        const expansion = expansionRadio?.value;
        const playerCount = parseInt(document.getElementById('player-count')?.value);
        const shipsLog = document.getElementById('ships-log-checkbox')?.checked;
        const twoPlayerVariant = document.getElementById('two-player-variant-checkbox')?.checked;
        const aiCaptains = parseInt(document.getElementById('ai-captains')?.value);
        
        // Get selected promos from checkboxes
        const promoCheckboxes = document.querySelectorAll('input[name="promo"]:checked');
        const selectedPromos = Array.from(promoCheckboxes).map(cb => cb.value);

        // Store configuration
        this.gameConfig = {
            expansion,
            playerCount,
            shipsLog: expansion === 'rising-tide' ? shipsLog : false,
            twoPlayerVariant: playerCount === 2 ? twoPlayerVariant : false,
            promos: selectedPromos,
            aiCaptains
        };

        console.log('Game configuration:', this.gameConfig);

        // Hide the setup form
        const setupCard = document.querySelector('#page-newbedford .card:first-child + .card');
        if (setupCard) {
            setupCard.style.display = 'none';
        }

        // Display game summary
        this.displayGameSummary();

        // Show notification
        if (window.showNotification) {
            window.showNotification('Game setup complete!');
        }
    }

    // Reset setup - go back to setup form
    resetSetup() {
        // Show the setup form
        const setupCard = document.querySelector('#page-newbedford .card:first-child + .card');
        if (setupCard) {
            setupCard.style.display = 'block';
        }

        // Hide game summary and buildings display
        const gameSummary = document.getElementById('game-summary');
        const buildingsDisplay = document.getElementById('buildings-display');
        
        if (gameSummary) {
            gameSummary.style.display = 'none';
        }
        
        if (buildingsDisplay) {
            buildingsDisplay.style.display = 'none';
        }

        // Clear game configuration
        this.gameConfig = null;

        // Scroll to top of setup form
        setupCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Show notification
        if (window.showNotification) {
            window.showNotification('Setup reset - configure your game again');
        }
    }

    // Display game configuration summary
    displayGameSummary() {
        const gameSummary = document.getElementById('game-summary');
        const summaryContent = document.getElementById('game-summary-content');

        if (!gameSummary || !summaryContent || !this.gameConfig) return;

        // Build summary HTML
        let html = '';
        
        html += `<div class="summary-item">
            <span class="summary-label">Expansion:</span>
            <span class="summary-value">${this.gameConfig.expansion === 'rising-tide' ? 'Base + Rising Tide' : 'Base Game'}</span>
        </div>`;
        
        html += `<div class="summary-item">
            <span class="summary-label">Players:</span>
            <span class="summary-value">${this.gameConfig.playerCount}</span>
        </div>`;
        
        if (this.gameConfig.expansion === 'rising-tide' && this.gameConfig.shipsLog) {
            html += `<div class="summary-item">
                <span class="summary-label">Ship's Log:</span>
                <span class="summary-value">Enabled</span>
            </div>`;
        }
        
        if (this.gameConfig.playerCount === 2 && this.gameConfig.twoPlayerVariant) {
            html += `<div class="summary-item">
                <span class="summary-label">2-Player Variant:</span>
                <span class="summary-value">Enabled</span>
            </div>`;
        }
        
        if (this.gameConfig.promos.length > 0) {
            html += `<div class="summary-item">
                <span class="summary-label">Promos:</span>
                <span class="summary-value">${this.gameConfig.promos.map(p => p.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ')}</span>
            </div>`;
        }
        
        if (this.gameConfig.aiCaptains > 0) {
            html += `<div class="summary-item">
                <span class="summary-label">AI Captains:</span>
                <span class="summary-value">${this.gameConfig.aiCaptains}</span>
            </div>`;
        }

        summaryContent.innerHTML = html;
        gameSummary.style.display = 'block';
        gameSummary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Display buildings based on game configuration
    displayBuildings() {
        const buildingsDisplay = document.getElementById('buildings-display');
        const buildingsList = document.getElementById('buildings-list');

        if (!buildingsList || !this.gameConfig) {
            console.log('Cannot display buildings: missing configuration');
            return;
        }

        // Get buildings based on player count from game config
        const buildings = this.getBuildingsByPlayerCount(this.gameConfig.playerCount);

        // Clear previous content
        buildingsList.innerHTML = '';

        if (buildings.length === 0) {
            buildingsList.innerHTML = '<p>No buildings available for this player count.</p>';
            if (buildingsDisplay) buildingsDisplay.style.display = 'block';
            return;
        }

        // Create building cards
        buildings.forEach(building => {
            const buildingCard = document.createElement('div');
            buildingCard.className = 'building-card';
            buildingCard.innerHTML = `
                <div class="building-header">
                    <h4>${building.name}</h4>
                    <span class="building-type">${building.type}</span>
                </div>
                <div class="building-details">
                    <p><strong>ID:</strong> ${building.id}</p>
                    <p><strong>Players:</strong> ${building.minPlayer}-${building.maxPlayer}</p>
                    <p><strong>Special:</strong> ${building.special}</p>
                </div>
            `;
            buildingsList.appendChild(buildingCard);
        });

        // Show the buildings display
        if (buildingsDisplay) {
            buildingsDisplay.style.display = 'block';
            buildingsDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // FUTURE METHODS - Gameplay tracking, scoring, etc.

    // Gameplay Phase
    startGameplay() {
        this.currentPhase = 'gameplay';
        console.log('Starting New Bedford gameplay phase');
        // TODO: Implement gameplay tracking
    }

    takeTurn(playerId, action) {
        console.log(`Player ${playerId} taking action: ${action}`);
        // TODO: Implement turn logic
    }

    // Scoring Phase
    calculateScore(playerId) {
        console.log(`Calculating score for player ${playerId}`);
        // TODO: Implement scoring logic
        return 0;
    }

    endGame() {
        this.currentPhase = 'scoring';
        console.log('Ending New Bedford game');
        // TODO: Implement end game logic
    }
}

// Create global instance
window.NewBedfordGame = new NewBedfordGame();