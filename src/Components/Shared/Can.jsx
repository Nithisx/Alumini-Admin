/**
 * <Can> — declarative RBAC gate for UI (buttons, nav items, sections).
 *
 *   <Can perm="members.export"><ExportButton /></Can>
 *   <Can anyOf={['events.edit_any','events.delete_any']}> … </Can>
 *   <Can perm="audit.view" fallback={<NoAccess />}> … </Can>
 *
 * Reads the effective permission set from the Redux permissions slice, so it
 * re-renders when the set loads or the admin edits the matrix. UX convenience
 * only — the backend always enforces RBAC regardless of what the UI shows.
 */
import { usePermissions } from "../../lib/usePermissions";

export default function Can({ perm, anyOf, allOf, fallback = null, children }) {
  const { permissions } = usePermissions();
  let allowed = true;
  if (perm) allowed = permissions.includes(perm);
  else if (anyOf) allowed = anyOf.some((c) => permissions.includes(c));
  else if (allOf) allowed = allOf.every((c) => permissions.includes(c));
  return allowed ? children : fallback;
}

export { Can };
