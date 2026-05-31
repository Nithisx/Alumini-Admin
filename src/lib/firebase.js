/**
 * Firebase Cloud Messaging — frontend SDK setup.
 *
 * Background push handling lives in src/sw.js (bundled by VitePWA).
 * This file handles: permission requests, FCM token retrieval, and
 * foreground message listening inside the React app.
 */

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            'AIzaSyBGeM47wLernND70Mr1VRQ0VsJM913AfZE',
  authDomain:        'alumni-kahe.firebaseapp.com',
  projectId:         'alumni-kahe',
  storageBucket:     'alumni-kahe.firebasestorage.app',
  messagingSenderId: '1093673972115',
  appId:             '1:1093673972115:web:720dad3aea9dea90de3866',
  measurementId:     'G-GRFZ9ZQZCC',
};

// VAPID key — Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = 'BIj5TfQsfPj-wCOlqzlu5kTFeeZl-Q_oMZyTJJn8XPoIcjCYtSKxxfE8NQRTV24hqPn_PDjK32uS9eVTfABrkEY';

let app = null;
let messaging = null;

function getFirebaseApp() {
  if (!app) app = initializeApp(firebaseConfig);
  return app;
}

function getMessagingInstance() {
  if (!messaging) messaging = getMessaging(getFirebaseApp());
  return messaging;
}

/**
 * Ask the browser for notification permission and, if granted, obtain the
 * FCM registration token and POST it to the backend.
 *
 * Uses navigator.serviceWorker.ready so FCM shares the single VitePWA-managed
 * SW (src/sw.js) — no separate firebase-messaging-sw.js registration needed.
 */
export async function requestNotificationPermission(authToken) {
  if (!authToken) return null;

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn('[FCM] Push notifications not supported in this browser.');
    return null;
  }

  if (Notification.permission === 'denied') return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('[FCM] Notification permission not granted.');
      return null;
    }

    // navigator.serviceWorker.ready resolves once VitePWA's sw.js is active.
    // No need to register a second SW — the combined sw.js already includes
    // the Firebase onBackgroundMessage handler.
    const swReg = await navigator.serviceWorker.ready;

    // Clear any stale push subscription (e.g. from a different VAPID key)
    // before asking FCM for a fresh token.
    const existing = await swReg.pushManager.getSubscription();
    if (existing) await existing.unsubscribe();

    const fcmToken = await getToken(getMessagingInstance(), {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (!fcmToken) {
      console.warn('[FCM] No registration token returned.');
      return null;
    }

    const { API_FCM_REGISTER } = await import('../config/api.js');
    await fetch(API_FCM_REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${authToken}`,
      },
      body: JSON.stringify({ token: fcmToken, device_type: 'web' }),
    });

    localStorage.setItem('FCMToken', fcmToken);
    console.info('[FCM] Token registered successfully.');
    return fcmToken;
  } catch (err) {
    console.error('[FCM] Error requesting notification permission:', err);
    return null;
  }
}

/**
 * Deactivate the stored FCM token on logout so the backend stops sending pushes.
 */
export async function unregisterNotificationToken(authToken) {
  const fcmToken = localStorage.getItem('FCMToken');
  if (!fcmToken || !authToken) return;
  try {
    const { API_FCM_UNREGISTER } = await import('../config/api.js');
    await fetch(API_FCM_UNREGISTER, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${authToken}`,
      },
      body: JSON.stringify({ token: fcmToken }),
    });
    localStorage.removeItem('FCMToken');
  } catch {
    // Swallow — the backend will eventually deactivate the stale token.
  }
}

/**
 * Listen for messages received while the app tab is active (foreground).
 * Returns the Firebase unsubscribe function.
 */
export function onForegroundMessage(callback) {
  try {
    return onMessage(getMessagingInstance(), callback);
  } catch (err) {
    console.error('[FCM] Failed to set up foreground message listener:', err);
    return () => {};
  }
}
