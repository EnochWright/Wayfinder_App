# Capacitor PWA App

A basic Capacitor application that works as both a Progressive Web App (PWA) and an Android app, built with vanilla JavaScript, HTML, and CSS.

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
├── www/                    # Web assets directory
│   ├── index.html         # Main HTML file
│   ├── styles.css         # Styles
│   ├── manifest.json      # PWA manifest
│   ├── service-worker.js  # Service worker for PWA
│   ├── js/
│   │   ├── app.js         # Main application logic
│   │   └── capacitor.js   # Capacitor initialization
│   └── assets/            # Icons and images
├── android/               # Android native project (generated)
├── capacitor.config.json  # Capacitor configuration
└── package.json          # Node dependencies and scripts
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

## 🎨 Customization

### Adding Icons

Replace the placeholder icons in `www/assets/`:
- `icon-192.png` - 192x192 pixels
- `icon-512.png` - 512x512 pixels
- `icon.png` - General purpose icon

### Modifying App Info

Edit [`capacitor.config.json`](capacitor.config.json:1) to change:
- `appId` - Your app's unique identifier
- `appName` - Your app's display name

### Styling

Edit [`www/styles.css`](www/styles.css:1) to customize the appearance.

### Adding Functionality

Edit [`www/js/app.js`](www/js/app.js:1) to add new features.

## 🔌 Adding Capacitor Plugins

To add native functionality, install Capacitor plugins:

```bash
npm install @capacitor/camera
npm run sync
```

Then use in your code:
```javascript
import { Camera } from '@capacitor/camera';

const photo = await Camera.getPhoto({
  quality: 90,
  allowEditing: true,
  resultType: CameraResultType.Uri
});
```

Popular plugins:
- [@capacitor/camera](https://capacitorjs.com/docs/apis/camera) - Camera and photos
- [@capacitor/geolocation](https://capacitorjs.com/docs/apis/geolocation) - GPS location
- [@capacitor/storage](https://capacitorjs.com/docs/apis/storage) - Key-value storage
- [@capacitor/network](https://capacitorjs.com/docs/apis/network) - Network status
- [@capacitor/device](https://capacitorjs.com/docs/apis/device) - Device information

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