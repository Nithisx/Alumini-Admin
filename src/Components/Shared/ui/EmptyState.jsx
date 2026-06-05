import React from "react";
import { getSectionTheme } from "../../../constants/uiTheme";
import { Reveal } from "./motion";

/**
 * EmptyState — standardized "no results / nothing here yet" panel with a gentle
 * pop entrance. Replaces the ad-hoc empty blocks scattered across pages.
 *
 * Props:
 *  - icon: node shown in the accent circle
 *  - title: headline string
 *  - description: optional secondary line
 *  - section: section key / theme object for the accent circle
 *  - action: optional node (e.g. a button)
 */
export default function EmptyState({
  icon,
  title = "Nothing here yet",
  description,
  section,
  action,
  className = "",
}) {
  const theme = getSectionTheme(section);
  return (
    <Reveal
      variant="scaleIn"
      className={`rounded-2xl border border-gray-100 bg-white px-6 py-14 text-center shadow-sm ${className}`}
    >
      <div
        className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl ${theme.iconBg}`}
      >
        {icon}
      </div>
      <p className="font-semibold text-gray-700">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </Reveal>
  );
}
