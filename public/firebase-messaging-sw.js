/**
 * firebase-messaging-sw.js — retired.
 *
 * This file is served so that any browser that still has the old SW cached
 * can install this replacement, which immediately unregisters itself.
 * Push notifications are now handled by push-sw.js (dev) / sw.js (prod).
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => self.clients.claim())
  );
});
