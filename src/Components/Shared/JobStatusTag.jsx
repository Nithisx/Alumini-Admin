import React, { useState } from "react";
import { toast } from "react-toastify";
import { API_JOBS } from "../../config/api";

const JOBS_URL = API_JOBS;

const CONFIG = {
  open: {
    label: "Open",
    pill: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  closed: {
    label: "Closed",
    pill: "bg-rose-100 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
  },
};

const normalize = (value) =>
  String(value ?? "").toLowerCase() === "closed" ? "closed" : "open";

/**
 * JobStatusTag — the "Role Open/Close" badge for a job post.
 *
 * Renders a static pill for everyone. When `canManage` is true (post owner or
 * staff/admin) the pill becomes a button that toggles the role open/closed via
 * the existing `PUT /jobs/<id>/` endpoint (which already restricts writes to
 * owner/staff) and reports the new value through `onChange`.
 *
 * Props:
 *   status    : current status string ("open" | "closed")
 *   jobId     : job id used for the update request
 *   canManage : whether the viewer may toggle the status (default false)
 *   onChange  : (nextStatus) => void — called after a successful update
 *   size      : "sm" (default) | "lg"
 */
export default function JobStatusTag({
  status,
  jobId,
  canManage = false,
  onChange,
  size = "sm",
}) {
  const [busy, setBusy] = useState(false);
  const current = normalize(status);
  const conf = CONFIG[current];

  const sizeCls = size === "lg" ? "text-sm px-3 py-1" : "text-xs px-2 py-0.5";
  const base = `inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ${conf.pill} ${sizeCls}`;

  const toggle = async (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    if (!canManage || busy || !jobId) return;

    const next = current === "open" ? "closed" : "open";
    setBusy(true);
    try {
      const token = localStorage.getItem("Token");
      const body = new FormData();
      body.append("status", next);
      const res = await fetch(`${JOBS_URL}${jobId}/`, {
        method: "PUT",
        headers: { Authorization: token ? `Token ${token}` : "" },
        body,
      });
      if (!res.ok) throw new Error();
      onChange?.(next);
      toast.success(`Role marked ${CONFIG[next].label}`);
    } catch {
      toast.error("Failed to update role status.");
    } finally {
      setBusy(false);
    }
  };

  if (!canManage) {
    return (
      <span className={base} title={`Role ${conf.label}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
        {conf.label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      title={`Click to mark role ${current === "open" ? "Closed" : "Open"}`}
      className={`${base} cursor-pointer transition hover:brightness-95 hover:ring-2 disabled:opacity-60`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${conf.dot} ${busy ? "animate-pulse" : ""}`}
      />
      {busy ? "Saving…" : conf.label}
    </button>
  );
}
