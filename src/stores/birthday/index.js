/** BirthdayStore — today's/upcoming birthdays. */
import { makeAutoObservable, runInAction } from "mobx";
import api from "../../services/apiClient";
import { API_BIRTHDAYS } from "../../config/api";

export default class BirthdayStore {
  items = [];
  loading = false;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false });
  }

  async load() {
    this.loading = true;
    try {
      const data = await api.get(API_BIRTHDAYS, { raw: true });
      runInAction(() => { this.items = Array.isArray(data) ? data : data?.results || []; });
    } catch { /* non-fatal */ } finally {
      runInAction(() => { this.loading = false; });
    }
  }
}
