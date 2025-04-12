import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faFileAlt, 
  faUserPlus, 
  faCalendarCheck, 
  faLock,
  faPhotoFilm,
  faMapMarker
} from "@fortawesome/free-solid-svg-icons";
import '../../App.css'; // Import your CSS file here

export default function AdminHeader() {
  return (
    <aside className="w-64 bg-gradient-to-b from-blue-50 to-white shadow-md min-h-screen fixed top-0 left-0 h-full">
      {/* Branding / Logo */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-center">
        <FontAwesomeIcon icon={faLock} className="text-green-600 mr-2" />
        <h1 className="text-xl font-bold text-green-600">Staff Dashboard</h1>
      </div>

      {/* Navigation Links */}
      <nav className="p-4 space-y-3">
          <NavItem to="/" icon={faFileAlt} label="Post" />
          <NavItem to="/register-request" icon={faUserPlus} label="Register Request" />
          <NavItem to="/event" icon={faCalendarCheck} label="Event" />
          <NavItem to="/albums" icon={faPhotoFilm} label="Albums" />
          <NavItem to="/map" icon={faMapMarker} label="Map" />  {/* Added Map nav item */}
        </nav>

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
