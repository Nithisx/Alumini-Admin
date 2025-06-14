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
import Logo from "../../images/logo.png"; // Adjust the path as necessary
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
    console.log("Logout clicked");
    // Note: localStorage not available in artifacts
    // localStorage.removeItem("Token")
    // localStorage.removeItem("Role")
    // window.location.href = "/login"
  };

  const navItems = [
    {
      path: "/admin/dashboard",
      icon: faFileAlt,
      label: "Dashboard",
      color: "text-blue-600",
    },
    {
      path: "/admin/event",
      icon: faCalendarCheck,
      label: "Events",
      color: "text-purple-600",
    },
    {
      path: "/admin/jobs",
      icon: faBriefcase,
      label: "Jobs",
      color: "text-orange-600",
    },
    {
      path: "/admin/albums",
      icon: faPhotoFilm,
      label: "Albums",
      color: "text-pink-600",
    },
    {
      path: "/admin/news",
      icon: faNewspaper,
      label: "NewsRoom",
      color: "text-red-600",
    },
    {
      path: "/admin/members",
      icon: faIdBadge,
      label: "Members",
      color: "text-indigo-600",
    },
    {
      path: "/admin/birthday",
      icon: faBirthdayCake,
      label: "Birthdays",
      color: "text-yellow-600",
    },
    {
      path: "/admin/business",
      icon: faBuilding,
      label: "Business",
      color: "text-teal-600",
    },
    {
      path: "/admin/my-profile",
      icon: faUser,
      label: "Profile",
      color: "text-gray-600",
    },
    {
      path: "/admin/my-contribution",
      icon: faHandHoldingHeart,
      label: "Contribution",
      color: "text-green-600",
    },
    {
      path: "/admin/register-request",
      icon: faShield,
      label: "Requests",
      color: "text-emerald-600",
    },
  ];

  return (
    <>
      {/* Main Navigation Bar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200"
            : "bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border-b border-emerald-100"
        }`}
      >
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 w-full">
            {/* Left section - Logo */} 
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div
                className="relative w-10 h-10 flex-shrink-0 cursor-pointer"
                onClick={() => window.location.href = '/'}
                title="Go to Home Page"
              >
                <img
                  src={Logo}
                  alt="Logo"
                  className="h-10 w-10 rounded-full shadow-md ring-2 ring-emerald-200 object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div
                className="leading-tight cursor-pointer hidden sm:block"
                onClick={() => window.location.href = '/'}
                title="Go to Home Page"
              >
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-emerald-600 bg-clip-text text-transparent">
                  KAHEAA
                </h1>
              </div>
            </div>

            {/* Desktop Navigation - Full width distribution */}
            <div className="hidden lg:flex items-center flex-1 justify-between">
              <div className="flex items-center flex-1 justify-center">
                <div className="flex items-center space-x-2">
                  {navItems.map((item) => (
                    <a
                      key={item.path}
                      href={item.path}
                      className={`group relative flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                        pathname === item.path
                          ? "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 shadow-md"
                          : "text-gray-700 hover:bg-gray-50 hover:text-emerald-600"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={item.icon}
                        className={`h-3.5 w-3.5 transition-all duration-300 ${
                          pathname === item.path
                            ? "text-emerald-600"
                            : `${item.color} group-hover:text-emerald-600`
                        }`}
                      />
                      <span className="text-xs font-medium whitespace-nowrap">
                        {item.label}
                      </span>

                      {/* Active indicator */}
                      {pathname === item.path && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                      )}
                    </a>
                  ))}
                </div>
              </div>

              {/* Logout Button */}
              <div className="ml-4 pl-4 border-l border-gray-200">
                <button
                  onClick={handleLogout}
                  className="group flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300 hover:scale-105"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Logout</span>
                </button>
              </div>
            </div>

            {/* Tablet Navigation - Dropdown for overflow items */}
            <div className="hidden md:flex lg:hidden items-center flex-1 mx-4">
              <div className="flex items-center space-x-1">
                {/* Show first 6 items */}
                {navItems.slice(0, 6).map((item) => (
                  <a
                    key={item.path}
                    href={item.path}
                    className={`group relative flex items-center gap-1.5 px-2 py-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                      pathname === item.path
                        ? "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 shadow-md"
                        : "text-gray-700 hover:bg-gray-50 hover:text-emerald-600"
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={item.icon}
                      className={`h-3.5 w-3.5 transition-all duration-300 ${
                        pathname === item.path
                          ? "text-emerald-600"
                          : `${item.color} group-hover:text-emerald-600`
                      }`}
                    />
                    <span className="text-xs font-medium hidden xl:block">
                      {item.label}
                    </span>
                  </a>
                ))}
                
                {/* More dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-1 px-2 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-all duration-300">
                    <FontAwesomeIcon icon={faChevronDown} className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">More</span>
                  </button>
                  
                  {/* Dropdown menu */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <div className="py-2">
                      {navItems.slice(6).map((item) => (
                        <a
                          key={item.path}
                          href={item.path}
                          className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors duration-200 ${
                            pathname === item.path ? "text-emerald-700 bg-emerald-50" : "text-gray-700"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={item.icon}
                            className={`h-4 w-4 ${
                              pathname === item.path ? "text-emerald-600" : item.color
                            }`}
                          />
                          {item.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <div className="ml-3 pl-3 border-l border-gray-200">
                <button
                  onClick={handleLogout}
                  className="group flex items-center gap-1.5 px-2 py-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium hidden xl:block">Logout</span>
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden relative p-2.5 rounded-lg bg-gradient-to-r from-emerald-100 to-emerald-50 hover:from-emerald-200 hover:to-emerald-100 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <FontAwesomeIcon
                icon={isMobileOpen ? faTimes : faBars}
                className={`h-4 w-4 text-emerald-700 transition-transform duration-300 ${
                  isMobileOpen ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
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
                <p className="text-xs text-gray-500">Logged in as Admin</p>
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
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Spacer to prevent content from being hidden under fixed navbar */}
      <div className="h-16"></div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}