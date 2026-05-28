"use client";

import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { API_BASE } from "../../../config/api";

const API_IMPORT   = `${API_BASE}/members/import/`;
const API_TEMPLATE = `${API_BASE}/members/import/`;   // GET on same endpoint

const token = () => localStorage.getItem("Token");

// ── Tiny helpers ────────────────────────────────────────────────────────────

function StatCard({ label, count, color, icon }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl px-6 py-5 shadow-sm border ${color}`}>
      <div className="text-3xl font-extrabold">{count}</div>
      <div className="flex items-center gap-1.5 mt-1 text-sm font-medium opacity-80">
        {icon}
        {label}
      </div>
    </div>
  );
}

function ResultSection({ title, color, items, emptyMsg, renderRow }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <div className={`rounded-2xl border overflow-hidden ${color.border}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold ${color.header} transition`}
      >
        <span>{title} ({items.length})</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-5 py-3 text-sm text-gray-400 italic">{emptyMsg}</p>
          ) : (
            items.map((item, i) => (
              <div key={i} className="px-5 py-2.5 text-xs font-mono text-gray-700">
                {renderRow(item)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function MemberImport() {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile]         = useState(null);
  const [sendEmails, setSendEmails] = useState(true);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);   // import result from API

  // ── File handling ──────────────────────────────────────────────────────────

  const acceptFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext)) {
      toast.error("Only .csv or .xlsx files are accepted.");
      return;
    }
    setFile(f);
    setResult(null);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files[0]);
  };

  const onPickFile = (e) => acceptFile(e.target.files[0]);

  const clearFile = () => {
    setFile(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Download sample template ───────────────────────────────────────────────

  const downloadTemplate = async () => {
    try {
      const res = await fetch(API_TEMPLATE, {
        method: "GET",
        headers: { Authorization: `Token ${token()}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "member_import_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download the template. Please try again.");
    }
  };

  // ── Import ────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file before importing.");
      return;
    }
    setLoading(true);
    setResult(null);

    const form = new FormData();
    form.append("file", file);
    form.append("send_emails", sendEmails ? "true" : "false");

    try {
      const res = await fetch(API_IMPORT, {
        method: "POST",
        headers: { Authorization: `Token ${token()}` },
        body: form,
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Import failed. Check the file and try again.");
        setLoading(false);
        return;
      }

      setResult(data);
      if (data.summary.created > 0) toast.success(data.message);
      else if (data.summary.updated > 0) toast.info(data.message);
      else toast.warn("No users were created or updated. Check the skipped list.");
    } catch {
      toast.error("Network error while importing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const fileExt = file?.name.split(".").pop().toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Import Members
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload a CSV or Excel file to bulk-onboard alumni and staff into the portal.
            Each new member's initial password is set to their Date of Birth (DDMMYYYY).
          </p>
        </div>

        {/* ── Step 1 — download template ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm">Step 1 — Download the sample template</p>
              <p className="text-xs text-gray-500 mt-0.5">
                The template contains all supported columns with a sample row and
                instructions. Required fields are highlighted in the header.
              </p>
              <button
                onClick={downloadTemplate}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-700 text-white text-xs font-semibold
                           hover:bg-green-800 active:scale-95 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Template (.xlsx)
              </button>
            </div>
          </div>

          {/* Column format hint */}
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-green-700 font-semibold select-none">
              View expected column headers
            </summary>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                "email","first_name","last_name","date_of_birth","phone","role",
                "college_name","course","branch","stream","roll_no","passed_out_year",
                "course_start_year","course_end_year","gender","salutation",
                "Address","city","state","country","zip_code",
                "company","position","current_work","work_experience",
                "professional_skills","industries_worked_in","chapter",
                "linkedin_link","twitter_link","facebook_link","website_link","bio",
              ].map((col) => (
                <span
                  key={col}
                  className={`px-2 py-0.5 rounded-full text-xs font-mono
                    ${["email","first_name","last_name","date_of_birth"].includes(col)
                      ? "bg-green-100 text-green-800 ring-1 ring-green-300"
                      : "bg-gray-100 text-gray-600"}`}
                >
                  {col}
                </span>
              ))}
              <span className="px-2 py-0.5 rounded-full text-xs text-gray-400 italic">+ more…</span>
            </div>
            <p className="mt-1.5 text-xs text-green-700">
              Green = required &nbsp;|&nbsp; Grey = optional
            </p>
          </details>
        </div>

        {/* ── Step 2 — upload file ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
          <p className="font-semibold text-gray-800 text-sm">Step 2 — Upload your file</p>

          {/* Drop zone */}
          {!file ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`w-full border-2 border-dashed rounded-2xl py-12 flex flex-col items-center gap-3 cursor-pointer transition
                ${dragging
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50/50"}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition
                ${dragging ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">
                  {dragging ? "Drop your file here" : "Drag & drop or click to browse"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Accepts .xlsx or .csv files</p>
              </div>
            </button>
          ) : (
            /* File selected state */
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-200">
              <div className="w-10 h-10 rounded-xl bg-green-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {fileExt}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB &middot; ready to import
                </p>
              </div>
              <button
                onClick={clearFile}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                title="Remove file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={onPickFile}
          />

          {/* Options */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setSendEmails((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${sendEmails ? "bg-green-600" : "bg-gray-300"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                ${sendEmails ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Send welcome emails to new members</p>
              <p className="text-xs text-gray-400">Sends credentials and a portal link to each newly created account.</p>
            </div>
          </label>
        </div>

        {/* ── Import button ──────────────────────────────────────────────── */}
        <button
          onClick={handleImport}
          disabled={!file || loading}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-green-700 text-white
                     font-semibold text-sm shadow-sm hover:bg-green-800 active:scale-[0.98]
                     disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Members
            </>
          )}
        </button>

        {/* ── Import results ─────────────────────────────────────────────── */}
        {result && (
          <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Created"
                count={result.summary.created}
                color="bg-green-50 border-green-200 text-green-800"
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                }
              />
              <StatCard
                label="Updated"
                count={result.summary.updated}
                color="bg-blue-50 border-blue-200 text-blue-800"
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                }
              />
              <StatCard
                label="Skipped"
                count={result.summary.skipped}
                color={result.summary.skipped > 0
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-gray-50 border-gray-200 text-gray-500"}
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
              />
            </div>

            <p className="text-center text-sm text-gray-600">{result.message}</p>

            {/* Expandable detail lists */}
            <ResultSection
              title="Created"
              color={{ border: "border-green-200", header: "bg-green-50 text-green-800 hover:bg-green-100" }}
              items={result.created}
              emptyMsg="No users created."
              renderRow={(item) => (
                <span>
                  <span className="text-gray-400">Row {item.row}</span>
                  {" · "}
                  <span className="font-semibold text-gray-800">{item.name || "—"}</span>
                  {" · "}
                  <span className="text-green-700">{item.email}</span>
                </span>
              )}
            />
            <ResultSection
              title="Updated"
              color={{ border: "border-blue-200", header: "bg-blue-50 text-blue-800 hover:bg-blue-100" }}
              items={result.updated}
              emptyMsg="No users updated."
              renderRow={(item) => (
                <span>
                  <span className="text-gray-400">Row {item.row}</span>
                  {" · "}
                  <span className="font-semibold text-gray-800">{item.name || "—"}</span>
                  {" · "}
                  <span className="text-blue-700">{item.email}</span>
                </span>
              )}
            />
            <ResultSection
              title="Skipped / Errors"
              color={{ border: "border-red-200", header: "bg-red-50 text-red-800 hover:bg-red-100" }}
              items={result.skipped}
              emptyMsg="No rows were skipped."
              renderRow={(item) => (
                <span>
                  <span className="text-gray-400">Row {item.row}</span>
                  {item.email && <>{" · "}<span className="text-red-700">{item.email}</span></>}
                  {" · "}
                  <span className="text-gray-600 italic">{item.reason}</span>
                </span>
              )}
            />

            {/* Import another file */}
            <button
              onClick={clearFile}
              className="w-full py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600
                         hover:bg-gray-50 transition font-medium"
            >
              Import another file
            </button>
          </div>
        )}

        {/* ── Notes ─────────────────────────────────────────────────────── */}
        {!result && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 space-y-1.5">
            <p className="font-semibold text-amber-900">Notes</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>If a user with the same email already exists, their profile will be <strong>updated</strong> (not duplicated).</li>
              <li>The initial password is the <strong>Date of Birth in DDMMYYYY format</strong> (e.g. 15 May 1998 → <code>15051998</code>).</li>
              <li>If DOB is missing, the default password <code>Alumni@123</code> is used.</li>
              <li>Welcome emails are only sent to <strong>newly created</strong> accounts, not updated ones.</li>
              <li>Multi-value columns like <code>professional_skills</code> should be comma-separated.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
