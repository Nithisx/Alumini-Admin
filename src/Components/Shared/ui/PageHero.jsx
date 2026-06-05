import React from "react";
import { getSectionTheme } from "../../../constants/uiTheme";
import { Reveal } from "./motion";

/**
 * PageHero — opt-in gradient banner that gives a page a bold, branded header
 * block. Carries an animated dot-grid + light sheen (.ui-hero-deco) regardless
 * of accent color, so it stays consistent across sections.
 *
 * It is a leaf banner (never an ancestor of fixed elements), so the transform
 * `Reveal` entrance is safe here.
 *
 * Props:
 *  - section: section key (uiTheme.js) or theme object — drives the gradient
 *  - icon: optional leading node
 *  - title: string
 *  - subtitle: optional string
 *  - stats: optional node (e.g. a row of <StatPill>)
 *  - actions: optional node (buttons)
 *  - children: optional extra content
 */
export default function PageHero({
  section,
  icon,
  title,
  subtitle,
  stats,
  actions,
  children,
  className = "",
}) {
  const theme = getSectionTheme(section);

  return (
    <Reveal
      variant="riseIn"
      className={`ui-hero-deco relative isolate overflow-hidden rounded-2xl bg-gradient-to-r ${theme.gradient} px-5 py-6 text-white shadow-lg ${className}`}
    >
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          {icon != null && (
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl shadow-inner">
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold leading-tight drop-shadow-sm sm:text-2xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 max-w-xl text-sm text-white/85">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>

        {stats && <div className="flex flex-wrap gap-2.5">{stats}</div>}

        {children}
      </div>
    </Reveal>
  );
}
