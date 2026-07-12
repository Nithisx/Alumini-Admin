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

  /** Request plumbing, not rendered state — hence not observable. */
  inFlight = null;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false, inFlight: false });
  }

  get currentUserId() { return this.me?.id ?? null; }
  get role() { return (this.me?.role || "").toLowerCase(); }

  /**
   * Fetch once; subsequent callers reuse the cached profile. Single-flight:
   * a page mounts several components that each want the profile, and without
   * this they'd all fire /profile/ before the first response landed.
   */
  async load({ force = false } = {}) {
    if (!getRole()) return null;
    if (this.loaded && !force) return this.me;
    if (this.inFlight && !force) return this.inFlight;

    this.loading = true;
    this.inFlight = api
      .get(API_PROFILE, { raw: true })
      .then((data) => {
        runInAction(() => { this.me = data; this.loaded = true; });
        return data;
      })
      .catch(() => null)
      .finally(() => {
        runInAction(() => { this.loading = false; });
        this.inFlight = null;
      });

    return this.inFlight;
  }

  async save(payload) {
    const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
    const data = isForm
      ? await api.raw("patch", API_PROFILE, { data: payload })
      : await api.patch(API_PROFILE, payload, { raw: true });
    runInAction(() => { this.me = { ...this.me, ...data }; });
    return data;
  }

  clear() { this.me = null; this.loaded = false; this.inFlight = null; }
}
