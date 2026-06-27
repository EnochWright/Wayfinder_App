// Container Game Module

class ContainerGame {
    init() {
        this.showMainMenu();
    }

    showMainMenu() {
        const container = document.getElementById('container-content');
        if (!container) return;

        container.innerHTML = `
            <div class="rail-baron-container">
                <h2>Container</h2>
                <p class="subtitle">A trading and shipping game companion</p>

                <div class="rail-baron-menu">
                    <button class="rail-baron-menu-btn" id="container-btn-automa">
                        <span class="menu-icon">🤖</span>
                        <span class="menu-title">Play Automa</span>
                        <span class="menu-desc">Solo play with automated opponent</span>
                    </button>

                    <button class="rail-baron-menu-btn" id="container-btn-score">
                        <span class="menu-icon">🏆</span>
                        <span class="menu-title">Score Calculator</span>
                        <span class="menu-desc">Calculate final scores</span>
                    </button>
                </div>
            </div>
        `;

        document.getElementById('container-btn-automa')?.addEventListener('click', () => {
            this.showAutoma();
        });

        document.getElementById('container-btn-score')?.addEventListener('click', () => {
            this.showScoreCalculator();
        });
    }

    showAutoma() {
        const container = document.getElementById('container-content');
        if (!container) return;

        container.innerHTML = `
            <button class="back-button" id="container-back" style="margin: 12px;">← Back to Menu</button>
            <div id="container-automa-root"></div>
        `;

        document.getElementById('container-back')?.addEventListener('click', () => {
            this.showMainMenu();
        });

        if (typeof showSetupScreen === 'function') {
            showSetupScreen();
        }
    }

    showScoreCalculator() {
        const container = document.getElementById('container-content');
        if (!container) return;

        container.innerHTML = `
            <div class="rail-baron-container">
                <button class="back-button" id="container-back">← Back to Menu</button>
                <h2>🏆 Score Calculator</h2>
                <p class="subtitle">Coming soon</p>
            </div>
        `;

        document.getElementById('container-back')?.addEventListener('click', () => {
            this.showMainMenu();
        });
    }
}

window.ContainerGame = new ContainerGame();
