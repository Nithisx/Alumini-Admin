/**
 * performLogout — shared logout utility used by all three header components.
 *
 * Sequence (order matters):
 *  1. Read the push endpoint from the user-scoped cache BEFORE clearing anything.
 *  2. POST /api/v1/logout/ with the endpoint — backend atomically deactivates the
 *     subscription AND invalidates the DRF auth token in a single round-trip.
 *     This is the reliable path even when the browser-level unsubscribe races.
 *  3. Best-effort browser-level cleanup (unsubscribes the service worker subscription
 *     so the browser push service stops delivering to this endpoint).
 *  4. Clear localStorage and redirect.
 */

import { toast } from 'react-toastify';
import { getCachedEndpoint, unregisterNotificationToken } from './webpush.js';
import { API_LOGOUT } from '../config/api.js';

export async function performLogout() {
  const token    = localStorage.getItem('Token');
  const endpoint = getCachedEndpoint(token);

  // ── 1. Atomic backend cleanup ─────────────────────────────────────────────
  // Call /logout/ with the push endpoint so the server deactivates just this
  // device's subscription and deletes the auth token, regardless of whether
  // the async browser cleanup below completes in time.
  try {
    await fetch(API_LOGOUT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      body: JSON.stringify(endpoint ? { endpoint } : {}),
    });
  } catch {
    // Non-fatal: continue with local cleanup even if network is down.
  }

  // ── 2. Browser-level push unsubscribe (best-effort) ───────────────────────
  // This removes the subscription from the browser's push manager so no further
  // native notifications arrive on this device. Fire-and-forget is acceptable
  // here because step 1 already handled the backend side.
  if (token) {
    unregisterNotificationToken(token).catch(() => {});
  }

  // ── 3. Clear local session ────────────────────────────────────────────────
  localStorage.removeItem('Token');
  localStorage.removeItem('Role');

  toast.success('Logged out successfully!');
  setTimeout(() => { window.location.href = '/login'; }, 800);
}
