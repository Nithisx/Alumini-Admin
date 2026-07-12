import { useEffect, useState } from "react";
import { autorun } from "mobx";
import { usePermissions } from "../../../lib/usePermissions";
import { useProfileStore } from "../../../stores";

/**
 * Signed-in viewer context for detail views + the moderation capabilities each
 * one needs — derived from the EFFECTIVE PERMISSION SET, not from role /
 * is_staff. Revoking, say, `news.delete_any` from a role must hide that role's
 * delete button (the backend already 403s it); gating on role left the button
 * visible, which was the bug this fixes.
 *
 * Pass the content domain to scope the capability flags:
 *   const { currentUserId, canEditAny, canDeleteAny, canModerateComments } =
 *     useViewerProfile("news");
 *
 * Returns:
 *   currentUserId        — for owner checks (own content is always editable)
 *   role                 — kept for display only, NEVER gate on it
 *   has(codename)        — arbitrary permission check
 *   canEditAny           — {domain}.edit_any   (edit OTHERS' content)
 *   canDeleteAny         — {domain}.delete_any (delete OTHERS' content)
 *   canModerateComments  — {domain}.moderate_comments
 *   canModerate          — any of the above (back-compat coarse flag)
 *   isAdmin              — rbac.manage (admin-panel capability)
 *
 * The profile comes from ProfileStore (fetched once per session, not once per
 * detail view). Reading a MobX observable does not subscribe a plain component,
 * so it's bridged into React state with autorun — same pattern as usePermissions.
 */
export default function useViewerProfile(domain) {
  const profileStore = useProfileStore();
  const { permissions } = usePermissions();

  const [profile, setProfile] = useState(() => ({
    currentUserId: profileStore.currentUserId,
    role: profileStore.role,
  }));

  useEffect(() => {
    profileStore.load();
    return autorun(() => {
      setProfile({ currentUserId: profileStore.currentUserId, role: profileStore.role });
    });
  }, [profileStore]);

  const has = (codename) => permissions.includes(codename);
  const canEditAny = domain ? has(`${domain}.edit_any`) : false;
  const canDeleteAny = domain ? has(`${domain}.delete_any`) : false;
  const canModerateComments = domain ? has(`${domain}.moderate_comments`) : false;
  const canModerate = canEditAny || canDeleteAny || canModerateComments;

  return {
    ...profile,
    permissions,
    has,
    canEditAny,
    canDeleteAny,
    canModerateComments,
    canModerate,
    isAdmin: has("rbac.manage"),
  };
}
