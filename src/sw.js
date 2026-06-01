import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── Native Web Push ───────────────────────────────────────────────────────────
//
// Backend sends a JSON payload: { title, body, type, click_url, image }
// • When the app tab is visible   → forward to the page via postMessage (toast)
// • When the app tab is not visible → show a native OS notification

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
        for (const client of clientList) {
          client.postMessage({ type: 'PUSH_MESSAGE', data });
        }

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
            tag:                (data.type === 'chat' && data.room_id) ? `chat-${data.room_id}` : (data.type || 'general'),
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
