// src/App.jsx
import React, { useState, useEffect } from "react";
import AppRoutes from "./AppRoutes";
import ErrorBoundary from "./Components/Shared/ErrorBoundary";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Loader from "./Pages/Loder";

export default function App() {
  // Show the Karpagam Alumni loading screen on every initial site open / refresh.
  // This initializer runs once per full page load (not on in-app route changes),
  // so the loader greets users when they open the site, then fades after the timer.
  const [appLoading, setAppLoading] = useState(true);

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
