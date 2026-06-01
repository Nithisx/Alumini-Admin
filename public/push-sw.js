/**
 * push-sw.js — Dev-only native Web Push service worker.
 *
 * Registered by webpush.js in DEV mode (VitePWA's sw.js is disabled in dev).
 * In PROD, Workbox's src/sw.js handles the same events.
 *
 * Push payload format expected from the backend:
 *   { title, body, type, click_url, image }
 */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Karpagam Alumni', body: event.data?.text() || '' };
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Forward to all open tabs so they can show an in-app toast
        for (const client of clientList) {
          client.postMessage({ type: 'PUSH_MESSAGE', data });
        }

        // Only show the native notification when no tab has focus
        const hasFocusedClient = clientList.some(
          (c) => c.visibilityState === 'visible'
        );

        if (hasFocusedClient) return;

        return self.registration.showNotification(
          data.title || 'Karpagam Alumni',
          {
            body:               data.body || 'You have a new notification.',
            icon:               '/pwa-192x192-v2.png',
            badge:              '/notification-badge.png',
            image:              data.image || undefined,
            tag:                data.type  || 'general',
            renotify:           true,
            requireInteraction: false,
            data:               { click_url: data.click_url || '/' },
            actions: [
              { action: 'open',    title: 'View'    },
              { action: 'dismiss', title: 'Dismiss' },
            ],
          }
        );
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_NOTIFICATIONS') {
    event.waitUntil(
      self.registration.getNotifications().then((notifications) => {
        notifications.forEach((n) => n.close());
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.click_url || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
