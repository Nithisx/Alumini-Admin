import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ requiredRole, children }) => {
  const token = localStorage.getItem('Token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const isStaff = localStorage.getItem('isStaff') === 'true';
  const isAlumni = localStorage.getItem('isAlumni') === 'true';
  const isStudent = localStorage.getItem('isStudent') === 'true';

  // If no token, redirect to home
  if (!token) {
    return <Navigate to="/home" replace />;
  }

  // Check if permissions match the required role
  let hasAccess = false;

  if (Array.isArray(requiredRole)) {
    // Handle array of required roles
    if (requiredRole.includes('admin') && isAdmin) hasAccess = true;
    if (requiredRole.includes('staff') && isStaff) hasAccess = true;
    if (requiredRole.includes('alumni') && isAlumni) hasAccess = true;
    if (requiredRole.includes('student') && isStudent) hasAccess = true;
  } else {
    // Handle single role requirement
    if (requiredRole === 'admin' && isAdmin) hasAccess = true;
    if (requiredRole === 'staff' && isStaff) hasAccess = true;
    if (requiredRole === 'alumni' && isAlumni) hasAccess = true;
    if (requiredRole === 'student' && isStudent) hasAccess = true;
  }

  // If token exists but permissions don't match, redirect to login
  if (!hasAccess) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
