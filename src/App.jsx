// src/App.jsx
import React, { useState, useEffect } from "react";
import AppRoutes from "./AppRoutes";
import ErrorBoundary from "./Components/Shared/ErrorBoundary";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Loader from "./Pages/Loder";

export default function App() {
  const [appLoading, setAppLoading] = useState(true);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAppLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!appLoading) {
      const revealTimer = setTimeout(() => setCtaVisible(true), 700);
      return () => clearTimeout(revealTimer);
    }
    return undefined;
  }, [appLoading]);

  useEffect(() => {
    const isStandalone = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer.startsWith("android-app://");

    if (isStandalone()) {
      setShowInstallButton(false);
      return undefined;
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      setDeferredInstallPrompt(null);
      setShowInstallButton(false);
    };

    const displayModeQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = () => {
      if (displayModeQuery.matches) {
        setDeferredInstallPrompt(null);
        setShowInstallButton(false);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    displayModeQuery.addEventListener?.("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      displayModeQuery.removeEventListener?.("change", handleDisplayModeChange);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredInstallPrompt) return;

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;

    setDeferredInstallPrompt(null);
    setShowInstallButton(false);
  };

  return (
    <ErrorBoundary>
      <div className="App">
        {appLoading && <Loader />}
        <AppRoutes />
        {!appLoading && showInstallButton && deferredInstallPrompt && (
          <button
            type="button"
            className={`install-app-button ${ctaVisible ? "show" : ""}`}
            onClick={handleInstallClick}
            aria-label="Install app"
            title="Install app"
          >
            <span className="install-app-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 3V14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 10L12 14L16 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 17H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="install-app-copy">
              <span className="install-app-title">Download app</span>
              <span className="install-app-subtitle">Tap to install for quick access</span>
            </span>
          </button>
        )}
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
