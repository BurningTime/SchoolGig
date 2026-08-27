// Minimal service worker so the app is installable as a PWA.
// No offline caching yet — add a cache strategy once there's real content to cache.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
