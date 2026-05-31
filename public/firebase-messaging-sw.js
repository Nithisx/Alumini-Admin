/**
 * Firebase Cloud Messaging service worker — alumni-kahe
 *
 * This file MUST live at the root of the public/ directory so it is served
 * from / (same scope as the PWA service worker).
 *
 * Handles background push messages (when the tab is hidden or closed) and
 * shows a native browser notification with the portal logo.
 */

// ---------------------------------------------------------------------------
// 1. Import Firebase compat scripts (CDN build works inside service workers)
// ---------------------------------------------------------------------------
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// ---------------------------------------------------------------------------
// 2. Initialise the Firebase app
// ---------------------------------------------------------------------------
firebase.initializeApp({
  apiKey:            "AIzaSyBGeM47wLernND70Mr1VRQ0VsJM913AfZE",
  authDomain:        "alumni-kahe.firebaseapp.com",
  projectId:         "alumni-kahe",
  storageBucket:     "alumni-kahe.firebasestorage.app",
  messagingSenderId: "1093673972115",
  appId:             "1:1093673972115:web:720dad3aea9dea90de3866",
});

// ---------------------------------------------------------------------------
// 3. Retrieve the messaging instance
// ---------------------------------------------------------------------------
const messaging = firebase.messaging();

// ---------------------------------------------------------------------------
// 4. Handle background messages
//    (foreground messages are handled inside the React app via onMessage())
// ---------------------------------------------------------------------------
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Received background message:', payload);

  const notification = payload.notification || {};
  const data         = payload.data         || {};

  const title = notification.title || data.title || 'Karpagam Alumni';
  const body  = notification.body  || data.body  || 'You have a new notification.';
  const icon  = '/pwa-192x192-v2.png';
  const badge = '/pwa-192x192-v2.png';
  const image = notification.image || data.image || undefined;

  // The click_url comes from our backend's FCM data payload
  const clickUrl = data.click_url || '/';

  const options = {
    body,
    icon,
    badge,
    image,
    tag: data.type || 'general',          // collapse same-type notifications
    renotify: true,
    requireInteraction: false,
    data: { click_url: clickUrl },
    actions: [
      { action: 'open', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  self.registration.showNotification(title, options);
});

// ---------------------------------------------------------------------------
// 5. Handle notification click
// ---------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const clickUrl = (event.notification.data && event.notification.data.click_url)
    ? event.notification.data.click_url
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an existing tab if one is open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(clickUrl);
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(clickUrl);
      }
    })
  );
});
