/**
 * AuditStore — admin audit-log listing, filters, and detail.
 * Replaces the old Redux auditSlice; identical behavior (silent-poll prepend,
 * server-side filters, detail drawer) expressed as store actions.
 */
import { makeAutoObservable, runInAction } from "mobx";
import api from "../../services/apiClient";
import { API_AUDIT_LOGS, API_AUDIT_LOG_DETAIL, API_AUDIT_LOG_FILTERS } from "../../config/api";

export default class AuditStore {
  logs = [];
  count = 0;
  page = 1;
  loading = false;
  error = null;
  filterOptions = { status_codes: [], target_types: [], usernames: [], actions: [] };
  filtersLoading = false;
  selectedLog = null;
  detailLoading = false;
  lastRefreshed = null;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false });
  }

  setPage(page) { this.page = page; }
  clearSelected() { this.selectedLog = null; }
  clearError() { this.error = null; }

  _buildParams(filters = {}) {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v === "" || v == null) return;
      if (Array.isArray(v)) { if (v.length) params[k] = v.join(","); }
      else params[k] = v;
    });
    return params;
  }

  async fetchLogs({ page = 1, filters = {}, silent = false } = {}) {
    if (!silent) { this.loading = true; this.error = null; }
    try {
      const params = { page, ...this._buildParams(filters) };
      const data = await api.get(API_AUDIT_LOGS, { params, raw: true });
      const incoming = data?.results ?? [];
      runInAction(() => {
        if (silent && this.logs.length > 0 && this.page === 1) {
          const existing = new Set(this.logs.map((l) => l.id));
          const fresh = incoming.filter((l) => !existing.has(l.id));
          if (fresh.length) { this.logs = [...fresh, ...this.logs]; this.count = data.count ?? this.count; }
        } else if (!silent) {
          this.logs = incoming;
          this.count = data?.count ?? 0;
          this.page = page;
        }
        this.lastRefreshed = Date.now();
      });
    } catch (err) {
      if (!silent) runInAction(() => { this.error = err.message; });
    } finally {
      if (!silent) runInAction(() => { this.loading = false; });
    }
  }

  async fetchFilters(usernameQ = "") {
    this.filtersLoading = true;
    try {
      const params = usernameQ ? { username_q: usernameQ } : undefined;
      const data = await api.get(API_AUDIT_LOG_FILTERS, { params, raw: true });
      runInAction(() => { this.filterOptions = data; });
    } catch { /* non-fatal */ } finally {
      runInAction(() => { this.filtersLoading = false; });
    }
  }

  async fetchDetail(id) {
    this.detailLoading = true;
    try {
      const data = await api.get(API_AUDIT_LOG_DETAIL(id), { raw: true });
      runInAction(() => { this.selectedLog = data; });
    } catch { /* non-fatal */ } finally {
      runInAction(() => { this.detailLoading = false; });
    }
  }
}
