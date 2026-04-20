import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import LoginPage from './Pages/Login';
import Signup from './Pages/Signup';
import OAuthSignupComplete from './Pages/OAuthSignupComplete';
import Home from './Pages/home';
import About from './Pages/about';
import PrivacyPolicy from './Pages/PrivacyPolicy';
import TermsOfService from './Pages/TermsOfService';
import ResetPassword from './Pages/ResetPassword';
import ShareRedirect from './Pages/ShareRedirect';
import { normalizeRoleForBase } from './lib/authRole';

// Layouts
import AdminLayout from './Components/Admin/AdminLayout';
import StaffLayout from './Components/Staff/StaffLayout';
import AlumniLayout from './Components/Alumni/AlumniLayout';

// Protected route wrapper
import ProtectedRoute from './Components/Shared/ProtectedRoute';

function AuthRedirect() {
  const token = localStorage.getItem('Token');
  const role = normalizeRoleForBase(localStorage.getItem('Role'));
  if (!token) return <Navigate to="/" replace />;
  switch (role) {
    case 'admin': return <Navigate to="/admin/dashboard" replace />;
    case 'staff': return <Navigate to="/staff/dashboard" replace />;
    case 'alumni':
      return <Navigate to="/alumni/dashboard" replace />;
    default: return <Navigate to="/" replace />;
  }
}

function GuestOnly({ children }) {
  const token = localStorage.getItem('Token');
  return token ? <AuthRedirect /> : children;
}

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Initial Route */}
        <Route path="/" element={<Home />} />

        {/* Public Routes */}
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/share/:token" element={<ShareRedirect />} />

        {/* Auth Routes — redirect away if already logged in */}
        <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
        <Route path="/oauth-signup" element={<OAuthSignupComplete />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        />

        {/* Staff Routes */}
        <Route
          path="/staff/*"
          element={
            <ProtectedRoute requiredRole="staff">
              <StaffLayout />
            </ProtectedRoute>
          }
        />

        {/* Alumni Routes */}
        <Route
          path="/alumni/*"
          element={
            <ProtectedRoute requiredRole={["alumni", "student"]}>
              <AlumniLayout />
            </ProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<AuthRedirect />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
