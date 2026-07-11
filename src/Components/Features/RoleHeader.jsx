/**
 * RoleHeader — one header for every role dashboard.
 *
 * Nav items come from the shared ROUTE_MANIFEST, filtered by the caller's RBAC
 * permissions (Redux permissions slice). Paths are prefixed with the current role base
 * (/admin | /staff | /alumni) so the same header works everywhere. Emerald
 * theme preserved from the original per-role headers.
 */
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt, faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import Logo from "../../assets/KAHEAA.svg";
import { performLogout } from "../../lib/logout.js";
import NotificationBell from "../Shared/NotificationBell.jsx";
import { useBasePath } from "../../lib/useBasePath";
import { ROUTE_MANIFEST } from "./routeManifest.jsx";

export default function RoleHeader({ baseOverride }) {
  // On role dashboards the base comes from the URL; on public pages (e.g.
  // /contact) a logged-in viewer's role base is passed explicitly.
  const urlBase = useBasePath();
  const base = baseOverride || urlBase;
  const permissions = useSelector((s) => s.permissions.permissions);
  const [pathname, setPathname] = useState(window.location.pathname);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const onNav = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onNav);
    return () => window.removeEventListener("popstate", onNav);
  }, []);

  const handleLogout = async () => { await performLogout(); };

  // Build nav from the manifest: only entries with a nav block, and only those
  // the caller is permitted to see. Paths are role-base-prefixed.
  const navItems = ROUTE_MANIFEST
    .filter((r) => r.nav && (!r.permission || permissions.includes(r.permission)))
    .map((r) => ({ path: `${base}/${r.path}`, label: r.nav.label, icon: r.nav.icon }));

  const mobileBottomItems = navItems.slice(0, 5);
  const isActive = (p) => pathname === p || pathname === `${p}/`;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 h-14 flex items-center justify-between">
          <a href={`${base}/dashboard`} className="flex items-center">
            <img src={Logo} alt="KAHEAA" className="h-10 sm:h-12 w-auto max-w-[170px] sm:max-w-[210px] object-contain" />
          </a>

          <div className="hidden lg:flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                title={item.label}
                className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-200 group ${
                  isActive(item.path) ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:bg-gray-50 hover:text-emerald-600"
                }`}
              >
                <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                {isActive(item.path) && <div className="w-1 h-1 bg-emerald-500 rounded-full mt-0.5" />}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              onClick={handleLogout}
              title="Logout"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              <span className="text-xs font-medium">Logout</span>
            </button>
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-all"
              aria-label="Open menu"
            >
              <FontAwesomeIcon icon={isMobileOpen ? faTimes : faBars} className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isMobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 py-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {navItems.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-center transition-all ${
                    isActive(item.path) ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </a>
              ))}
              <button
                onClick={handleLogout}
                className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="h-5 w-5" />
                <span className="text-xs font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-center justify-around h-14 px-2">
          {mobileBottomItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive(item.path) ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className={`h-6 w-6 ${isActive(item.path) ? "scale-110" : ""} transition-transform`} />
              {isActive(item.path) && <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1" />}
            </a>
          ))}
        </div>
      </nav>

      <div className="h-14" />

      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setIsMobileOpen(false)} aria-hidden="true" />
      )}
    </>
  );
}
