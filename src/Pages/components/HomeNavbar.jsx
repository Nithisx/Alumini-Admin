import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faTimes,
  faSignInAlt,
  faUserPlus,
  faUser,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import "../../App.css";

export default function HomeNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("Token");
    const role = localStorage.getItem("Role");

    setIsLoggedIn(!!token);
    setUserRole(role);
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("Token");
    localStorage.removeItem("Role");
    setIsLoggedIn(false);
    setUserRole(null);
    navigate("/home");
  };

  // Navigate to dashboard based on user role
  const goToDashboard = () => {
    if (userRole) {
      navigate(`/${userRole}/dashboard`);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {" "}
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img
                src="/src/assets/kahelogo.png"
                alt="KAHE Logo"
                className="h-10 w-10 mr-3"
              />
              <span className="text-xl font-bold text-blue-600">
                Alumni Network
              </span>
            </Link>
          </div>
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/about" className="text-gray-600 hover:text-blue-600">
              About
            </Link>{" "}
            <a href="/#features" className="text-gray-600 hover:text-blue-600">
              Features
            </a>
            <a href="/#contact" className="text-gray-600 hover:text-blue-600">
              Contact
            </a>
            <div className="flex items-center space-x-2 ml-4">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={goToDashboard}
                    className="px-4 py-2 flex items-center text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <FontAwesomeIcon icon={faUser} className="mr-2" />
                    Dashboard
                  </button>

                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg flex items-center"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/login")}
                    className="px-4 py-2 flex items-center text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />
                    Login
                  </button>

                  <button
                    onClick={() => navigate("/Signup")}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center"
                  >
                    <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </nav>
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <FontAwesomeIcon
              icon={isMobileMenuOpen ? faTimes : faBars}
              className="h-6 w-6 text-blue-600"
            />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <Link
              to="/about"
              className="block py-2 px-4 text-gray-600 hover:bg-blue-50 rounded"
            >
              About
            </Link>{" "}
            <a
              href="/#features"
              className="block py-2 px-4 text-gray-600 hover:bg-blue-50 rounded"
            >
              Features
            </a>
            <a
              href="/#contact"
              className="block py-2 px-4 text-gray-600 hover:bg-blue-50 rounded"
            >
              Contact
            </a>
            <div className="flex flex-col space-y-2 mt-4 px-4">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={goToDashboard}
                    className="py-2 w-full flex items-center justify-center text-blue-600 border border-blue-600 rounded-lg"
                  >
                    <FontAwesomeIcon icon={faUser} className="mr-2" />
                    Dashboard
                  </button>

                  <button
                    onClick={handleLogout}
                    className="py-2 w-full bg-red-600 text-white rounded-lg flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/login")}
                    className="py-2 w-full flex items-center justify-center text-blue-600 border border-blue-600 rounded-lg"
                  >
                    <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />
                    Login
                  </button>

                  <button
                    onClick={() => navigate("/Signup")}
                    className="py-2 w-full bg-blue-600 text-white rounded-lg flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
