import React, { useEffect, useState } from "react";

/**
 * App-wide connectivity banner. Mounted once at the app root so *every* page
 * gets a clear "you're offline" signal without per-page wiring.
 *
 * - Slides in a red bar the moment the browser goes offline.
 * - When connectivity returns, briefly shows a green "back online" bar, then
 *   auto-hides.
 */
export default function NetworkStatusBanner() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  // `justReconnected` lets us flash the green confirmation, then fade out.
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setOnline(false);
      setJustReconnected(false);
    };
    const handleOnline = () => {
      setOnline(true);
      setJustReconnected(true);
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    if (!justReconnected) return;
    const t = setTimeout(() => setJustReconnected(false), 3000);
    return () => clearTimeout(t);
  }, [justReconnected]);

  if (online && !justReconnected) return null;

  const offline = !online;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 top-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2 text-center text-sm font-medium text-white shadow-md transition-transform ${
        offline ? "bg-red-600" : "bg-emerald-600"
      }`}
    >
      {offline ? (
        <>
          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M18.364 5.636L5.636 18.364M8.111 8.111A9 9 0 003 12m9 9l.354-.353M8.818 14.818a4.5 4.5 0 016.364 0" />
          </svg>
          <span>You're offline — some features may not work until you reconnect.</span>
        </>
      ) : (
        <>
          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Back online</span>
        </>
      )}
    </div>
  );
}
