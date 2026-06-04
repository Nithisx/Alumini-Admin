import React from "react";
import { Icons } from "./primitives";

/**
 * Hero action buttons (Edit / Delete / and custom extras) styled for the
 * emerald hero banner. Pass the handlers you need; omitted ones aren't rendered.
 *
 * Props:
 *   onEdit, editLabel
 *   onDelete, deleteLabel
 *   children — extra buttons (use HeroButton)
 */
export const HeroButton = ({ icon, children, tone = "neutral", className = "", ...rest }) => {
  const tones = {
    neutral: "bg-white/15 hover:bg-white/25 text-white",
    danger: "bg-red-500/90 hover:bg-red-600 text-white",
    light: "bg-white text-emerald-700 hover:bg-emerald-50",
  };
  return (
    <button
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm ${tones[tone]} ${className}`}
      {...rest}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
};

export default function HeroActions({ onEdit, editLabel = "Edit", onDelete, deleteLabel = "Delete", children }) {
  return (
    <>
      {children}
      {onEdit && (
        <HeroButton icon={Icons.edit} onClick={onEdit}>
          {editLabel}
        </HeroButton>
      )}
      {onDelete && (
        <HeroButton icon={Icons.trash} tone="danger" onClick={onDelete}>
          {deleteLabel}
        </HeroButton>
      )}
    </>
  );
}
