import React from "react";
import { DASHBOARD_THEME } from "../../../constants/dashboardTheme";

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

export function ErrorScreen({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try Again",
}) {
  return (
    <div className={DASHBOARD_THEME.loadingPage}>
      <div className={`anim-pop-in ${DASHBOARD_THEME.errorPanel}`}>
        <div className={DASHBOARD_THEME.errorIconWrap}>
          <svg className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className={DASHBOARD_THEME.errorTitle}>{title}</h3>
        {message && <p className={DASHBOARD_THEME.errorBody}>{message}</p>}
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
