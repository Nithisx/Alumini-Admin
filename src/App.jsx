// src/App.jsx
import React, { useState, useEffect } from "react";
import AppRoutes from "./AppRoutes";
import ErrorBoundary from "./Components/Shared/ErrorBoundary";
import NetworkStatusBanner from "./Components/Shared/NetworkStatusBanner";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Loader from "./Pages/Loder";
import { usePermissionStore } from "./stores";
import { getRole } from "./lib/authToken";



export default function App() {
  const permissions = usePermissionStore();

  // Show the Karpagam Alumni loading screen only on the landing page ("/" or
  // "/home"). Runs once per full page load (not on in-app route changes).
  const [appLoading, setAppLoading] = useState(() => {
    const pathname = window.location.pathname;
    return pathname === "/" || pathname === "/home";
  });

  // Effective RBAC permissions: fetched once at boot (they are NOT in the JWT —
  // an admin edits the matrix at runtime), then re-polled so a granted/revoked
  // permission propagates to the nav and every <Can>-gated control without the
  // user having to log out. Toast only when the set actually changed.
  useEffect(() => {
    if (!getRole()) return undefined;
    permissions.fetch();
    permissions.startPolling(() => toast.info("Your permissions were updated."));
    return () => permissions.stopPolling();
  }, [permissions]);

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
