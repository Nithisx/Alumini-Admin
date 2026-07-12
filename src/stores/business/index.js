/**
 * BusinessStore — business directory (domain codenames: business.*).
 */
import { makeObservable, observable, runInAction } from "mobx";
import ContentStore from "../base/ContentStore";
import api from "../../services/apiClient";
import { API_BASE } from "../../config/api";

const LIST = `${API_BASE}/businesses/`;

export default class BusinessStore extends ContentStore {
  categories = [];

  constructor(root) {
    super(root, {
      list: () => LIST,
      detail: (id) => `${LIST}${id}/`,
      ownerOf: (item) => item?.user ?? item?.owner ?? item?.owner_details?.id ?? item?.user_id ?? null,
    });
    // The base's makeObservable() runs before this subclass's fields exist, so
    // `categories` has to be declared here or nothing re-renders when it loads.
    makeObservable(this, { categories: observable });
  }

  async fetchCategories() {
    const data = await api.get(`${LIST}categories/`, { raw: true });
    const categories = Array.isArray(data) ? data : data?.results || [];
    runInAction(() => { this.categories = categories; });
    return categories;
  }

  /** One call for the whole page: listings + the category facets beside them. */
  async load() {
    await Promise.all([this.fetchAll(), this.fetchCategories().catch(() => [])]);
  }
}
