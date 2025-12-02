// Simple service worker for caching.
// In a real-world scenario, you'd use a more robust solution like Workbox.

const CACHE_NAME = 'storecast-media-cache-v1';

self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(self.skipWaiting()); // Activate worker immediately
});

self.addEventListener('activate', (event) => {
  // Claim clients immediately, so the page doesn't need to be reloaded.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // This service worker doesn't intercept fetch requests by default.
  // Caching is handled manually by the client-side application logic.
  // This file is mainly here to enable the Cache API for the app.
});
