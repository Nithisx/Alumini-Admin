/**
 * RoleLayout — one layout for every role dashboard (replaces the former
 * AdminLayout / StaffLayout / AlumniLayout).
 *
 * Mounted under /admin, /staff and /alumni. Routes come from the shared
 * ROUTE_MANIFEST; a route with a `permission` is guarded — a user lacking it is
 * redirected to their dashboard (the backend enforces it regardless). Detail
 * views receive the current role base via their element factory.
 *
 * Permissions come from the MobX PermissionStore (stores/permissions); nav is rendered by
 * RoleHeader.
 */
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { usePermissions } from "../../lib/usePermissions";
import PageTransition from "../Shared/PageTransition";
import Breadcrumb from "../Shared/Breadcrumb";
import { BreadcrumbProvider } from "../Shared/BreadcrumbContext";
import { NotificationProvider } from "../Shared/NotificationProvider.jsx";
import NotificationPromptModal from "../Shared/NotificationPromptModal.jsx";
import RoleHeader from "./RoleHeader";
import { useBasePath } from "../../lib/useBasePath";
import { ROUTE_MANIFEST } from "./routeManifest.jsx";

function GuardedElement({ entry, base }) {
  const { permissions, loaded } = usePermissions();

  // Wait for permissions before deciding, to avoid a flash-redirect on reload.
  if (entry.permission && loaded && !permissions.includes(entry.permission)) {
    return <Navigate to={`${base}/dashboard`} replace />;
  }
  // `factory` entries are element builders that need the role base
  // (detail views: (base) => <View basePath={base} />). Everything else is a
  // plain component.
  if (entry.factory) return entry.element(base);
  const C = entry.element;
  return <C />;
}

export default function RoleLayout() {
  const location = useLocation();
  const base = useBasePath();

  return (
    <NotificationProvider>
      <NotificationPromptModal />
      <BreadcrumbProvider>
        <div>
          <RoleHeader />
          <main className="role-content w-full min-w-0 p-0 pb-14 lg:pb-0">
            <Breadcrumb />
            <PageTransition transitionKey={location.pathname}>
              <Routes>
                {ROUTE_MANIFEST.map((entry) => (
                  <Route
                    key={entry.path}
                    path={entry.path}
                    element={<GuardedElement entry={entry} base={base} />}
                  />
                ))}
                <Route path="*" element={<Navigate to={`${base}/dashboard`} replace />} />
              </Routes>
            </PageTransition>
          </main>
        </div>
      </BreadcrumbProvider>
    </NotificationProvider>
  );
}
