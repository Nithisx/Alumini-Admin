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

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
       
          <div className="flex items-center space-x-4">
            <img src={logo} alt="KAHEAA Logo" className="h-12 w-auto" />
            <div className="leading-tight">
              <h1 className="text-xl font-bold text-green-700">KAHEAA</h1>
              <p className="text-xs text-gray-600">
                Karpagam Academy of Higher
                <br />
                Education Alumni Association
              </p>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end space-y-1">
            <div className="text-sm text-gray-800 space-x-2">
              {localStorage.getItem("Token") ? (
                <>
            <button
              onClick={() => {
                const role = localStorage.getItem("Role");
                switch (role) {
                  case "admin":
                    navigate("/admin/dashboard");
                    break;
                  case "staff":
                    navigate("/staff/dashboard");
                    break;
                  case "alumni":
                  case "student":
                    navigate("/alumni/dashboard");
                    break;
                  default:
                    navigate("/home");
                }
              }}
              className="bg-white border border-green-700 text-green-700 px-3 py-1 rounded hover:bg-green-50 transition"
            >
              DASHBOARD
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("Token");
                localStorage.removeItem("Role");
                navigate("/login");
              }}
              className="bg-white border border-green-700 text-green-700 px-3 py-1 rounded hover:bg-green-50 transition"
            >
              LOGOUT
            </button>
                </>
              ) : (
                <>
            <button
              onClick={() => navigate("/signup")}
              className="bg-white border border-green-700 text-green-700 px-3 py-1 rounded hover:bg-green-50 transition"
            >
              REGISTER
            </button>
            <button
              onClick={() => navigate("/login")}
              className="bg-white border border-green-700 text-green-700 px-3 py-1 rounded hover:bg-green-50 transition"
            >
              LOGIN
            </button>
                </>
              )}
            </div>

            <nav className="flex gap-4 text-sm text-gray-700">
              {/* About dropdown - added padding to create a larger hover area */}

            <button
              onClick={() => handleNavigation("/about")}
              className="hover:text-green-700 bg-transparent"
            >
              About Us
            </button>

            <button
              onClick={() => handleNavigation("/#news-section")}
              className="hover:text-green-700 bg-transparent"
            >
              Newsroom
            </button>
            <button
              onClick={() => handleNavigation("/#member-section")}
              className="hover:text-green-700 bg-transparent"
            >
              Members
            </button>
            <button
              onClick={() => handleNavigation("/#events-section")}
              className="hover:text-green-700 bg-transparent"
            >
              Events
            </button>
            <button
              onClick={() => handleNavigation("/#chapters-section")}
              className="hover:text-green-700 bg-transparent"
            >
              Chapters
            </button>
            <button
              onClick={() => handleNavigation("/#contact-section")}
              className="hover:text-green-700 bg-transparent"
            >
              Contact Us
            </button>
          </nav>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-2xl text-green-700"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4">
          <div className="text-sm text-gray-800 mb-2 space-x-2 text-right">
            {localStorage.getItem("Token") ? (
              <>
                <button
                  onClick={() => {
                    const role = localStorage.getItem("Role");
                    switch (role) {
                      case "admin":
                        navigate("/admin/dashboard");
                        break;
                      case "staff":
                        navigate("/staff/dashboard");
                        break;
                      case "alumni":
                      case "student":
                        navigate("/alumni/dashboard");
                        break;
                      default:
                        navigate("/home");
                    }
                    setMenuOpen(false);
                  }}
                  className="hover:underline bg-transparent"
                >
                  DASHBOARD
                </button>
                <span>::</span>
                <button
                  onClick={() => {
                    localStorage.removeItem("Token");
                    localStorage.removeItem("Role");
                    navigate("/login");
                    setMenuOpen(false);
                  }}
                  className="hover:underline bg-transparent"
                >
                  LOGOUT
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    navigate("/signup");
                    setMenuOpen(false);
                  }}
                  className="hover:underline bg-transparent"
                >
                  REGISTER
                </button>
                <span>::</span>
                <button
                  onClick={() => {
                    navigate("/login");
                    setMenuOpen(false);
                  }}
                  className="hover:underline bg-transparent"
                >
                  LOGIN
                </button>
              </>
            )}
          </div>
          <nav className="flex flex-col gap-2 text-sm text-gray-700">
            {/* Mobile About section with submenu */}
            <div className="mb-2">
              <button
                onClick={() => handleNavigation("/about")}
                className="hover:text-green-700 bg-transparent text-left font-medium"
              >
                About Us
              </button>
              <div className="ml-4 mt-1 flex flex-col gap-1">
                <button
                  onClick={() => handleNavigation("/about#overview")}
                  className="text-gray-600 hover:text-green-700 text-left text-xs bg-transparent"
                >
                  Overview
                </button>
                <button
                  onClick={() => handleNavigation("/about#vision-mission")}
                  className="text-gray-600 hover:text-green-700 text-left text-xs bg-transparent"
                >
                  Vision & Mission
                </button>
                <button
                  onClick={() => handleNavigation("/about#administration")}
                  className="text-gray-600 hover:text-green-700 text-left text-xs bg-transparent"
                >
                  Administration
                </button>
              </div>
            </div>
            <button
              onClick={() => handleNavigation("/#news-section")}
              className="hover:text-green-700 bg-transparent text-left"
            >
              Newsroom
            </button>
            <button
              onClick={() => handleNavigation("/#member-section")}
              className="hover:text-green-700 bg-transparent text-left"
            >
              Members
            </button>
            <button
              onClick={() => handleNavigation("/#events-section")}
              className="hover:text-green-700 bg-transparent text-left"
            >
              Events
            </button>
            <button
              onClick={() => handleNavigation("/#chapters-section")}
              className="hover:text-green-700 bg-transparent text-left"
            >
              Chapters
            </button>
            <button
              onClick={() => handleNavigation("/#contact-section")}
              className="hover:text-green-700 bg-transparent text-left"
            >
              Contact Us
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
