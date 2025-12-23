// Import Capacitor
import { Capacitor } from '@capacitor/core';

// Make Capacitor available globally
window.Capacitor = Capacitor;

// Log platform information
console.log('Capacitor Platform:', Capacitor.getPlatform());
console.log('Is Native:', Capacitor.isNativePlatform());