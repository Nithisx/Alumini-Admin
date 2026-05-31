import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Values come from .env / .env.local — never hardcoded.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Isolated scope keeps the FCM SW from conflicting with VitePWA's sw.js
// which owns scope '/'. Push events go to whichever SW owns the subscription
// regardless of which pages that SW controls.
const FCM_SW_SCOPE = '/firebase-cloud-messaging-push-scope';

let messagingInstance = null;

function getMessagingInstance() {
  if (!messagingInstance) {
    messagingInstance = getMessaging(initializeApp(firebaseConfig));
  }
  return messagingInstance;
}

// Register (or reuse) the dedicated FCM service worker and wait until it
// is fully activated before returning — required before calling getToken().
async function getFCMServiceWorker() {
  const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
    scope: FCM_SW_SCOPE,
  });

  if (reg.active) return reg;

  // First install: wait for installing → activated transition.
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
  if (cached === token) return; // unchanged — skip the round-trip
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
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;
  if (Notification.permission === 'denied') return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    // firebase-messaging-sw.js lives in public/ so it is served by both
    // the Vite dev server (localhost) and the production CDN (Vercel).
    // Push subscriptions work on localhost without HTTPS, so no environment
    // guard is needed here.
    const fcmSWReg = await getFCMServiceWorker();

    // Happy path — existing valid subscription → fast token refresh.
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
      // Fall through to stale-subscription recovery.
    }

    // Recovery — clear stale endpoint and retry once.
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
