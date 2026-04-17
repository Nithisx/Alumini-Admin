import { useEffect, useMemo, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faDownload,
  faTimes,
  faEye,
  faSearch,
  faChevronLeft,
  faChevronRight,
  faRotateRight,
  faCircleCheck,
  faCircleXmark,
  faUserSlash,
} from "@fortawesome/free-solid-svg-icons";

const API_BASE = "https://api.karpagamalumni.in/api/v1";

const CATEGORIES = ["AUTH", "PROFILE", "CONTENT", "CHAT", "ADMIN", "OTHER"];
const METHODS = ["GET", "POST", "PATCH", "PUT", "DELETE", "WS"];

const CATEGORY_COLORS = {
  AUTH: "bg-blue-50 text-blue-700 border-blue-200",
  PROFILE: "bg-purple-50 text-purple-700 border-purple-200",
  CONTENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CHAT: "bg-amber-50 text-amber-700 border-amber-200",
  ADMIN: "bg-rose-50 text-rose-700 border-rose-200",
  OTHER: "bg-gray-50 text-gray-700 border-gray-200",
};

function formatTimestamp(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function buildQuery(filters, extras = {}) {
  const params = new URLSearchParams();
  Object.entries({ ...filters, ...extras }).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) params.set(k, v);
  });
  return params.toString();
}

function StatusBadge({ code }) {
  if (code == null) return <span className="text-gray-400">-</span>;
  const ok = code >= 200 && code < 400;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      <FontAwesomeIcon icon={ok ? faCircleCheck : faCircleXmark} className="h-3 w-3" />
      {code}
    </span>
  );
}

function DetailModal({ log, onClose }) {
  if (!log) return null;
  const userDisp = log.user_display || {};
  const meta = log.metadata || {};
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Audit Log #{log.id}</h3>
            <p className="text-sm text-gray-500">{formatTimestamp(log.timestamp)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 space-y-5">
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Actor</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Username</div>
                <div className="font-medium flex items-center gap-2">
                  {log.actor_username || "anonymous"}
                  {userDisp.deleted && (
                    <span className="inline-flex items-center gap-1 text-xs text-rose-600">
                      <FontAwesomeIcon icon={faUserSlash} /> deleted
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Role</div>
                <div className="font-medium">{log.actor_role || "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">IP</div>
                <div className="font-mono text-xs">{log.ip || "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">User Agent</div>
                <div className="font-mono text-xs truncate" title={log.user_agent}>
                  {log.user_agent || "-"}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Action</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Action</div>
                <div className="font-mono font-semibold text-gray-800">{log.action}</div>
              </div>
              <div>
                <div className="text-gray-500">Category</div>
                <span
                  className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${
                    CATEGORY_COLORS[log.category] || CATEGORY_COLORS.OTHER
                  }`}
                >
                  {log.category}
                </span>
              </div>
              <div>
                <div className="text-gray-500">Method</div>
                <div className="font-mono">{log.method || "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Status</div>
                <StatusBadge code={log.status_code} />
              </div>
              <div className="col-span-2">
                <div className="text-gray-500">Path</div>
                <div className="font-mono text-xs break-all">{log.path || "-"}</div>
              </div>
            </div>
          </section>

          {(log.target_type || log.target_repr) && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Target</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">Type</div>
                  <div className="font-medium">{log.target_type || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500">ID</div>
                  <div className="font-mono">{log.target_id || "-"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-500">Summary</div>
                  <div className="break-words">{log.target_repr || "-"}</div>
                </div>
              </div>
            </section>
          )}

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Metadata</h4>
            <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs overflow-x-auto max-h-80">
              {Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "(empty)"}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [showFilters, setShowFilters] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    username: "",
    role: "",
    category: "",
    action: "",
    method: "",
    target_type: "",
    status_code: "",
    date_from: "",
    date_to: "",
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("Token") : null;
  const headers = useMemo(
    () => ({ Authorization: `Token ${token}`, "Content-Type": "application/json" }),
    [token]
  );

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildQuery(filters, { page, page_size: pageSize });
      const res = await fetch(`${API_BASE}/audit-logs/?${qs}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(data.results || []);
      setCount(data.count || 0);
    } catch (e) {
      setError(e.message || "Failed to load audit logs");
      setLogs([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize, headers]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const openDetail = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/audit-logs/${id}/`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSelected(data);
    } catch (e) {
      alert("Failed to load log detail: " + e.message);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (logs.every((l) => selectedIds.has(l.id))) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        logs.forEach((l) => next.delete(l.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        logs.forEach((l) => next.add(l.id));
        return next;
      });
    }
  };

  const resetFilters = () => {
    setFilters({
      search: "", username: "", role: "", category: "", action: "",
      method: "", target_type: "", status_code: "", date_from: "", date_to: "",
    });
    setPage(1);
  };

  const doExport = async (format, scope) => {
    setExporting(true);
    setShowExportMenu(false);
    try {
      const extras = { format };
      if (scope === "selected") {
        if (!selectedIds.size) {
          alert("No logs selected.");
          setExporting(false);
          return;
        }
        extras.ids = Array.from(selectedIds).join(",");
      }
      const filtersToSend = scope === "all" ? {} : filters;
      const qs = buildQuery(filtersToSend, extras);
      const res = await fetch(`${API_BASE}/audit-logs/export/?${qs}`, { headers });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().slice(0, 19)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export failed: " + e.message);
    } finally {
      setExporting(false);
    }
  };

  const updateFilter = (k, v) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };

  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
          <p className="text-sm text-gray-500">Every write action and chat message across the portal</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faFilter} />
            Filters
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faRotateRight} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu((s) => !s)}
              disabled={exporting}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faDownload} />
              {exporting ? "Exporting..." : "Export"}
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-30 overflow-hidden">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">Export scope</div>
                {[
                  ["filtered", "Current filters"],
                  ["all", "All logs (ignore filters)"],
                  ["selected", `Selected (${selectedIds.size})`],
                ].map(([scope, label]) => (
                  <div key={scope} className="border-b last:border-b-0">
                    <div className="px-4 py-1.5 text-xs text-gray-500">{label}</div>
                    <div className="flex">
                      {["csv", "json", "pdf"].map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => doExport(fmt, scope)}
                          className="flex-1 px-2 py-2 text-xs font-medium uppercase hover:bg-emerald-50"
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="col-span-2 lg:col-span-2">
              <label className="text-xs font-medium text-gray-500">Search</label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5"
                />
                <input
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  placeholder="User, action, path, IP, target..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Username</label>
              <input
                value={filters.username}
                onChange={(e) => updateFilter("username", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Role</label>
              <select
                value={filters.role}
                onChange={(e) => updateFilter("role", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              >
                <option value="">All</option>
                <option value="admin">Admin</option>
                <option value="superuser">Superuser</option>
                <option value="alumni">Alumni</option>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Category</label>
              <select
                value={filters.category}
                onChange={(e) => updateFilter("category", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              >
                <option value="">All</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Action contains</label>
              <input
                value={filters.action}
                onChange={(e) => updateFilter("action", e.target.value.toUpperCase())}
                placeholder="e.g. LOGIN_USER"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Method</label>
              <select
                value={filters.method}
                onChange={(e) => updateFilter("method", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              >
                <option value="">All</option>
                {METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Target type</label>
              <input
                value={filters.target_type}
                onChange={(e) => updateFilter("target_type", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Status code</label>
              <input
                value={filters.status_code}
                onChange={(e) => updateFilter("status_code", e.target.value)}
                placeholder="e.g. 200"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">From</label>
              <input
                type="datetime-local"
                value={filters.date_from}
                onChange={(e) => updateFilter("date_from", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">To</label>
              <input
                type="datetime-local"
                value={filters.date_to}
                onChange={(e) => updateFilter("date_to", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={resetFilters}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600 tracking-wide">
              <tr>
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={logs.length > 0 && logs.every((l) => selectedIds.has(l.id))}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-3 py-3 text-left">Time</th>
                <th className="px-3 py-3 text-left">User</th>
                <th className="px-3 py-3 text-left">Action</th>
                <th className="px-3 py-3 text-left">Category</th>
                <th className="px-3 py-3 text-left">Target</th>
                <th className="px-3 py-3 text-left">Method</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-left">IP</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10} className="px-3 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={10} className="px-3 py-12 text-center text-rose-600">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && logs.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-12 text-center text-gray-400">
                    No audit logs match the current filters.
                  </td>
                </tr>
              )}
              {!loading && !error && logs.map((log) => {
                const ud = log.user_display || {};
                return (
                  <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(log.id)}
                        onChange={() => toggleSelect(log.id)}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-mono text-gray-600">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">
                          {log.actor_username || "anonymous"}
                        </span>
                        {ud.deleted && (
                          <FontAwesomeIcon
                            icon={faUserSlash}
                            title="User deleted"
                            className="text-rose-500 h-3 w-3"
                          />
                        )}
                      </div>
                      {log.actor_role && (
                        <div className="text-xs text-gray-400">{log.actor_role}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{log.action}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${
                          CATEGORY_COLORS[log.category] || CATEGORY_COLORS.OTHER
                        }`}
                      >
                        {log.category}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs max-w-[240px] truncate" title={log.target_repr}>
                      {log.target_repr || log.target_type || "-"}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{log.method || "-"}</td>
                    <td className="px-3 py-2"><StatusBadge code={log.status_code} /></td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">{log.ip || "-"}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => openDetail(log.id)}
                        className="text-emerald-600 hover:text-emerald-700 text-xs font-medium"
                      >
                        <FontAwesomeIcon icon={faEye} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm">
          <div className="text-gray-500">
            {count.toLocaleString()} entries · page {page} of {totalPages}
            {selectedIds.size > 0 && (
              <span className="ml-3 text-emerald-600 font-medium">
                {selectedIds.size} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded border border-gray-200 bg-white disabled:opacity-50 hover:bg-gray-100"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded border border-gray-200 bg-white disabled:opacity-50 hover:bg-gray-100"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      </div>

      <DetailModal log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
