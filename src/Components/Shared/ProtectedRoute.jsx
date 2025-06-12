import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ requiredRole, children }) => {
  const token = localStorage.getItem('Token');
  const role = localStorage.getItem('Role');

  // If no token, redirect to home, if token exists but roles don't match, redirect to login
  if (!token) {
    return <Navigate to="/home" replace />;
  } else if (role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
