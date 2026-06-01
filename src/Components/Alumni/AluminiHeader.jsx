import { useState, useEffect } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAlt, faCalendarCheck, faPhotoFilm, faSignOutAlt,
  faNewspaper, faIdBadge, faBirthdayCake, faBriefcase,
  faBuilding, faUser, faHandHoldingHeart, faComments, faBars, faTimes,
} from "@fortawesome/free-solid-svg-icons";
import Logo from "../../assets/KAHEAA.svg";
import NotificationBell from "../Shared/NotificationBell.jsx";
import { performLogout } from "../../lib/logout.js";

export default function AlumniHeader() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleLocationChange = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  const handleLogout = performLogout;

  const navItems = [
    { path: "/alumni/dashboard", icon: faFileAlt, label: "Home" },
    { path: "/alumni/event", icon: faCalendarCheck, label: "Events" },
    { path: "/alumni/jobs", icon: faBriefcase, label: "Jobs" },
    { path: "/alumni/albums", icon: faPhotoFilm, label: "Albums" },
    { path: "/alumni/news", icon: faNewspaper, label: "News" },
    { path: "/alumni/members", icon: faIdBadge, label: "Members" },
    { path: "/alumni/birthday", icon: faBirthdayCake, label: "Birthdays" },
    { path: "/alumni/business", icon: faBuilding, label: "Business" },
    { path: "/alumni/my-profile", icon: faUser, label: "Profile" },
    { path: "/alumni/my-contribution", icon: faHandHoldingHeart, label: "My Uploads" },
    { path: "/alumni/chat", icon: faComments, label: "Chat" },
  ];

  const mobileBottomItems = navItems.slice(0, 5);

  return (
    <>
      {/* ── Instagram-style top bar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 h-14 flex items-center justify-between">
          <a href="/alumni/dashboard" className="flex items-center">
            <img src={Logo} alt="KAHEAA" className="h-10 sm:h-12 w-auto max-w-[170px] sm:max-w-[210px] object-contain" />
          </a>

          {/* Desktop nav icons (hidden < lg) */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                title={item.label}
                className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-200 group ${
                  pathname === item.path
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-500 hover:bg-gray-50 hover:text-emerald-600"
                }`}
              >
                <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                {pathname === item.path && (
                  <div className="w-1 h-1 bg-emerald-500 rounded-full mt-0.5" />
                )}
              </a>
            ))}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Logout (desktop) */}
            <button
              onClick={handleLogout}
              title="Logout"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              <span className="text-xs font-medium">Logout</span>
            </button>

            {/* Hamburger (tablet) */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-all"
              aria-label="Open menu"
            >
              <FontAwesomeIcon icon={isMobileOpen ? faTimes : faBars} className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tablet/mobile slide-down menu */}
        {isMobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 py-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {navItems.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-center transition-all ${
                    pathname === item.path
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-50"
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

      {/* ── Instagram-style bottom nav (mobile only, < lg) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom lg:hidden">
        <div className="flex items-center justify-around h-14 px-2">
          {mobileBottomItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                pathname === item.path ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              <FontAwesomeIcon
                icon={item.icon}
                className={`h-6 w-6 ${pathname === item.path ? "scale-110" : ""} transition-transform`}
              />
              {pathname === item.path && (
                <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1" />
              )}
            </a>
          ))}
        </div>
      </nav>

      {/* Spacer for fixed top bar */}
      <div className="h-14" />

      {/* Backdrop for mobile menu */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
