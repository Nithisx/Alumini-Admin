import React, { useState, useRef, useEffect } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../images/logo.png"; // Adjust the path as necessary

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const aboutDropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  // Improved navigation function that properly handles hash links with React Router
  const handleNavigation = (path) => {
    // Close mobile menu if open
    if (menuOpen) {
      setMenuOpen(false);
    }

    // Close dropdown if open
    if (aboutDropdownOpen) {
      setAboutDropdownOpen(false);
    }

    // Check if it's a hash link to home page sections
    if (path.includes("#")) {
      const [baseUrl, hash] = path.split("#");

      // If it's a home page hash link (starts with /)
      if (baseUrl === "/" || baseUrl === "") {
        // If we're already on home page, just scroll
        if (location.pathname === "/" || location.pathname === "/home") {
          setTimeout(() => {
            const element = document.getElementById(hash);
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          }, 100);
        } else {
          // Navigate to home page first, then scroll
          navigate("/home");
          setTimeout(() => {
            const element = document.getElementById(hash);
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          }, 300);
        }
        return;
      }
      // If it's an about page hash link
      else if (baseUrl === "/about") {
        if (location.pathname === "/about") {
          setTimeout(() => {
            const element = document.getElementById(hash);
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          }, 100);
        } else {
          navigate("/about");
          setTimeout(() => {
            const element = document.getElementById(hash);
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          }, 300);
        }
        return;
      }
    }

    // For regular navigation (non-hash links)
    if (path.startsWith("/")) {
      navigate(path);
    } else {
      // For external links or special cases
      window.location.href = path;
    }
  };

  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setAboutDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    // Set a longer timeout to close the dropdown after a delay
    timeoutRef.current = setTimeout(() => {
      setAboutDropdownOpen(false);
    }, 600); // 600ms delay before closing
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        aboutDropdownRef.current &&
        !aboutDropdownRef.current.contains(event.target)
      ) {
        setAboutDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isLoggedIn = !!localStorage.getItem("Token");

  const goToDashboard = () => {
    const role = localStorage.getItem("Role");
    switch (role) {
      case "admin": navigate("/admin/dashboard"); break;
      case "staff": navigate("/staff/dashboard"); break;
      case "alumni":
      case "student": navigate("/alumni/dashboard"); break;
      default: navigate("/home");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("Token");
    localStorage.removeItem("Role");
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        {/* Logo */}
        <button onClick={() => navigate("/home")} className="flex items-center space-x-3 bg-transparent p-0">
          <img src={logo} alt="KAHEAA Logo" className="h-10 sm:h-12 w-auto" />
          <div className="leading-tight text-left">
            <h1 className="text-base sm:text-xl font-bold text-green-700">KAHEAA</h1>
            <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
              Karpagam Academy of Higher Education Alumni Association
            </p>
          </div>
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-sm">
            {isLoggedIn ? (
              <>
                <button onClick={goToDashboard} className="border border-green-700 text-green-700 px-3 py-1 rounded hover:bg-green-50 transition text-sm font-medium">Dashboard</button>
                <button onClick={handleLogout} className="border border-green-700 text-green-700 px-3 py-1 rounded hover:bg-green-50 transition text-sm font-medium">Logout</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate("/signup")} className="border border-green-700 text-green-700 px-3 py-1 rounded hover:bg-green-50 transition text-sm font-medium">Register</button>
                <button onClick={() => navigate("/login")} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition text-sm font-medium">Login</button>
              </>
            )}
          </div>
          <nav className="flex gap-5 text-sm text-gray-700">
            {[
              { label: "About Us", path: "/about" },
              { label: "Newsroom", path: "/#news-section" },
              { label: "Members", path: "/#member-section" },
              { label: "Events", path: "/#events-section" },
              { label: "Chapters", path: "/#chapters-section" },
              { label: "Contact Us", path: "/#contact-section" },
            ].map(({ label, path }) => (
              <button key={label} onClick={() => handleNavigation(path)} className="hover:text-green-700 bg-transparent font-medium transition-colors">
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md text-green-700 hover:bg-green-50 transition"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
        </button>
      </div>

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          {/* Auth buttons */}
          <div className="flex gap-3 px-5 py-4 border-b border-gray-100">
            {isLoggedIn ? (
              <>
                <button onClick={() => { goToDashboard(); setMenuOpen(false); }}
                  className="flex-1 border border-green-700 text-green-700 py-2.5 rounded-lg text-sm font-medium hover:bg-green-50 transition">
                  Dashboard
                </button>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="flex-1 border border-red-400 text-red-600 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 transition">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { navigate("/signup"); setMenuOpen(false); }}
                  className="flex-1 border border-green-700 text-green-700 py-2.5 rounded-lg text-sm font-medium hover:bg-green-50 transition">
                  Register
                </button>
                <button onClick={() => { navigate("/login"); setMenuOpen(false); }}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition">
                  Login
                </button>
              </>
            )}
          </div>
          {/* Nav links */}
          <nav className="flex flex-col px-5 py-3 gap-1">
            {[
              { label: "About Us", path: "/about" },
              { label: "Newsroom", path: "/#news-section" },
              { label: "Members", path: "/#member-section" },
              { label: "Events", path: "/#events-section" },
              { label: "Chapters", path: "/#chapters-section" },
              { label: "Contact Us", path: "/#contact-section" },
            ].map(({ label, path }) => (
              <button key={label} onClick={() => { handleNavigation(path); setMenuOpen(false); }}
                className="text-left py-3 px-2 text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-lg text-base font-medium bg-transparent border-b border-gray-50 last:border-0 transition-colors">
                {label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
