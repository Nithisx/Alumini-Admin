import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Pages
import LoginPage from './Pages/Login';
import Signup from './Pages/Signup';
import OAuthSignupComplete from './Pages/OAuthSignupComplete';
import OAuthComplete from './Pages/OAuthComplete';
import Home from './Pages/home';
import About from './Pages/about';
import Contact from './Pages/Contact';
import Developers from './Pages/DevelopersShowcase';
import DeveloperCommunity from './Pages/DeveloperCommunityLive';
import PrivacyPolicy from './Pages/PrivacyPolicyPage';
import TermsOfService from './Pages/TermsOfService';
import ResetPassword from './Pages/ResetPassword';
import ShareRedirect from './Pages/ShareRedirect';
import InstallAppPrompt from './Components/Shared/InstallAppPrompt';
import FCMDiagnostics from './Components/Shared/FCMDiagnostics';
import PageTransition from './Components/Shared/PageTransition';

// Layouts
// One shared layout for every role dashboard (replaces the three per-role
// layouts). Which pages/actions a user sees is driven by the RBAC permission
// matrix, not by the role folder.
import RoleLayout from './Components/Features/RoleLayout';

// Protected route wrapper
import ProtectedRoute from './Components/Shared/ProtectedRoute';
import { peekLoginRedirect } from './lib/loginRedirect';

// Bounces an already-authenticated visitor off a guest-only page (/, /home,
// /login, /signup).
//
// It MUST honour a pending post-login destination. GuestOnly reads localStorage,
// which is not reactive: the instant login stores the token, any re-render while
// still on /login makes GuestOnly render this component, and a blind
// <Navigate to="/dashboard"> here would race and override the redirect to the
// page the user originally clicked. Consuming the saved target first means the
// user lands where they intended no matter which navigation wins.
function AuthRedirect() {
  const location = useLocation();
  const token = localStorage.getItem('Token');
  const suffix = `${location.search || ''}${location.hash || ''}`;
  // Session vanished mid-flight — send them to log in again, not to the
  // marketing home page (and keep where they were headed).
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  // Peek (not consume) — this runs during render; AnimatedRoutes clears the key
  // once the user lands on the destination.
  const target = peekLoginRedirect();
  return <Navigate to={target || `/dashboard${suffix}`} replace />;
}

function GuestOnly({ children }) {
  const token = localStorage.getItem('Token');
  return token ? <AuthRedirect /> : children;
}

// Animates between top-level sections, keyed by the first path segment so that
// navigating within a section (e.g. /members → /members/john) does not remount
// the whole layout — that nested transition is handled inside each layout.
function AnimatedRoutes() {
  const location = useLocation();
  const segment = `/${location.pathname.split('/')[1] || ''}`;

  // Drop a stale "return to this page after login" target once the user
  // navigates somewhere outside the auth flow (i.e. they abandoned logging in).
  // /oauth/complete MUST be listed: Google sends the user back through it, and
  // clearing the target there would strand them on /dashboard instead of the
  // page they originally clicked.
  React.useEffect(() => {
    const authPaths = ['/login', '/signup', '/oauth-signup', '/oauth/complete'];
    if (!authPaths.includes(location.pathname)) {
      sessionStorage.removeItem('login_redirect_to');
    }
  }, [location.pathname]);

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
        <Route path="/oauth/complete" element={<OAuthComplete />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Authenticated app — one shared RoleLayout, one prefix-free route tree.
            ProtectedRoute only checks for a valid session; which pages/actions
            a user sees is decided entirely by the RBAC permission matrix inside
            RoleLayout, not by a role-specific URL prefix. */}
        <Route path="/fcm-diagnostics" element={<FCMDiagnostics />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <RoleLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </PageTransition>
  );
}

const AppRoutes = () => {
  const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;
  return (
    <Router>
      <InstallAppPrompt />
      <AnimatedRoutes />
    </Router>
  );
};

export default AppRoutes;
