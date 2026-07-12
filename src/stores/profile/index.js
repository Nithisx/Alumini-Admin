/**
 * ProfileStore — the signed-in user's own profile.
 * Cached because nearly every screen needs `currentUserId` for owner checks,
 * and a per-component /profile/ fetch was firing on every page.
 */
import { makeAutoObservable, runInAction } from "mobx";
import api from "../../services/apiClient";
import { API_PROFILE } from "../../config/api";
import { getRole } from "../../lib/authToken";

export default class ProfileStore {
  me = null;
  loading = false;
  loaded = false;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false });
  }

  get currentUserId() { return this.me?.id ?? null; }

  /** Fetch once; subsequent callers reuse the cached profile. */
  async load({ force = false } = {}) {
    if (!getRole()) return null;
    if (this.loaded && !force) return this.me;
    this.loading = true;
    try {
      const data = await api.get(API_PROFILE, { raw: true });
      runInAction(() => { this.me = data; this.loaded = true; });
      return data;
    } catch {
      return null;
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  async save(payload) {
    const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
    const data = isForm
      ? await api.raw("patch", API_PROFILE, { data: payload })
      : await api.patch(API_PROFILE, payload, { raw: true });
    runInAction(() => { this.me = { ...this.me, ...data }; });
    return data;
  }

  clear() { this.me = null; this.loaded = false; }
}
