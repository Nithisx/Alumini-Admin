import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ requiredRole, children }) => {
  const token = localStorage.getItem('Token');
  const role = localStorage.getItem('Role');

  // If no token, redirect to home
  if (!token) {
    return <Navigate to="/home" replace />;
  }

  // Check if role matches (handle both string and array of roles)
  const hasAccess = Array.isArray(requiredRole) 
    ? requiredRole.includes(role) 
    : role === requiredRole;

  // If token exists but roles don't match, redirect to login
  if (!hasAccess) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
