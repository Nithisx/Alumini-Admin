import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAlt,
  faCalendarCheck,
  faPhotoFilm,
  faMapMarker,
  faLock,
  faSignOutAlt
} from "@fortawesome/free-solid-svg-icons";
import '../../App.css';

export default function AdminHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("Token");
    localStorage.removeItem("Role");
    navigate("/login"); // Adjust this route as needed
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-blue-50 to-white shadow-md min-h-screen fixed top-0 left-0 h-full">
      {/* Branding / Logo */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-center">
        <FontAwesomeIcon icon={faLock} className="text-green-600 mr-2" />
        <h1 className="text-xl font-bold text-green-600">Staff Dashboard</h1>
      </div>

      {/* Navigation Links */}
      <nav className="p-4 space-y-3">
        <NavItem to="/staff/dashboard" icon={faFileAlt} label="Post" />
        <NavItem to="/staff/event" icon={faCalendarCheck} label="Event" />
        <NavItem to="/staff/albums" icon={faPhotoFilm} label="Albums" />
        <NavItem to="/staff/map" icon={faMapMarker} label="Map" />
      </nav>

      {/* Logout Button */}
      <div className="p-4 text-center">
        <button
          onClick={handleLogout}
          className="flex items-center mx-auto px-4 py-2 text-sm text-red-600 hover:text-white hover:bg-red-500 rounded transition-colors duration-200"
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
          Logout
        </button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 w-full p-4 text-center text-xs text-gray-500">
        <FontAwesomeIcon icon={faLock} className="mr-1" />
        <span>Logged in as Staff</span>
      </div>
    </aside>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center px-4 py-3 rounded-lg text-gray-700
                 hover:bg-blue-500 hover:text-white transition-colors
                 transform hover:translate-x-1 duration-200"
    >
      <FontAwesomeIcon icon={icon} className="mr-3 text-lg w-5" />
      <span>{label}</span>
    </Link>
  );
}
