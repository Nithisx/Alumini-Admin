import React from "react";
import { getErrorInfo, ERROR_KIND } from "../../../lib/errorMessage";

/**
 * Inline error panel — for errors that live *inside* a page section (a feed, a
 * list, a card) rather than replacing the whole screen. Pass the raw `error`
 * and it classifies the wording/icon; `onRetry` renders a retry button.
 *
 *   {error ? <ErrorState error={error} onRetry={refetch} /> : <Feed … />}
 */
export default function ErrorState({
  error,
  title,
  message,
  onRetry,
  retryLabel = "Try Again",
  className = "",
}) {
  const info = getErrorInfo(error ?? message ?? title);
  const resolvedTitle = title || info.title;
  const resolvedMessage = message && error == null ? message : info.message;
  const danger =
    info.kind === ERROR_KIND.OFFLINE || info.kind === ERROR_KIND.NETWORK;

  return (
    <div
      role="alert"
      className={`rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center shadow-sm ${className}`}
    >
      <div
        className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
          danger ? "bg-amber-50" : "bg-red-50"
        }`}
      >
        <svg
          className={`h-6 w-6 ${danger ? "text-amber-500" : "text-red-500"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p className="font-semibold text-gray-800">{resolvedTitle}</p>
      {resolvedMessage && (
        <p className="mt-1 text-sm text-gray-500">{resolvedMessage}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
