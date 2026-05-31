import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let messagingInstance = null;

function getMessagingInstance() {
  if (!messagingInstance) {
    messagingInstance = getMessaging(initializeApp(firebaseConfig));
  }
  return messagingInstance;
}

/**
 * Returns the service worker registration to use for FCM.
 *
 * DEV  — VitePWA's sw.js is disabled (devOptions.enabled:false).
 *         Register public/firebase-messaging-sw.js at scope '/' directly.
 *         No scope conflict; importScripts-based classic script is the most
 *         compatible form for push subscription creation.
 *
 * PROD — VitePWA's sw.js is active at scope '/' and already includes
 *         onBackgroundMessage. navigator.serviceWorker.ready returns it.
 */
async function getFCMServiceWorker() {
  if (import.meta.env.DEV) {
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    if (reg.active) return reg;
    return new Promise((resolve, reject) => {
      const sw = reg.installing ?? reg.waiting;
      if (!sw) { resolve(reg); return; }
      sw.addEventListener('statechange', function handler() {
        if (this.state === 'activated') {
          sw.removeEventListener('statechange', handler);
          resolve(reg);
        } else if (this.state === 'redundant') {
          sw.removeEventListener('statechange', handler);
          reject(new Error('FCM SW install failed — check browser console for importScripts errors'));
        }
      });
    });
  }

  // Production: VitePWA registers sw.js (Workbox + Firebase bundled).
  // Wait for it to be fully active before passing it to getToken().
  return navigator.serviceWorker.ready;
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
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;
  if (Notification.permission === 'denied') return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const swReg = await getFCMServiceWorker();

    // Happy path — existing valid subscription returns a token fast.
    try {
      const token = await getToken(getMessagingInstance(), {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });
      if (token) {
        await registerTokenWithBackend(token, authToken);
        return token;
      }
    } catch {
      // fall through to stale-subscription recovery
    }

    // Recovery — clear stale push endpoint and retry once.
    const stale = await swReg.pushManager.getSubscription();
    if (stale) await stale.unsubscribe().catch(() => {});

    const token = await getToken(getMessagingInstance(), {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
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
