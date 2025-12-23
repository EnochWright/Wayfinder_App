// Data Manager for Wayfinder
// Pure data loading service - no game logic

class DataManager {
    constructor() {
        this.data = {};
    }

    // Load data from a JSON file
    async loadJSON(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error loading ${filePath}:`, error);
            throw error;
        }
    }

    // Load data for a specific game
    async loadGameData(gameName, dataType, filePath) {
        const key = `${gameName}.${dataType}`;
        
        if (!this.data[key]) {
            const jsonData = await this.loadJSON(filePath);
            this.data[key] = jsonData[dataType] || jsonData;
            console.log(`Loaded ${gameName} ${dataType}:`, this.data[key].length || 'data loaded');
        }
        
        return this.data[key];
    }

    // Get cached data
    getData(gameName, dataType) {
        const key = `${gameName}.${dataType}`;
        return this.data[key] || [];
    }

    // Check if data is loaded
    isLoaded(gameName, dataType) {
        const key = `${gameName}.${dataType}`;
        return !!this.data[key];
    }

    // Clear all cached data
    clearCache() {
        this.data = {};
    }

    // Clear specific game data
    clearGameData(gameName) {
        Object.keys(this.data).forEach(key => {
            if (key.startsWith(`${gameName}.`)) {
                delete this.data[key];
            }
        });
    }
}

// Create global instance
window.dataManager = new DataManager();