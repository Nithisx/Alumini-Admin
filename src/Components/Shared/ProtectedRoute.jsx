import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ requiredRole, children }) => {
  const token = localStorage.getItem('Token');
  const role = localStorage.getItem('Role');
  const location = useLocation();

  if (!token) {
    // Save the page they wanted so login can redirect back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasAccess = Array.isArray(requiredRole)
    ? requiredRole.includes(role)
    : role === requiredRole;

  if (!hasAccess) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
