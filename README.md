# Wayfinder - Board Game Companion App

A comprehensive board game companion app that works as both a Progressive Web App (PWA) and an Android app. Features utilities for multiple board games including Rail Baron, Catan, New Bedford, and more.

🌐 **Live Version**: [https://wayfinder.enochwright.com](https://wayfinder.enochwright.com)

## 📋 Features

- ✅ Progressive Web App (PWA) support
- ✅ Android native app support
- ✅ Vanilla JavaScript (no framework required)
- ✅ Service Worker for offline functionality
- ✅ Responsive design
- ✅ No build tools required

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- For Android development:
  - Android Studio
  - Java Development Kit (JDK) 11 or higher
  - Android SDK

### Installation

1. Install dependencies:
```bash
npm install
```

2. Sync Capacitor with the web assets:
```bash
npm run sync
```

## 🛠️ Development

### Running as PWA (Web)

Start the development server:
```bash
npm run dev
```

Then open your browser to `http://localhost:8080`

### Mobile Simulator (Without Android Studio)

To simulate the Android experience without installing Android Studio:

```bash
npm run dev
```

Then open: `http://localhost:8080/mobile-simulator.html`

**Features:**
- 📱 Mobile device frame with realistic appearance
- 🔄 Multiple device sizes (iPhone, Android small/medium/large)
- 🔄 Portrait and landscape orientations
- 🎮 Interactive controls
- 🔧 Easy access to DevTools

**Note:** The simulator shows the web version. For true native Android features, you'll need Android Studio.

### Running on Android

1. Open Android Studio:
```bash
npm run open:android
```

2. In Android Studio:
   - Wait for Gradle sync to complete
   - Connect an Android device or start an emulator
   - Click the "Run" button (green play icon)

Alternatively, run directly from command line:
```bash
npm run run:android
```

## 📁 Project Structure

```
.
├── www/                           # Web assets directory
│   ├── index.html                # Main HTML file
│   ├── styles.css                # Global styles
│   ├── manifest.json             # PWA manifest
│   ├── service-worker.js         # Service worker for offline support
│   ├── js/
│   │   ├── app.js                # Main application logic
│   │   ├── capacitor.js          # Capacitor initialization
│   │   ├── data-manager.js       # Data loading utilities
│   │   └── games/                # Game-specific modules
│   │       ├── railbaron.js      # Rail Baron game utilities
│   │       ├── catan.js          # Catan resource tracker
│   │       ├── newbedford.js     # New Bedford building reference
│   │       ├── alchemists.js     # Alchemists ingredient tracker
│   │       └── ...               # Other game modules
│   ├── data/                     # Game data (JSON files)
│   │   ├── railbaron-*.json      # Rail Baron data files
│   │   ├── catan-*.json          # Catan data
│   │   └── ...                   # Other game data
│   └── assets/                   # Images and static assets
│       └── railbaron/
│           ├── images/           # Game images
│           └── map/              # Map and railroad overlays
├── android/                      # Android native project
├── screenshots/                  # App screenshots
├── capacitor.config.json         # Capacitor configuration
└── package.json                  # Node dependencies and scripts
```

## 📱 PWA Installation

When running as a web app, users can install it as a PWA:

1. Open the app in a supported browser (Chrome, Edge, Safari)
2. Look for the "Install" prompt or button
3. Click "Install" to add it to your home screen

## 🔧 Available Scripts

- `npm run dev` - Start development server for web
- `npm run sync` - Sync web assets to native platforms
- `npm run open:android` - Open Android project in Android Studio
- `npm run run:android` - Build and run on Android device/emulator
- `npm run copy` - Copy web assets to native platforms
- `npm run update` - Update Capacitor dependencies

## 🐛 Troubleshooting

### Android Build Issues

If you encounter Gradle errors:
1. Open Android Studio
2. File → Invalidate Caches / Restart
3. Clean and rebuild the project

### Service Worker Not Updating

Clear browser cache or use incognito mode for testing.

### Port Already in Use

Change the port in the dev script:
```bash
npx http-server www -p 3000
```

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)

## 📄 License

MIT