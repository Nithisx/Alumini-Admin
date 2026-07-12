/**
 * StudentsStore — the student photo gallery (name + image upload).
 */
import { makeAutoObservable, runInAction } from "mobx";
import api from "../../services/apiClient";
import { API_STUDENTS } from "../../config/api";

export default class StudentsStore {
  items = [];
  loading = false;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false });
  }

  async fetchAll() {
    this.loading = true;
    try {
      const data = await api.get(API_STUDENTS, { raw: true });
      const items = Array.isArray(data) ? data : data?.results || [];
      runInAction(() => { this.items = items; });
      return items;
    } catch {
      return [];
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  /** `formData` carries name + image. */
  async create(formData) {
    const created = await api.upload(API_STUDENTS, formData, { raw: true });
    runInAction(() => { this.items = [created, ...this.items]; });
    return created;
  }
}
