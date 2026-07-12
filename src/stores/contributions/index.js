/**
 * ContributionsStore — the viewer's own posts (`/myposts/`), which the five
 * "My contribution" tabs all read from.
 *
 * Replaces lib/mypostsCache.js, whose cache was keyed by the raw token — a
 * design that only worked while the token lived in localStorage. Auth is now a
 * cookie the client can't read, so the cache is keyed by nothing but the
 * session, and RootStore.reset() clears it on logout.
 *
 * Single-flight: the five tabs mount and each ask for the same payload, so
 * concurrent callers share one in-flight request.
 */
import { makeAutoObservable, runInAction } from "mobx";
import api from "../../services/apiClient";
import { API_BASE } from "../../config/api";

const MYPOSTS_URL = `${API_BASE}/myposts/`;

export default class ContributionsStore {
  data = null;
  loading = false;
  error = null;

  /** Not observable — it's request plumbing, not rendered state. */
  inFlight = null;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false, inFlight: false }, { autoBind: true });
  }

  // Section keys as `/myposts/` actually returns them — note `business` is
  // singular there, and events have also shipped under `posts`.
  get news() { return this.data?.news || []; }
  get events() { return this.data?.events || this.data?.posts || []; }
  get albums() { return this.data?.albums || []; }
  get businesses() { return this.data?.business || this.data?.businesses || []; }
  get jobs() { return this.data?.jobs || []; }

  async load({ force = false } = {}) {
    if (!force && this.data) return this.data;
    if (!force && this.inFlight) return this.inFlight;

    this.loading = true;
    this.error = null;
    this.inFlight = api
      .get(MYPOSTS_URL, { raw: true })
      .then((data) => {
        runInAction(() => { this.data = data; });
        return data;
      })
      .catch((err) => {
        runInAction(() => { this.error = err.message; });
        throw err;
      })
      .finally(() => {
        runInAction(() => { this.loading = false; });
        this.inFlight = null;
      });

    return this.inFlight;
  }

  /** After a create/edit/delete elsewhere, the cached copy is stale. */
  invalidate() {
    this.data = null;
    this.inFlight = null;
  }

  /**
   * The payload's key for a section, since the aliases above mean the caller's
   * name ("businesses", "events") isn't always the key the server sent.
   */
  keyFor(section) {
    const aliases = {
      businesses: ["business", "businesses"],
      events: ["events", "posts"],
      news: ["news"],
      albums: ["albums"],
      jobs: ["jobs"],
    }[section] || [section];
    return aliases.find((k) => Array.isArray(this.data?.[k]));
  }

  /** Drop an item from a section locally so the tab updates without a refetch. */
  removeLocal(section, id) {
    const key = this.keyFor(section);
    if (!key) return;
    this.data = {
      ...this.data,
      [key]: this.data[key].filter((i) => String(i.id) !== String(id)),
    };
  }

  /** Swap an item in a section locally after an edit. */
  replaceLocal(section, id, item) {
    const key = this.keyFor(section);
    if (!key) return;
    this.data = {
      ...this.data,
      [key]: this.data[key].map((i) => (String(i.id) === String(id) ? item : i)),
    };
  }

  clear() {
    this.data = null;
    this.inFlight = null;
    this.loading = false;
    this.error = null;
  }
}
