/**
 * Central auth accessors.
 *
 * The real credential now lives in an httpOnly `auth_token` cookie, set by
 * the backend on every login response (api/tokens.py::attach_auth_cookie)
 * and sent automatically by the browser on every request (see
 * lib/axiosInstance.js — withCredentials + CSRF header wiring). That's the
 * mechanism ~10 call sites (NotificationProvider, webpush, logout, Chat,
 * Map, EngagementPanel, the Redux slices, permissionsSlice, App.jsx) were
 * migrated to rely on exclusively during this same pass.
 *
 * getToken()/setToken() below still ALSO mirror the JWT into localStorage's
 * "Token" key, purely for backward compatibility: 60+ other components
 * across the app (Members, Events, Albums, Business, Post, Profile, Audit,
 * etc.) still read that key directly to build their own Authorization
 * headers, and migrating all of them is a separate, larger pass that needs
 * real browser testing, not something to do blind in the same sitting.
 * Do not remove this dual-write until every one of those call sites is
 * migrated to cookie-based auth — removing it before then silently breaks
 * data-fetching across most of the app (they'd send `Authorization: Token
 * null` / find no token and bail, not fall back to the cookie).
 */

const TOKEN_KEY = 'Token';
const ROLE_KEY = 'Role';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function setRole(role) {
  if (role) localStorage.setItem(ROLE_KEY, role);
  else localStorage.removeItem(ROLE_KEY);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}

/** True if the string looks like a three-segment JWT. */
function isJwt(token) {
  return typeof token === 'string' && token.split('.').length === 3;
}

/**
 * Authorization header value for the mirrored localStorage credential —
 * still needed by the 60+ not-yet-migrated call sites; the ~10 migrated
 * ones no longer call this at all (cookie handles them).
 *   JWT   → "Bearer <jwt>"
 *   token → "Token <key>"   (legacy sessions)
 */
export function authHeader() {
  const token = getToken();
  if (!token) return null;
  return isJwt(token) ? `Bearer ${token}` : `Token ${token}`;
}

/**
 * Record a successful login/OAuth response. The backend already set the
 * httpOnly cookie on the same response; this mirrors the JWT into
 * localStorage too (see file header) and caches the role for UI gating.
 * Prefers `data.role` (present on every login payload); `roleKey` is an
 * optional caller-supplied fallback. Returns false if no credential/role
 * could be determined.
 */
export function storeLoginCredential(data, roleKey) {
  const credential = data?.jwt || data?.token;
  const role = data?.role || roleKey;
  if (!credential && !role) return false;
  if (credential) setToken(credential);
  if (role) setRole(role);
  return true;
}
