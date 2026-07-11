/**
 * useBasePath — legacy route-base accessor, kept as a no-op shim.
 *
 * Routes are now a single prefix-free tree (no /admin, /staff, /alumni split) —
 * every user sees the same URLs, gated by RBAC permissions instead of a URL
 * prefix. This always returns "" so the ~28 existing call sites that build
 * paths as `${base}/members` etc. keep working unchanged, now resolving to
 * plain `/members`.
 */
import { useLocation } from 'react-router-dom';

export function basePathFromPath() {
  return '';
}

export function useBasePath() {
  // eslint-disable-next-line no-unused-vars
  useLocation();
  return '';
}

/**
 * Non-hook accessor — see useBasePath above. Kept for call sites outside
 * component render scope (event handlers, module-level helpers).
 */
export function roleBase() {
  return '';
}
