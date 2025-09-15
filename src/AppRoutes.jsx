import React from 'react';
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
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const isStaff = localStorage.getItem('isStaff') === 'true';
  const isAlumni = localStorage.getItem('isAlumni') === 'true';
  const isStudent = localStorage.getItem('isStudent') === 'true';
  const userType = localStorage.getItem('userType');

  // Redirect authenticated users to their respective dashboards
  const redirectAuthenticated = () => {
    if (!token) return <Navigate to="/home" replace />;

    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (isStaff) {
      return <Navigate to="/staff/dashboard" replace />;
    } else if (isAlumni || isStudent) {
      return <Navigate to="/alumni/dashboard" replace />;
    } else {
      return <Navigate to="/home" replace />;
    }
  };

  return (
    <Router>
      <Routes>
        {/* Initial Route - Redirect based on role or to home */}
        <Route path="/" element={redirectAuthenticated()} />

        {/* Public Routes */}
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        
        {/* Login and Signup */}
        <Route path="/login" element={token ? redirectAuthenticated() : <LoginPage />} />
        <Route path="/signup" element={token ? redirectAuthenticated() : <Signup />} />

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
        <Route path="*" element={token ? redirectAuthenticated() : <Navigate to="/home" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
