/**
 * ContentStore — shared base for the content domains (news, events, albums,
 * jobs, business). They are the same CRUD shape, so the list/create/update/
 * delete/ownership logic lives here once instead of being re-implemented (and
 * re-bugged) in five components.
 *
 * A subclass supplies its endpoints and its owner field; everything else is
 * inherited. All network access goes through services/apiClient, so no
 * component ever builds a fetch, an auth header, or a CSRF header.
 *
 * Permission gating stays in the UI layer (lib/usePermissions + <Can>), because
 * whether to SHOW a control is a rendering concern. The backend re-enforces
 * every one of these actions regardless — the store never assumes it may act.
 */
import { makeObservable, observable, action, runInAction } from "mobx";
import api from "../../services/apiClient";

export default class ContentStore {
  items = [];
  current = null;
  loading = false;
  saving = false;
  error = null;

  /**
   * @param {object} root RootStore
   * @param {object} cfg
   *   list        () => url                  — GET list / POST create
   *   detail      (id) => url                — GET one / PATCH / DELETE
   *   ownerOf     (item) => id | null        — who owns this item
   */
  constructor(root, cfg) {
    this.root = root;
    this.cfg = cfg;
    makeObservable(this, {
      items: observable,
      current: observable,
      loading: observable,
      saving: observable,
      error: observable,
      setItems: action,
      clearError: action,
    });
  }

  setItems(items) { this.items = items; }
  clearError() { this.error = null; }

  /** True when `userId` owns `item` — an owner may always edit/delete their own. */
  isOwner(item, userId) {
    if (!userId) return false;
    const owner = this.cfg.ownerOf(item);
    return owner != null && String(owner) === String(userId);
  }

  async fetchAll(params) {
    this.loading = true;
    this.error = null;
    try {
      const data = await api.get(this.cfg.list(), { params, raw: true });
      // The API is inconsistent: some endpoints return a bare array, others a
      // paginated {results: []}. Normalise here so no component has to care.
      const items = Array.isArray(data) ? data : data?.results || [];
      runInAction(() => { this.items = items; });
      return items;
    } catch (err) {
      runInAction(() => { this.error = err.message; });
      return [];
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  /** Cheap existence probe — the detail views use it for prev/next arrows. */
  async exists(id) {
    try {
      await api.get(this.cfg.detail(id), { raw: true });
      return true;
    } catch {
      return false;
    }
  }

  async fetchOne(id) {
    this.loading = true;
    this.error = null;
    try {
      const data = await api.get(this.cfg.detail(id), { raw: true });
      runInAction(() => { this.current = data; });
      return data;
    } catch (err) {
      runInAction(() => { this.error = err.message; });
      throw err;
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  /** `payload` may be a FormData (file uploads) or a plain object. */
  async create(payload) {
    this.saving = true;
    try {
      const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
      const created = isForm
        ? await api.upload(this.cfg.list(), payload, { raw: true })
        : await api.post(this.cfg.list(), payload, { raw: true });
      runInAction(() => { this.items = [created, ...this.items]; });
      return created;
    } catch (err) {
      runInAction(() => { this.error = err.message; });
      throw err;
    } finally {
      runInAction(() => { this.saving = false; });
    }
  }

  async update(id, payload) {
    this.saving = true;
    try {
      const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
      const updated = isForm
        ? await api.raw("patch", this.cfg.detail(id), { data: payload })
        : await api.patch(this.cfg.detail(id), payload, { raw: true });
      runInAction(() => {
        this.items = this.items.map((i) => (String(i.id) === String(id) ? { ...i, ...updated } : i));
        if (this.current && String(this.current.id) === String(id)) {
          this.current = { ...this.current, ...updated };
        }
      });
      return updated;
    } catch (err) {
      runInAction(() => { this.error = err.message; });
      throw err;
    } finally {
      runInAction(() => { this.saving = false; });
    }
  }

  /**
   * Full replace (PUT). Distinct from update()'s PATCH: several detail
   * endpoints expect the whole representation, and the two verbs are not
   * interchangeable against this backend — callers pick deliberately.
   * `payload` may be FormData or a plain object.
   */
  async replace(id, payload) {
    this.saving = true;
    try {
      const updated = await api.raw("put", this.cfg.detail(id), { data: payload });
      runInAction(() => {
        this.items = this.items.map((i) => (String(i.id) === String(id) ? updated : i));
        if (this.current && String(this.current.id) === String(id)) this.current = updated;
      });
      return updated;
    } catch (err) {
      runInAction(() => { this.error = err.message; });
      throw err;
    } finally {
      runInAction(() => { this.saving = false; });
    }
  }

  async remove(id) {
    this.saving = true;
    try {
      await api.delete(this.cfg.detail(id));
      runInAction(() => {
        this.items = this.items.filter((i) => String(i.id) !== String(id));
        if (this.current && String(this.current.id) === String(id)) this.current = null;
      });
    } catch (err) {
      runInAction(() => { this.error = err.message; });
      throw err;
    } finally {
      runInAction(() => { this.saving = false; });
    }
  }
}
