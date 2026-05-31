/**
 * Firebase Cloud Messaging — frontend SDK setup.
 * Handles permission requests, token retrieval, and foreground message listening.
 *
 * Firebase project: alumni-kahe  (project_id from service account)
 */

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// ── Firebase project config (alumni-kahe) ────────────────────────────────────
// These values come from Firebase Console → Project Settings → Your apps → Web app.
// They are safe to expose in client-side code — all security is enforced by
// Firebase Security Rules and the backend (FCM Server Key never leaves the backend).
const firebaseConfig = {
  apiKey:            "AIzaSyBGeM47wLernND70Mr1VRQ0VsJM913AfZE",
  authDomain:        "alumni-kahe.firebaseapp.com",
  projectId:         "alumni-kahe",
  storageBucket:     "alumni-kahe.firebasestorage.app",
  messagingSenderId: "1093673972115",
  appId:             "1:1093673972115:web:720dad3aea9dea90de3866",
  measurementId:     "G-GRFZ9ZQZCC",
};

// VAPID key — Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = "BIj5TfQsfPj-wCOlqzlu5kTFeeZl-Q_oMZyTJJn8XPoIcjCYtSKxxfE8NQRTV24hqPn_PDjK32uS9eVTfABrkEY";

// ── Initialise Firebase ───────────────────────────────────────────────────────
let app = null;
let messaging = null;

function getFirebaseApp() {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

function getMessagingInstance() {
  if (!messaging) {
    messaging = getMessaging(getFirebaseApp());
  }
  return messaging;
}

// ── Request permission & register token ──────────────────────────────────────

/**
 * Ask the browser for notification permission and, if granted, obtain the
 * FCM registration token and POST it to the backend.
 *
 * @param {string} authToken   - The alumni portal auth token (for the API call)
 * @returns {Promise<string|null>}  The FCM token, or null on failure/denial
 */
export async function requestNotificationPermission(authToken) {
  if (!authToken) return null;

  // Safari and some browsers don't support the Notifications API
  if (!('Notification' in window)) {
    console.warn('[FCM] This browser does not support notifications.');
    return null;
  }

  // Don't re-ask if already denied
  if (Notification.permission === 'denied') return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('[FCM] Notification permission not granted.');
      return null;
    }

    const fcmToken = await getToken(getMessagingInstance(), {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        { scope: '/' }
      ),
    });

    if (!fcmToken) {
      console.warn('[FCM] No registration token available.');
      return null;
    }

    // POST the token to the backend
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
 *
 * @param {string} authToken - The alumni portal auth token (for the API call)
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
    // Swallow — the backend will eventually deactivate the stale token
  }
}

/**
 * Listen for messages received while the app is in the foreground.
 *
 * @param {Function} callback  - Called with the FCM message payload
 * @returns {Function}         - Unsubscribe function
 */
export function onForegroundMessage(callback) {
  try {
    return onMessage(getMessagingInstance(), callback);
  } catch (err) {
    console.error('[FCM] Failed to set up foreground message listener:', err);
    return () => {};
  }
}
