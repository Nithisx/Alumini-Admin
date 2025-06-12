import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import LoginPage from './Pages/Login';
import Signup from './Pages/Signup';
import Home from './Pages/home';
import About from './Pages/about';

// Layouts
import AdminLayout from './Components/Admin/AdminLayout';
import StaffLayout from './Components/Staff/StaffLayout';
import AlumniLayout from './Components/Alumni/AlumniLayout';

// Protected route wrapper
import ProtectedRoute from './Components/Shared/ProtectedRoute';

const AppRoutes = () => {
  const token = localStorage.getItem('Token');
  const role = localStorage.getItem('Role');

  // Redirect authenticated users to their respective dashboards
  const redirectAuthenticated = () => {
    if (token) {
      switch (role) {
        case 'admin':
          return <Navigate to="/admin/dashboard" replace />;
        case 'staff':
          return <Navigate to="/staff/dashboard" replace />;
        case 'alumni':
          return <Navigate to="/alumni/dashboard" replace />;
        default:
          return <Navigate to="/home" replace />;
      }
    }
    return null;
  };

  return (
    <Router>
      <Routes>        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        
        <Route path="/login" element={
          token ? redirectAuthenticated() : <LoginPage />
        } />
        <Route path="/Signup" element={
          token ? redirectAuthenticated() : <Signup />
        } />

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
            <ProtectedRoute requiredRole="alumni">
              <AlumniLayout />
            </ProtectedRoute>
          }
        />

        {/* Fallback - redirect to home if no token, otherwise to appropriate dashboard */}
        <Route path="*" element={token ? redirectAuthenticated() : <Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;