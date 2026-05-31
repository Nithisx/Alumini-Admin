import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            'AIzaSyBGeM47wLernND70Mr1VRQ0VsJM913AfZE',
  authDomain:        'alumni-kahe.firebaseapp.com',
  projectId:         'alumni-kahe',
  storageBucket:     'alumni-kahe.firebasestorage.app',
  messagingSenderId: '1093673972115',
  appId:             '1:1093673972115:web:720dad3aea9dea90de3866',
};

const VAPID_KEY = 'BIj5TfQsfPj-wCOlqzlu5kTFeeZl-Q_oMZyTJJn8XPoIcjCYtSKxxfE8NQRTV24hqPn_PDjK32uS9eVTfABrkEY';

// Isolated scope for the FCM service worker.
// Using a path that no page lives at keeps it from conflicting with
// VitePWA's sw.js which controls scope '/'.
// Push events are dispatched to whichever SW owns the push subscription,
// regardless of which pages that SW controls.
const FCM_SW_SCOPE = '/firebase-cloud-messaging-push-scope';

let messagingInstance = null;

function getMessagingInstance() {
  if (!messagingInstance) {
    messagingInstance = getMessaging(initializeApp(firebaseConfig));
  }
  return messagingInstance;
}

// Register (or re-use) the dedicated FCM service worker and wait until
// it is fully activated before returning the registration.
async function getFCMServiceWorker() {
  const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
    scope: FCM_SW_SCOPE,
  });

  if (reg.active) return reg;

  // First install — wait for the SW to move from installing → activated.
  return new Promise((resolve, reject) => {
    const sw = reg.installing ?? reg.waiting;
    if (!sw) { resolve(reg); return; }
    sw.addEventListener('statechange', function handler() {
      if (this.state === 'activated') {
        sw.removeEventListener('statechange', handler);
        resolve(reg);
      } else if (this.state === 'redundant') {
        sw.removeEventListener('statechange', handler);
        reject(new Error('FCM SW became redundant during install'));
      }
    });
  });
}

async function registerTokenWithBackend(token, authToken) {
  const cached = localStorage.getItem('FCMToken');
  if (cached === token) return;
  const { API_FCM_REGISTER } = await import('../config/api.js');
  await fetch(API_FCM_REGISTER, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${authToken}`,
    },
    body: JSON.stringify({ token, device_type: 'web' }),
  });
  localStorage.setItem('FCMToken', token);
}

export async function requestNotificationPermission(authToken) {
  if (!authToken) return null;

  // Push subscriptions need a production build — skip entirely in dev to avoid
  // "push service error" noise from the Vite dev server SW.
  if (import.meta.env.DEV) return null;

  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;
  if (Notification.permission === 'denied') return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    // Register firebase-messaging-sw.js at an isolated scope so it coexists
    // with VitePWA's sw.js (scope '/') without a controller conflict.
    const fcmSWReg = await getFCMServiceWorker();

    // Happy path — existing valid subscription returns a token immediately.
    try {
      const token = await getToken(getMessagingInstance(), {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: fcmSWReg,
      });
      if (token) {
        await registerTokenWithBackend(token, authToken);
        return token;
      }
    } catch {
      // Fall through to stale-subscription recovery below.
    }

    // Recovery — clear any stale push endpoint and retry once.
    const stale = await fcmSWReg.pushManager.getSubscription();
    if (stale) await stale.unsubscribe().catch(() => {});

    const token = await getToken(getMessagingInstance(), {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: fcmSWReg,
    });

    if (!token) return null;
    await registerTokenWithBackend(token, authToken);
    return token;
  } catch (err) {
    console.warn('[FCM] Registration failed:', err.message);
    return null;
  }
}

export async function unregisterNotificationToken(authToken) {
  const token = localStorage.getItem('FCMToken');
  if (!token || !authToken) return;
  try {
    const { API_FCM_UNREGISTER } = await import('../config/api.js');
    await fetch(API_FCM_UNREGISTER, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${authToken}`,
      },
      body: JSON.stringify({ token }),
    });
  } catch {
    // Backend will eventually expire the stale token.
  }
  localStorage.removeItem('FCMToken');
}

export function onForegroundMessage(callback) {
  try {
    return onMessage(getMessagingInstance(), callback);
  } catch {
    return () => {};
  }
}
