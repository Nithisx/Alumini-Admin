// src/App.jsx
import React, { useState, useEffect } from "react";
import AppRoutes from "./AppRoutes";
import ErrorBoundary from "./Components/Shared/ErrorBoundary";
import NetworkStatusBanner from "./Components/Shared/NetworkStatusBanner";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Loader from "./Pages/Loder";
import { useDispatch } from "react-redux";
import { fetchPermissions } from "./store/permissionsSlice";
import { getRole } from "./lib/authToken";
import usePermissionsPolling from "./lib/usePermissionsPolling";


export default function App() {
  const dispatch = useDispatch();
  // Live propagation of admin-side RBAC edits (role matrix or per-user
  // overrides) — polls GET /me/permissions/ every 5 minutes while
  // authenticated and silently refreshes Redux (nav/Can gating react
  // automatically), toasting only when the effective set actually changed.
  usePermissionsPolling();
  // Show the Karpagam Alumni loading screen only on the landing page ("/" or
  // "/home"). Runs once per full page load (not on in-app route changes).
  const [appLoading, setAppLoading] = useState(() => {
    const pathname = window.location.pathname;
    return pathname === "/" || pathname === "/home";
  });

  // Load the caller's effective RBAC permissions once at boot if a session
  // exists (fetched from the backend — not embedded in the JWT).
  useEffect(() => {
    if (getRole()) dispatch(fetchPermissions());
  }, [dispatch]);

  useEffect(() => {
    if (!appLoading) return;
    const timer = setTimeout(() => setAppLoading(false), 3000);
    return () => clearTimeout(timer);
  }, [appLoading]);

  return (
    <ErrorBoundary>
      <div className="App">
        <NetworkStatusBanner />
        {appLoading && <Loader />}
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="colored"
        />
      </div>
    </ErrorBoundary>
  );
}
