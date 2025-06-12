import React, { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import logo from "../images/logo.png"; // Adjust the path as necessary
const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

return (
    <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            {/* Left section */}
            <div className="flex items-center space-x-4">
                <img src={logo} alt="KAHEAA Logo" className="h-12 w-auto" />
                <div className="leading-tight">
                    <h1 className="text-xl font-bold text-green-700">KAHEAA</h1>
                    <p className="text-xs text-gray-600">
                        Karpagam Academy of Higher<br />Education Alumni Association
                    </p>
                </div>
            </div>

            <div className="hidden md:flex flex-col items-end space-y-1">
                <div className="text-sm text-gray-800 space-x-2">
                    <button
                        onClick={() => window.location.href = "/signup"}
                        className="bg-white border border-green-700 text-green-700 px-3 py-1 rounded hover:bg-green-50 transition"
                    >
                        REGISTER
                    </button>
                    <button
                        onClick={() => window.location.href = "/login"}
                        className="bg-white border border-green-700 text-green-700 px-3 py-1 rounded hover:bg-green-50 transition"
                    >
                        LOGIN
                    </button>
                </div>

                <nav className="flex gap-4 text-sm text-gray-700">
                    <button onClick={() => window.location.href = "/about"} className="hover:text-green-700 bg-transparent">About Us</button>
                    <button onClick={() => window.location.href = "/newsroom"} className="hover:text-green-700 bg-transparent">Newsroom</button>
                    <button onClick={() => window.location.href = "/members"} className="hover:text-green-700 bg-transparent">Members</button>
                    <button onClick={() => window.location.href = "/events"} className="hover:text-green-700 bg-transparent">Events</button>
                    <button onClick={() => window.location.href = "/Chapters"} className="hover:text-green-700 bg-transparent">Chapters</button>
                    <button onClick={() => window.location.href = "/contact"} className="hover:text-green-700 bg-transparent">Contact Us</button>
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
                    <button onClick={() => window.location.href = "/signup"} className="hover:underline bg-transparent">REGISTER</button>
                    <span>::</span>
                    <button onClick={() => window.location.href = "/login"} className="hover:underline bg-transparent">LOGIN</button>
                </div>
                <nav className="flex flex-col gap-2 text-sm text-gray-700">
                    <button onClick={() => window.location.href = "/about"} className="hover:text-green-700 bg-transparent text-left">About Us</button>
                    <button onClick={() => window.location.href = "/newsroom"} className="hover:text-green-700 bg-transparent text-left">Newsroom</button>
                    <button onClick={() => window.location.href = "/members"} className="hover:text-green-700 bg-transparent text-left">Members</button>
                    <button onClick={() => window.location.href = "/events"} className="hover:text-green-700 bg-transparent text-left">Events</button>
                    <button onClick={() => window.location.href = "/Chapters"} className="hover:text-green-700 bg-transparent text-left">Chapters</button>
                    <button onClick={() => window.location.href = "/contact"} className="hover:text-green-700 bg-transparent text-left">Contact Us</button>
                </nav>
            </div>
        )}
    </header>
);
};

export default Header;
