# Quick Start Guide - Running as PWA

## Step 1: Start the Development Server

Open a terminal in the project directory and run:

```bash
npm run dev
```

You should see output like:
```
Starting up http-server, serving www
Available on:
  http://127.0.0.1:8080
  http://192.168.x.x:8080
```

## Step 2: Open in Browser

Open your web browser and navigate to:
```
http://localhost:8080
```

## Step 3: Test PWA Features

The app should now be running! You'll see:
- Platform info showing "Platform: web | Native: No (Web)" or "Platform: Web Browser (PWA Mode)"
- A working click counter button
- Responsive design

## Step 4: Install as PWA (Optional)

### On Desktop (Chrome/Edge):
1. Look for the install icon (⊕) in the address bar
2. Click it and select "Install"
3. The app will open in its own window

### On Mobile (Chrome/Safari):
1. Tap the browser menu (⋮ or share icon)
2. Select "Add to Home Screen" or "Install App"
3. The app will be added to your home screen

## Step 5: Test Offline Mode

1. Open browser DevTools (F12)
2. Go to the "Application" or "Storage" tab
3. Check "Service Workers" - you should see the service worker registered
4. Enable "Offline" mode in DevTools
5. Refresh the page - it should still work!

## Troubleshooting

### Port Already in Use
If port 8080 is busy, use a different port:
```bash
npx http-server www -p 3000
```

### Service Worker Not Registering
- Make sure you're using `http://localhost` (not `file://`)
- Check browser console for errors
- Try clearing browser cache

### Capacitor Not Loading
This is normal for web mode. The app works as a PWA without Capacitor's native features. Capacitor will load properly when running on Android.

## Next Steps

- **Customize**: Edit files in the `www/` directory
- **Add Icons**: Place your icons in `www/assets/`
- **Run on Android**: See main README.md for Android setup
- **Add Features**: Modify `www/js/app.js` to add functionality

## Common Commands

```bash
# Start dev server
npm run dev

# Sync changes to Android
npm run sync

# Open Android Studio
npm run open:android

# Run on Android device
npm run run:android
```

Enjoy your Capacitor PWA! 🚀