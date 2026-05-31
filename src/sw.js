/**
 * Combined service worker — VitePWA (injectManifest) + Firebase Cloud Messaging
 *
 * Vite bundles this file and replaces self.__WB_MANIFEST with the precache list.
 * Running a single SW at scope / avoids the two-SW push-subscription conflict
 * that caused "Registration failed - push service error".
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// ── PWA: activate immediately so the page gets the latest assets ──────────────
self.addEventListener('install', () => self.skipWaiting());

// ── PWA: precache all Vite-built assets ───────────────────────────────────────
// self.__WB_MANIFEST is replaced by VitePWA at build time.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── FCM: initialise Firebase inside the SW ────────────────────────────────────
const firebaseApp = initializeApp({
  apiKey:            'AIzaSyBGeM47wLernND70Mr1VRQ0VsJM913AfZE',
  authDomain:        'alumni-kahe.firebaseapp.com',
  projectId:         'alumni-kahe',
  storageBucket:     'alumni-kahe.firebasestorage.app',
  messagingSenderId: '1093673972115',
  appId:             '1:1093673972115:web:720dad3aea9dea90de3866',
});

const messaging = getMessaging(firebaseApp);

// ── FCM: show a native notification for background push messages ──────────────
onBackgroundMessage(messaging, (payload) => {
  console.log('[SW] Background message received:', payload);

  const notification = payload.notification || {};
  const data         = payload.data         || {};

  const title    = notification.title || data.title || 'Karpagam Alumni';
  const body     = notification.body  || data.body  || 'You have a new notification.';
  const clickUrl = data.click_url || '/';

  self.registration.showNotification(title, {
    body,
    icon:              '/pwa-192x192-v2.png',
    badge:             '/pwa-192x192-v2.png',
    image:             notification.image || data.image || undefined,
    tag:               data.type || 'general',
    renotify:          true,
    requireInteraction: false,
    data:              { click_url: clickUrl },
    actions: [
      { action: 'open',    title: 'View'    },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
});

// ── FCM: handle notification click ───────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const clickUrl = event.notification.data?.click_url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(clickUrl);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(clickUrl);
    })
  );
});
