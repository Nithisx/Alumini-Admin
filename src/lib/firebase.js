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

export async function requestNotificationPermission(authToken) {
  if (!authToken) return null;

  // Push subscriptions require a production build — the Vite dev server serves
  // sw.js as a dev module that Chrome's push service rejects.
  if (import.meta.env.DEV) return null;

  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;
  if (Notification.permission === 'denied') return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    // Wait for the VitePWA-managed SW (src/sw.js) to be active. The SW
    // already includes onBackgroundMessage, so no separate firebase-messaging-sw.js
    // is needed.
    const swRegistration = await navigator.serviceWorker.ready;

    const token = await getToken(getMessagingInstance(), {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) return null;

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
