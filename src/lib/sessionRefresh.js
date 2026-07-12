/**
 * sessionRefresh — keeps a 5-minute access token alive without the user noticing.
 *
 * The access token now expires every 5 minutes (T7). When the backend answers
 * 401 with code TOKEN_EXPIRED, we POST /auth/refresh/ — the browser sends the
 * long-lived httpOnly refresh cookie, the backend sets a fresh access cookie and
 * rotates the refresh cookie — and we replay the original request once.
 *
 * SINGLE-FLIGHT is the whole point of this module. A page easily fires a dozen
 * requests at once; if each one kicked off its own refresh, they'd all present
 * the same refresh token and the backend's rotation/reuse-detection would see
 * the 2nd..Nth as REPLAYED STOLEN TOKENS and nuke the session. So concurrent
 * callers all await the SAME in-flight refresh promise.
 *
 * Failure is terminal: if the refresh itself fails, the session is
 * unrecoverable (expired refresh, revoked by logout, reuse detected) — clear
 * local auth and send the user to /login, remembering where they were.
 */
import { API_TOKEN_REFRESH } from "../config/api";
import { clearAuth, getRole } from "./authToken";
import { saveLoginRedirect } from "./loginRedirect";

let inFlight = null;

/**
 * Refresh the session. Concurrent callers share one request.
 * Resolves true on success; false if the session is gone.
 */
export function refreshSession() {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      // Prefer the RAW fetch (installed by lib/axiosInstance.js). The patched
      // one also explicitly skips the /auth/refresh/ 401 path, so either is
      // safe — but going raw keeps this independent of that guard.
      const rawFetch = window.__rawFetch || window.fetch;
      const res = await rawFetch(API_TOKEN_REFRESH, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      return res.ok;
    } catch {
      return false; // offline — treat as "couldn't refresh"
    } finally {
      // Clear on the next tick so callers awaiting this promise all see the
      // same result before a new refresh can start.
      setTimeout(() => { inFlight = null; }, 0);
    }
  })();

  return inFlight;
}

/** Session is unrecoverable — wipe local auth and bounce to login. */
export function endSession() {
  if (!getRole()) return; // already logged out; don't loop
  clearAuth();
  saveLoginRedirect(window.location); // come back here after signing in
  window.location.href = "/login";
}
