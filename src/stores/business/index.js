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

  /** Gallery images for one listing — a separate endpoint from the detail. */
  async fetchImages(id) {
    try {
      const data = await api.get(`${LIST}${id}/images/`, { raw: true });
      return Array.isArray(data) ? data : data?.results || [];
    } catch {
      return [];
    }
  }

  /** `formData` carries one or more `images`. */
  uploadImages(id, formData) {
    return api.upload(`${LIST}${id}/images/`, formData, { raw: true });
  }

  /**
   * The images endpoint resolves a bare id in the album/business slot to the
   * IMAGE itself (see the backend's get_object fallback), which is how the UI
   * has always deleted one — keep the shape rather than guess a new one.
   */
  deleteImage(imageId) {
    return api.delete(`${LIST}${imageId}/images/`);
  }

  /** One call for the whole page: listings + the category facets beside them. */
  async load() {
    await Promise.all([this.fetchAll(), this.fetchCategories().catch(() => [])]);
  }
}
