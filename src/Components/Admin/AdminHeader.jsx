import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAlt,
  faCalendarCheck,
  faPhotoFilm,
  faSignOutAlt,
  faBars,
  faTimes,
  faShield,
  faNewspaper,
  faIdBadge,
  faBirthdayCake,
  faBriefcase,
  faBuilding,
  faUser,
  faHandHoldingHeart,
  faComments,
  faClipboardList
} from "@fortawesome/free-solid-svg-icons";
import Logo from "../../images/logo.png";

export default function AdminHeader() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleLocationChange = () => setPathname(window.location.pathname);

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // Authentication check useEffect
  useEffect(() => {
    const isRegisterPage = pathname.includes('/register-request') || pathname.includes('/admin/register-request');

    const checkAuthStatus = () => {
      const token = localStorage.getItem('Token');
      const role = localStorage.getItem('Role');

      if (isRegisterPage) {
        if (token && role && role !== 'admin' && role !== 'superuser') {
          localStorage.removeItem('Token');
          localStorage.removeItem('Role');
          window.location.href = '/login';
        }
        return;
      }

      if (!token) {
        window.location.href = '/login';
        return;
      }

      if (role && role !== 'admin' && role !== 'superuser') {
        localStorage.removeItem('Token');
        localStorage.removeItem('Role');
        window.location.href = '/login';
      }
    };

    checkAuthStatus();

    // Periodic token validation (every 5 minutes) via a lightweight profile ping
    let tokenCheckInterval;
    if (!isRegisterPage) {
      const validateToken = async () => {
        const token = localStorage.getItem('Token');
        if (!token) return;
        try {
          const response = await fetch('https://api.karpagamalumni.in/api/v1/validate-token/', {
            method: 'GET',
            headers: { 'Authorization': `Token ${token}` },
          });
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('Token');
            localStorage.removeItem('Role');
            window.location.href = '/login';
          }
        } catch {
          // Network error — keep session alive, don't log out
        }
      };
      tokenCheckInterval = setInterval(validateToken, 5 * 60 * 1000);
    }

    return () => {
      if (tokenCheckInterval) clearInterval(tokenCheckInterval);
    };
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("Token");
    localStorage.removeItem("Role");
    toast.success("Logged out successfully!");
    setTimeout(() => {
      window.location.href = "/login";
    }, 800);
  };

  const navItems = [
    {
      path: "/admin/dashboard",
      icon: faFileAlt,
      label: "Home",
    },
    {
      path: "/admin/event",
      icon: faCalendarCheck,
      label: "Events",
    },
    {
      path: "/admin/jobs",
      icon: faBriefcase,
      label: "Jobs",
    },
    {
      path: "/admin/albums",
      icon: faPhotoFilm,
      label: "Albums",
    },
    {
      path: "/admin/news",
      icon: faNewspaper,
      label: "News",
    },
    {
      path: "/admin/members",
      icon: faIdBadge,
      label: "Members",
    },
    {
      path: "/admin/birthday",
      icon: faBirthdayCake,
      label: "Birthdays",
    },
    {
      path: "/admin/business",
      icon: faBuilding,
      label: "Business",
    },
    {
      path: "/admin/my-profile",
      icon: faUser,
      label: "Profile",
    },
    {
      path: "/admin/my-contribution",
      icon: faHandHoldingHeart,
      label: "Contribute",
    },
    {
      path: "/admin/register-request",
      icon: faShield,
      label: "Requests",
    },
    {
      path: "/admin/chat",
      icon: faComments,
      label: "Chat",
    },
    {
      path: "/admin/audit",
      icon: faClipboardList,
      label: "Audit",
    },
  ];

  const mobileBottomItems = navItems.slice(0, 5);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 h-14 flex items-center justify-between">
          <a href="/admin/dashboard" className="flex items-center gap-2">
            <img src={Logo} alt="KAHEAA" className="h-8 w-8 rounded-full ring-2 ring-emerald-300 object-cover" />
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent hidden sm:block">
              KAHEAA
            </span>
          </a>

          <div className="hidden lg:flex items-center gap-1 overflow-x-auto">
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
                {pathname === item.path && <div className="w-1 h-1 bg-emerald-500 rounded-full mt-0.5" />}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
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
                    pathname === item.path ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:bg-gray-50"
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
                pathname === item.path ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              <FontAwesomeIcon
                icon={item.icon}
                className={`h-6 w-6 ${pathname === item.path ? "scale-110" : ""} transition-transform`}
              />
              {pathname === item.path && <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1" />}
            </a>
          ))}
        </div>
      </nav>

      <div className="h-14" />

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}