/**
 * ProfileStore — the signed-in user's own profile.
 * Cached because nearly every screen needs `currentUserId` for owner checks,
 * and a per-component /profile/ fetch was firing on every page.
 */
import { makeAutoObservable, runInAction } from "mobx";
import api from "../../services/apiClient";
import { API_PROFILE, API_USER_COURSES, API_USER_COURSE, API_SUGGESTIONS } from "../../config/api";
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

  /**
   * Full replace (PUT + multipart) — the profile editor submits the whole form,
   * photos included. Distinct from save()'s PATCH.
   */
  async replace(formData) {
    const data = await api.raw("put", API_PROFILE, { data: formData });
    runInAction(() => { this.me = { ...this.me, ...data }; });
    return data;
  }

  // ── the viewer's OWN course enrollments ──────────────────────────────────
  async fetchCourses() {
    const data = await api.get(API_USER_COURSES, { raw: true });
    return Array.isArray(data) ? data : data?.results || [];
  }

  addCourse(payload) { return api.post(API_USER_COURSES, payload, { raw: true }); }
  removeCourse(courseId) { return api.delete(API_USER_COURSE(courseId)); }

  /** Typeahead for the profile form (usernames, countries, states, cities…). */
  async suggestions(params) {
    const query = new URLSearchParams(params).toString();
    return api.get(`${API_SUGGESTIONS}/profile?${query}`, { raw: true });
  }

  clear() { this.me = null; this.loaded = false; this.inFlight = null; }
}
