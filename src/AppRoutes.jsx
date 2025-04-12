import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Our Components
import LoginPage from './Pages/Login'; // Your existing login
import Signup from './Pages/Signup';
import AdminLayout from './Components/Admin/AdminLayout';
import StaffLayout from './Components/Staff/StaffLayout';
import ProtectedRoute from './Components/Shared/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Route: Login */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/Signup" element={<Signup />} />

        {/* Admin Routes (Protected) */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        />

        {/* Staff Routes (Protected) */}
        <Route
          path="/staff/*"
          element={
            <ProtectedRoute requiredRole="staff">
              <StaffLayout />
            </ProtectedRoute>
          }
        />

        {/* Default or 404 */}
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
