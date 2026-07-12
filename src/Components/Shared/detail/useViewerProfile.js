import { useEffect, useState } from "react";
import { usePermissions } from "../../../lib/usePermissions";
import { API_BASE } from "./media";

/**
 * Signed-in viewer context for detail views + the moderation capabilities each
 * one needs — now derived from the EFFECTIVE PERMISSION SET, not from role /
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
 */
export default function useViewerProfile(domain) {
  const [profile, setProfile] = useState({ currentUserId: null, role: "" });
  const { permissions } = usePermissions();

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/profile/`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setProfile({ currentUserId: d.id ?? null, role: (d.role || "").toLowerCase() });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

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
