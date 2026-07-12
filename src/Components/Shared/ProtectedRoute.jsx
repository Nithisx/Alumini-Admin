import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../../lib/authToken';

// Gates the authenticated app tree behind a valid session only — which pages
// a user can actually reach is decided by the RBAC permission matrix inside
// RoleLayout (GuardedElement), not by a role check here.
const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    // Save the page they wanted so login can redirect back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
