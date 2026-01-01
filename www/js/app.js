// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('App initialized');
    
    // Load game data first
    await loadGameData();
    
    // Initialize the app
    initApp();
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
});

async function loadGameData() {
    // Data will be loaded on-demand when user navigates to a game
    console.log('Data manager ready - data will load on demand');
}

function initApp() {
    // Initialize navigation menu
    initNavigation();
    
    // Initialize game modules
    initGameModules();
    
    // Handle PWA install prompt
    handlePWAInstall();
}

// Initialize all game modules
function initGameModules() {
    // Initialize each game module
    if (window.AlchemistsGame) {
        window.AlchemistsGame.init();
    }
    if (window.CatanGame) {
        window.CatanGame.init();
    }
    if (window.NewBedfordGame) {
        window.NewBedfordGame.init();
    }
    if (window.PlanetXGame) {
        window.PlanetXGame.init();
    }
    if (window.RailBaronGame) {
        window.RailBaronGame.init();
    }
    if (window.Rising5Game) {
        window.Rising5Game.init();
    }
}

// Navigation Menu Functions
function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link:not(.dropdown-toggle)');
    const dropdownToggle = document.getElementById('games-dropdown');
    const dropdownMenu = document.getElementById('games-menu');
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    
    // Toggle mobile menu
    navToggle.addEventListener('click', function() {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Handle dropdown toggle
    if (dropdownToggle) {
        dropdownToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dropdownToggle.classList.toggle('active');
            dropdownMenu.classList.toggle('show');
        });
    }
    
    // Handle dropdown item clicks
    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active from all nav links and dropdown items
            navLinks.forEach(l => l.classList.remove('active'));
            dropdownItems.forEach(i => i.classList.remove('active'));
            
            // Add active to clicked item
            this.classList.add('active');
            
            // Close dropdown and mobile menu
            dropdownMenu.classList.remove('show');
            dropdownToggle.classList.remove('active');
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            
            // Get the page name
            const page = this.getAttribute('data-page');
            console.log('Navigating to:', page);
            
            // Switch to the selected page
            switchPage(page);
        });
    });
    
    // Handle regular navigation link clicks
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links and dropdown items
            navLinks.forEach(l => l.classList.remove('active'));
            dropdownItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Close mobile menu and dropdown
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            dropdownMenu.classList.remove('show');
            dropdownToggle.classList.remove('active');
            
            // Get the page name
            const page = this.getAttribute('data-page');
            console.log('Navigating to:', page);
            
            // Switch to the selected page
            switchPage(page);
        });
    });
    
    // Close dropdown and menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            dropdownMenu.classList.remove('show');
            dropdownToggle.classList.remove('active');
        }
    });
    
}

// Page Switching Function
async function switchPage(pageName) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Load game data on-demand
    try {
        if (pageName === 'newbedford' && !window.dataManager.isLoaded('newbedford', 'buildings')) {
            await window.dataManager.loadGameData('newbedford', 'buildings', 'data/newbedford-buildings.json');
        }
        // Other games will load their data when implemented
    } catch (error) {
        console.error(`Error loading ${pageName} data:`, error);
    }
    
    // Show the selected page
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Scroll to top after page is shown (prevents flash)
        requestAnimationFrame(() => {
            window.scrollTo(0, 0);
        });
    }
}


// Show notification function
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

function handlePWAInstall() {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        
        console.log('PWA install prompt available');
        
        // You could show a custom install button here
        // For now, we'll just log it
    });
    
    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        deferredPrompt = null;
    });
}
