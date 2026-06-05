import React from "react";
import CountUp from "../CountUp";

/**
 * StatPill — a compact stat chip with an animated counter, designed to sit on a
 * gradient hero banner. Numeric values animate up via the shared CountUp.
 *
 * Props:
 *  - value: number or string (e.g. 1240, "1,240", "12+")
 *  - label: caption under the value
 *  - icon: optional leading node
 *  - onClick: optional — renders as a button when provided
 */
export default function StatPill({ value, label, icon, onClick, className = "" }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-2xl border border-white/20 bg-white/15 px-3.5 py-2 text-left backdrop-blur-sm transition hover:bg-white/25 ${className}`}
    >
      {icon != null && (
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
          {icon}
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-lg font-extrabold leading-none text-white">
          <CountUp value={value} />
        </span>
        <span className="block truncate text-[11px] font-medium text-white/80">
          {label}
        </span>
      </span>
    </Tag>
  );
}
