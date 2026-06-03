// src/App.jsx
import React, { useState, useEffect } from "react";
import AppRoutes from "./AppRoutes";
import ErrorBoundary from "./Components/Shared/ErrorBoundary";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Loader from "./Pages/Loder";

export default function App() {
  // Show the Karpagam Alumni loading screen only on the landing page ("/" or
  // "/home"). Runs once per full page load (not on in-app route changes).
  const [appLoading, setAppLoading] = useState(() => {
    const pathname = window.location.pathname;
    return pathname === "/" || pathname === "/home";
  });

  useEffect(() => {
    if (!appLoading) return;
    const timer = setTimeout(() => setAppLoading(false), 3000);
    return () => clearTimeout(timer);
  }, [appLoading]);

  return (
    <ErrorBoundary>
      <div className="App">
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
