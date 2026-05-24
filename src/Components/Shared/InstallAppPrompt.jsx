import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";

const INSTALL_TOAST_ID = "install-app-notification";

const INSTALL_TOAST_STYLES = `
  .install-toast {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }
  .install-toast-content {
    flex: 1;
    min-width: 0;
  }
  .install-toast-title {
    font-size: 16px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 6px 0;
    line-height: 1.3;
  }
  .install-toast-subtitle {
    font-size: 14px;
    color: #555;
    margin: 0;
    line-height: 1.4;
  }
  .install-toast-actions {
    display: flex;
    flex-direction: row;
    gap: 12px;
    width: 100%;
  }
  .install-toast-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    white-space: nowrap;
    transition: background-color 0.15s ease, transform 0.1s ease;
    line-height: 1;
    flex: 1;
  }
  .install-toast-btn:active {
    transform: scale(0.97);
  }
  .install-toast-btn-primary {
    background-color: #1e7e34;
    color: #ffffff;
  }
  .install-toast-btn-primary:hover {
    background-color: #166228;
  }
  .install-toast-btn-secondary {
    background-color: #ffffff;
    color: #1e7e34;
    border: 1.5px solid #1e7e34;
  }
  .install-toast-btn-secondary:hover {
    background-color: #f0faf3;
  }
  .Toastify__toast.install-toast-wrapper {
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    padding: 16px;
    min-width: 320px;
    max-width: 400px;
    background: #ffffff;
    color: #1a1a1a;
    border-left: 6px solid #1e7e34;
  }
  .Toastify__toast.install-toast-wrapper .Toastify__toast-body {
    padding: 0;
    margin: 0;
    width: 100%;
  }
  .Toastify__toast.install-toast-wrapper .Toastify__close-button {
    color: #999;
    opacity: 0.6;
    align-self: flex-start;
    margin-top: -4px;
    margin-right: -4px;
  }
  .Toastify__toast.install-toast-wrapper .Toastify__close-button:hover {
    opacity: 1;
  }
`;

const isStandaloneDisplay = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true ||
  document.referrer.startsWith("android-app://");

const isInstallRoute = (pathname) =>
  pathname === "/" || pathname === "/home" || pathname.endsWith("/dashboard");

export default function InstallAppPrompt() {
  const { pathname } = useLocation();
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneDisplay());

  const shouldShowPrompt = useMemo(
    () => isInstallRoute(pathname) && !isInstalled && Boolean(deferredInstallPrompt),
    [pathname, isInstalled, deferredInstallPrompt]
  );

  // Inject styles once on mount
  useEffect(() => {
    const styleId = "install-toast-styles";
    if (document.getElementById(styleId)) return;
    const styleEl = document.createElement("style");
    styleEl.id = styleId;
    styleEl.textContent = INSTALL_TOAST_STYLES;
    document.head.appendChild(styleEl);
    return () => document.getElementById(styleId)?.remove();
  }, []);

  useEffect(() => {
    const displayModeQuery = window.matchMedia("(display-mode: standalone)");

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event);
      setIsInstalled(false);
    };

    const handleAppInstalled = () => {
      setDeferredInstallPrompt(null);
      setIsInstalled(true);
      toast.dismiss(INSTALL_TOAST_ID);
    };

    const handleDisplayModeChange = () => {
      const installed = isStandaloneDisplay();
      setIsInstalled(installed);
      if (installed) {
        setDeferredInstallPrompt(null);
        toast.dismiss(INSTALL_TOAST_ID);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    displayModeQuery.addEventListener?.("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      displayModeQuery.removeEventListener?.("change", handleDisplayModeChange);
      toast.dismiss(INSTALL_TOAST_ID);
    };
  }, []);

  useEffect(() => {
    if (!shouldShowPrompt) {
      toast.dismiss(INSTALL_TOAST_ID);
      return;
    }

    const triggerInstall = async () => {
      if (!deferredInstallPrompt) return;

      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;

      setDeferredInstallPrompt(null);
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      toast.dismiss(INSTALL_TOAST_ID);
    };

    toast.info(
      ({ closeToast }) => (
        <div className="install-toast">
          <div className="install-toast-content">
            <p className="install-toast-title">Install this app</p>
            <p className="install-toast-subtitle">Get quick access from your home screen.</p>
          </div>
          <div className="install-toast-actions">
            <button
              type="button"
              className="install-toast-btn install-toast-btn-primary"
              onClick={triggerInstall}
            >
              Install
            </button>
            <button
              type="button"
              className="install-toast-btn install-toast-btn-secondary"
              onClick={closeToast}
            >
              Not now
            </button>
          </div>
        </div>
      ),
      {
        toastId: INSTALL_TOAST_ID,
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        icon: false,
        className: "install-toast-wrapper",
      }
    );
  }, [shouldShowPrompt, deferredInstallPrompt]);

  return null;
}