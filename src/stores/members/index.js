/**
 * MembersStore — the member directory + admin actions on a user.
 * Gating for these actions is members.view / members.edit_any /
 * users.deactivate / users.delete — enforced by the backend, mirrored in the UI.
 */
import { makeAutoObservable, runInAction } from "mobx";
import api from "../../services/apiClient";
import {
  API_BASE,
  API_PROFILE,
  API_DEACTIVATE_USER,
  API_DELETE_USER,
  API_ADMIN_USER_UPDATE,
  API_CHAPTER_MEMBERS,
} from "../../config/api";

export default class MembersStore {
  items = [];
  current = null;
  loading = false;
  error = null;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false });
  }

  async fetchAll(params) {
    this.loading = true;
    try {
      const data = await api.get(`${API_BASE}/admin-members/`, { params, raw: true });
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

  /** One member by username (the detail page's route param). */
  async fetchOne(username) {
    this.loading = true;
    try {
      const data = await api.get(`${API_PROFILE}${encodeURIComponent(username)}`, { raw: true });
      runInAction(() => { this.current = data; });
      return data;
    } catch (err) {
      runInAction(() => { this.error = err.message; });
      throw err;
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  /** Members of a country/city/state chapter (paginated + searchable). */
  async fetchChapterMembers({ type, value, page = 1, pageSize = 24, search }) {
    const params = { type, value, page, page_size: pageSize };
    if (search) params.search = search;
    return api.get(API_CHAPTER_MEMBERS, { params, raw: true });
  }

  update(userId, payload) {
    const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
    return isForm
      ? api.raw("patch", API_ADMIN_USER_UPDATE(userId), { data: payload })
      : api.patch(API_ADMIN_USER_UPDATE(userId), payload, { raw: true });
  }

  deactivate(email) { return api.post(API_DEACTIVATE_USER, { email }); }
  remove(email) { return api.delete(API_DELETE_USER, { email }); }
}
