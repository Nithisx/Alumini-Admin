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

// ── Cross-device detection helpers ────────────────────────────────────────────

/**
 * Detect if we're running on an iOS device (iPhone / iPad / iPod).
 */
function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

/**
 * Detect if the app is running as a standalone PWA (added to home screen).
 * On iOS, Web Push ONLY works in standalone PWA mode (iOS 16.4+).
 */
function isStandalonePWA() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

/**
 * Returns the current notification status for the UI to render the right prompt.
 *
 * @returns {{ supported: boolean, permission: string, isIOS: boolean, isPWA: boolean, canRequest: boolean }}
 */
export function getNotificationStatus() {
  const supported = 'Notification' in window && 'serviceWorker' in navigator;
  const permission = supported ? Notification.permission : 'unsupported';
  const ios = isIOSDevice();
  const pwa = isStandalonePWA();

  // canRequest = browser supports it, permission isn't denied,
  //              and (not iOS OR is iOS PWA)
  const canRequest =
    supported &&
    permission !== 'denied' &&
    permission !== 'granted' &&
    (!ios || pwa);

  return { supported, permission, isIOS: ios, isPWA: pwa, canRequest };
}

// ── Service worker helpers ────────────────────────────────────────────────────

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

// ── Token registration ────────────────────────────────────────────────────────

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

async function acquireAndRegisterToken(authToken) {
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
  try {
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
    console.warn('[FCM] Token recovery failed:', err.message);
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Silently registers the FCM token if permission is ALREADY 'granted'.
 * Safe to call on page load / useEffect — never prompts the user.
 *
 * @param {string} authToken — Django auth token
 * @returns {Promise<string|null>} FCM token or null
 */
export async function registerExistingPermission(authToken) {
  if (!authToken) return null;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    return await acquireAndRegisterToken(authToken);
  } catch (err) {
    console.warn('[FCM] Silent registration failed:', err.message);
    return null;
  }
}

/**
 * Prompts the user for notification permission and registers the FCM token.
 *
 * ⚠️  MUST be called from a user-initiated event (button click, tap).
 *     Mobile browsers will auto-block if called on page load.
 *
 * @param {string} authToken — Django auth token
 * @returns {Promise<{ success: boolean, token?: string, reason?: string }>}
 */
export async function requestNotificationPermission(authToken) {
  if (!authToken) {
    return { success: false, reason: 'no_auth' };
  }

  // 1. Check basic browser support
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return { success: false, reason: 'unsupported' };
  }

  // 2. iOS-specific: Must be installed as PWA (Home Screen) for Web Push
  if (isIOSDevice() && !isStandalonePWA()) {
    return { success: false, reason: 'ios_not_pwa' };
  }

  // 3. Already denied — user must change in browser/OS settings
  if (Notification.permission === 'denied') {
    return { success: false, reason: 'denied' };
  }

  try {
    // 4. Request permission (this is the browser prompt)
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, reason: 'dismissed' };
    }

    // 5. Acquire token (SW must be ready first — crucial for mobile)
    const token = await acquireAndRegisterToken(authToken);
    if (!token) {
      return { success: false, reason: 'token_failed' };
    }

    return { success: true, token };
  } catch (err) {
    console.warn('[FCM] Permission request failed:', err.message);
    return { success: false, reason: 'error', message: err.message };
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
