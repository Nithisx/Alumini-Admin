/**
 * BusinessStore — business directory (domain codenames: business.*).
 */
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
  }

  async fetchCategories() {
    const data = await api.get(`${LIST}categories/`, { raw: true });
    this.categories = Array.isArray(data) ? data : data?.results || [];
    return this.categories;
  }
}
