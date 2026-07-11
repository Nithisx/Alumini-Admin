import React from 'react';
import logo from "../../assets/KAHEAA.svg";
const Footer = () => (
  <footer className="bg-gray-800 text-white py-8">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-3 gap-8">
        <div>
          <div className="mb-4">
            <img src={logo} alt="KAHE Alumni Logo" className="h-16 sm:h-20 w-auto max-w-[260px] object-contain" />
          </div>
          <p className="text-gray-400">Connecting graduates and building opportunities together.</p>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li><a href="/about" className="text-gray-400 hover:text-white">About Us</a></li>
            <li><a href="/#features" className="text-gray-400 hover:text-white">Features</a></li>
            <li><a href="/developers" className="text-gray-400 hover:text-white">Meet the Developers</a></li>
            <li><a href="/developer-community" className="text-gray-400 hover:text-white">Developer Community</a></li>
            <li><a href="/contact" className="text-gray-400 hover:text-white">Contact</a></li>
            <li><a href="/login" className="text-gray-400 hover:text-white">Alumni Login</a></li>
            <li><a href="/privacy-policy" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
            <li><a href="/terms-of-service" className="text-gray-400 hover:text-white">Terms of Service</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-4">Contact Info</h3>
          <ul className="space-y-2 text-gray-400">
            <li>Pollachi Main Road, Eachanari, Coimbatore</li>
            <li>Tamil Nadu - 641021</li>
            <li>alumni@kahedu.edu.in</li>
            <li>+91 422 2619300</li>
          </ul>
        </div>
      </div>
      <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
        <p>© {new Date().getFullYear()} Karpagam Academy of Higher Education. All rights reserved.</p>
        <p className="mt-2">
          <a href="/privacy-policy" className="hover:text-white underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
