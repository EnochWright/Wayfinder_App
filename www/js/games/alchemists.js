// Alchemists Game Module

class AlchemistsGame {
    constructor() {
        this.gameState = {
            view: 'start', // start, setup, gameplay
            variant: 'apprentice', // apprentice, master
            gameCode: '',
            mapping: [], // Array of 8 integers (1-8) representing Alchemicals for Ingredients A-H
            selectedIngredients: [] // For Test on Student
        };

        // Alchemical mappings
        this.ingredients = [
            { id: 'Mushroom', name: 'Mushroom', src: 'assets/alchemists/ingredients/Mushroom.png' },
            { id: 'Fern', name: 'Fern', src: 'assets/alchemists/ingredients/Fern.png' },
            { id: 'Toad', name: 'Toad', src: 'assets/alchemists/ingredients/Toad.png' },
            { id: 'Claw', name: 'Claw', src: 'assets/alchemists/ingredients/Claw.png' },
            { id: 'Lotus', name: 'Lotus', src: 'assets/alchemists/ingredients/Lotus.png' },
            { id: 'Root', name: 'Root', src: 'assets/alchemists/ingredients/Root.png' },
            { id: 'Scorpion', name: 'Scorpion', src: 'assets/alchemists/ingredients/Scorpion.png' },
            { id: 'Feather', name: 'Feather', src: 'assets/alchemists/ingredients/Feather.png' }
        ];

        this.alchemicals = [
            'R+', 'R-', 'B+', 'B-',
            'G+', 'G-', '++', '--'
        ];

        // Alchemical Compositions (Red, Green, Blue signs: 1=Positive, -1=Negative)
        this.alchemicalCompositions = {
            '++': { r: 1, g: 1, b: 1 },
            '--': { r: -1, g: -1, b: -1 },
            'R+': { r: 1, g: -1, b: -1 },
            'R-': { r: -1, g: 1, b: 1 },
            'G+': { r: -1, g: 1, b: -1 },
            'G-': { r: 1, g: -1, b: 1 },
            'B+': { r: -1, g: -1, b: 1 },
            'B-': { r: 1, g: 1, b: -1 }
        };

        this.potions = {
            'NEUTRAL': { name: 'Neutral', color: 'gray', sign: 0, src: 'assets/alchemists/potions/neutral.svg' },
            'RED_POS': { name: 'Health', color: 'red', sign: 1, src: 'assets/alchemists/potions/red_plus.svg' },
            'RED_NEG': { name: 'Poison', color: 'red', sign: -1, src: 'assets/alchemists/potions/red_minus.svg' },
            'GREEN_POS': { name: 'Speed', color: 'green', sign: 1, src: 'assets/alchemists/potions/green_plus.svg' },
            'GREEN_NEG': { name: 'Paralysis', color: 'green', sign: -1, src: 'assets/alchemists/potions/green_minus.svg' },
            'BLUE_POS': { name: 'Wisdom', color: 'blue', sign: 1, src: 'assets/alchemists/potions/blue_plus.svg' },
            'BLUE_NEG': { name: 'Insanity', color: 'blue', sign: -1, src: 'assets/alchemists/potions/blue_minus.svg' }
        };
    }

    init() {
        console.log('Alchemists game module initializing...');
        this.setupUI();
    }

    setupUI() {
        const container = document.getElementById('page-alchemists');
        if (!container) return;

        // Inject the HTML structure
        container.innerHTML = `
           

            <!-- Initial View (Main Menu) -->
            <!-- Initial View (Main Menu) -->
            <div id="alchemists-start" class="game-view">
                <div class="catan-container">
                    <h2>Alchemists</h2>
                    
                    <div class="card center-content">
                        <div class="setup-options">
                            <button id="btn-start-new-game" class="btn btn-primary btn-large btn-block">Start New Game</button>
                            <button id="btn-enter-code-menu" class="btn btn-secondary btn-large btn-block" style="margin-top: 10px;">Enter Game Code</button>
                            
                            <div class="form-group" style="margin-top: 20px; text-align: left;">
                                <label>Difficulty Variant</label>
                                <div class="btn-group">
                                    <button class="btn active" data-variant="apprentice">Apprentice</button>
                                    <button class="btn" data-variant="master">Master</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Code Entry View -->
            <div id="alchemists-code-entry" class="game-view hidden">
                <div class="card">
                    <h3>Enter Game Code</h3>
                    <div class="setup-options">
                        <div class="form-group">
                            <label for="game-code-input">Game Code</label>
                            <input type="text" id="game-code-input" placeholder="ABCD" maxlength="4" style="text-transform: uppercase; font-size: 2rem; text-align: center; letter-spacing: 5px;">
                            <small>Enter the 4-letter code from another device.</small>
                        </div>
                        
                        <div class="btn-group" style="margin-top: 20px;">
                            <button id="btn-code-cancel" class="btn btn-text">Cancel</button>
                            <button id="btn-code-ok" class="btn btn-primary btn-block">OK</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Test on Student View -->
            <div id="alchemists-test-student" class="game-view hidden">
                 <div class="card">
                    <div style="display: flex; align-items: center; margin-bottom: 20px;">
                        <button id="btn-test-back" class="btn btn-text" style="margin-right: auto;">← Back</button>
                        <h3 style="margin: 0; flex: 2; text-align: center;">Test on Student</h3>
                        <div style="flex: 1;"></div> <!-- Spacer -->
                    </div>

                    <!-- Mixing Area -->
                    <div class="mixing-area" style="text-align: center; margin-bottom: 30px;">
                        <div class="potion-result hidden" id="test-result-display">
                            <img id="test-potion-img" src="" alt="Potion" style="width: 80px; height: 100px; object-fit: contain;">
                            <div id="test-potion-name" style="font-weight: bold; margin-top: 10px;">Unknown</div>
                        </div>
                        <div id="test-slots" style="display: flex; justify-content: center; gap: 20px; align-items: center;">
                            <div class="ingredient-slot" id="test-slot-1">?</div>
                            <span style="font-size: 2rem;">+</span>
                            <div class="ingredient-slot" id="test-slot-2">?</div>
                            <span style="font-size: 2rem;">=</span>
                             <button id="btn-mix-test" class="btn btn-primary" disabled>Mix</button>
                        </div>
                        <small style="display: block; margin-top: 10px; color: #666;">Select 2 ingredients to mix</small>
                    </div>

                    <!-- Ingredients Grid -->
                    <div class="ingredients-grid" id="test-ingredients-grid">
                        <!-- Populated by JS -->
                    </div>
                </div>
            </div>

            <!-- Gameplay View -->
            <div id="alchemists-gameplay" class="game-view hidden">
                <div class="card">
                    <div class="action-grid">
                        <button class="btn btn-action" id="btn-debunk">
                            <span class="icon">🔍</span>
                            <span class="label">Debunk Theory</span>
                        </button>
                        <button class="btn btn-action" id="btn-sell">
                            <span class="icon">💰</span>
                            <span class="label">Sell Potion</span>
                        </button>
                        <button class="btn btn-action" id="btn-test-student">
                            <span class="icon">🧪</span>
                            <span class="label">Test on Student</span>
                        </button>
                        <button class="btn btn-action" id="btn-drink">
                            <span class="icon">🍷</span>
                            <span class="label">Drink Potion</span>
                        </button>
                    </div>
                </div>
                
                <div class="card info-card" style="flex-direction: column; gap: 10px;">
                    <div class="game-info" style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                        <div>
                            <span>Game Code: <strong id="display-game-code">----</strong></span>
                            <span id="variant-display" style="margin-left: 10px; font-size: 0.8em; color: gray;"></span>
                        </div>
                        <button id="btn-reset-game" class="btn btn-danger btn-small">Reset Game</button>
                    </div>

                    <!-- Results Table -->
                    <div style="width: 100%; margin-top: 15px; border-top: 1px solid #ddd; padding-top: 15px;">
                        <h4 style="margin-bottom: 10px;">Solution</h4>
                        <table id="alchemists-solution-table" style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead>
                                <tr style="background: #f0f0f0; text-align: left;">
                                    <th style="padding: 5px;">Ingredient</th>
                                    <th style="padding: 5px;">Alchemical</th>
                                </tr>
                            </thead>
                            <tbody id="solution-table-body">
                                <!-- Populated by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Drink Potion View -->
            <div id="alchemists-drink-potion" class="game-view hidden">
                 <div class="card">
                    <div style="display: flex; align-items: center; margin-bottom: 20px;">
                        <button id="btn-drink-back" class="btn btn-text" style="margin-right: auto;">← Back</button>
                        <h3 style="margin: 0; flex: 2; text-align: center;">Drink Potion</h3>
                        <div style="flex: 1;"></div>
                    </div>

                    <div class="mixing-area" style="text-align: center; margin-bottom: 30px;">
                        <div class="potion-result hidden" id="drink-result-display">
                            <img id="drink-potion-img" src="" alt="Potion" style="width: 80px; height: 100px; object-fit: contain;">
                            <div id="drink-potion-name" style="font-weight: bold; margin-top: 10px;">Unknown</div>
                        </div>
                        <div id="drink-slots" style="display: flex; justify-content: center; gap: 20px; align-items: center;">
                            <div class="ingredient-slot" id="drink-slot-1">?</div>
                            <span style="font-size: 2rem;">+</span>
                            <div class="ingredient-slot" id="drink-slot-2">?</div>
                            <span style="font-size: 2rem;">=</span>
                             <button id="btn-mix-drink" class="btn btn-primary" disabled>Drink!</button>
                        </div>
                        <small style="display: block; margin-top: 10px; color: #666;">Select 2 ingredients to drink</small>
                    </div>

                    <div class="ingredients-grid" id="drink-ingredients-grid"></div>
                </div>
            </div>

            <!-- Sell Potion View -->
            <div id="alchemists-sell-potion" class="game-view hidden">
                 <div class="card">
                    <div style="display: flex; align-items: center; margin-bottom: 20px;">
                        <button id="btn-sell-back" class="btn btn-text" style="margin-right: auto;">← Back</button>
                        <h3 style="margin: 0; flex: 2; text-align: center;">Sell Potion</h3>
                        <div style="flex: 1;"></div>
                    </div>

                    <div class="mixing-area" style="text-align: center; margin-bottom: 30px;">
                        <div class="potion-result hidden" id="sell-result-display">
                            <img id="sell-potion-img" src="" alt="Potion" style="width: 80px; height: 100px; object-fit: contain;">
                            <div id="sell-potion-name" style="font-weight: bold; margin-top: 10px;">Unknown</div>
                        </div>
                        <div id="sell-slots" style="display: flex; justify-content: center; gap: 20px; align-items: center;">
                            <div class="ingredient-slot" id="sell-slot-1">?</div>
                            <span style="font-size: 2rem;">+</span>
                            <div class="ingredient-slot" id="sell-slot-2">?</div>
                            <span style="font-size: 2rem;">=</span>
                             <button id="btn-mix-sell" class="btn btn-primary" disabled>Sell</button>
                        </div>
                        <small style="display: block; margin-top: 10px; color: #666;">Select 2 ingredients to sell</small>
                    </div>

                    <div class="ingredients-grid" id="sell-ingredients-grid"></div>
                </div>
            </div>

            <!-- Debunk Theory View -->
            <div id="alchemists-debunk-theory" class="game-view hidden">
                 <div class="card">
                    <div style="display: flex; align-items: center; margin-bottom: 20px;">
                        <button id="btn-debunk-back" class="btn btn-text" style="margin-right: auto;">← Back</button>
                        <h3 style="margin: 0; flex: 2; text-align: center;">Debunk Theory</h3>
                        <div style="flex: 1;"></div>
                    </div>

                    <div class="mixing-area" style="text-align: center; margin-bottom: 30px;">
                        <div class="potion-result hidden" id="debunk-result-display">
                            <img id="debunk-potion-img" src="" alt="Potion" style="width: 80px; height: 100px; object-fit: contain;">
                            <div id="debunk-potion-name" style="font-weight: bold; margin-top: 10px;">Unknown</div>
                        </div>
                        <div id="debunk-slots" style="display: flex; justify-content: center; gap: 20px; align-items: center;">
                            <div class="ingredient-slot" id="debunk-slot-1">?</div>
                            <span style="font-size: 2rem;">+</span>
                            <div class="ingredient-slot" id="debunk-slot-2">?</div>
                            <span style="font-size: 2rem;">=</span>
                             <button id="btn-mix-debunk" class="btn btn-primary" disabled>Debunk</button>
                        </div>
                        <small style="display: block; margin-top: 10px; color: #666;">Select 2 ingredients to test</small>
                    </div>

                    <div class="ingredients-grid" id="debunk-ingredients-grid"></div>
                </div>
            </div>    

            </div>
        `;

        this.cacheDOM();
        this.bindEvents();
        this.loadState();
    }

    cacheDOM() {
        this.dom = {
            page: document.getElementById('page-alchemists'),
            views: {
                start: document.getElementById('alchemists-start'),
                codeEntry: document.getElementById('alchemists-code-entry'),
                gameplay: document.getElementById('alchemists-gameplay'),
                testStudent: document.getElementById('alchemists-test-student'),
                drinkPotion: document.getElementById('alchemists-drink-potion'),
                sellPotion: document.getElementById('alchemists-sell-potion'),
                debunkTheory: document.getElementById('alchemists-debunk-theory')
            },
            buttons: {
                startNew: document.getElementById('btn-start-new-game'),
                enterCodeMenu: document.getElementById('btn-enter-code-menu'),
                codeCancel: document.getElementById('btn-code-cancel'),
                codeOk: document.getElementById('btn-code-ok'),
                reset: document.getElementById('btn-reset-game'),
                variantBtns: document.querySelectorAll('#alchemists-start .btn-group .btn'),
                // Action Buttons
                testBack: document.getElementById('btn-test-back'),
                mixTest: document.getElementById('btn-mix-test'),
                drinkBack: document.getElementById('btn-drink-back'),
                mixDrink: document.getElementById('btn-mix-drink'),
                sellBack: document.getElementById('btn-sell-back'),
                mixSell: document.getElementById('btn-mix-sell'),
                debunkBack: document.getElementById('btn-debunk-back'),
                mixDebunk: document.getElementById('btn-mix-debunk')
            },
            inputs: {
                gameCode: document.getElementById('game-code-input')
            },
            display: {
                gameCode: document.getElementById('display-game-code'),
                variant: document.getElementById('variant-display'),
                solutionBody: document.getElementById('solution-table-body'),
            }
        };
    }

    bindEvents() {
        // Main Menu Actions
        this.dom.buttons.startNew.addEventListener('click', () => {
            // Generate random code and start immediately
            const code = this.generateRandomCode();
            this.gameState.gameCode = code;
            this.setupGame(code);
            this.switchToGameplay();
        });

        this.dom.buttons.enterCodeMenu.addEventListener('click', () => {
            this.dom.inputs.gameCode.value = ''; // Clear previous input
            this.switchView('codeEntry');
            this.dom.inputs.gameCode.focus();
        });

        // Test on Student Actions
        this.dom.buttons.testBack.addEventListener('click', () => { this.switchView('gameplay'); this.resetMixingState('test'); });
        this.dom.buttons.mixTest.addEventListener('click', () => this.handleMixAction('test'));

        // Drink Potion Actions
        this.dom.buttons.drinkBack.addEventListener('click', () => { this.switchView('gameplay'); this.resetMixingState('drink'); });
        this.dom.buttons.mixDrink.addEventListener('click', () => this.handleMixAction('drink'));

        // Sell Potion Actions
        this.dom.buttons.sellBack.addEventListener('click', () => { this.switchView('gameplay'); this.resetMixingState('sell'); });
        this.dom.buttons.mixSell.addEventListener('click', () => this.handleMixAction('sell'));

        // Debunk Theory Actions
        this.dom.buttons.debunkBack.addEventListener('click', () => { this.switchView('gameplay'); this.resetMixingState('debunk'); });
        this.dom.buttons.mixDebunk.addEventListener('click', () => this.handleMixAction('debunk'));

        // Variant Selection
        this.dom.buttons.variantBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.dom.buttons.variantBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.gameState.variant = e.target.dataset.variant;
            });
        });

        // Code Entry Actions
        this.dom.buttons.codeOk.addEventListener('click', () => this.handleCodeSubmit());
        this.dom.buttons.codeCancel.addEventListener('click', () => this.switchView('start'));

        // Gameplay Actions
        this.dom.buttons.reset.addEventListener('click', () => this.resetGame());

        // Navigation from Gameplay
        const actions = {
            'test-student': 'testStudent',
            'drink': 'drinkPotion',
            'sell': 'sellPotion',
            'debunk': 'debunkTheory'
        };

        Object.entries(actions).forEach(([btnIdSuffix, viewName]) => {
            const btn = document.getElementById(`btn-${btnIdSuffix}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.switchView(viewName);
                    // Map viewName to prefix
                    const prefixMap = {
                        'testStudent': 'test',
                        'drinkPotion': 'drink',
                        'sellPotion': 'sell',
                        'debunkTheory': 'debunk'
                    };
                    this.initializeMixingView(prefixMap[viewName]);
                });
            }
        });
    }

    loadState() {
        // TODO: Load from localStorage if we add persistence later
        // For now, reset to start
        this.switchView('start');
    }

    switchView(viewName) {
        this.gameState.view = viewName;

        // Hide all views
        Object.values(this.dom.views).forEach(el => el.classList.add('hidden'));

        // Show target view
        if (this.dom.views[viewName]) {
            this.dom.views[viewName].classList.remove('hidden');
        }
    }

    handleCodeSubmit() {
        const codeInput = this.dom.inputs.gameCode.value.toUpperCase().trim();

        if (!codeInput || codeInput.length !== 4) {
            alert('Please enter a valid 4-letter game code.');
            return;
        }

        if (!/^[A-Z]{4}$/.test(codeInput)) {
            alert('Game code must consist of 4 letters (A-Z).');
            return;
        }

        this.gameState.gameCode = codeInput;
        this.setupGame(this.gameState.gameCode);
        this.switchToGameplay();
    }

    switchToGameplay() {
        this.dom.display.gameCode.textContent = this.gameState.gameCode;
        this.dom.display.variant.textContent = `(${this.gameState.variant})`;
        this.renderSolution();
        this.switchView('gameplay');
    }

    renderSolution() {
        if (!this.dom.display.solutionBody) return;

        this.dom.display.solutionBody.innerHTML = '';

        this.ingredients.forEach((ingredient, index) => {
            const alchemical = this.gameState.mapping[index];
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #eee';
            row.innerHTML = `
                <td style="padding: 8px;">
                    <img src="${ingredient.src}" style="width: 30px; vertical-align: middle; margin-right: 10px;">
                    ${ingredient.name}
                </td>
                <td style="padding: 8px; font-family: monospace; font-weight: bold;">${alchemical}</td>
            `;
            this.dom.display.solutionBody.appendChild(row);
        });
    }


    resetGame() {
        if (confirm('Are you sure you want to end this game?')) {
            this.gameState.gameCode = '';
            this.gameState.mapping = [];
            this.dom.inputs.gameCode.value = '';
            this.switchView('start');
        }
    }

    generateRandomCode() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        return code;
    }

    // Core Logic: Set up the game mapping based on the seed
    setupGame(code) {
        const seed = this.codeToSeed(code);
        const rng = this.mulberry32(seed);

        // Generate mapping: Ingredients [0-7] -> Alchemicals [1-8]
        // We start with [1,2,3,4,5,6,7,8] and shuffle it
        let shuffledAlchemicals = [...this.alchemicals];

        // Fisher-Yates shuffle using our seeded RNG
        for (let i = shuffledAlchemicals.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [shuffledAlchemicals[i], shuffledAlchemicals[j]] = [shuffledAlchemicals[j], shuffledAlchemicals[i]];
        }

        this.gameState.mapping = shuffledAlchemicals;
        console.log(`Game Setup for code ${code}:`, this.gameState.mapping);
        // Debug output: Ingredient A = Alchemical mapping[0], etc.
    }

    // Unified Mixing Logic for Test, Drink, Sell, Debunk
    initializeMixingView(viewPrefix) {
        this.gameState.currentMixingView = viewPrefix;
        this.resetMixingState(viewPrefix);
        this.renderIngredientsForView(viewPrefix);
    }

    resetMixingState(viewPrefix) {
        this.gameState.selectedIngredients = [];
        this.updateMixingUI(viewPrefix);

        // Hide result
        const resultDisplay = document.getElementById(`${viewPrefix}-result-display`);
        const slotsWrapper = document.getElementById(`${viewPrefix}-slots`);

        if (resultDisplay) resultDisplay.classList.add('hidden');
        if (slotsWrapper) slotsWrapper.classList.remove('hidden');

        // Reset slot text
        const slot1 = document.getElementById(`${viewPrefix}-slot-1`);
        const slot2 = document.getElementById(`${viewPrefix}-slot-2`);
        if (slot1) { slot1.innerHTML = '?'; slot1.style.backgroundImage = 'none'; slot1.style.border = '3px dashed #bbb'; }
        if (slot2) { slot2.innerHTML = '?'; slot2.style.backgroundImage = 'none'; slot2.style.border = '3px dashed #bbb'; }

        // Re-render grid to clear selection
        this.renderIngredientsForView(viewPrefix);
    }

    renderIngredientsForView(viewPrefix) {
        const grid = document.getElementById(`${viewPrefix}-ingredients-grid`);
        if (!grid) return;

        grid.innerHTML = '';
        this.ingredients.forEach(ing => {
            const isSelected = this.gameState.selectedIngredients.includes(ing.id);
            const btn = document.createElement('div');
            btn.className = `ingredient-select-btn ${isSelected ? 'selected' : ''}`;
            btn.innerHTML = `<img src="${ing.src}" alt="${ing.name}">`;

            btn.onclick = () => this.handleIngredientSelection(ing.id, viewPrefix);
            grid.appendChild(btn);
        });
    }

    handleIngredientSelection(id, viewPrefix) {
        const index = this.gameState.selectedIngredients.indexOf(id);

        if (index > -1) {
            // Deselect
            this.gameState.selectedIngredients.splice(index, 1);
        } else {
            // Select (max 2)
            if (this.gameState.selectedIngredients.length < 2) {
                this.gameState.selectedIngredients.push(id);
            }
        }

        this.updateMixingUI(viewPrefix);
        this.renderIngredientsForView(viewPrefix);
    }

    updateMixingUI(viewPrefix) {
        const selected = this.gameState.selectedIngredients;
        const btnMix = document.getElementById(`btn-mix-${viewPrefix}`);

        // Update Slots
        const slot1 = document.getElementById(`${viewPrefix}-slot-1`);
        const slot2 = document.getElementById(`${viewPrefix}-slot-2`);

        const updateSlot = (slot, ingId) => {
            if (!slot) return;
            if (ingId) {
                const ing = this.ingredients.find(i => i.id === ingId);
                slot.innerHTML = '';
                slot.style.backgroundImage = `url('${ing.src}')`;
                slot.style.backgroundSize = 'contain';
                slot.style.backgroundRepeat = 'no-repeat';
                slot.style.backgroundPosition = 'center';
                slot.style.border = 'none';
            } else {
                slot.innerHTML = '?';
                slot.style.backgroundImage = 'none';
                slot.style.border = '3px dashed #bbb';
            }
        };

        updateSlot(slot1, selected[0]);
        updateSlot(slot2, selected[1]);

        // Enable/Disable Mix Button
        if (btnMix) {
            btnMix.disabled = selected.length !== 2;
        }
    }

    handleMixAction(viewPrefix) {
        if (this.gameState.selectedIngredients.length !== 2) return;

        const [ing1Id, ing2Id] = this.gameState.selectedIngredients;

        // Map Ingredient IDs to Alchemicals
        const idx1 = this.ingredients.findIndex(i => i.id === ing1Id);
        const idx2 = this.ingredients.findIndex(i => i.id === ing2Id);

        if (idx1 === -1 || idx2 === -1) {
            console.error('Ingredient not found');
            return;
        }

        const alch1 = this.gameState.mapping[idx1];
        const alch2 = this.gameState.mapping[idx2];

        const result = this.mixPotions(alch1, alch2);

        // Show Result
        const resultDisplay = document.getElementById(`${viewPrefix}-result-display`);
        const slotsWrapper = document.getElementById(`${viewPrefix}-slots`);
        const potionImg = document.getElementById(`${viewPrefix}-potion-img`);
        const potionName = document.getElementById(`${viewPrefix}-potion-name`);

        if (potionImg) potionImg.src = result.src;
        if (potionName) potionName.textContent = result.name;

        // Visual transition
        if (slotsWrapper) slotsWrapper.classList.add('hidden');
        if (resultDisplay) {
            resultDisplay.classList.remove('hidden');
            resultDisplay.classList.add('fade-in'); // Optional animation class
        }

        if (resultDisplay) {
            resultDisplay.onclick = () => {
                this.resetMixingState(viewPrefix);
            };
        }
    }

    // Convert 4-letter code to numeric seed
    codeToSeed(code) {
        let seed = 0;
        for (let i = 0; i < code.length; i++) {
            seed = ((seed << 5) - seed) + code.charCodeAt(i);
            seed |= 0; // Convert to 32bit integer
        }
        return Math.abs(seed); // Ensure positive for consistency usually
    }

    // Simple seeded PRNG (Mulberry32)
    mulberry32(a) {
        return function () {
            var t = a += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        }
    }

    // Logic: Mix two alchemicals to get a potion
    mixPotions(alch1, alch2) {
        const comp1 = this.alchemicalCompositions[alch1];
        const comp2 = this.alchemicalCompositions[alch2];

        if (!comp1 || !comp2) return this.potions.NEUTRAL;

        // Check for matching signs
        if (comp1.r === comp2.r) {
            return comp1.r === 1 ? this.potions.RED_POS : this.potions.RED_NEG;
        }
        if (comp1.g === comp2.g) {
            return comp1.g === 1 ? this.potions.GREEN_POS : this.potions.GREEN_NEG;
        }
        if (comp1.b === comp2.b) {
            return comp1.b === 1 ? this.potions.BLUE_POS : this.potions.BLUE_NEG;
        }

        return this.potions.NEUTRAL;
    }

    render() {
        // Initial render logic if needed
    }
}

window.AlchemistsGame = new AlchemistsGame();