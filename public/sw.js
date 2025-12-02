// This file is intentionally left blank.
// The caching logic is now handled by src/lib/media-cache.ts using IndexedDB
// and does not require a traditional service worker for this specific implementation.
// The ServiceWorkerRegistrar component can be removed or kept for future PWA features.
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
});

self.addEventListener('fetch', (event) => {
  // We are not intercepting fetch events here, as the logic is in the app.
});
