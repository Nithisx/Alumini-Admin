import React from "react";
import { getSectionTheme } from "../../../constants/uiTheme";

/**
 * PageHeader — standardized sticky page header used across every role/page.
 *
 * Layout: [accent icon chip] [title + optional subtitle]  …  [search]  [actions]
 *
 * Styling: a translucent "glass" bar (.glass-header) that stays readable while
 * content scrolls underneath. It animates with OPACITY ONLY via CSS (no
 * transform) so it is safe above `position: fixed` descendants.
 *
 * Props:
 *  - icon: a React node (lucide / FontAwesome / emoji) shown in the accent chip
 *  - title: string
 *  - subtitle: optional string under the title
 *  - section: section key (see uiTheme.js) or a theme object — drives the accent
 *  - search: optional node rendered as a flex-grow search slot
 *  - actions: optional node rendered at the trailing edge
 *  - below: optional node rendered as a second row (e.g. tabs / category pills)
 *  - maxWidth: container max-width class (default "max-w-2xl")
 *  - sticky: whether the header sticks (default true)
 *  - className: extra classes for the inner row
 */
export default function PageHeader({
  icon,
  title,
  subtitle,
  section,
  search,
  actions,
  below,
  maxWidth = "max-w-2xl",
  sticky = true,
  className = "",
}) {
  const theme = getSectionTheme(section);

  return (
    <div
      className={`glass-header anim-fade-in ${
        sticky ? "sticky top-0" : ""
      } z-30 border-b border-gray-200/70`}
    >
      <div className={`${maxWidth} mx-auto px-4 py-3`}>
        <div className={`flex items-center gap-3 ${className}`}>
          {icon != null && (
            <span
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-base shadow-sm ${theme.iconBg}`}
            >
              {icon}
            </span>
          )}

          <div className="min-w-0 flex-shrink-0">
            <h1 className="reveal-title truncate text-base font-bold leading-tight text-gray-900">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-xs text-gray-400">{subtitle}</p>
            )}
          </div>

          {search && <div className="relative min-w-0 flex-1">{search}</div>}

          {actions && (
            <div className="ml-auto flex flex-shrink-0 items-center gap-2">
              {actions}
            </div>
          )}
        </div>

        {below && <div className="mt-2">{below}</div>}
      </div>
    </div>
  );
}
