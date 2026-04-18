import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAuditLogs, fetchAuditFilters, fetchAuditDetail, setPage as setReduxPage, clearSelected } from "../../../store/auditSlice";
import { toast } from "react-toastify";
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
  faXmark,
  faBan,
  faShield,
  faPlus,
  faPencilAlt,
  faTrash,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";

const API_BASE = "https://api.karpagamalumni.in/api/v1";

const CATEGORIES = ["AUTH", "PROFILE", "CONTENT", "CHAT", "ADMIN", "OTHER"];
const METHODS = ["GET", "POST", "PATCH", "PUT", "DELETE", "WS"];

// Human-readable descriptions for common HTTP status codes shown in tooltips
const STATUS_CODE_LABELS = {
  200: "OK — Request succeeded",
  201: "Created — Resource created successfully",
  204: "No Content — Request succeeded, nothing to return",
  301: "Moved Permanently — Resource has a new URL",
  302: "Found — Temporary redirect",
  304: "Not Modified — Cached version is still valid",
  400: "Bad Request — Invalid data sent",
  401: "Unauthorized — Login required",
  403: "Forbidden — You don't have permission",
  404: "Not Found — Resource doesn't exist",
  405: "Method Not Allowed — Action not supported",
  409: "Conflict — Duplicate or conflicting data",
  422: "Unprocessable Entity — Validation error",
  429: "Too Many Requests — Rate limit exceeded",
  500: "Internal Server Error — Something went wrong on the server",
  502: "Bad Gateway — Upstream server error",
  503: "Service Unavailable — Server is down or overloaded",
};

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
    if (v !== "" && v !== null && v !== undefined) {
      // Arrays (multi-select) are joined with commas
      if (Array.isArray(v)) {
        if (v.length > 0) params.set(k, v.join(","));
      } else {
        params.set(k, v);
      }
    }
  });
  return params.toString();
}

// Multi-value tag input used for action, status_code, target_type
function TagInput({ values, onChange, suggestions = [], placeholder }) {
  const [input, setInput] = useState("");
  const [showSug, setShowSug] = useState(false);
  const wrapRef = useRef(null);

  const filtered = useMemo(() => {
    if (!input.trim()) return suggestions.filter((s) => !values.includes(String(s)));
    return suggestions
      .filter((s) => String(s).toLowerCase().includes(input.toLowerCase()) && !values.includes(String(s)))
      .slice(0, 12);
  }, [input, suggestions, values]);

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSug(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const addValue = (v) => {
    const s = String(v).trim();
    if (s && !values.includes(s)) onChange([...values, s]);
    setInput("");
    setShowSug(false);
  };

  const removeValue = (v) => onChange(values.filter((x) => x !== v));

  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      addValue(input.trim());
    } else if (e.key === "Backspace" && !input && values.length) {
      removeValue(values[values.length - 1]);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <div
        className="flex flex-wrap gap-1 min-h-[36px] px-2 py-1 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-emerald-400 bg-white cursor-text"
        onClick={() => wrapRef.current?.querySelector("input")?.focus()}
      >
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-medium"
          >
            {v}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeValue(v); }}
              className="hover:text-emerald-600"
            >
              <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSug(true); }}
          onFocus={() => setShowSug(true)}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[80px] text-sm outline-none bg-transparent py-0.5"
        />
      </div>
      {showSug && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg text-sm">
          {filtered.map((s) => (
            <li
              key={s}
              onMouseDown={(e) => { e.preventDefault(); addValue(s); }}
              className="px-3 py-1.5 hover:bg-emerald-50 cursor-pointer font-mono"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Autocomplete input for plain single-value fields (username)
function AutocompleteInput({ value, onChange, suggestions = [], placeholder, className }) {
  const [showSug, setShowSug] = useState(false);
  const wrapRef = useRef(null);

  const filtered = useMemo(() => {
    if (!value.trim()) return suggestions.slice(0, 10);
    return suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase())).slice(0, 10);
  }, [value, suggestions]);

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSug(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setShowSug(true); }}
        onFocus={() => setShowSug(true)}
        placeholder={placeholder}
        className={className}
      />
      {showSug && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg text-sm">
          {filtered.map((s) => (
            <li
              key={s}
              onMouseDown={(e) => { e.preventDefault(); onChange(s); setShowSug(false); }}
              className="px-3 py-1.5 hover:bg-emerald-50 cursor-pointer"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Bug 3: StatusBadge with tooltip explaining what the code means
function StatusBadge({ code }) {
  if (code == null) return <span className="text-gray-400">-</span>;
  const ok = code >= 200 && code < 400;
  const label = STATUS_CODE_LABELS[code] || (ok ? "Success" : "Error");
  return (
    <span
      title={label}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono cursor-default select-none ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      <FontAwesomeIcon icon={ok ? faCircleCheck : faCircleXmark} className="h-3 w-3" />
      {code}
    </span>
  );
}

// Bug 6: DetailModal — always show Target section, full user_agent (no truncation)
function DetailModal({ log, onClose }) {
  if (!log) return null;
  const userDisp = log.user_display || {};
  const meta = log.metadata || {};
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Audit Log #{log.id || "-"}</h3>
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
                <div className="text-gray-500">Location</div>
                <div className="text-xs">{log.location || "-"}</div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500">User Agent</div>
                {/* Bug 6: show full user_agent, no truncation */}
                <div className="font-mono text-xs break-words whitespace-pre-wrap">
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
                <div className="font-mono font-semibold text-gray-800">{log.action || "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Category</div>
                <span
                  className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${
                    CATEGORY_COLORS[log.category] || CATEGORY_COLORS.OTHER
                  }`}
                >
                  {log.category || "-"}
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

          {/* Bug 6: always show Target section — don't hide when fields are empty */}
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

const ENTITY_TYPES = ["ip", "username", "email"];
const MODES = ["block", "whitelist"];

const MODE_COLORS = {
  block: "bg-rose-50 text-rose-700 border-rose-200",
  whitelist: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const ENTITY_TYPE_ICONS = {
  ip: faBan,
  username: faUserSlash,
  email: faSearch,
};

function BlockEntityForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(
    initial || { entity_type: "ip", value: "", mode: "block", reason: "" }
  );

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Type</label>
          <select
            value={form.entity_type}
            onChange={(e) => handleChange("entity_type", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
          >
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Mode</label>
          <select
            value={form.mode}
            onChange={(e) => handleChange("mode", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
          >
            {MODES.map((m) => (
              <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-500 block mb-1">
            Value ({form.entity_type === "ip" ? "IP address" : form.entity_type})
          </label>
          <input
            value={form.value}
            onChange={(e) => handleChange("value", e.target.value)}
            placeholder={
              form.entity_type === "ip" ? "e.g. 203.0.113.42"
              : form.entity_type === "username" ? "e.g. john_doe"
              : "e.g. user@example.com"
            }
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none font-mono"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-500 block mb-1">Reason (optional)</label>
          <input
            value={form.reason}
            onChange={(e) => handleChange("reason", e.target.value)}
            placeholder="Why is this entry blocked / whitelisted?"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.value.trim()}
          className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

function BlockManagementTab() {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterMode, setFilterMode] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("Token") : null;
  const headers = useMemo(
    () => ({ Authorization: `Token ${token}`, "Content-Type": "application/json" }),
    [token]
  );

  const fetchEntities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("entity_type", filterType);
      if (filterMode) params.set("mode", filterMode);
      if (search) params.set("search", search);
      const res = await fetch(`${API_BASE}/blocked-entities/?${params}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEntities(data);
    } catch (e) {
      toast.error("Failed to load blocked entities: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterMode, search, headers]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/blocked-entities/`, {
        method: "POST",
        headers,
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.value?.[0] || data.detail || JSON.stringify(data));
      toast.success(`${form.mode === "block" ? "Blocked" : "Whitelisted"} ${form.entity_type}: ${form.value}`);
      setShowForm(false);
      fetchEntities();
    } catch (e) {
      toast.error("Failed to save: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id, form) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/blocked-entities/${id}/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || JSON.stringify(data));
      toast.success("Entry updated.");
      setEditingId(null);
      setEditDraft(null);
      fetchEntities();
    } catch (e) {
      toast.error("Failed to update: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Remove "${label}" from the list?`)) return;
    try {
      const res = await fetch(`${API_BASE}/blocked-entities/${id}/`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Entry removed.");
      fetchEntities();
    } catch (e) {
      toast.error("Failed to delete: " + e.message);
    }
  };

  const startEdit = (entity) => {
    setEditingId(entity.id);
    setEditDraft({ entity_type: entity.entity_type, value: entity.value, mode: entity.mode, reason: entity.reason || "" });
    setShowForm(false);
  };

  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Block / Whitelist Management</h1>
          <p className="text-sm text-gray-500">Control access by IP address, username, or email</p>
        </div>
        <button
          onClick={() => { setShowForm((s) => !s); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <FontAwesomeIcon icon={faPlus} />
          Add Entry
        </button>
      </div>

      {showForm && (
        <div className="mb-4">
          <BlockEntityForm
            onSave={handleCreate}
            onCancel={() => setShowForm(false)}
            saving={saving}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            >
              <option value="">All</option>
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Mode</label>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            >
              <option value="">All</option>
              <option value="block">Blocked</option>
              <option value="whitelist">Whitelisted</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-500">Search value</label>
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search IP, username, email..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600 tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Value</th>
                <th className="px-4 py-3 text-left">Mode</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="px-4 py-3 text-left">Added By</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Loading...</td></tr>
              )}
              {!loading && entities.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No entries found.</td></tr>
              )}
              {!loading && entities.map((entity) => (
                <tr key={entity.id} className="border-t border-gray-100 hover:bg-gray-50">
                  {editingId === entity.id ? (
                    <td colSpan={7} className="px-4 py-3">
                      <BlockEntityForm
                        initial={editDraft}
                        onSave={(form) => handleUpdate(entity.id, form)}
                        onCancel={() => { setEditingId(null); setEditDraft(null); }}
                        saving={saving}
                      />
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          <FontAwesomeIcon icon={ENTITY_TYPE_ICONS[entity.entity_type] || faBan} className="h-3 w-3" />
                          {entity.entity_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-medium text-gray-800">{entity.value}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold ${MODE_COLORS[entity.mode] || ""}`}>
                          <FontAwesomeIcon icon={entity.mode === "block" ? faBan : faShield} className="mr-1 h-3 w-3" />
                          {entity.mode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate" title={entity.reason}>
                        {entity.reason || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{entity.created_by_username || "-"}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">
                        {entity.created_at ? new Date(entity.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(entity)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <FontAwesomeIcon icon={faPencilAlt} className="mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(entity.id, `${entity.entity_type}:${entity.value}`)}
                            className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                          >
                            <FontAwesomeIcon icon={faTrash} className="mr-1" />
                            Remove
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm text-gray-500">
          {entities.length} {entities.length === 1 ? "entry" : "entries"}
        </div>
      </div>
    </div>
  );
}

function AuditLogsTab() {
  const dispatch = useDispatch();
  const { logs, count, page, loading, error, filterOptions, selectedLog: selected, detailLoading } = useSelector((s) => s.audit);

  const [localPage, setLocalPage] = useState(page);
  const [pageSize] = useState(25);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [showFilters, setShowFilters] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    username: "",
    role: "",
    category: "",
    action: [],
    method: "",
    target_type: [],
    status_code: [],
    date_from: "",
    date_to: "",
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("Token") : null;
  const headers = useMemo(
    () => ({ Authorization: `Token ${token}`, "Content-Type": "application/json" }),
    [token]
  );

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  // Fetch filter options on mount
  useEffect(() => {
    dispatch(fetchAuditFilters());
  }, [dispatch]);

  // Re-fetch username suggestions when username filter changes (debounced)
  const usernameSuggestionsRef = useRef([]);
  useEffect(() => {
    usernameSuggestionsRef.current = filterOptions.usernames || [];
    if (!filters.username) return;
    const t = setTimeout(() => {
      dispatch(fetchAuditFilters(filters.username));
    }, 250);
    return () => clearTimeout(t);
  }, [filters.username, dispatch, filterOptions.usernames]);

  const fetchLogs = useCallback(() => {
    dispatch(fetchAuditLogs({ page: localPage, filters: { ...filters, page_size: pageSize } }));
  }, [dispatch, filters, localPage, pageSize]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh every 30 seconds to keep audit log up to date
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchAuditLogs({ page: localPage, filters: { ...filters, page_size: pageSize } }));
    }, 10000);
    return () => clearInterval(interval);
  }, [dispatch, filters, localPage, pageSize]);

  const setPage = (p) => {
    setLocalPage(p);
    dispatch(setReduxPage(p));
  };

  const openDetail = (id) => {
    dispatch(fetchAuditDetail(id));
  };

  const closeDetail = () => {
    dispatch(clearSelected());
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
      search: "", username: "", role: "", category: "",
      action: [], method: "", target_type: [], status_code: [],
      date_from: "", date_to: "",
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
          toast.warning("No logs selected.");
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
      toast.error("Export failed: " + e.message);
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
          <p className="text-sm text-gray-500">Every API call across the portal — authorized or not. Auto-refreshes every 30s.</p>
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
            {/* Search */}
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

            {/* Username with autocomplete suggestions */}
            <div>
              <label className="text-xs font-medium text-gray-500">Username</label>
              <AutocompleteInput
                value={filters.username}
                onChange={(v) => updateFilter("username", v)}
                suggestions={usernameSuggestionsRef.current.length ? usernameSuggestionsRef.current : filterOptions.usernames}
                placeholder="Type to search..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              />
            </div>

            {/* Role */}
            <div>
              <label className="text-xs font-medium text-gray-500">Role</label>
              <select
                value={filters.role}
                onChange={(e) => updateFilter("role", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              >
                <option value="">All</option>
                <option value="admin">Admin</option>
                {/* <option value="superuser">Superuser</option> */}
                <option value="alumni">Alumni</option>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            {/* Category */}
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

            {/* Action contains — multi-value tag input with suggestions */}
            <div className="col-span-2 lg:col-span-2">
              <label className="text-xs font-medium text-gray-500">Action contains <span className="font-normal text-gray-400">(type & press Enter or pick)</span></label>
              <TagInput
                values={filters.action}
                onChange={(v) => updateFilter("action", v)}
                suggestions={filterOptions.actions}
                placeholder="e.g. LOGIN_USER, EVENT…"
              />
            </div>

            {/* Method */}
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

            {/* Target type — multi-value dropdown */}
            <div>
              <label className="text-xs font-medium text-gray-500">Target type</label>
              <TagInput
                values={filters.target_type}
                onChange={(v) => updateFilter("target_type", v)}
                suggestions={filterOptions.target_types}
                placeholder="Pick or type…"
              />
            </div>

            {/* Status code — multi-value dropdown */}
            <div>
              <label className="text-xs font-medium text-gray-500">Status code</label>
              <TagInput
                values={filters.status_code}
                onChange={(v) => updateFilter("status_code", v)}
                suggestions={filterOptions.status_codes.map(String)}
                placeholder="200, 400…"
              />
            </div>

            {/* Date range */}
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
                <th className="px-3 py-3 text-left">Location</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={11} className="px-3 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={11} className="px-3 py-12 text-center text-rose-600">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && logs.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-12 text-center text-gray-400">
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
                    <td className="px-3 py-2 text-xs text-gray-600 max-w-[200px] truncate" title={log.location || ""}>
                      {log.location || "-"}
                    </td>
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

      <DetailModal log={selected} onClose={closeDetail} />
    </div>
  );
}

const TABS = [
  { id: "logs", label: "Audit Logs", icon: faClipboardList },
  { id: "blocks", label: "Block / Whitelist", icon: faBan },
];

export default function AuditPage() {
  const [activeTab, setActiveTab] = useState("logs");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-emerald-600 text-emerald-700 bg-emerald-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FontAwesomeIcon icon={tab.icon} className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "logs" && <AuditLogsTab />}
      {activeTab === "blocks" && <BlockManagementTab />}
    </div>
  );
}
