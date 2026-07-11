/**
 * Central auth-token accessors + JWT role decoding.
 *
 * Storage keys (unchanged from legacy so existing sessions survive):
 *   "Token" — the credential. Now a JWT when the backend issued one at login;
 *             a legacy DRF token for sessions predating the JWT rollout.
 *
 * The role is DECODED from the JWT payload — it is not stored as a separate
 * localStorage key (that key is deprecated). Legacy DRF tokens are opaque, so
 * for those we fall back to the cached role written at login.
 */

const TOKEN_KEY = 'Token';
// Deprecated but still read as a fallback for pre-JWT (legacy token) sessions.
const LEGACY_ROLE_KEY = 'Role';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_ROLE_KEY);
}

/**
 * Persist the credential from a login/OAuth response. Prefers the JWT (whose
 * payload carries the role) and falls back to the legacy DRF token. The
 * optional roleKey is written under the deprecated "Role" key purely so
 * legacy-token sessions (no JWT) can still resolve a role.
 */
export function storeLoginCredential(data, roleKey) {
  const credential = data?.jwt || data?.token;
  if (!credential) return false;
  localStorage.setItem(TOKEN_KEY, credential);
  if (roleKey) localStorage.setItem(LEGACY_ROLE_KEY, roleKey);
  return true;
}

/** True if the string looks like a three-segment JWT. */
function isJwt(token) {
  return typeof token === 'string' && token.split('.').length === 3;
}

/** Decode a JWT payload without verifying (verification is server-side). */
export function decodeJwtPayload(token) {
  try {
    const part = token.split('.')[1];
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

/**
 * Authorization header value for the stored credential:
 *   JWT   → "Bearer <jwt>"
 *   token → "Token <key>"   (legacy sessions)
 */
export function authHeader() {
  const token = getToken();
  if (!token) return null;
  return isJwt(token) ? `Bearer ${token}` : `Token ${token}`;
}

/**
 * The user's role. Prefers the JWT payload; falls back to the legacy "Role"
 * key for opaque-token sessions. Returned verbatim from the backend
 * ("Admin" | "Manager" | "Moderator" | "Staff" | "Alumni" | "Student").
 */
export function getRole() {
  const token = getToken();
  if (isJwt(token)) {
    const payload = decodeJwtPayload(token);
    if (payload?.role) return payload.role;
  }
  return localStorage.getItem(LEGACY_ROLE_KEY) || null;
}
