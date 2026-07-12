/**
 * PermissionStore — the caller's effective RBAC permission set.
 *
 * Replaces the old Redux permissionsSlice + usePermissionsPolling hook.
 * Permissions are fetched from `GET /me/permissions/` (NOT embedded in the
 * JWT, since Admin edits the matrix at runtime), cached in localStorage for
 * instant gating on reload, and re-polled so admin-side changes propagate
 * live. Gate UI with `has()`, `hasAny()`, `hasAll()` — the backend always
 * re-enforces regardless of what the client believes.
 */
import { makeAutoObservable, runInAction } from "mobx";
import api from "../../services/apiClient";
import { API_ME_PERMISSIONS } from "../../config/api";
import { getRole } from "../../lib/authToken";

const LS_KEY = "app:permissions";
const POLL_INTERVAL_MS = 5 * 60 * 1000;

function loadCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(LS_KEY) || "null");
    if (cached?.permissions) {
      return { permissions: cached.permissions, role: cached.role || getRole(), loaded: true };
    }
  } catch { /* ignore corrupt cache */ }
  return { permissions: [], role: getRole(), loaded: false };
}

export default class PermissionStore {
  permissions = [];
  role = null;
  loaded = false;
  loading = false;
  _pollTimer = null;

  constructor(root) {
    this.root = root;
    const cached = loadCache();
    this.permissions = cached.permissions;
    this.role = cached.role;
    this.loaded = cached.loaded;
    makeAutoObservable(this, { root: false, _pollTimer: false });
  }

  has(codename) {
    return this.permissions.includes(codename);
  }
  hasAny(codenames = []) {
    return codenames.some((c) => this.permissions.includes(c));
  }
  hasAll(codenames = []) {
    return codenames.every((c) => this.permissions.includes(c));
  }

  _persist() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ permissions: this.permissions, role: this.role }));
    } catch { /* quota */ }
  }

  seedFromLogin(data) {
    if (!Array.isArray(data?.permissions)) return;
    runInAction(() => {
      this.permissions = data.permissions;
      this.role = data.role || getRole();
      this.loaded = true;
    });
    this._persist();
  }

  /** Refetch the effective set. Returns true if it changed. */
  async fetch() {
    if (!getRole()) return false;
    this.loading = true;
    try {
      const data = await api.get(API_ME_PERMISSIONS);
      const next = data?.permissions || [];
      const before = [...this.permissions].sort();
      const after = [...next].sort();
      const changed = before.length !== after.length || before.some((c, i) => c !== after[i]);
      runInAction(() => {
        this.permissions = next;
        this.role = data?.role || getRole();
        this.loaded = true;
      });
      this._persist();
      return changed;
    } catch {
      return false;
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  startPolling(onChange) {
    this.stopPolling();
    if (!getRole()) return;
    this._pollTimer = setInterval(async () => {
      if (!getRole()) return;
      const changed = await this.fetch();
      if (changed && typeof onChange === "function") onChange();
    }, POLL_INTERVAL_MS);
  }

  stopPolling() {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
  }

  clear() {
    runInAction(() => {
      this.permissions = [];
      this.role = null;
      this.loaded = false;
    });
    localStorage.removeItem(LS_KEY);
  }
}
