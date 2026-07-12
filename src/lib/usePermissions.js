/**
 * usePermissions — read the caller's EFFECTIVE RBAC permission set for UI gating.
 *
 * The set is the same live source the backend enforces: seeded at login,
 * fetched on boot, and polled (permissions Redux slice / App.jsx). Gate every
 * action control on the exact permission codename the backend checks — never
 * on role or is_staff. If a permission is revoked, the control must disappear
 * on the next permission refresh (and immediately on hard refresh), matching
 * the backend's 403.
 *
 *   const { has } = usePermissions();
 *   {has("news.delete_any") && <DeleteButton />}
 *
 * Owner-owned content is separate: a user may always edit/delete their OWN
 * item regardless of the *.edit_any / *.delete_any permission (those gate
 * acting on OTHER people's content). Compose: has("x.delete_any") || isOwner.
 */
import { useSelector } from "react-redux";

export function usePermissions() {
  const permissions = useSelector((s) => s.permissions.permissions);
  return {
    permissions,
    has: (codename) => permissions.includes(codename),
    hasAny: (list = []) => list.some((c) => permissions.includes(c)),
    hasAll: (list = []) => list.every((c) => permissions.includes(c)),
  };
}

export default usePermissions;
