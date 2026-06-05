import React from "react";

/**
 * SectionHeader — a small in-page section title with an optional trailing
 * action (e.g. "See all"). Standardizes the "● Title  ……  Action" rows used
 * across feeds and dashboards.
 */
export default function SectionHeader({ title, icon, action, onAction, actionLabel, className = "" }) {
  return (
    <div className={`mb-3 flex items-center justify-between gap-3 ${className}`}>
      <h2 className="reveal-title flex items-center gap-2 text-base font-bold text-gray-900">
        {icon != null ? (
          icon
        ) : (
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-gray-300" />
        )}
        <span className="truncate">{title}</span>
      </h2>
      {action
        ? action
        : actionLabel && (
            <button
              type="button"
              onClick={onAction}
              className="flex-shrink-0 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
            >
              {actionLabel}
            </button>
          )}
    </div>
  );
}
