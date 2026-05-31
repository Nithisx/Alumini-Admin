import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

// Activate immediately and take control of all clients so PWA caching
// kicks in on first load without requiring a page reload.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
