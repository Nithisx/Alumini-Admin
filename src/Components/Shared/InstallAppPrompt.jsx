import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";

const INSTALL_TOAST_ID = "install-app-notification";

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
      }
    );
  }, [shouldShowPrompt, deferredInstallPrompt]);

  return null;
}
