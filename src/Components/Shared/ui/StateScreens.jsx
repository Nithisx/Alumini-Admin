import React from "react";
import { DASHBOARD_THEME } from "../../../constants/dashboardTheme";
import { getErrorInfo, ERROR_KIND } from "../../../lib/errorMessage";

/**
 * Full-page loading / error screens, standardized on the DASHBOARD_THEME tokens
 * so every role/page shows the same branded spinner and error panel.
 */

export function LoadingScreen({ message = "Loading…" }) {
  return (
    <div className={DASHBOARD_THEME.loadingPage}>
      <div className={DASHBOARD_THEME.loadingWrap}>
        <div className={DASHBOARD_THEME.loadingSpinner} />
        <p className={DASHBOARD_THEME.loadingText}>{message}</p>
      </div>
    </div>
  );
}

/** Kind-specific icon so the user instantly reads what went wrong. */
function ErrorIcon({ kind }) {
  const base = "h-7 w-7 text-red-500";
  switch (kind) {
    case ERROR_KIND.OFFLINE:
    case ERROR_KIND.NETWORK:
      // wifi-off
      return (
        <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M18.364 5.636L5.636 18.364M8.111 8.111A9 9 0 003 12m9 9a.5.5 0 01-.354-.853L12 19.79l.354.357A.5.5 0 0112 21zm-3.182-6.182a4.5 4.5 0 016.364 0" />
        </svg>
      );
    case ERROR_KIND.TIMEOUT:
      // clock
      return (
        <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case ERROR_KIND.UNAUTHORIZED:
    case ERROR_KIND.FORBIDDEN:
      // lock
      return (
        <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    case ERROR_KIND.NOT_FOUND:
      // magnifier
      return (
        <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      );
    case ERROR_KIND.SERVER:
      // server
      return (
        <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-14 4h.01M17 16h.01" />
        </svg>
      );
    default:
      // alert
      return (
        <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

/**
 * Full-page error panel.
 *
 * Preferred usage — pass the raw `error` and let it classify (network /
 * unauthorized / not-found / server / offline …):
 *   <ErrorScreen error={err} onRetry={refetch} />
 *
 * Back-compat — an explicit `message`/`title` string still works and is also
 * run through the classifier so legacy strings like "Failed to fetch" upgrade
 * to friendly wording automatically.
 */
export function ErrorScreen({
  error,
  title,
  message,
  onRetry,
  retryLabel = "Try Again",
}) {
  // Prefer the raw error; otherwise classify whatever string was passed.
  const info = getErrorInfo(error ?? message ?? title);
  const resolvedTitle = title || info.title;
  const resolvedMessage = message && error == null ? message : info.message;

  return (
    <div className={DASHBOARD_THEME.loadingPage}>
      <div className={`anim-pop-in ${DASHBOARD_THEME.errorPanel}`}>
        <div className={DASHBOARD_THEME.errorIconWrap}>
          <ErrorIcon kind={info.kind} />
        </div>
        <h3 className={DASHBOARD_THEME.errorTitle}>{resolvedTitle}</h3>
        {resolvedMessage && <p className={DASHBOARD_THEME.errorBody}>{resolvedMessage}</p>}
        {onRetry && (
          <button onClick={onRetry} className={DASHBOARD_THEME.retryButton}>
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default LoadingScreen;
