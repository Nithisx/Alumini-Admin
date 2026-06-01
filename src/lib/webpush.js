/**
 * webpush.js — Native Web Push API
 *
 * Identical public surface to the old firebase.js so every caller
 * (NotificationProvider, headers, FCMDiagnostics) works with zero changes
 * except updating the import path.
 *
 * Push flow:
 *  DEV  – registers public/push-sw.js at scope '/', waits for it to activate
 *  PROD – uses VitePWA's Workbox sw.js (already contains the push listener)
 *
 * Backend contract (new endpoints):
 *  POST   /api/v1/push/register/   { endpoint, p256dh, auth, device_type }
 *  DELETE /api/v1/push/unregister/ { endpoint }
 *
 * Foreground messages:
 *  Service worker posts { type: 'PUSH_MESSAGE', data: {...} } to all clients.
 *  onForegroundMessage() wraps that postMessage as an observable callback.
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const STORAGE_KEY      = 'pushSubscription'; // JSON: { endpoint, p256dh, auth }

// ── Device helpers ────────────────────────────────────────────────────────────

function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isStandalonePWA() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

// ── Public: status ────────────────────────────────────────────────────────────

/**
 * Returns the current notification capability state for the UI.
 * @returns {{ supported: boolean, permission: string, isIOS: boolean, isPWA: boolean, canRequest: boolean }}
 */
export function getNotificationStatus() {
  const supported  = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  const permission = supported ? Notification.permission : 'unsupported';
  const ios        = isIOSDevice();
  const pwa        = isStandalonePWA();
  const canRequest =
    supported &&
    permission !== 'denied' &&
    permission !== 'granted' &&
    (!ios || pwa);
  return { supported, permission, isIOS: ios, isPWA: pwa, canRequest };
}

// ── VAPID key conversion ──────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  const output  = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function arrayBufferToBase64url(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ── Service worker resolution ─────────────────────────────────────────────────

async function getPushServiceWorker() {
  if (import.meta.env.DEV) {
    // Unregister any leftover legacy firebase-messaging-sw.js
    const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
    for (const r of regs) {
      const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || '';
      if (url.includes('firebase-messaging-sw')) {
        await r.unregister().catch(() => {});
      }
    }

    const reg = await navigator.serviceWorker.register('/push-sw.js', { scope: '/' });
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
          reject(new Error('Push SW install failed — check browser console'));
        }
      });
    });
  }

  // PROD: VitePWA's sw.js is active; also clean up any legacy firebase-messaging-sw.js
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    let swReg  = null;
    for (const r of regs) {
      const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || '';
      if (url.includes('firebase-messaging-sw')) {
        await r.unregister().catch(() => {});
      } else if (url.includes('sw.js')) {
        swReg = r;
      }
    }
    if (swReg) return swReg;
  } catch (err) {
    console.warn('[Push] SW scan error:', err);
  }

  return navigator.serviceWorker.ready;
}

// ── Subscription lifecycle ────────────────────────────────────────────────────

async function getOrCreateSubscription(swReg) {
  const existing = await swReg.pushManager.getSubscription();
  if (existing) return existing;

  return swReg.pushManager.subscribe({
    userVisibleOnly:      true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
}

async function registerSubscriptionWithBackend(sub, authToken) {
  const p256dh   = arrayBufferToBase64url(sub.getKey('p256dh'));
  const auth     = arrayBufferToBase64url(sub.getKey('auth'));
  const cacheKey = JSON.stringify({ endpoint: sub.endpoint, p256dh, auth });

  if (localStorage.getItem(STORAGE_KEY) === cacheKey) return;

  const { API_PUSH_REGISTER } = await import('../config/api.js');
  const res = await fetch(API_PUSH_REGISTER, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${authToken}`,
    },
    body: JSON.stringify({ endpoint: sub.endpoint, p256dh, auth, device_type: 'web' }),
  });

  if (res.ok) localStorage.setItem(STORAGE_KEY, cacheKey);
}

async function acquireAndRegisterSubscription(authToken) {
  const swReg = await getPushServiceWorker();

  try {
    const sub = await getOrCreateSubscription(swReg);
    if (sub) {
      await registerSubscriptionWithBackend(sub, authToken);
      return sub;
    }
  } catch {
    // fall through to recovery
  }

  // Recovery: drop stale subscription and re-subscribe
  try {
    const stale = await swReg.pushManager.getSubscription();
    if (stale) await stale.unsubscribe().catch(() => {});

    const sub = await swReg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    if (!sub) return null;
    await registerSubscriptionWithBackend(sub, authToken);
    return sub;
  } catch (err) {
    console.warn('[Push] Subscription recovery failed:', err.message);
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Silently registers the push subscription if permission is already 'granted'.
 * Safe to call on page load — never prompts the user.
 *
 * @param {string} authToken — Django auth token
 * @returns {Promise<PushSubscription|null>}
 */
export async function registerExistingPermission(authToken) {
  if (!authToken) return null;
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    return await acquireAndRegisterSubscription(authToken);
  } catch (err) {
    console.warn('[Push] Silent registration failed:', err.message);
    return null;
  }
}

/**
 * Prompts the user for notification permission and registers the push subscription.
 *
 * ⚠️  MUST be called from a user-initiated event (button click, tap).
 *
 * @param {string} authToken — Django auth token
 * @returns {Promise<{ success: boolean, token?: string, reason?: string }>}
 */
export async function requestNotificationPermission(authToken) {
  if (!authToken) return { success: false, reason: 'no_auth' };

  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, reason: 'unsupported' };
  }

  if (isIOSDevice() && !isStandalonePWA()) {
    return { success: false, reason: 'ios_not_pwa' };
  }

  if (Notification.permission === 'denied') {
    return { success: false, reason: 'denied' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { success: false, reason: 'dismissed' };

    const sub = await acquireAndRegisterSubscription(authToken);
    if (!sub) return { success: false, reason: 'token_failed' };

    return { success: true, token: sub.endpoint };
  } catch (err) {
    console.warn('[Push] Permission request failed:', err.message);
    return { success: false, reason: 'error', message: err.message };
  }
}

/**
 * Unregisters the push subscription from the backend and clears local storage.
 *
 * @param {string} authToken — Django auth token
 */
export async function unregisterNotificationToken(authToken) {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (!cached || !authToken) return;

  let endpoint;
  try {
    endpoint = JSON.parse(cached).endpoint;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  // Also unsubscribe from the push manager so the subscription is truly gone
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      const sub = await reg.pushManager.getSubscription().catch(() => null);
      if (sub && sub.endpoint === endpoint) await sub.unsubscribe().catch(() => {});
    }
  } catch {
    // non-fatal
  }

  try {
    const { API_PUSH_UNREGISTER } = await import('../config/api.js');
    await fetch(API_PUSH_UNREGISTER, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${authToken}`,
      },
      body: JSON.stringify({ endpoint }),
    });
  } catch {
    // Backend will expire the stale subscription eventually.
  }

  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Closes all pending OS-level notifications in the browser notification center.
 * Call this on page load so that background notifications vanish once the user opens the app.
 */
export async function clearOSNotifications() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      if (reg.active) {
        reg.active.postMessage({ type: 'CLEAR_NOTIFICATIONS' });
      }
    }
  } catch {
    // non-fatal
  }
}

/**
 * Subscribes to foreground push messages forwarded by the service worker via postMessage.
 *
 * The service worker sends { type: 'PUSH_MESSAGE', data: { title, body, type, click_url, ... } }
 * to all focused clients instead of showing a native notification.
 *
 * Returns an unsubscribe function — call it in useEffect cleanup.
 *
 * @param {(payload: { data: object }) => void} callback
 * @returns {() => void}
 */
export function onForegroundMessage(callback) {
  if (!('serviceWorker' in navigator)) return () => {};

  const handler = (event) => {
    if (event.data?.type === 'PUSH_MESSAGE') {
      // Wrap in { data } to match the shape callers expect from the old Firebase payload
      callback({ data: event.data.data });
    }
  };

  navigator.serviceWorker.addEventListener('message', handler);
  return () => navigator.serviceWorker.removeEventListener('message', handler);
}
