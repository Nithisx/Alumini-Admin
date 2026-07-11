/**
 * usePermissionsPolling — live propagation of RBAC permission-matrix edits.
 *
 * Admin can grant/revoke a permission (role-wide or per-user) at any time;
 * this hook re-fetches the caller's effective set from GET /me/permissions/
 * every 5 minutes so nav items / <Can>-gated UI update without requiring a
 * logout/login. The Redux state update (and therefore the UI reacting) is
 * already handled by fetchPermissions.fulfilled in permissionsSlice — this
 * hook only adds the interval trigger plus a silent diff that surfaces a
 * toast when something actually changed (never on an unchanged poll).
 */
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchPermissions, selectPermissions } from "../store/permissionsSlice";
import { getToken } from "./authToken";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export default function usePermissionsPolling() {
  const dispatch = useDispatch();
  const permissions = useSelector(selectPermissions);
  // Kept in a ref so the interval callback always reads the latest Redux
  // value without needing to re-create the interval on every change.
  const permissionsRef = useRef(permissions);
  permissionsRef.current = permissions;

  useEffect(() => {
    // Only poll while authenticated — never hit /me/permissions/ on public pages.
    if (!getToken()) return undefined;

    const interval = setInterval(async () => {
      if (!getToken()) return; // logged out since the last tick — skip silently
      const before = [...permissionsRef.current].sort();
      const action = await dispatch(fetchPermissions());
      if (fetchPermissions.fulfilled.match(action)) {
        const after = [...(action.payload.permissions || [])].sort();
        const changed =
          before.length !== after.length || before.some((c, i) => c !== after[i]);
        if (changed) {
          toast.info("Your permissions were updated.");
        }
      }
      // Silent on rejection (e.g. transient network error) and on no-change.
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [dispatch]);
}
