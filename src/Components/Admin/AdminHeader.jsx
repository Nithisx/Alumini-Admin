import { useState, useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faFileAlt,
  faCalendarCheck,
  faPhotoFilm,
  faMapMarker,
  faSignOutAlt,
  faBars,
  faTimes,
  faShield,
  faUserPlus
} from "@fortawesome/free-solid-svg-icons"
import "../../App.css"

export default function AdminHeader() {
  const [pathname, setPathname] = useState(window.location.pathname)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(window.location.pathname)
    }

    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMobileOpen(false)
      } else {
        setIsMobileOpen(true)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("Token")
    localStorage.removeItem("Role")
    window.location.href = "/login"
  }

  const navItems = [
    { path: "/admin/dashboard", icon: faFileAlt, label: "Dashboard" },
    {path: "/admin/register-request", icon: faUserPlus, label: "Register Request" },
    { path: "/admin/event", icon: faCalendarCheck, label: "Events" },
    { path: "/admin/albums", icon: faPhotoFilm, label: "Albums" },
    { path: "/admin/map", icon: faMapMarker, label: "Map" },

  ]

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-white border border-gray-200 shadow-sm"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <FontAwesomeIcon icon={isMobileOpen ? faTimes : faBars} className="h-5 w-5 text-gray-700" />
      </button>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-gradient-to-b from-emerald-50 to-white border-r border-gray-200 transition-all duration-300 ease-in-out
          w-[280px]
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-start p-4 border-b border-gray-200 gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600">
            <FontAwesomeIcon icon={faShield} className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold text-emerald-700">Admin Portal</h1>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4 overflow-y-auto">
          <nav className="px-2 space-y-1">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) setIsMobileOpen(false)
                }}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 transition-all duration-200
                  hover:bg-emerald-100 hover:text-emerald-700 group
                  ${pathname === item.path ? "bg-emerald-100 text-emerald-700 font-medium" : ""}`}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className={`h-5 w-5 flex-shrink-0
                    ${pathname === item.path ? "text-emerald-600" : "text-gray-500 group-hover:text-emerald-600"}`}
                />
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            className="w-full flex items-center px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            onClick={handleLogout}
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="h-5 w-5 mr-2" />
            <span>Logout</span>
          </button>

          <div className="mt-4 text-xs text-center text-gray-500">
            <p>Logged in as Admin</p>
            <p className="mt-1">© 2025 Admin Portal</p>
          </div>
        </div>
      </aside>
    </>
  )
}
