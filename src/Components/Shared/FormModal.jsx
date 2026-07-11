import React from "react";
import { createPortal } from "react-dom";

/**
 * FormModal — like ConfirmModal, but the body is arbitrary form content
 * (children) instead of a plain-text message. ConfirmModal wraps its
 * `message` prop in a <p>, so block-level form fields (inputs/selects)
 * passed through it produce invalid HTML nesting — use this instead
 * whenever the modal body needs real form controls.
 *
 * Props:
 *  isOpen          boolean
 *  title           string
 *  children        ReactNode — the form body
 *  onConfirm       () => void
 *  onCancel        () => void
 *  confirmText     string  (default "Confirm")
 *  cancelText      string  (default "Cancel")
 *  danger          boolean — red confirm button
 *  confirmDisabled boolean — disable the confirm button (e.g. required field empty)
 */
export default function FormModal({
  isOpen,
  title,
  children,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  confirmDisabled = false,
}) {
  if (!isOpen) return null;

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onCancel();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: "formModalIn 0.18s ease" }}
      >
        <div className={`h-1.5 w-full ${danger ? "bg-red-500" : "bg-emerald-500"}`} />
        <div className="px-6 pt-5 pb-6">
          <h3 className="text-base font-semibold text-gray-900 leading-tight mb-4">{title}</h3>

          {children}

          <div className="flex gap-3 mt-5 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={confirmDisabled}
              className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed ${
                danger ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes formModalIn {
          from { opacity: 0; transform: scale(0.94) translateY(-8px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}
