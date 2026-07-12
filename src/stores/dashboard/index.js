/**
 * DashboardStore — home/dashboard aggregate + geographic distributions.
 */
import { makeAutoObservable, runInAction } from "mobx";
import api from "../../services/apiClient";
import { API_HOME, API_COUNTRY_DIST, API_CITY_STATE_CHAPTERS } from "../../config/api";

export default class DashboardStore {
  data = null;
  countryDistribution = { chapters: [] };
  cityStateDistribution = { city_chapters: [], state_chapters: [] };
  loading = false;
  error = null;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false });
  }

  async load() {
    this.loading = true;
    this.error = null;
    try {
      // One round-trip set instead of three sequential awaits in the component.
      const [home, country, cityState] = await Promise.all([
        api.get(API_HOME, { raw: true }),
        api.get(API_COUNTRY_DIST, { raw: true }),
        api.get(API_CITY_STATE_CHAPTERS, { raw: true }),
      ]);
      runInAction(() => {
        this.data = home;
        this.countryDistribution = country;
        this.cityStateDistribution = cityState;
      });
    } catch (err) {
      runInAction(() => { this.error = err.message; });
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }
}
