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

let messagingInstance = null;

function getMessagingInstance() {
  if (!messagingInstance) {
    messagingInstance = getMessaging(initializeApp(firebaseConfig));
  }
  return messagingInstance;
}

async function registerTokenWithBackend(token, authToken) {
  const cached = localStorage.getItem('FCMToken');
  if (cached === token) return; // token unchanged — skip the network round-trip
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

  // Push subscriptions require a production build with HTTPS.
  // The Vite dev server serves sw.js as a virtual module that Chrome's push
  // service rejects. Skip entirely in dev to keep the console clean.
  if (import.meta.env.DEV) return null;

  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;
  if (Notification.permission === 'denied') return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    // Wait for VitePWA's sw.js to be active. The SW includes onBackgroundMessage
    // so no separate firebase-messaging-sw.js is needed.
    const swReg = await navigator.serviceWorker.ready;

    // ── Happy path ───────────────────────────────────────────────────────────
    // If the browser already has a valid push subscription for this SW
    // registration, Firebase returns (and refreshes) the existing token fast.
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
      // Fall through to stale-subscription cleanup below.
    }

    // ── Stale subscription recovery ──────────────────────────────────────────
    // "Registration failed – push service error" means the browser has an
    // expired or mismatched push endpoint (e.g. left over from a previous SW
    // version). Unsubscribe it, then retry once. This is safe here because
    // requestNotificationPermission is called from a single place
    // (NotificationProvider) so there is no concurrent caller to race with.
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
