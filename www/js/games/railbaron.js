// Rail Baron Game Module

class RailBaronGame {
    constructor() {
        this.regions = null;
        this.regionRolls = null;
        this.destinations = null;
        this.locations = null;
        this.currentRegion = null;
        this.currentDestination = null;
    }

    async init() {
        console.log('Rail Baron game module loaded');
        await this.loadData();
        this.setupUI();
    }

    async loadData() {
        try {
            const [regionsData, regionRollsData, destinationsData, locationsData, payoffsData] = await Promise.all([
                fetch('data/railbaron-regions.json').then(r => r.json()),
                fetch('data/railbaron-region-rolls.json').then(r => r.json()),
                fetch('data/railbaron-destinations.json').then(r => r.json()),
                fetch('data/railbaron-locations.json').then(r => r.json()),
                fetch('data/railbaron-payoffs.json').then(r => r.json())
            ]);
            
            this.regions = regionsData.regions;
            this.regionRolls = regionRollsData.regionRolls;
            this.destinations = destinationsData.destinations;
            this.locations = locationsData.locations;
            this.payoffs = payoffsData.payoffs;
            
            // Create a map of locations by region for easier lookup
            this.locationsByRegion = this.createLocationsByRegion();
        } catch (error) {
            console.error('Error loading Rail Baron data:', error);
        }
    }

    createLocationsByRegion() {
        const byRegion = {};
        
        // Initialize regions
        this.regions.forEach(region => {
            byRegion[region.id] = [];
        });
        
        // Group locations by their region
        this.destinations.forEach(dest => {
            const locationId = dest.odd; // Use odd value (could also use even, just need unique locations)
            if (!byRegion[dest.region].find(loc => loc.id === locationId)) {
                const location = this.locations.find(l => l.id === locationId);
                if (location) {
                    byRegion[dest.region].push(location);
                }
            }
            
            const evenLocationId = dest.even;
            if (!byRegion[dest.region].find(loc => loc.id === evenLocationId)) {
                const location = this.locations.find(l => l.id === evenLocationId);
                if (location) {
                    byRegion[dest.region].push(location);
                }
            }
        });
        
        // Sort locations within each region by name
        Object.keys(byRegion).forEach(regionId => {
            byRegion[regionId].sort((a, b) => a.location.localeCompare(b.location));
        });
        
        return byRegion;
    }

    setupUI() {
        const container = document.getElementById('game-content');
        if (!container) return;

        this.showMainMenu();
    }

    showMainMenu() {
        const container = document.getElementById('game-content');
        container.innerHTML = `
            <div class="rail-baron-container">
                <h2>🚂 Rail Baron</h2>
                <p class="subtitle">Select a tool to get started</p>
                
                <div class="rail-baron-menu">
                    <button class="rail-baron-menu-btn" id="btn-destination">
                        <span class="menu-icon">🎲</span>
                        <span class="menu-title">Destination Roller</span>
                        <span class="menu-desc">Roll for region and destination</span>
                    </button>
                    
                    <button class="rail-baron-menu-btn" id="btn-payoff">
                        <span class="menu-icon">💰</span>
                        <span class="menu-title">Payoff Chart</span>
                        <span class="menu-desc">Calculate route payoffs</span>
                    </button>
                    
                    <button class="rail-baron-menu-btn" id="btn-roll-play" disabled>
                        <span class="menu-icon">🎮</span>
                        <span class="menu-title">Roll and Play</span>
                        <span class="menu-desc">Coming soon</span>
                    </button>
                    
                    <button class="rail-baron-menu-btn" id="btn-railroads" disabled>
                        <span class="menu-icon">🚂</span>
                        <span class="menu-title">Railroads</span>
                        <span class="menu-desc">Coming soon</span>
                    </button>
                </div>
            </div>
        `;

        // Attach menu button listeners
        document.getElementById('btn-destination')?.addEventListener('click', () => {
            this.showDestinationRoller();
        });
        
        document.getElementById('btn-payoff')?.addEventListener('click', () => {
            this.showPayoffChart();
        });
    }

    showPayoffChart() {
        const container = document.getElementById('game-content');
        container.innerHTML = `
            <div class="rail-baron-container">
                <button class="back-button" id="back-to-menu">← Back to Menu</button>
                <h2>Payoff Chart</h2>
                <p class="subtitle">Select two cities to see the payoff</p>
                
                <div class="roll-section">
                    <div class="city-selector-container">
                        <div class="city-selector">
                            <label>From City:</label>
                            <button type="button" class="city-select-btn" id="from-city-btn">
                                <span class="city-select-display" id="from-city-display">Select City</span>
                            </button>
                        </div>
                        
                        <div class="city-selector">
                            <label>To City:</label>
                            <button type="button" class="city-select-btn" id="to-city-btn">
                                <span class="city-select-display" id="to-city-display">Select City</span>
                            </button>
                        </div>
                    </div>
                    
                    <div id="payoff-result" class="result-display"></div>
                </div>
            </div>
            
            <!-- City Picker Modal -->
            <div class="dice-modal" id="city-modal">
                <div class="dice-modal-overlay" id="city-modal-overlay"></div>
                <div class="city-modal-content">
                    <h3>Select City</h3>
                    <div class="city-regions" id="city-regions"></div>
                </div>
            </div>
        `;
        
        this.selectedFromCity = null;
        this.selectedToCity = null;
        
        // Attach event listeners
        document.getElementById('back-to-menu')?.addEventListener('click', () => {
            this.showMainMenu();
        });
        
        document.getElementById('from-city-btn')?.addEventListener('click', () => {
            this.openCityPicker('from');
        });
        
        document.getElementById('to-city-btn')?.addEventListener('click', () => {
            this.openCityPicker('to');
        });
        
        document.getElementById('city-modal-overlay')?.addEventListener('click', () => {
            this.closeCityPicker();
        });
    }

    openCityPicker(type) {
        this.currentCityPickerType = type;
        const modal = document.getElementById('city-modal');
        const regionsContainer = document.getElementById('city-regions');
        
        // Build city list organized by region
        let html = '';
        this.regions.forEach(region => {
            const cities = this.locationsByRegion[region.id] || [];
            if (cities.length > 0) {
                html += `
                    <div class="city-region-group">
                        <h4 class="city-region-title">${region.region}</h4>
                        <div class="city-grid">
                            ${cities.map(city =>
                                `<button class="city-grid-btn" data-city-id="${city.id}">${city.location}</button>`
                            ).join('')}
                        </div>
                    </div>
                `;
            }
        });
        
        regionsContainer.innerHTML = html;
        
        // Attach click handlers to city buttons
        document.querySelectorAll('.city-grid-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cityId = parseInt(e.target.getAttribute('data-city-id'));
                this.selectCity(cityId);
            });
        });
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeCityPicker() {
        const modal = document.getElementById('city-modal');
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    selectCity(cityId) {
        const city = this.locations.find(l => l.id === cityId);
        
        if (this.currentCityPickerType === 'from') {
            this.selectedFromCity = cityId;
            document.getElementById('from-city-display').textContent = city.location;
        } else if (this.currentCityPickerType === 'to') {
            this.selectedToCity = cityId;
            document.getElementById('to-city-display').textContent = city.location;
        }
        
        this.closeCityPicker();
        
        // Calculate payoff if both cities are selected
        if (this.selectedFromCity && this.selectedToCity) {
            this.calculatePayoff();
        }
    }

    calculatePayoff() {
        // Use lower ID first as per game rules
        const start = Math.min(this.selectedFromCity, this.selectedToCity);
        const end = Math.max(this.selectedFromCity, this.selectedToCity);
        
        const payoffEntry = this.payoffs.find(p => p.start === start && p.end === end);
        
        if (payoffEntry) {
            const fromCity = this.locations.find(l => l.id === this.selectedFromCity);
            const toCity = this.locations.find(l => l.id === this.selectedToCity);
            
            const resultDiv = document.getElementById('payoff-result');
            resultDiv.innerHTML = `
                <div class="result-box success">
                    <strong>💰 Payoff: $${payoffEntry.payoff.toLocaleString()}</strong>
                    <p>${fromCity.location} → ${toCity.location}</p>
                    <p class="payoff-detail">Lookup: ${start} × ${end}</p>
                </div>
            `;
        }
    }

    showDestinationRoller() {
        const container = document.getElementById('game-content');
        container.innerHTML = `
            <div class="rail-baron-container">
                <button class="back-button" id="back-to-menu">← Back to Menu</button>
                <h2>Rail Baron Destination Roller</h2>
                
                <!-- Step 1: Roll for Region -->
                <div class="roll-section">
                    <h3>Step 1: Determine Region</h3>
                    <p>Roll 2d6 for value + 1d6 for odd/even</p>
                    
                    <div class="dice-controls" id="region-controls">
                        <div class="manual-input">
                            <div class="dice-value-selector">
                                <label>Dice Total:</label>
                                <button type="button" class="dice-value-btn" id="region-dice-btn">
                                    <span class="dice-value-display" id="region-dice-display">7</span>
                                </button>
                            </div>
                            <div class="parity-selector">
                                <label class="parity-option">
                                    <input type="radio" name="region-parity" value="odd" checked>
                                    <span class="parity-label">Odd</span>
                                </label>
                                <label class="parity-option">
                                    <input type="radio" name="region-parity" value="even">
                                    <span class="parity-label">Even</span>
                                </label>
                            </div>
                        </div>
                        <div class="button-group">
                            <button id="roll-region-auto" class="btn-primary">🎲 Auto Roll Region</button>
                            <button id="roll-region-manual" class="btn-secondary">✓ Use Selected Values</button>
                        </div>
                    </div>
                    
                    <div id="region-result" class="result-display"></div>
                </div>

                <!-- Step 2: Roll for Destination -->
                <div class="roll-section" id="destination-section" style="display: none;">
                    <h3>Step 2: Determine Destination</h3>
                    <p>Roll 2d6 for value + 1d6 for odd/even (based on region: <span id="current-region-name"></span>)</p>
                    
                    <div class="dice-controls">
                        <div class="manual-input">
                            <div class="dice-value-selector">
                                <label>Dice Total:</label>
                                <button type="button" class="dice-value-btn" id="dest-dice-btn">
                                    <span class="dice-value-display" id="dest-dice-display">7</span>
                                </button>
                            </div>
                            <div class="parity-selector">
                                <label class="parity-option">
                                    <input type="radio" name="dest-parity" value="odd" checked>
                                    <span class="parity-label">Odd</span>
                                </label>
                                <label class="parity-option">
                                    <input type="radio" name="dest-parity" value="even">
                                    <span class="parity-label">Even</span>
                                </label>
                            </div>
                        </div>
                        <div class="button-group">
                            <button id="roll-dest-auto" class="btn-primary">🎲 Auto Roll Destination</button>
                            <button id="roll-dest-manual" class="btn-secondary">✓ Use Selected Values</button>
                        </div>
                    </div>
                    
                    <div id="dest-result" class="result-display"></div>
                </div>

                <!-- Reset Button -->
                <div class="roll-section">
                    <button id="reset-rolls" class="btn-reset">🔄 Start New Roll</button>
                </div>

                <!-- Roll History -->
                <div class="roll-section">
                    <h3>Roll History</h3>
                    <div id="roll-history" class="roll-history"></div>
                </div>
            </div>
            
            <!-- Dice Value Picker Modal -->
            <div class="dice-modal" id="dice-modal">
                <div class="dice-modal-overlay" id="dice-modal-overlay"></div>
                <div class="dice-modal-content">
                    <h3>Select Dice Total</h3>
                    <div class="dice-grid" id="dice-grid">
                        ${Array.from({length: 11}, (_, i) => i + 2).map(num =>
                            `<button class="dice-grid-btn" data-value="${num}">${num}</button>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
        
        // Attach back button listener
        document.getElementById('back-to-menu')?.addEventListener('click', () => {
            this.showMainMenu();
        });
    }

    attachEventListeners() {
        // Region rolling
        document.getElementById('roll-region-auto')?.addEventListener('click', () => {
            this.rollRegionAuto();
        });
        
        document.getElementById('roll-region-manual')?.addEventListener('click', () => {
            this.rollRegionManual();
        });

        // Destination rolling
        document.getElementById('roll-dest-auto')?.addEventListener('click', () => {
            this.rollDestinationAuto();
        });
        
        document.getElementById('roll-dest-manual')?.addEventListener('click', () => {
            this.rollDestinationManual();
        });

        // Reset
        document.getElementById('reset-rolls')?.addEventListener('click', () => {
            this.resetRolls();
        });

        // Dice value picker buttons
        document.getElementById('region-dice-btn')?.addEventListener('click', () => {
            this.openDicePicker('region');
        });
        
        document.getElementById('dest-dice-btn')?.addEventListener('click', () => {
            this.openDicePicker('dest');
        });

        // Modal overlay close
        document.getElementById('dice-modal-overlay')?.addEventListener('click', () => {
            this.closeDicePicker();
        });

        // Dice grid buttons
        document.querySelectorAll('.dice-grid-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const value = parseInt(e.target.getAttribute('data-value'));
                this.selectDiceValue(value);
            });
        });
    }

    openDicePicker(type) {
        this.currentPickerType = type;
        const modal = document.getElementById('dice-modal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    closeDicePicker() {
        const modal = document.getElementById('dice-modal');
        modal.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
    }

    selectDiceValue(value) {
        if (this.currentPickerType === 'region') {
            document.getElementById('region-dice-display').textContent = value;
        } else if (this.currentPickerType === 'dest') {
            document.getElementById('dest-dice-display').textContent = value;
        }
        this.closeDicePicker();
    }

    rollDice(sides = 6) {
        return Math.floor(Math.random() * sides) + 1;
    }

    roll2D6() {
        const die1 = this.rollDice(6);
        const die2 = this.rollDice(6);
        return { die1, die2, total: die1 + die2 };
    }

    rollOddEven() {
        const die = this.rollDice(6);
        return { die, parity: die % 2 === 0 ? 'even' : 'odd' };
    }

    rollRegionAuto() {
        const diceRoll = this.roll2D6();
        const parityRoll = this.rollOddEven();
        
        this.displayRegionRoll(diceRoll.total, parityRoll.parity, true, diceRoll, parityRoll);
    }

    rollRegionManual() {
        const value = parseInt(document.getElementById('region-dice-display').textContent);
        const parity = document.querySelector('input[name="region-parity"]:checked').value;
        
        this.displayRegionRoll(value, parity, false);
    }

    displayRegionRoll(diceTotal, parity, isAuto, diceRoll = null, parityRoll = null) {
        const regionRoll = this.regionRolls.find(r => r.number === diceTotal);
        if (!regionRoll) return;

        const regionId = regionRoll[parity];
        const region = this.regions.find(r => r.id === regionId);
        this.currentRegion = regionId;

        let rollDetails = '';
        if (isAuto && diceRoll && parityRoll) {
            rollDetails = `<div class="roll-details">
                <span class="dice-roll">🎲 ${diceRoll.die1} + ${diceRoll.die2} = ${diceRoll.total}</span>
                <span class="parity-roll">🎲 ${parityRoll.die} (${parityRoll.parity})</span>
            </div>`;
        }

        const resultDiv = document.getElementById('region-result');
        resultDiv.innerHTML = `
            ${rollDetails}
            <div class="result-box success">
                <strong>Region ${regionId}: ${region.region}</strong>
                <p>Dice: ${diceTotal} (${parity})</p>
            </div>
        `;

        // Hide Step 1 controls but keep result visible, show destination section
        document.getElementById('region-controls').style.display = 'none';
        document.getElementById('destination-section').style.display = 'block';
        document.getElementById('current-region-name').textContent = region.region;
    }

    rollDestinationAuto() {
        if (!this.currentRegion) {
            alert('Please roll for a region first');
            return;
        }

        const diceRoll = this.roll2D6();
        const parityRoll = this.rollOddEven();
        
        this.displayDestinationRoll(diceRoll.total, parityRoll.parity, true, diceRoll, parityRoll);
    }

    rollDestinationManual() {
        if (!this.currentRegion) {
            alert('Please roll for a region first');
            return;
        }

        const value = parseInt(document.getElementById('dest-dice-display').textContent);
        const parity = document.querySelector('input[name="dest-parity"]:checked').value;
        
        this.displayDestinationRoll(value, parity, false);
    }

    displayDestinationRoll(diceTotal, parity, isAuto, diceRoll = null, parityRoll = null) {
        const destination = this.destinations.find(
            d => d.region === this.currentRegion && d.number === diceTotal
        );
        
        if (!destination) return;

        const locationId = destination[parity];
        const location = this.locations.find(l => l.id === locationId);
        this.currentDestination = locationId;

        let rollDetails = '';
        if (isAuto && diceRoll && parityRoll) {
            rollDetails = `<div class="roll-details">
                <span class="dice-roll">🎲 ${diceRoll.die1} + ${diceRoll.die2} = ${diceRoll.total}</span>
                <span class="parity-roll">🎲 ${parityRoll.die} (${parityRoll.parity})</span>
            </div>`;
        }

        const resultDiv = document.getElementById('dest-result');
        resultDiv.innerHTML = `
            ${rollDetails}
            <div class="result-box success">
                <strong>🎯 Destination: ${location.location}</strong>
                <p>Location ID: ${locationId}</p>
                <p>Dice: ${diceTotal} (${parity})</p>
            </div>
        `;

        // Add to history
        this.addToHistory(this.currentRegion, locationId, diceTotal, parity, isAuto);
    }

    addToHistory(regionId, locationId, diceTotal, parity, isAuto) {
        const region = this.regions.find(r => r.id === regionId);
        const location = this.locations.find(l => l.id === locationId);
        
        const historyDiv = document.getElementById('roll-history');
        const timestamp = new Date().toLocaleTimeString();
        const method = isAuto ? '🎲 Auto' : '✓ Manual';
        
        const entry = document.createElement('div');
        entry.className = 'history-entry';
        entry.innerHTML = `
            <span class="history-time">${timestamp}</span>
            <span class="history-method">${method}</span>
            <span class="history-region">${region.region}</span>
            <span class="history-arrow">→</span>
            <span class="history-destination">${location.location}</span>
        `;
        
        historyDiv.insertBefore(entry, historyDiv.firstChild);
    }

    resetRolls() {
        this.currentRegion = null;
        this.currentDestination = null;
        
        document.getElementById('region-result').innerHTML = '';
        document.getElementById('dest-result').innerHTML = '';
        document.getElementById('region-controls').style.display = 'flex';
        document.getElementById('destination-section').style.display = 'none';
        
        // Reset inputs
        document.getElementById('region-dice-display').textContent = '7';
        document.getElementById('dest-dice-display').textContent = '7';
        document.querySelector('input[name="region-parity"][value="odd"]').checked = true;
        document.querySelector('input[name="dest-parity"][value="odd"]').checked = true;
    }
}

window.RailBaronGame = new RailBaronGame();
