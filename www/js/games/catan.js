// Catan Game Module
// Handles all Catan specific functionality

class CatanGame {
    constructor() {
        this.currentMap = null;
        this.is56Player = false;
    }

    init() {
        console.log('Catan game module loaded');
        this.setupUI();
    }

    setupUI() {
        const container = document.getElementById('catan-content');
        if (!container) return;

        this.showMainMenu();
    }

    showMainMenu() {
        const container = document.getElementById('catan-content');
        if (!container) return;

        container.innerHTML = `
            <div class="catan-container">
                <h2>Catan</h2>
                
                <div class="catan-menu">
                    <button class="catan-menu-btn" id="btn-map-generator">
                        <span class="menu-icon">🗺️</span>
                        <span class="menu-title">Map Generator</span>
                        <span class="menu-desc">Generate game board setup</span>
                    </button>
                    
                    <button class="catan-menu-btn" id="btn-dice-roller" disabled>
                        <span class="menu-icon">🎲</span>
                        <span class="menu-title">Dice Roller</span>
                        <span class="menu-desc">Coming soon</span>
                    </button>
                    
                    <button class="catan-menu-btn" id="btn-resource-tracker">
                        <span class="menu-icon">📦</span>
                        <span class="menu-title">Resource Tracker</span>
                        <span class="menu-desc">Track your resources</span>
                    </button>
                    
                    <button class="catan-menu-btn" id="btn-dev-cards" disabled>
                        <span class="menu-icon">🃏</span>
                        <span class="menu-title">Development Cards</span>
                        <span class="menu-desc">Coming soon</span>
                    </button>
                    
                    <button class="catan-menu-btn" id="btn-score-tracker" disabled>
                        <span class="menu-icon">🏆</span>
                        <span class="menu-title">Score Tracker</span>
                        <span class="menu-desc">Coming soon</span>
                    </button>
                </div>
            </div>
        `;

        // Attach menu button listeners
        document.getElementById('btn-map-generator')?.addEventListener('click', () => {
            this.showMapGenerator();
        });
        
        document.getElementById('btn-dice-roller')?.addEventListener('click', () => {
            this.showDiceRoller();
        });
        
        document.getElementById('btn-resource-tracker')?.addEventListener('click', () => {
            this.showResourceTracker();
        });
        
        document.getElementById('btn-dev-cards')?.addEventListener('click', () => {
            this.showDevCards();
        });
        
        document.getElementById('btn-score-tracker')?.addEventListener('click', () => {
            this.showScoreTracker();
        });
    }

    showMapGenerator() {
        const container = document.getElementById('catan-content');
        if (!container) return;

        container.innerHTML = `
            <div class="catan-container">
                <button class="back-button" id="back-to-menu">← Back to Menu</button>
                <h2>🗺️ Map Generator</h2>
                
                <div class="roll-section">
                    <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                        <label class="expansion-checkbox-label">
                            <input type="checkbox" id="enable-56-player" class="expansion-checkbox">
                            <span class="expansion-checkbox-text">🎮 5-6 Player Expansion</span>
                        </label>
                    </div>
                    
                    <div class="button-group" style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn btn-primary" id="generate-default" style="flex: 1; min-width: 180px;">
                            📋 Beginners Map
                        </button>
                        <button class="btn btn-secondary" id="generate-variable" style="flex: 1; min-width: 180px;">
                            🎲 Variable Map
                        </button>
                        <button class="btn btn-secondary" id="generate-random" style="flex: 1; min-width: 180px; background: linear-gradient(135deg, #ea4335, #fbbc04);">
                            🎰 Random Map
                        </button>
                    </div>
                    <p style="text-align: center; color: var(--text-light); margin-top: 10px; font-size: 0.85rem; line-height: 1.6;">
                        <strong>Beginners:</strong> Fixed balanced setup<br>
                        <strong>Variable:</strong> Random terrains, ordered numbers<br>
                        <strong>Random:</strong> Fully randomized (no adjacent 6s/8s)
                    </p>
                </div>
                
                <div id="map-display" class="roll-section" style="display: none;">
                    <h3>Game Board</h3>
                    <div id="catan-map" class="catan-map"></div>
                    <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button class="btn btn-secondary" id="regenerate-map">🔄 Regenerate</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('back-to-menu')?.addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('enable-56-player')?.addEventListener('change', (e) => {
            this.is56Player = e.target.checked;
        });

        document.getElementById('generate-default')?.addEventListener('click', () => {
            this.generateDefaultMap();
        });

        document.getElementById('generate-variable')?.addEventListener('click', () => {
            this.generateVariableMap();
        });

        document.getElementById('generate-random')?.addEventListener('click', () => {
            this.generateRandomMap();
        });

        document.getElementById('regenerate-map')?.addEventListener('click', () => {
            if (this.currentMap === 'default') {
                this.generateDefaultMap();
            } else if (this.currentMap === 'variable') {
                this.generateVariableMap();
            } else {
                this.generateRandomMap();
            }
        });
    }

    generateDefaultMap() {
        if (this.is56Player) {
            this.generate56DefaultMap();
            return;
        }
        
        this.currentMap = 'default';
        
        // Base game default setup from rules (Page 3, Illustration A/R)
        const tiles = [
            // Row 1 (top, 3 tiles): mountain, farm, trees
            { terrain: 'mountains', number: 10 },
            { terrain: 'grain', number: 2 },
            { terrain: 'forest', number: 9 },
            // Row 2 (4 tiles): wheat, brick, farm, brick
            { terrain: 'grain', number: 12 },
            { terrain: 'hills', number: 6 },
            { terrain: 'pasture', number: 4 },
            { terrain: 'hills', number: 10 },
            // Row 3 (5 tiles - middle): wheat, forest, desert, forest, mountain
            { terrain: 'grain', number: 9 },
            { terrain: 'forest', number: 11 },
            { terrain: 'desert', number: null },
            { terrain: 'forest', number: 3 },
            { terrain: 'mountains', number: 8 },
            // Row 4 (4 tiles): forest, mountain, field, pasture
            { terrain: 'forest', number: 8 },
            { terrain: 'mountains', number: 3 },
            { terrain: 'grain', number: 4 },
            { terrain: 'pasture', number: 5 },
            // Row 5 (bottom, 3 tiles): brick, fields, pasture
            { terrain: 'hills', number: 5 },
            { terrain: 'grain', number: 6 },
            { terrain: 'pasture', number: 11 }
        ];

        this.displayMap(tiles);
    }

    generate56DefaultMap() {
        this.currentMap = 'default';
        
        // 5-6 Player Beginners Map from expansion rules (Page 5)
        // 30 tiles total in 3-4-5-6-5-4-3 pattern
        const tiles = [
            // Row 1 (3 tiles): hills, pasture, desert
            { terrain: 'hills', number: 10 },
            { terrain: 'pasture', number: 6 },
            { terrain: 'desert', number: null },
            // Row 2 (4 tiles): hills, fields, mountain, hills
            { terrain: 'hills', number: 6 },
            { terrain: 'grain', number: 2 },
            { terrain: 'mountains', number: 9 },
            { terrain: 'hills', number: 11 },
            // Row 3 (5 tiles): forest, mountain, forest, field, pasture
            { terrain: 'forest', number: 3 },
            { terrain: 'mountains', number: 11 },
            { terrain: 'forest', number: 5 },
            { terrain: 'grain', number: 10 },
            { terrain: 'pasture', number: 4 },
            // Row 4 (6 tiles): desert, pasture, field, mountain, pasture, field
            { terrain: 'desert', number: null },
            { terrain: 'pasture', number: 5 },
            { terrain: 'grain', number: 4 },
            { terrain: 'mountains', number: 6 },
            { terrain: 'pasture', number: 3 },
            { terrain: 'grain', number: 8 },
            // Row 5 (5 tiles): forest, mountain, pasture, hill, forest
            { terrain: 'forest', number: 12 },
            { terrain: 'mountains', number: 10 },
            { terrain: 'pasture', number: 2 },
            { terrain: 'hills', number: 4 },
            { terrain: 'forest', number: 11 },
            // Row 6 (4 tiles): forest, fields, forest, fields
            { terrain: 'forest', number: 8 },
            { terrain: 'grain', number: 3 },
            { terrain: 'forest', number: 9 },
            { terrain: 'grain', number: 5 },
            // Row 7 (3 tiles): hills, pasture, mountains
            { terrain: 'hills', number: 9 },
            { terrain: 'pasture', number: 12 },
            { terrain: 'mountains', number: 8 }
        ];

        this.displayMap56(tiles);
    }

    generateVariableMap() {
        if (this.is56Player) {
            this.generate56VariableMap();
            return;
        }
        
        this.currentMap = 'variable';
        
        // Base game terrain counts
        const terrains = [
            'forest', 'forest', 'forest', 'forest',
            'pasture', 'pasture', 'pasture', 'pasture',
            'grain', 'grain', 'grain', 'grain',
            'hills', 'hills', 'hills',
            'mountains', 'mountains', 'mountains',
            'desert'
        ];
        
        // Number tokens in alphabetical order (A-R)
        const numbers = [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11];
        
        // Shuffle terrains
        this.shuffleArray(terrains);
        
        // Counter-clockwise spiral from top-left corner
        const spiralOrder = [
            0,    // Start top-left
            3, 7, 12, 16,  // Go down left edge
            17, 18,  // Bottom row left to right
            15, 11, 6, 2,  // Go up right edge
            1,    // Top row right
            4, 8, 13,  // Inner ring down-left
            14, 10, 5,  // Inner ring up-right
            9     // Center
        ];
        
        // Create tiles with terrains
        const tiles = terrains.map(terrain => ({ terrain, number: null }));
        
        // Place numbers in counter-clockwise spiral, skipping desert
        let numberIndex = 0;
        for (const tileIndex of spiralOrder) {
            if (tiles[tileIndex].terrain !== 'desert' && numberIndex < numbers.length) {
                tiles[tileIndex].number = numbers[numberIndex];
                numberIndex++;
            }
        }
        
        // Check for adjacent red numbers
        this.ensureNoAdjacentRedNumbers(tiles);
        
        this.displayMap(tiles);
    }

    generate56VariableMap() {
        this.currentMap = 'variable';
        
        // 5-6 player terrain counts: 6 forest, 6 pasture, 6 grain, 5 hills, 5 mountains, 2 desert
        const terrains = [
            'forest', 'forest', 'forest', 'forest', 'forest', 'forest',
            'pasture', 'pasture', 'pasture', 'pasture', 'pasture', 'pasture',
            'grain', 'grain', 'grain', 'grain', 'grain', 'grain',
            'hills', 'hills', 'hills', 'hills', 'hills',
            'mountains', 'mountains', 'mountains', 'mountains', 'mountains',
            'desert', 'desert'
        ];
        
        // 28 number tokens in ALPHABETICAL order (A through Y, then ZA, ZB, ZC)
        // A-2, B-5, C-4, D-6, E-3, F-9, G-8, H-11, I-11, J-10, K-6, L-3, M-8, N-4, O-8, P-10, Q-11, R-12, S-10, T-5, U-4, V-9, W-5, X-9, Y-12, ZA-3, ZB-2, ZC-6
        const numbers = [2, 5, 4, 6, 3, 9, 8, 11, 11, 10, 6, 3, 8, 4, 8, 10, 11, 12, 10, 5, 4, 9, 5, 9, 12, 3, 2, 6];
        
        // Shuffle terrains
        this.shuffleArray(terrains);
        
        // Counter-clockwise spiral for 30 tiles
        const spiralOrder = this.get56SpiralOrder();
        
        // Create tiles with terrains
        const tiles = terrains.map(terrain => ({ terrain, number: null }));
        
        // Place numbers in counter-clockwise spiral, skipping deserts
        let numberIndex = 0;
        for (const tileIndex of spiralOrder) {
            if (tiles[tileIndex].terrain !== 'desert' && numberIndex < numbers.length) {
                tiles[tileIndex].number = numbers[numberIndex];
                numberIndex++;
            }
        }
        
        // Check for adjacent red numbers
        this.ensure56NoAdjacentRedNumbers(tiles);
        
        this.displayMap56(tiles);
    }

    generateRandomMap() {
        if (this.is56Player) {
            this.generate56RandomMap();
            return;
        }
        
        this.currentMap = 'random';
        
        // Base game terrain counts
        const terrains = [
            'forest', 'forest', 'forest', 'forest',
            'pasture', 'pasture', 'pasture', 'pasture',
            'grain', 'grain', 'grain', 'grain',
            'hills', 'hills', 'hills',
            'mountains', 'mountains', 'mountains',
            'desert'
        ];
        
        // Number tokens
        const numbers = [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11];
        
        // Shuffle both
        this.shuffleArray(terrains);
        this.shuffleArray(numbers);
        
        // Create tiles
        const tiles = [];
        let numberIndex = 0;
        
        for (let i = 0; i < terrains.length; i++) {
            const terrain = terrains[i];
            const tile = { terrain };
            
            if (terrain === 'desert') {
                tile.number = null;
            } else {
                tile.number = numbers[numberIndex];
                numberIndex++;
            }
            
            tiles.push(tile);
        }
        
        // Check for adjacent red numbers
        this.ensureNoAdjacentRedNumbers(tiles);
        
        this.displayMap(tiles);
    }

    generate56RandomMap() {
        this.currentMap = 'random';
        
        // 5-6 player terrain counts
        const terrains = [
            'forest', 'forest', 'forest', 'forest', 'forest', 'forest',
            'pasture', 'pasture', 'pasture', 'pasture', 'pasture', 'pasture',
            'grain', 'grain', 'grain', 'grain', 'grain', 'grain',
            'hills', 'hills', 'hills', 'hills', 'hills',
            'mountains', 'mountains', 'mountains', 'mountains', 'mountains',
            'desert', 'desert'
        ];
        
        // 28 number tokens
        const numbers = [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11, 6, 11, 4, 8, 10, 5, 2, 6, 3, 9];
        
        // Shuffle both
        this.shuffleArray(terrains);
        this.shuffleArray(numbers);
        
        // Create tiles
        const tiles = [];
        let numberIndex = 0;
        
        for (let i = 0; i < terrains.length; i++) {
            const terrain = terrains[i];
            const tile = { terrain };
            
            if (terrain === 'desert') {
                tile.number = null;
            } else {
                tile.number = numbers[numberIndex];
                numberIndex++;
            }
            
            tiles.push(tile);
        }
        
        // Check for adjacent red numbers
        this.ensure56NoAdjacentRedNumbers(tiles);
        
        this.displayMap56(tiles);
    }

    get56SpiralOrder() {
        // Counter-clockwise spiral for 30-tile board (4-5-6-5-6-5-4 pattern)
        // Starting from top-left corner
        return [
            0,    // Start top-left
            4, 9, 14, 20, 25,  // Down left edge
            26, 27, 28, 29,  // Bottom row
            24, 19, 13, 8, 3,  // Up right edge
            1, 2,  // Top row
            5, 10, 15, 21,  // Inner ring down-left
            22, 23, 18, 12, 7,  // Inner ring bottom and up-right
            6,  // Second ring
            11, 16,  // Inner ring
            17  // Center
        ];
    }

    ensureNoAdjacentRedNumbers(tiles) {
        // Hex adjacency map for the 19-tile layout
        const adjacencies = [
            [1, 3, 4], // 0
            [0, 2, 4, 5], // 1
            [1, 5, 6], // 2
            [0, 4, 7, 8], // 3
            [0, 1, 3, 5, 8, 9], // 4
            [1, 2, 4, 6, 9, 10], // 5
            [2, 5, 10, 11], // 6
            [3, 8, 12], // 7
            [3, 4, 7, 9, 12, 13], // 8
            [4, 5, 8, 10, 13, 14], // 9
            [5, 6, 9, 11, 14, 15], // 10
            [6, 10, 15], // 11
            [7, 8, 13, 16], // 12
            [8, 9, 12, 14, 16, 17], // 13
            [9, 10, 13, 15, 17, 18], // 14
            [10, 11, 14, 18], // 15
            [12, 13, 17], // 16
            [13, 14, 16, 18], // 17
            [14, 15, 17] // 18
        ];
        
        const redNumbers = [6, 8];
        let swapped = true;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (swapped && attempts < maxAttempts) {
            swapped = false;
            attempts++;
            
            for (let i = 0; i < tiles.length; i++) {
                if (redNumbers.includes(tiles[i].number)) {
                    const neighbors = adjacencies[i] || [];
                    
                    for (const neighborIdx of neighbors) {
                        if (redNumbers.includes(tiles[neighborIdx].number)) {
                            // Find a non-adjacent tile to swap with
                            for (let j = 0; j < tiles.length; j++) {
                                if (j !== i && j !== neighborIdx &&
                                    !redNumbers.includes(tiles[j].number) &&
                                    tiles[j].terrain !== 'desert') {
                                    // Swap numbers
                                    const temp = tiles[i].number;
                                    tiles[i].number = tiles[j].number;
                                    tiles[j].number = temp;
                                    swapped = true;
                                    break;
                                }
                            }
                            if (swapped) break;
                        }
                    }
                    if (swapped) break;
                }
            }
        }
    }

    displayMap(tiles) {
        const mapDisplay = document.getElementById('map-display');
        const mapContainer = document.getElementById('catan-map');
        
        if (!mapDisplay || !mapContainer) return;
        
        mapDisplay.style.display = 'block';
        
        // Create hexagonal grid layout in honeycomb pattern
        let html = '<div class="hex-grid">';
        
        // Catan board: 3, 4, 5, 4, 3 tiles per row
        const rows = [
            { start: 0, count: 3 },  // Row 1
            { start: 3, count: 4 },  // Row 2
            { start: 7, count: 5 },  // Row 3 (middle)
            { start: 12, count: 4 }, // Row 4
            { start: 16, count: 3 }  // Row 5
        ];
        
        rows.forEach((row, rowIndex) => {
            html += `<div class="hex-row">`;
            
            for (let i = 0; i < row.count; i++) {
                const tileIndex = row.start + i;
                const tile = tiles[tileIndex];
                const terrainClass = `terrain-${tile.terrain}`;
                const numberClass = (tile.number === 6 || tile.number === 8) ? 'number-red' : '';
                
                html += `
                    <div class="hex ${terrainClass}">
                        <div class="hex-content">
                            <div class="terrain-name">${this.getTerrainName(tile.terrain)}</div>
                            ${tile.number ? `
                                <div class="number-token ${numberClass}">
                                    <div class="number-value">${tile.number}</div>
                                    <div class="number-pips">${this.getPips(tile.number)}</div>
                                </div>
                            ` : '<div class="robber-icon">🏜️</div>'}
                        </div>
                    </div>
                `;
            }
            
            html += '</div>';
        });
        
        html += '</div>';
        
        mapContainer.innerHTML = html;
        mapDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    getTerrainName(terrain) {
        const names = {
            'forest': 'Forest',
            'pasture': 'Pasture',
            'grain': 'Fields',
            'hills': 'Hills',
            'mountains': 'Mountains',
            'desert': 'Desert'
        };
        return names[terrain] || terrain;
    }

    getPips(number) {
        const pips = {
            2: '•',
            3: '••',
            4: '•••',
            5: '••••',
            6: '•••••',
            8: '•••••',
            9: '••••',
            10: '•••',
            11: '••',
            12: '•'
        };
        return pips[number] || '';
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    showDiceRoller() {
        const container = document.getElementById('catan-content');
        if (!container) return;

        container.innerHTML = `
            <div class="catan-container">
                <button class="back-button" id="back-to-menu">← Back to Menu</button>
                <h2>🎲 Dice Roller</h2>
                <p class="subtitle">Roll dice with statistics tracking</p>
                
                <div class="roll-section">
                    <h3>Coming Soon</h3>
                    <p>Dice rolling functionality will be added in a future update.</p>
                </div>
            </div>
        `;

        document.getElementById('back-to-menu')?.addEventListener('click', () => {
            this.showMainMenu();
        });
    }

    showResourceTracker() {
        const container = document.getElementById('catan-content');
        if (!container) return;

        container.innerHTML = `
            <div class="catan-container">
                <button class="back-button" id="back-to-menu">← Back to Menu</button>
                <h2>📦 Resource Tracker</h2>
                
                <div class="catan-section">
                    <div class="catan-button-group" style="margin-bottom: 20px;">
                        <button id="add-resource-btn" class="btn btn-primary">Add Resource</button>
                    </div>
                    
                    <h3>Resources by Roll</h3>
                    <div id="resource-roll-display" class="resource-roll-display"></div>
                    
                    <div class="catan-button-group">
                        <button id="reset-resources-btn" class="btn btn-secondary">Reset Resources</button>
                    </div>
                </div>
            </div>
        `;

        // Load existing resources from localStorage grouped by dice roll
        const resourceDisplay = document.getElementById('resource-roll-display');
        const loadResources = () => {
            const savedResources = JSON.parse(localStorage.getItem('catan-resources') || '[]');
            
            // Group resources by dice roll
            const resourcesByRoll = {};
            savedResources.forEach((resource, index) => {
                if (!resourcesByRoll[resource.diceRoll]) {
                    resourcesByRoll[resource.diceRoll] = [];
                }
                resourcesByRoll[resource.diceRoll].push({...resource, index});
            });
            
            // Sort dice rolls numerically
            const sortedRolls = Object.keys(resourcesByRoll).sort((a, b) => parseInt(a) - parseInt(b));
            
            if (sortedRolls.length === 0) {
                resourceDisplay.innerHTML = '<p class="no-resources">No resources added yet. Click "Add Resource" to get started.</p>';
                return;
            }
            
            // Generate HTML for each dice roll group
            resourceDisplay.innerHTML = sortedRolls.map(roll => {
                const resources = resourcesByRoll[roll];
                
                return `
                    <div class="dice-roll-group">
                        <div class="dice-roll-header">
                            <div class="dice-roll-number">${roll}</div>
                            <div class="dice-roll-pip">${this.getPips(parseInt(roll))}</div>
                        </div>
                        <div class="resource-items">
                            <div class="resource-items-grid">
                                ${resources.map(resource => `
                                    <div class="resource-item ${resource.settlementType}" data-index="${resource.index}">
                                        <div class="resource-image-wrapper" data-index="${resource.index}">
                                            <img src="assets/catan/resources/${resource.resourceType}.jpg"
                                                alt="${resource.resourceType}"
                                                class="resource-image" />
                                            ${resource.multiplier > 1 ?
                                                `<span class="resource-multiplier">×${resource.multiplier}</span>` : ''}
                                        </div>
                                        <div class="resource-name">${resource.resourceType.charAt(0).toUpperCase() + resource.resourceType.slice(1)}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Add resource item click listeners to open management modal
            document.querySelectorAll('.resource-image-wrapper').forEach(item => {
                item.addEventListener('click', (e) => {
                    const index = item.getAttribute('data-index');
                    const savedResources = JSON.parse(localStorage.getItem('catan-resources') || '[]');
                    const resource = savedResources[index];
                    this.showResourceManagementModal(resource, index, loadResources);
                });
            });
        };

        // Initial load of resources
        loadResources();

        // Add resource button handler
        const addResourceBtn = document.getElementById('add-resource-btn');
        addResourceBtn.addEventListener('click', () => {
            this.showResourceInputModal(loadResources);
        });

        // Reset resources button handler
        const resetResourcesBtn = document.getElementById('reset-resources-btn');
        resetResourcesBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all resources?')) {
                localStorage.removeItem('catan-resources');
                loadResources();
            }
        });

        // Back to menu button
        document.getElementById('back-to-menu')?.addEventListener('click', () => {
            this.showMainMenu();
        });
    }

    showResourceInputModal(onComplete) {
        const modalHTML = `
            <div class="dice-modal show" id="resource-input-modal">
                <div class="dice-modal-overlay"></div>
                <div class="dice-modal-content" style="max-height: 85vh; display: flex; flex-direction: column; max-width: 500px;">
                    <h3 style="margin: 0 0 10px 0;">Add Resource</h3>
                    <div style="overflow-y: auto; flex: 1; padding-top: 2px;">
                        <div style="display: flex; flex-direction: column; gap: 15px; margin: 10px 0;">
                            <div class="catan-input-section">
                                <label>Dice Roll (2-12):</label>
                                <div class="catan-dice-grid">
                                    ${[2,3,4,5,6,8,9,10,11,12].map(num => `
                                        <button class="catan-dice-btn" data-value="${num}">
                                            ${num}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="catan-input-section">
                                <label>Resource Type:</label>
                                <div class="catan-resource-grid">
                                    <button class="catan-resource-btn" data-value="brick">Brick</button>
                                    <button class="catan-resource-btn" data-value="lumber">Lumber</button>
                                    <button class="catan-resource-btn" data-value="ore">Ore</button>
                                    <button class="catan-resource-btn" data-value="grain">Grain</button>
                                    <button class="catan-resource-btn" data-value="wool">Wool</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-primary" id="confirm-resource" style="width: 100%; margin-top: 15px;">Add Resource</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('resource-input-modal');
        const overlay = modal.querySelector('.dice-modal-overlay');
        const confirmBtn = document.getElementById('confirm-resource');
        
        let selectedDiceRoll = null;
        let selectedResourceType = null;

        // Dice roll selection
        modal.querySelectorAll('.catan-dice-btn[data-value]').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.catan-dice-btn[data-value]').forEach(b => {
                    b.classList.remove('selected');
                });
                btn.classList.add('selected');
                selectedDiceRoll = btn.getAttribute('data-value');
            });
        });

        // Resource type selection
        modal.querySelectorAll('.catan-resource-btn[data-value]').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.catan-resource-btn[data-value]').forEach(b => {
                    b.classList.remove('selected');
                });
                btn.classList.add('selected');
                selectedResourceType = btn.getAttribute('data-value');
            });
        });

        // Confirm button
        confirmBtn.addEventListener('click', () => {
            if (!selectedDiceRoll) {
                alert('Please select a dice roll');
                return;
            }
            if (!selectedResourceType) {
                alert('Please select a resource type');
                return;
            }

            const savedResources = JSON.parse(localStorage.getItem('catan-resources') || '[]');
            savedResources.push({
                diceRoll: selectedDiceRoll,
                settlementType: 'settlement',
                resourceType: selectedResourceType,
                multiplier: 1
            });
            localStorage.setItem('catan-resources', JSON.stringify(savedResources));

            // Close modal and refresh resource list
            modal.remove();
            if (onComplete) onComplete();
        });

        // Close modal on overlay click
        const closeModal = () => {
            modal.remove();
        };

        overlay.addEventListener('click', closeModal);
    }
    
    showResourceManagementModal(resource, index, onComplete) {
        // Initialize multiplier from resource if it exists, otherwise derive from settlement type
        const currentMultiplier = resource.multiplier || (resource.settlementType === 'city' ? 2 : 1);
        const maxMultiplier = 10;
        
        // Create modal HTML matching New Bedford token modal style (with image)
        const modalHTML = `
            <div class="dice-modal show" id="resource-management-modal">
                <div class="dice-modal-overlay"></div>
                <div class="dice-modal-content" style="max-height: 85vh; display: flex; flex-direction: column;">
                    <img src="assets/catan/resources/${resource.resourceType}.jpg" alt="${resource.resourceType}" style="width: 100%; max-width: 200px; border-radius: 8px; margin: 0 auto 15px; display: block;">
                    <h3 style="margin: 0 0 10px 0;">${resource.resourceType.charAt(0).toUpperCase() + resource.resourceType.slice(1)}</h3>
                    <p style="text-align: center; font-size: 1.1rem; color: var(--text-light); margin-bottom: 15px;">
                        Dice Roll: ${resource.diceRoll}
                    </p>
                    <div style="overflow-y: auto; flex: 1; margin-bottom: 15px; padding-top: 2px;">
                        <div class="catan-multiplier-picker-grid">
                            ${Array.from({length: maxMultiplier}, (_, i) => {
                                const value = i + 1;
                                return `
                                    <button class="catan-multiplier-picker-btn ${value === currentMultiplier ? 'selected' : ''}" data-value="${value}">
                                        ${value}
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; width: 100%;">
                        <button class="btn btn-secondary" id="remove-resource" style="flex: 1; background: #ea4335; min-width: 0; padding: 12px 8px; font-size: 0.95rem;">
                            Remove
                        </button>
                        <button class="btn btn-secondary" id="cancel-resource-changes" style="flex: 1; min-width: 0; padding: 12px 8px; font-size: 0.95rem;">
                            Cancel
                        </button>
                        <button class="btn btn-primary" id="save-resource-changes" style="flex: 1; min-width: 0; padding: 12px 8px; font-size: 0.95rem;">
                            Save
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('resource-management-modal');
        const overlay = modal.querySelector('.dice-modal-overlay');
        const cancelBtn = document.getElementById('cancel-resource-changes');
        const saveBtn = document.getElementById('save-resource-changes');
        const removeBtn = document.getElementById('remove-resource');
        const pickerBtns = modal.querySelectorAll('.catan-multiplier-picker-btn');
        
        let selectedMultiplier = currentMultiplier;
        
        // Add click listeners to picker buttons
        pickerBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                selectedMultiplier = parseInt(btn.getAttribute('data-value'));
                
                // Update button selection
                pickerBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
        
        // Save changes
        saveBtn.addEventListener('click', () => {
            const savedResources = JSON.parse(localStorage.getItem('catan-resources') || '[]');
            
            // Update both multiplier and settlement type (for backward compatibility)
            savedResources[index].multiplier = selectedMultiplier;
            savedResources[index].settlementType = selectedMultiplier > 1 ? 'city' : 'settlement';
            
            localStorage.setItem('catan-resources', JSON.stringify(savedResources));
            modal.remove();
            onComplete();
        });
        
        // Remove resource
        removeBtn.addEventListener('click', () => {
            const savedResources = JSON.parse(localStorage.getItem('catan-resources') || '[]');
            savedResources.splice(index, 1);
            localStorage.setItem('catan-resources', JSON.stringify(savedResources));
            modal.remove();
            onComplete();
        });
        
        // Cancel changes
        const closeModal = () => {
            modal.remove();
        };
        
        cancelBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
    }

    showDevCards() {
        const container = document.getElementById('catan-content');
        if (!container) return;

        container.innerHTML = `
            <div class="catan-container">
                <button class="back-button" id="back-to-menu">← Back to Menu</button>
                <h2>🃏 Development Cards</h2>
                <p class="subtitle">Track the development card deck</p>
                
                <div class="catan-section">
                    <h3>Coming Soon</h3>
                    <p>Development card tracking functionality will be added in a future update.</p>
                </div>
            </div>
        `;

        document.getElementById('back-to-menu')?.addEventListener('click', () => {
            this.showMainMenu();
        });
    }

    showScoreTracker() {
        const container = document.getElementById('catan-content');
        if (!container) return;

        container.innerHTML = `
            <div class="catan-container">
                <button class="back-button" id="back-to-menu">← Back to Menu</button>
                <h2>🏆 Score Tracker</h2>
                <p class="subtitle">Track victory points for all players</p>
                
                <div class="catan-section">
                    <h3>Coming Soon</h3>
                    <p>Score tracking functionality will be added in a future update.</p>
                </div>
            </div>
        `;

        document.getElementById('back-to-menu')?.addEventListener('click', () => {
            this.showMainMenu();
        });
    }

    get56SpiralOrder() {
        // Counter-clockwise spiral for 30-tile board (3-4-5-6-5-4-3 pattern)
        // Starting from top-RIGHT corner going counter-clockwise
        // Layout: Row1: 0,1,2  Row2: 3,4,5,6  Row3: 7,8,9,10,11  Row4: 12,13,14,15,16,17  Row5: 18,19,20,21,22  Row6: 23,24,25,26  Row7: 27,28,29
        // Numbers: 2,5,4,6,3,9,8,11,11,10,6,3,8,4,8,10,11,12,10,5,4,9,5,9,12,3,2,6
        // Letters: A-B-C-O-N-M-L-K-J-I-H-G-F-E-D-Q-P-R-Y-X-W-ZC-ZB-ZA-S-T-U-V
        return [
            2,    // A - top right (start)
            1, 0,  // B, C - left across top
            3, 7, 12, 18, 23, 27,  // O,N,M,L,K,J - down left edge
            28, 29,  // I, H - bottom row
            26, 22, 17, 11, 6,  // G,F,E,D,Q - up right edge
            4, 5,  // P, R
            8, 13, 19, 24,  // Y,X,W,ZC
            25, 21, 16,  // ZB,ZA,S
            10, 9,  // T,U
            14, 20,  // V
            15  // Center
        ];
    }

    ensure56NoAdjacentRedNumbers(tiles) {
        // 30-tile adjacency map for 5-6 player board (3-4-5-6-5-4-3 pattern)
        // Row1: 0,1,2  Row2: 3,4,5,6  Row3: 7,8,9,10,11  Row4: 12,13,14,15,16,17  Row5: 18,19,20,21,22  Row6: 23,24,25,26  Row7: 27,28,29
        const adjacencies = [
            [1, 3, 4], // 0
            [0, 2, 4, 5], // 1
            [1, 5, 6], // 2
            [0, 4, 7, 8], // 3
            [0, 1, 3, 5, 8, 9], // 4
            [1, 2, 4, 6, 9, 10], // 5
            [2, 5, 10, 11], // 6
            [3, 8, 12, 13], // 7
            [3, 4, 7, 9, 13, 14], // 8
            [4, 5, 8, 10, 14, 15], // 9
            [5, 6, 9, 11, 15, 16], // 10
            [6, 10, 16, 17], // 11
            [7, 13, 18], // 12
            [7, 8, 12, 14, 18, 19], // 13
            [8, 9, 13, 15, 19, 20], // 14
            [9, 10, 14, 16, 20, 21], // 15
            [10, 11, 15, 17, 21, 22], // 16
            [11, 16, 22], // 17
            [12, 13, 19, 23, 24], // 18
            [13, 14, 18, 20, 24, 25], // 19
            [14, 15, 19, 21, 25, 26], // 20
            [15, 16, 20, 22, 26], // 21
            [16, 17, 21, 26], // 22
            [18, 24, 27, 28], // 23
            [18, 19, 23, 25, 28, 29], // 24
            [19, 20, 24, 26, 29], // 25
            [20, 21, 22, 25, 29], // 26
            [23, 28], // 27
            [23, 24, 27, 29], // 28
            [24, 25, 26, 28] // 29
        ];
        
        this.swapAdjacentRedNumbers(tiles, adjacencies);
    }

    swapAdjacentRedNumbers(tiles, adjacencies) {
        const redNumbers = [6, 8];
        let swapped = true;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (swapped && attempts < maxAttempts) {
            swapped = false;
            attempts++;
            
            for (let i = 0; i < tiles.length; i++) {
                if (redNumbers.includes(tiles[i].number)) {
                    const neighbors = adjacencies[i] || [];
                    
                    for (const neighborIdx of neighbors) {
                        if (redNumbers.includes(tiles[neighborIdx].number)) {
                            // Find a non-adjacent tile to swap with
                            for (let j = 0; j < tiles.length; j++) {
                                if (j !== i && j !== neighborIdx &&
                                    !redNumbers.includes(tiles[j].number) &&
                                    tiles[j].terrain !== 'desert') {
                                    // Swap numbers
                                    const temp = tiles[i].number;
                                    tiles[i].number = tiles[j].number;
                                    tiles[j].number = temp;
                                    swapped = true;
                                    break;
                                }
                            }
                            if (swapped) break;
                        }
                    }
                    if (swapped) break;
                }
            }
        }
    }

    displayMap56(tiles) {
        const mapDisplay = document.getElementById('map-display');
        const mapContainer = document.getElementById('catan-map');
        
        if (!mapDisplay || !mapContainer) return;
        
        mapDisplay.style.display = 'block';
        
        // Create hexagonal grid for 5-6 player board
        let html = '<div class="hex-grid hex-grid-56">';
        
        // 5-6 player board: 3, 4, 5, 6, 5, 4, 3 tiles per row (30 total)
        const rows = [
            { start: 0, count: 3 },   // Row 1
            { start: 3, count: 4 },   // Row 2
            { start: 7, count: 5 },   // Row 3
            { start: 12, count: 6 },  // Row 4 (widest)
            { start: 18, count: 5 },  // Row 5
            { start: 23, count: 4 },  // Row 6
            { start: 27, count: 3 }   // Row 7
        ];
        
        rows.forEach((row, rowIndex) => {
            html += `<div class="hex-row">`;
            
            for (let i = 0; i < row.count; i++) {
                const tileIndex = row.start + i;
                const tile = tiles[tileIndex];
                const terrainClass = `terrain-${tile.terrain}`;
                const numberClass = (tile.number === 6 || tile.number === 8) ? 'number-red' : '';
                
                html += `
                    <div class="hex hex-56 ${terrainClass}">
                        <div class="hex-content">
                            <div class="terrain-name">${this.getTerrainName(tile.terrain)}</div>
                            ${tile.number ? `
                                <div class="number-token ${numberClass}">
                                    <div class="number-value">${tile.number}</div>
                                    <div class="number-pips">${this.getPips(tile.number)}</div>
                                </div>
                            ` : '<div class="robber-icon">🏜️</div>'}
                        </div>
                    </div>
                `;
            }
            
            html += '</div>';
        });
        
        html += '</div>';
        
        mapContainer.innerHTML = html;
        mapDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

window.CatanGame = new CatanGame();