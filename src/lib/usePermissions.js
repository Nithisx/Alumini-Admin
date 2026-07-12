/**
 * usePermissions — the caller's EFFECTIVE RBAC permission set, for UI gating.
 *
 * Backed by the MobX PermissionStore (stores/permissions/) — the same live set
 * the backend enforces: seeded at login, fetched on boot, re-polled so an
 * admin's matrix edit appears without a re-login.
 *
 * Gate every action control on the exact permission codename the backend checks
 * — never on role or is_staff. When a permission is revoked the control must
 * disappear, matching the backend's 403.
 *
 *   const { has } = usePermissions();
 *   {has("news.delete_any") && <DeleteButton />}
 *
 * Owner-owned content is separate: a user may always edit/delete their OWN item
 * regardless of *.edit_any / *.delete_any (those gate acting on OTHER people's
 * content). Compose: has("x.delete_any") || isOwner.
 *
 * WHY THE autorun — this is the crux of the Redux→MobX swap. Redux's useSelector
 * subscribes a component automatically; simply READING a MobX observable from a
 * plain function component does NOT. Without this bridge every consumer would
 * render once with an empty set and never update when permissions arrive,
 * silently hiding every gated control. Mirroring the observable into React state
 * here keeps all ~19 consumers reactive without wrapping each one in observer().
 */
import { useEffect, useState } from "react";
import { autorun } from "mobx";
import { usePermissionStore } from "../stores";

export function usePermissions() {
  const store = usePermissionStore();
  const [snapshot, setSnapshot] = useState(() => ({
    permissions: store.permissions.slice(),
    loaded: store.loaded,
  }));

  useEffect(
    () =>
      // Touching the observables inside autorun is what subscribes us to them.
      autorun(() => {
        setSnapshot({
          permissions: store.permissions.slice(),
          loaded: store.loaded,
        });
      }),
    [store]
  );

  const { permissions, loaded } = snapshot;

  return {
    permissions,
    loaded,
    has: (codename) => permissions.includes(codename),
    hasAny: (list = []) => list.some((c) => permissions.includes(c)),
    hasAll: (list = []) => list.every((c) => permissions.includes(c)),
  };
}

export default usePermissions;
