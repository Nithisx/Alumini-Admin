/**
 * SignupRequestStore — the admin approval queue for pending signups.
 * Replaces the old Redux loginRequestSlice.
 */
import { makeAutoObservable, runInAction } from "mobx";
import api from "../../services/apiClient";
import { API_APPROVE_SIGNUP, API_APPROVE_SIGNUP_DETAIL } from "../../config/api";

export default class SignupRequestStore {
  requests = [];
  loading = false;
  error = null;
  processing = false;
  lastRefreshed = null;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false });
  }

  clearError() { this.error = null; }

  async fetch({ silent = false } = {}) {
    if (!silent) { this.loading = true; this.error = null; }
    try {
      const data = await api.get(API_APPROVE_SIGNUP, { raw: true });
      const incoming = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
      runInAction(() => {
        if (silent && this.requests.length > 0) {
          const existing = new Set(this.requests.map((r) => r.id));
          const incomingIds = new Set(incoming.map((r) => r.id));
          const fresh = incoming.filter((r) => !existing.has(r.id));
          const stillPending = this.requests.filter((r) => incomingIds.has(r.id));
          if (fresh.length || stillPending.length !== this.requests.length) {
            this.requests = [...fresh, ...stillPending];
          }
        } else {
          this.requests = incoming;
        }
        this.lastRefreshed = Date.now();
      });
    } catch (err) {
      if (!silent) runInAction(() => { this.error = err.message; });
    } finally {
      if (!silent) runInAction(() => { this.loading = false; });
    }
  }

  async approve(email) {
    this.processing = true;
    try {
      await api.post(API_APPROVE_SIGNUP, { email });
      runInAction(() => { this.requests = this.requests.filter((r) => r.email !== email); });
    } catch (err) {
      runInAction(() => { this.error = err.message; });
      throw err;
    } finally {
      runInAction(() => { this.processing = false; });
    }
  }

  async decline(email) {
    this.processing = true;
    try {
      await api.delete(API_APPROVE_SIGNUP, { email });
      runInAction(() => { this.requests = this.requests.filter((r) => r.email !== email); });
    } catch (err) {
      runInAction(() => { this.error = err.message; });
      throw err;
    } finally {
      runInAction(() => { this.processing = false; });
    }
  }

  async bulkApprove(requests) {
    this.processing = true;
    const result = { approved: [], failed: [] };
    for (const req of requests) {
      try {
        await api.post(API_APPROVE_SIGNUP, { email: req.email });
        result.approved.push(req.email);
      } catch {
        result.failed.push(req.email);
      }
    }
    runInAction(() => {
      this.requests = this.requests.filter((r) => !result.approved.includes(r.email));
      this.processing = false;
      if (result.approved.length === 0 && result.failed.length > 0) {
        this.error = `All ${result.failed.length} approvals failed.`;
      }
    });
    return result;
  }

  async edit(id, payload) {
    this.processing = true;
    try {
      const data = await api.patch(API_APPROVE_SIGNUP_DETAIL(id), payload, { raw: true });
      const updates = data?.data || payload;
      runInAction(() => {
        this.requests = this.requests.map((r) => (r.id === id ? { ...r, ...updates } : r));
      });
      return updates;
    } catch (err) {
      runInAction(() => { this.error = err.message; });
      throw err;
    } finally {
      runInAction(() => { this.processing = false; });
    }
  }
}
