// Rail Baron Game Module

class RailBaronGame {
    constructor() {
        this.regions = null;
        this.regionRolls = null;
        this.destinations = null;
        this.locations = null;
        this.currentRegion = null;
        this.currentDestination = null;
        this.rollHistory = this.loadRollHistory();
    }

    loadRollHistory() {
        try {
            const saved = localStorage.getItem('railbaron_roll_history');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading roll history:', error);
            return [];
        }
    }

    saveRollHistory() {
        try {
            localStorage.setItem('railbaron_roll_history', JSON.stringify(this.rollHistory));
        } catch (error) {
            console.error('Error saving roll history:', error);
        }
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
                    
                    <button class="rail-baron-menu-btn" id="btn-map-viewer">
                        <span class="menu-icon">🗺️</span>
                        <span class="menu-title">Map Viewer</span>
                        <span class="menu-desc">View railroad routes on map</span>
                    </button>
                    
                    <button class="rail-baron-menu-btn" id="btn-railroads">
                        <span class="menu-icon">🚂</span>
                        <span class="menu-title">Railroads</span>
                        <span class="menu-desc">View railroad information</span>
                    </button>
                    
                    <button class="rail-baron-menu-btn" id="btn-cities">
                        <span class="menu-icon">🏙️</span>
                        <span class="menu-title">Cities</span>
                        <span class="menu-desc">View city information</span>
                    </button>
                    
                    <button class="rail-baron-menu-btn" id="btn-roll-play" disabled>
                        <span class="menu-icon">🎮</span>
                        <span class="menu-title">Roll and Play</span>
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
        
        document.getElementById('btn-map-viewer')?.addEventListener('click', () => {
            this.showMapViewer();
        });
        
        document.getElementById('btn-railroads')?.addEventListener('click', () => {
            this.showRailroadsPage();
        });
        
        document.getElementById('btn-cities')?.addEventListener('click', () => {
            this.showCitiesPage();
        });
    }

    async showCitiesPage() {
        const container = document.getElementById('game-content');
        
        // Load city and railroad data
        let cities = [];
        let railroads = [];
        try {
            const [citiesData, railroadsData] = await Promise.all([
                fetch('data/railbaron-locations.json').then(r => r.json()),
                fetch('data/railbaron-railroads.json').then(r => r.json())
            ]);
            cities = citiesData.locations;
            railroads = railroadsData.railroads;
        } catch (error) {
            console.error('Error loading data:', error);
        }

        container.innerHTML = `
            <div class="rail-baron-container">
                <button class="back-button" id="back-to-menu">← Back to Menu</button>
                <h2>🏙️ City Information</h2>
                <p class="subtitle">Select a city to view its region and railroads</p>
                
                <div class="roll-section">
                    <div class="railroad-selector">
                        <label for="city-select">Choose a City:</label>
                        <select id="city-select" class="railroad-dropdown">
                            <option value="">-- Select a City --</option>
                            ${cities.map(city =>
                                `<option value="${city.id}">${city.location}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div id="city-info" class="railroad-info-display"></div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('back-to-menu')?.addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('city-select')?.addEventListener('change', (e) => {
            const cityId = parseInt(e.target.value);
            if (cityId) {
                const city = cities.find(c => c.id === cityId);
                this.displayCityInfo(city, railroads);
            } else {
                document.getElementById('city-info').innerHTML = '';
            }
        });
    }

    displayCityInfo(city, railroads) {
        const infoDiv = document.getElementById('city-info');
        
        // Get railroad info for this city
        const cityRailroads = city.railroads.map(rrId => {
            const rr = railroads.find(r => r.id === rrId);
            return rr ? { name: rr.name, abbr: rr.abbr } : null;
        }).filter(rr => rr !== null).sort((a, b) => a.name.localeCompare(b.name));
        
        infoDiv.innerHTML = `
            <div class="railroad-detail-card">
                <div class="railroad-detail-header">
                    <h3>${city.location}</h3>
                    <span class="railroad-detail-price">Region: ${city.region}</span>
                </div>
                
                <div class="railroad-detail-body">
                    <div class="railroad-detail-item">
                        <span class="railroad-detail-label">🚂 Railroads Serving This City:</span>
                        <div class="city-railroads-list">
                            ${cityRailroads.map(rr =>
                                `<span class="city-railroad-badge">${rr.name} <span class="badge-abbr">(${rr.abbr})</span></span>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async showRailroadsPage() {
        const container = document.getElementById('game-content');
        
        // Load railroad and city data
        let railroads = [];
        let cities = [];
        try {
            const [railroadsData, citiesData] = await Promise.all([
                fetch('data/railbaron-railroads.json').then(r => r.json()),
                fetch('data/railbaron-locations.json').then(r => r.json())
            ]);
            railroads = railroadsData.railroads;
            cities = citiesData.locations;
        } catch (error) {
            console.error('Error loading railroads:', error);
        }

        container.innerHTML = `
            <div class="rail-baron-container">
                <button class="back-button" id="back-to-menu">← Back to Menu</button>
                <h2>🚂 Railroad Information</h2>
                <p class="subtitle">Select a railroad to view its history and details</p>
                
                <div class="roll-section">
                    <div class="railroad-selector">
                        <label for="railroad-select">Choose a Railroad:</label>
                        <select id="railroad-select" class="railroad-dropdown">
                            <option value="">-- Select a Railroad --</option>
                            ${railroads.map(rr =>
                                `<option value="${rr.id}">${rr.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div id="railroad-info" class="railroad-info-display"></div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('back-to-menu')?.addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('railroad-select')?.addEventListener('change', (e) => {
            const railroadId = parseInt(e.target.value);
            if (railroadId) {
                const railroad = railroads.find(rr => rr.id === railroadId);
                this.displayRailroadInfo(railroad, cities);
            } else {
                document.getElementById('railroad-info').innerHTML = '';
            }
        });
    }

    displayRailroadInfo(railroad, cities) {
        const infoDiv = document.getElementById('railroad-info');
        
        // Find all cities served by this railroad
        const servedCities = cities
            .filter(city => city.railroads && city.railroads.includes(railroad.id))
            .map(city => city.location)
            .sort();
        
        infoDiv.innerHTML = `
            <div class="railroad-detail-card">
                <div class="railroad-detail-header">
                    <h3>${railroad.name} <span class="railroad-abbr-header">(${railroad.abbr})</span></h3>
                    <span class="railroad-detail-price">Game Cost: $${railroad.price.toLocaleString()}</span>
                </div>
                
                <div class="railroad-detail-body">
                    <div class="railroad-detail-item">
                        <span class="railroad-detail-label">📅 Years of Operation:</span>
                        <span class="railroad-detail-value">${railroad.years}</span>
                    </div>
                    
                    <div class="railroad-detail-item">
                        <span class="railroad-detail-label">📋 Outcome:</span>
                        <span class="railroad-detail-value">${railroad.outcome}</span>
                    </div>
                    
                    <div class="railroad-detail-item">
                        <span class="railroad-detail-label">🏢 Current Status:</span>
                        <span class="railroad-detail-value railroad-current-status">${railroad.currentStatus}</span>
                    </div>
                    
                    <div class="railroad-detail-item">
                        <span class="railroad-detail-label">🏙️ Cities Served (${servedCities.length}):</span>
                        <div class="city-railroads-list">
                            ${servedCities.map(cityName =>
                                `<span class="city-railroad-badge">${cityName}</span>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async showMapViewer() {
        const container = document.getElementById('game-content');
        
        // Load railroad data
        let railroads = [];
        try {
            const railroadsData = await fetch('data/railbaron-railroads.json').then(r => r.json());
            railroads = railroadsData.railroads;
        } catch (error) {
            console.error('Error loading railroads:', error);
        }

        // Map railroad IDs to abbreviations
        const railroadAbbr = {
            1: 'atsf', 2: 'acl', 3: 'bo', 4: 'bm', 5: 'co', 6: 'cbq', 7: 'cmstpp',
            8: 'crip', 9: 'cnw', 10: 'drgw', 11: 'gn', 12: 'gmo', 13: 'ic', 14: 'ln',
            15: 'mp', 16: 'nynhh', 17: 'nyc', 18: 'nw', 19: 'np', 20: 'pa', 21: 'rfp',
            22: 'sal', 23: 'sp', 24: 'sou', 25: 'slsf', 26: 'tp', 27: 'up', 28: 'wp'
        };

        container.innerHTML = `
            <div class="rail-baron-container" id="map-viewer-container">
                <div class="map-viewer-header">
                    <button class="back-button" id="back-to-menu">← Back to Menu</button>
                    <div class="width-toggle-buttons">
                        <button class="width-toggle-btn active" data-width="normal" title="Normal Width (900px)">Normal</button>
                        <button class="width-toggle-btn" data-width="wide" title="Wide (1200px)">Wide</button>
                        <button class="width-toggle-btn" data-width="full" title="Full Width">Full</button>
                    </div>
                </div>
                <h2>🗺️ Rail Baron Map Viewer</h2>
                <p class="subtitle">Toggle railroads on and off to view their routes</p>
                
                <div class="map-viewer-section">
                    <div class="map-canvas-wrapper" id="map-canvas-wrapper">
                        <div class="map-zoom-controls">
                            <button class="zoom-btn" id="zoom-in" title="Zoom In">+</button>
                            <button class="zoom-btn" id="zoom-out" title="Zoom Out">−</button>
                            <button class="zoom-btn" id="zoom-fit" title="Fit to Screen">⊡</button>
                            <span class="zoom-level" id="zoom-level">100%</span>
                        </div>
                        <div id="map-loading" class="map-loading">
                            <div class="loading-spinner"></div>
                            <p>Loading map...</p>
                        </div>
                        <div id="map-canvas" class="map-canvas" style="display: none;">
                            <!-- Map and overlays will be loaded here -->
                        </div>
                    </div>
                    
                    <div class="map-controls-panel">
                        <div class="controls-header">
                            <h3>Railroad Overlays</h3>
                            <div class="toggle-all-buttons">
                                <button class="toggle-btn show-all" id="show-all">Show All</button>
                                <button class="toggle-btn hide-all" id="hide-all">Hide All</button>
                            </div>
                        </div>
                        <div id="railroad-toggles" class="railroad-toggles">
                            <!-- Railroad toggles will be added here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listener for back button
        document.getElementById('back-to-menu')?.addEventListener('click', () => {
            this.showMainMenu();
        });

        // Add width toggle listeners
        document.querySelectorAll('.width-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const width = e.target.getAttribute('data-width');
                this.setMapViewerWidth(width);
                
                // Update active state
                document.querySelectorAll('.width-toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Initialize map
        this.initializeMap(railroads, railroadAbbr);
    }

    setMapViewerWidth(width) {
        const container = document.getElementById('map-viewer-container');
        container.classList.remove('width-normal', 'width-wide', 'width-full');
        
        switch(width) {
            case 'wide':
                container.classList.add('width-wide');
                break;
            case 'full':
                container.classList.add('width-full');
                break;
            default:
                container.classList.add('width-normal');
        }
        
        // Refit map after width change
        setTimeout(() => {
            if (this.mapState) {
                this.fitMapToScreen();
            }
        }, 100);
    }

    initializeMap(railroads, railroadAbbr) {
        const mapCanvas = document.getElementById('map-canvas');
        const mapWrapper = document.getElementById('map-canvas-wrapper');
        const loadingDiv = document.getElementById('map-loading');
        
        // Initialize zoom and pan state
        this.mapState = {
            scale: 1,
            translateX: 0,
            translateY: 0,
            isDragging: false,
            startX: 0,
            startY: 0,
            minScale: 0.5,
            maxScale: 3
        };
        
        // Create base map image
        const baseMap = document.createElement('img');
        baseMap.src = 'assets/railbaron/map/map-highres.jpg';
        baseMap.className = 'map-base-image';
        baseMap.alt = 'Rail Baron Base Map';
        
        baseMap.onload = () => {
            // Set canvas size to match image
            mapCanvas.style.width = baseMap.naturalWidth + 'px';
            mapCanvas.style.height = baseMap.naturalHeight + 'px';
            
            // Add railroad overlays
            railroads.forEach(railroad => {
                const abbr = railroadAbbr[railroad.id];
                if (abbr) {
                    const overlay = document.createElement('img');
                    overlay.src = `assets/railbaron/map/${abbr}.png`;
                    overlay.className = 'map-overlay hidden';
                    overlay.id = `overlay-${abbr}`;
                    overlay.alt = `${railroad.name} Route`;
                    overlay.onerror = () => {
                        console.warn(`Could not load overlay for ${railroad.name}`);
                    };
                    mapCanvas.appendChild(overlay);
                }
            });

            // Show map, hide loading
            loadingDiv.style.display = 'none';
            mapCanvas.style.display = 'block';
            
            // Initialize zoom to fit
            this.fitMapToScreen();
            
            // Setup zoom and pan controls
            this.setupMapControls(mapCanvas, mapWrapper);
            
            // Create railroad toggles
            this.createRailroadToggles(railroads, railroadAbbr);
        };

        baseMap.onerror = () => {
            loadingDiv.innerHTML = '<p style="color: #f44336;">Error loading map. Please check that map images exist in assets/railbaron/map/</p>';
        };

        mapCanvas.appendChild(baseMap);
    }

    setupMapControls(mapCanvas, mapWrapper) {
        // Zoom controls
        document.getElementById('zoom-in')?.addEventListener('click', () => {
            this.zoomMap(0.2);
        });
        
        document.getElementById('zoom-out')?.addEventListener('click', () => {
            this.zoomMap(-0.2);
        });
        
        document.getElementById('zoom-fit')?.addEventListener('click', () => {
            this.fitMapToScreen();
        });

        // Mouse wheel zoom
        mapWrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.zoomMap(delta, e.clientX, e.clientY);
        }, { passive: false });

        // Pan with mouse drag
        mapCanvas.addEventListener('mousedown', (e) => {
            this.mapState.isDragging = true;
            this.mapState.startX = e.clientX - this.mapState.translateX;
            this.mapState.startY = e.clientY - this.mapState.translateY;
            mapCanvas.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.mapState.isDragging) return;
            
            this.mapState.translateX = e.clientX - this.mapState.startX;
            this.mapState.translateY = e.clientY - this.mapState.startY;
            this.updateMapTransform();
        });

        document.addEventListener('mouseup', () => {
            if (this.mapState.isDragging) {
                this.mapState.isDragging = false;
                mapCanvas.style.cursor = 'grab';
            }
        });

        // Touch support for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        let lastTouchDistance = 0;

        mapCanvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                // Single touch - pan
                this.mapState.isDragging = true;
                touchStartX = e.touches[0].clientX - this.mapState.translateX;
                touchStartY = e.touches[0].clientY - this.mapState.translateY;
            } else if (e.touches.length === 2) {
                // Two touches - pinch zoom
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
            }
        });

        mapCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1 && this.mapState.isDragging) {
                // Pan
                this.mapState.translateX = e.touches[0].clientX - touchStartX;
                this.mapState.translateY = e.touches[0].clientY - touchStartY;
                this.updateMapTransform();
            } else if (e.touches.length === 2) {
                // Pinch zoom
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (lastTouchDistance > 0) {
                    const delta = (distance - lastTouchDistance) * 0.01;
                    this.zoomMap(delta);
                }
                
                lastTouchDistance = distance;
            }
        }, { passive: false });

        mapCanvas.addEventListener('touchend', () => {
            this.mapState.isDragging = false;
            lastTouchDistance = 0;
        });

        // Set initial cursor
        mapCanvas.style.cursor = 'grab';
    }

    zoomMap(delta, centerX = null, centerY = null) {
        const oldScale = this.mapState.scale;
        this.mapState.scale = Math.max(
            this.mapState.minScale,
            Math.min(this.mapState.maxScale, this.mapState.scale + delta)
        );

        // If zooming with mouse position, adjust translation to zoom toward cursor
        if (centerX !== null && centerY !== null) {
            const mapWrapper = document.getElementById('map-canvas-wrapper');
            const rect = mapWrapper.getBoundingClientRect();
            const x = centerX - rect.left;
            const y = centerY - rect.top;
            
            const scaleChange = this.mapState.scale / oldScale;
            this.mapState.translateX = x - (x - this.mapState.translateX) * scaleChange;
            this.mapState.translateY = y - (y - this.mapState.translateY) * scaleChange;
        }

        this.updateMapTransform();
    }

    fitMapToScreen() {
        const mapCanvas = document.getElementById('map-canvas');
        const mapWrapper = document.getElementById('map-canvas-wrapper');
        
        const wrapperWidth = mapWrapper.clientWidth;
        const wrapperHeight = mapWrapper.clientHeight;
        const mapWidth = mapCanvas.offsetWidth;
        const mapHeight = mapCanvas.offsetHeight;
        
        // Calculate scale to fit
        const scaleX = wrapperWidth / mapWidth;
        const scaleY = wrapperHeight / mapHeight;
        this.mapState.scale = Math.min(scaleX, scaleY, 1) * 0.95; // 95% to add padding
        
        // Center the map
        this.mapState.translateX = (wrapperWidth - mapWidth * this.mapState.scale) / 2;
        this.mapState.translateY = (wrapperHeight - mapHeight * this.mapState.scale) / 2;
        
        this.updateMapTransform();
    }

    updateMapTransform() {
        const mapCanvas = document.getElementById('map-canvas');
        mapCanvas.style.transform = `translate(${this.mapState.translateX}px, ${this.mapState.translateY}px) scale(${this.mapState.scale})`;
        mapCanvas.style.transformOrigin = '0 0';
        
        // Update zoom level display
        const zoomLevel = document.getElementById('zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(this.mapState.scale * 100)}%`;
        }
    }

    createRailroadToggles(railroads, railroadAbbr) {
        const togglesContainer = document.getElementById('railroad-toggles');
        
        railroads.forEach(railroad => {
            const abbr = railroadAbbr[railroad.id];
            if (!abbr) return;
            
            const toggle = document.createElement('div');
            toggle.className = 'railroad-toggle-item';
            toggle.innerHTML = `
                <input type="checkbox"
                       class="railroad-checkbox"
                       id="toggle-${abbr}"
                       data-abbr="${abbr}">
                <label for="toggle-${abbr}" class="railroad-label">
                    <span class="railroad-name">${railroad.name} <span class="railroad-abbr">(${railroad.abbr})</span></span>
                    <span class="railroad-price">$${railroad.price.toLocaleString()}</span>
                </label>
            `;
            
            const checkbox = toggle.querySelector('input');
            const label = toggle.querySelector('label');
            
            checkbox.addEventListener('change', (e) => {
                this.toggleRailroadOverlay(abbr, e.target.checked);
            });
            
            // Make entire card clickable
            toggle.addEventListener('click', (e) => {
                // Don't trigger if clicking the checkbox itself or the label (they handle their own clicks)
                if (e.target !== checkbox && !label.contains(e.target)) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
            
            togglesContainer.appendChild(toggle);
        });

        // Setup toggle all buttons
        document.getElementById('show-all')?.addEventListener('click', () => {
            this.toggleAllRailroads(true, railroads, railroadAbbr);
        });
        
        document.getElementById('hide-all')?.addEventListener('click', () => {
            this.toggleAllRailroads(false, railroads, railroadAbbr);
        });
    }

    toggleRailroadOverlay(abbr, show) {
        const overlay = document.getElementById(`overlay-${abbr}`);
        if (overlay) {
            if (show) {
                overlay.classList.remove('hidden');
            } else {
                overlay.classList.add('hidden');
            }
        }
    }

    toggleAllRailroads(show, railroads, railroadAbbr) {
        railroads.forEach(railroad => {
            const abbr = railroadAbbr[railroad.id];
            if (abbr) {
                const checkbox = document.getElementById(`toggle-${abbr}`);
                if (checkbox) {
                    checkbox.checked = show;
                    this.toggleRailroadOverlay(abbr, show);
                }
            }
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
                    <div class="card-header-with-button">
                        <h3>Roll History</h3>
                        <button id="clear-history" class="btn-secondary" style="padding: 8px 16px; font-size: 0.9rem;">🗑️ Clear History</button>
                    </div>
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
        
        // Load and display saved roll history
        this.displaySavedHistory();
        
        // Attach back button listener
        document.getElementById('back-to-menu')?.addEventListener('click', () => {
            this.showMainMenu();
        });
    }

    displaySavedHistory() {
        const historyDiv = document.getElementById('roll-history');
        if (!historyDiv || !this.rollHistory || this.rollHistory.length === 0) return;
        
        // Display history in reverse order (newest first)
        this.rollHistory.slice().reverse().forEach(item => {
            const entry = document.createElement('div');
            entry.className = 'history-entry';
            entry.innerHTML = `
                <div class="history-main">
                    <span class="history-time">${item.timestamp}</span>
                    <span class="history-method">${item.method}</span>
                    <span class="history-region">${item.regionName}</span>
                    <span class="history-arrow">→</span>
                    <span class="history-destination">${item.locationName}</span>
                </div>
                ${item.regionDiceTotal ? `
                <div class="history-details">
                    <span class="history-detail-label">Region:</span>
                    <span class="history-dice-value">${item.regionDiceTotal}</span>
                    <span class="history-parity ${item.regionParity}">${item.regionParity}</span>
                    <span class="history-detail-separator">|</span>
                    <span class="history-detail-label">Destination:</span>
                    <span class="history-dice-value">${item.diceTotal}</span>
                    <span class="history-parity ${item.parity}">${item.parity}</span>
                </div>
                ` : ''}
            `;
            historyDiv.appendChild(entry);
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

        // Clear history button
        document.getElementById('clear-history')?.addEventListener('click', () => {
            this.clearHistory();
        });
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all roll history?')) {
            this.rollHistory = [];
            this.saveRollHistory();
            
            const historyDiv = document.getElementById('roll-history');
            if (historyDiv) {
                historyDiv.innerHTML = '';
            }
        }
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
        
        // Store region roll info for history
        this.currentRegionDiceTotal = diceTotal;
        this.currentRegionParity = parity;

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

        // Hide destination controls after rolling
        const destSection = document.getElementById('destination-section');
        const destControls = destSection?.querySelector('.dice-controls');
        if (destControls) {
            destControls.style.display = 'none';
        }

        // Add to history
        this.addToHistory(this.currentRegion, locationId, diceTotal, parity, isAuto);
    }

    addToHistory(regionId, locationId, diceTotal, parity, isAuto) {
        const region = this.regions.find(r => r.id === regionId);
        const location = this.locations.find(l => l.id === locationId);
        
        const historyDiv = document.getElementById('roll-history');
        const timestamp = new Date().toLocaleTimeString();
        const method = isAuto ? '🎲 Auto' : '✓ Manual';
        
        // Save to history array
        const historyItem = {
            timestamp,
            method,
            regionId,
            regionName: region.region,
            locationId,
            locationName: location.location,
            diceTotal,
            parity,
            regionDiceTotal: this.currentRegionDiceTotal,
            regionParity: this.currentRegionParity
        };
        
        this.rollHistory.unshift(historyItem); // Add to beginning
        
        // Limit history to 50 items
        if (this.rollHistory.length > 50) {
            this.rollHistory = this.rollHistory.slice(0, 50);
        }
        
        // Save to localStorage
        this.saveRollHistory();
        
        // Display in UI
        const entry = document.createElement('div');
        entry.className = 'history-entry';
        entry.innerHTML = `
            <div class="history-main">
                <span class="history-time">${timestamp}</span>
                <span class="history-method">${method}</span>
                <span class="history-region">${region.region}</span>
                <span class="history-arrow">→</span>
                <span class="history-destination">${location.location}</span>
            </div>
            <div class="history-details">
                <span class="history-detail-label">Region:</span>
                <span class="history-dice-value">${this.currentRegionDiceTotal}</span>
                <span class="history-parity ${this.currentRegionParity}">${this.currentRegionParity}</span>
                <span class="history-detail-separator">|</span>
                <span class="history-detail-label">Destination:</span>
                <span class="history-dice-value">${diceTotal}</span>
                <span class="history-parity ${parity}">${parity}</span>
            </div>
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
        
        // Show destination controls again
        const destSection = document.getElementById('destination-section');
        const destControls = destSection?.querySelector('.dice-controls');
        if (destControls) {
            destControls.style.display = 'flex';
        }
        
        // Reset inputs
        document.getElementById('region-dice-display').textContent = '7';
        document.getElementById('dest-dice-display').textContent = '7';
        document.querySelector('input[name="region-parity"][value="odd"]').checked = true;
        document.querySelector('input[name="dest-parity"][value="odd"]').checked = true;
    }
}

window.RailBaronGame = new RailBaronGame();
