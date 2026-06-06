import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Pages
import LoginPage from './Pages/Login';
import Signup from './Pages/Signup';
import OAuthSignupComplete from './Pages/OAuthSignupComplete';
import Home from './Pages/home';
import About from './Pages/about';
import Contact from './Pages/Contact';
import Developers from './Pages/DevelopersShowcase';
import DeveloperCommunity from './Pages/DeveloperCommunityLive';
import PrivacyPolicy from './Pages/PrivacyPolicyPage';
import TermsOfService from './Pages/TermsOfService';
import ResetPassword from './Pages/ResetPassword';
import ShareRedirect from './Pages/ShareRedirect';
import { normalizeRoleForBase } from './lib/authRole';
import InstallAppPrompt from './Components/Shared/InstallAppPrompt';
import FCMDiagnostics from './Components/Shared/FCMDiagnostics';
import PageTransition from './Components/Shared/PageTransition';

// Layouts
import AdminLayout from './Components/Admin/AdminLayout';
import StaffLayout from './Components/Staff/StaffLayout';
import AlumniLayout from './Components/Alumni/AlumniLayout';

// Protected route wrapper
import ProtectedRoute from './Components/Shared/ProtectedRoute';

function AuthRedirect() {
  const location = useLocation();
  const token = localStorage.getItem('Token');
  const role = normalizeRoleForBase(localStorage.getItem('Role'));
  const suffix = `${location.search || ''}${location.hash || ''}`;
  if (!token) return <Navigate to="/" replace />;
  switch (role) {
    case 'admin': return <Navigate to={`/admin/dashboard${suffix}`} replace />;
    case 'staff': return <Navigate to={`/staff/dashboard${suffix}`} replace />;
    case 'alumni':
      return <Navigate to={`/alumni/dashboard${suffix}`} replace />;
    default: return <Navigate to="/" replace />;
  }
}

function GuestOnly({ children }) {
  const token = localStorage.getItem('Token');
  return token ? <AuthRedirect /> : children;
}

// Animates between top-level sections, keyed by the first path segment so that
// navigating within a layout (e.g. /admin/dashboard → /admin/members) does not
// remount the whole layout — that nested transition is handled inside each layout.
function AnimatedRoutes() {
  const location = useLocation();
  const segment = `/${location.pathname.split('/')[1] || ''}`;
  return (
    <PageTransition transitionKey={segment}>
      <Routes>
        {/* Initial Route — redirect authenticated users to their dashboard */}
        <Route path="/" element={<GuestOnly><Home /></GuestOnly>} />

        {/* Public Routes */}
        <Route path="/home" element={<GuestOnly><Home /></GuestOnly>} />
        <Route path="/about" element={<About />} />
        <Route path="/developers" element={<Developers />} />
        <Route path="/developer-community" element={<DeveloperCommunity />} />
        <Route path="/contact" element={<Contact />} />
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
        <Route path="/fcm-diagnostics" element={<FCMDiagnostics />} />
        <Route path="*" element={<AuthRedirect />} />
      </Routes>
    </PageTransition>
  );
}

const AppRoutes = () => {
  return (
    <Router>
      <InstallAppPrompt />
      <AnimatedRoutes />
    </Router>
  );
};

export default AppRoutes;
