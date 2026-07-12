/** MapStore — alumni map scatter, member search, and sharing your location. */
import { makeAutoObservable, runInAction } from "mobx";
import api from "../../services/apiClient";
import {
  API_MAP_SCATTER,
  API_MAP_USER_SEARCH,
  API_USER_MAP_LOCATION,
  API_USER_LOCATIONS,
  API_CHAPTER_MEMBERS,
} from "../../config/api";

export default class MapStore {
  scatter = { countries: [], states: [], cities: [], addresses: [] };
  loading = false;
  error = null;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false });
  }

  async loadScatter() {
    this.loading = true;
    this.error = null;
    try {
      const d = await api.get(API_MAP_SCATTER, { raw: true });
      runInAction(() => {
        this.scatter = {
          countries: (d.countries || []).map((x) => ({ ...x, bucket: "country" })),
          states: (d.states || []).map((x) => ({ ...x, bucket: "state" })),
          cities: (d.cities || []).map((x) => ({ ...x, bucket: "city" })),
          addresses: d.addresses || [],
        };
      });
    } catch (err) {
      runInAction(() => { this.error = err.message; });
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  searchUsers(q) {
    return api.get(API_MAP_USER_SEARCH, { params: { q }, raw: true });
  }

  locateUser(username) {
    return api.get(API_USER_MAP_LOCATION, { params: { username }, raw: true });
  }

  chapterMembers(type, value, pageSize = 50) {
    return api.get(API_CHAPTER_MEMBERS, { params: { type, value, page_size: pageSize }, raw: true });
  }

  async shareMyLocation(latitude, longitude) {
    await api.post(API_USER_LOCATIONS, {
      latitude: String(latitude),
      longitude: String(longitude),
    });
    await this.loadScatter();
  }
}
