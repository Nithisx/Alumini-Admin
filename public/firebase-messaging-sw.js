importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyBGeM47wLernND70Mr1VRQ0VsJM913AfZE',
  authDomain:        'alumni-kahe.firebaseapp.com',
  projectId:         'alumni-kahe',
  storageBucket:     'alumni-kahe.firebasestorage.app',
  messagingSenderId: '1093673972115',
  appId:             '1:1093673972115:web:720dad3aea9dea90de3866',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  self.registration.showNotification(
    data.title || 'Karpagam Alumni',
    {
      body:               data.body || 'You have a new notification.',
      icon:               '/pwa-192x192-v2.png',
      badge:              '/notification-badge.png',
      image:              data.image || undefined,
      tag:                data.type || 'general',
      renotify:           true,
      requireInteraction: false,
      data:               { click_url: data.click_url || '/' },
      actions: [
        { action: 'open',    title: 'View'    },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    }
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.click_url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});
