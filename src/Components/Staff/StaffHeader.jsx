import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAlt,
  faCalendarCheck,
  faPhotoFilm,
  faMapMarker,
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
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

// Mock logo - replace with actual logo import
import logo from "../../images/logo.png"; // Make sure this path is correct and the file exists

// If the image is not found, try adjusting the path, for example:
// import logo from "../../../images/logo.png";
// or
// import logo from "/src/images/logo.png";
export default function AdminHeader() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    // Note: localStorage not available in artifacts
    console.log("Logout clicked");
    localStorage.removeItem("Token");
    localStorage.removeItem("Role");
    window.location.href = "/login";
  };

  const navItems = [
    {
      path: "/staff/dashboard",
      icon: faFileAlt,
      label: "Dashboard",
      color: "text-blue-600",
    },
    {
      path: "/staff/event",
      icon: faCalendarCheck,
      label: "Events",
      color: "text-purple-600",
    },
    {
      path: "/staff/jobs",
      icon: faBriefcase,
      label: "Jobs",
      color: "text-orange-600",
    },
    {
      path: "/staff/albums",
      icon: faPhotoFilm,
      label: "Albums",
      color: "text-pink-600",
    },
    {
      path: "/staff/news",
      icon: faNewspaper,
      label: "NewsRoom",
      color: "text-red-600",
    },
    {
      path: "/staff/members",
      icon: faIdBadge,
      label: "Members",
      color: "text-indigo-600",
    },
    {
      path: "/staff/birthday",
      icon: faBirthdayCake,
      label: "Birthdays",
      color: "text-yellow-600",
    },
    {
      path: "/staff/business",
      icon: faBuilding,
      label: "Business Directory",
      color: "text-teal-600",
    },
    {
      path: "/staff/my-profile",
      icon: faUser,
      label: "My Profile",
      color: "text-gray-600",
    },
    {
      path: "/staff/my-contribution",
      icon: faHandHoldingHeart,
      label: "My Contribution",
      color: "text-green-600",
    },
  ];

  return (
    <>
      {/* Main Navigation Bar */}
      <nav
        className={`fixed top-0  left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200"
            : "bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border-b border-emerald-100"
        }`}
      >
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left section - Logo */}
            <div className="flex items-center space-x-4">
              <div
                className="relative w-14 h-14 flex-shrink-0 cursor-pointer"
                onClick={() => (window.location.href = "/home")}
                title="Go to Home Page"
              >
                <img
                  src={logo}
                  alt="KAHEAA Logo"
                  className="h-14 w-14 object-cover rounded-full shadow-md ring-2 ring-emerald-200"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div
                className="leading-tight cursor-pointer"
                onClick={() => (window.location.href = "/home")}
                title="Go to Home Page"
              >
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-600 bg-clip-text text-transparent">
                  KAHEAA
                </h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  className={`group relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                    pathname === item.path
                      ? "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 shadow-md"
                      : "text-gray-700 hover:bg-gray-50 hover:text-emerald-600"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className={`h-4 w-4 transition-all duration-300 ${
                      pathname === item.path
                        ? "text-emerald-600"
                        : `${item.color} group-hover:text-emerald-600`
                    }`}
                  />
                  <span className="text-sm font-medium whitespace-nowrap">
                    {item.label}
                  </span>

                  {/* Active indicator */}
                  {pathname === item.path && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                  )}
                </a>
              ))}

              {/* Logout Button */}
              <div className="ml-4 pl-4 border-l border-gray-200">
                <button
                  onClick={handleLogout}
                  className="group flex items-center gap-2 px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300 hover:scale-105"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="h-4 w-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="lg:hidden relative p-3 rounded-xl bg-gradient-to-r from-emerald-100 to-emerald-50 hover:from-emerald-200 hover:to-emerald-100 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <FontAwesomeIcon
                icon={isMobileOpen ? faTimes : faBars}
                className={`h-5 w-5 text-emerald-700 transition-transform duration-300 ${
                  isMobileOpen ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <div
          className={`lg:hidden transition-all duration-300 ease-in-out ${
            isMobileOpen
              ? "max-h-screen opacity-100 bg-white/95 backdrop-blur-md"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="px-4 py-6 space-y-2 border-t border-gray-200">
            {navItems.map((item, index) => (
              <a
                key={item.path}
                href={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-102 ${
                  pathname === item.path
                    ? "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 shadow-md"
                    : "text-gray-700 hover:bg-gray-50 hover:text-emerald-600"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`p-2 rounded-lg ${
                    pathname === item.path
                      ? "bg-emerald-200"
                      : "bg-gray-100 group-hover:bg-emerald-100"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className={`h-5 w-5 transition-all duration-300 ${
                      pathname === item.path
                        ? "text-emerald-600"
                        : `${item.color} group-hover:text-emerald-600`
                    }`}
                  />
                </div>
                <span className="font-medium">{item.label}</span>

                {pathname === item.path && (
                  <div className="ml-auto w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                )}
              </a>
            ))}

            {/* Mobile Logout */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full group flex items-center gap-4 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300"
              >
                <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200">
                  <FontAwesomeIcon icon={faSignOutAlt} className="h-5 w-5" />
                </div>
                <span className="font-medium">Logout</span>
              </button>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">Logged in as Alumini</p>
                <p className="text-xs text-gray-400 mt-1">
                  © 2025 Admin Portal
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Spacer to prevent content from being hidden under fixed navbar */}
      <div className="h-20"></div>
    </>
  );
}
