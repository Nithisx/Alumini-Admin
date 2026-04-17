import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * ConfirmModal — styled replacement for window.confirm() and prompt("DELETE")
 *
 * Props:
 *  isOpen        boolean
 *  title         string
 *  message       string | ReactNode
 *  onConfirm     () => void
 *  onCancel      () => void
 *  confirmText   string  (default "Confirm")
 *  cancelText    string  (default "Cancel")
 *  danger        boolean — red confirm button
 *  requireTyping string  — if set, user must type this exact string to confirm
 *  bullets       string[] — optional bullet list under message
 */
export default function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  requireTyping,
  bullets,
}) {
  const [typed, setTyped] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTyped("");
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canConfirm = requireTyping ? typed === requireTyping : true;

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onCancel();
    if (e.key === "Enter" && canConfirm) onConfirm();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-modal-in"
        style={{ animation: "modalIn 0.18s ease" }}
      >
        {/* Top accent bar */}
        <div className={`h-1.5 w-full ${danger ? "bg-red-500" : "bg-green-500"}`} />

        <div className="px-6 pt-5 pb-6">
          {/* Icon + Title */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                danger ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
              }`}
            >
              {danger ? "⚠️" : "❓"}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 leading-tight">{title}</h3>
              {message && (
                <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{message}</p>
              )}
            </div>
          </div>

          {/* Bullet list */}
          {bullets?.length > 0 && (
            <ul className="mt-2 mb-3 ml-13 space-y-1 pl-12">
              {bullets.map((b, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          )}

          {/* Typing confirmation */}
          {requireTyping && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Type <span className="font-bold text-red-600">"{requireTyping}"</span> to confirm:
              </label>
              <input
                ref={inputRef}
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={requireTyping}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 border-gray-300"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-5 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={!canConfirm}
              className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed ${
                danger
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(-8px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}
