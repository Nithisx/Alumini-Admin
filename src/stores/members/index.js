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
  API_CHAT_ROOMS,
} from "../../config/api";

const coursesUrl = (userId) => `${API_BASE}/profile/${userId}/courses/`;
const courseUrl = (userId, courseId) => `${API_BASE}/profile/${userId}/courses/${courseId}/`;

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

  /**
   * Admin edit of another user's profile. PUT + multipart: the endpoint takes a
   * full representation and the payload can carry a new profile photo.
   */
  update(userId, payload) {
    return api.raw("put", API_ADMIN_USER_UPDATE(userId), { data: payload });
  }

  /**
   * Deactivate/delete are POST {user_id} — not a DELETE, and not keyed by email.
   * (Backend: api/domains/members/views.py DeactivateUserView / DeleteUserView.)
   * `deactivate` toggles: it activates a currently-inactive user.
   */
  deactivate(userId) { return api.post(API_DEACTIVATE_USER, { user_id: userId }, { raw: true }); }
  remove(userId) { return api.post(API_DELETE_USER, { user_id: userId }, { raw: true }); }

  // ── a member's courses (admin view of someone else's) ────────────────────
  async fetchCourses(userId) {
    const data = await api.get(coursesUrl(userId), { raw: true });
    return Array.isArray(data) ? data : data?.results || [];
  }

  addCourse(userId, payload) { return api.post(coursesUrl(userId), payload, { raw: true }); }
  updateCourse(userId, courseId, payload) {
    return api.raw("put", courseUrl(userId, courseId), { data: payload });
  }
  removeCourse(userId, courseId) { return api.delete(courseUrl(userId, courseId)); }

  /** Open (or reuse) a 1:1 chat room with this member. */
  startChat(userId) { return api.post(API_CHAT_ROOMS, { target_user_id: userId }, { raw: true }); }
}
