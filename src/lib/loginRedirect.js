/**
 * loginRedirect — "send me back where I was trying to go" after signing in.
 *
 * A logged-out visitor who hits a protected page (via ProtectedRoute) or taps
 * a protected link on a public page (e.g. a member card on /home) is sent to
 * /login with the intended path stashed here. On successful login — password
 * OR Google OAuth — we pop it and navigate there instead of the dashboard.
 *
 * Routing is prefix-free (useBasePath() returns ""), so the destination is
 * just a plain path like "/members/johndoe". The old code re-prefixed it with
 * the role ("/alumni/members/johndoe"), which no longer resolves and silently
 * dumped everyone on /dashboard — that's the bug this replaces.
 *
 * sessionStorage (not React state) because the OAuth flow leaves the SPA and
 * comes back on a fresh page load; same-origin sessionStorage survives that.
 */
const KEY = "login_redirect_to";
// Written by an older build; cleared so a stale value can't hijack a redirect.
const LEGACY_KEY = "login_redirect_relative";

const AUTH_PATHS = ["/login", "/signup", "/oauth-signup", "/oauth/complete"];

/** Stash the location the user was denied. Accepts a react-router location or {pathname,search,hash}. */
export function saveLoginRedirect(from) {
  if (!from?.pathname) return;
  if (AUTH_PATHS.includes(from.pathname)) return; // never bounce back to an auth page
  const path = from.pathname + (from.search || "") + (from.hash || "");
  try {
    sessionStorage.setItem(KEY, path);
  } catch { /* private mode / quota */ }
}

/** Only ever redirect to an in-app path — never an absolute/protocol-relative URL. */
function safePath(path) {
  return path && path.startsWith("/") && !path.startsWith("//") ? path : null;
}

/**
 * Read the stashed destination WITHOUT clearing it. Use this anywhere that
 * reads during render (e.g. AuthRedirect) — React StrictMode double-renders in
 * dev, and a destructive read there would consume the target on the first pass
 * and return null on the second, silently losing it. AnimatedRoutes clears the
 * key once the user actually lands on a non-auth page.
 */
export function peekLoginRedirect() {
  try {
    return safePath(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}

/** Pop the stashed destination (single-use). Safe to call from an event handler. */
export function consumeLoginRedirect() {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(LEGACY_KEY);
    return safePath(path);
  } catch {
    return null;
  }
}

export const DEFAULT_AFTER_LOGIN = "/dashboard";
