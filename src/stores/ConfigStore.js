/**
 * ConfigStore — runtime config served by the backend (`GET /api/v1/config/`).
 *
 * The values (API/WS bases, browser VAPID key, Supabase URL + public anon key)
 * are fetched by config/runtimeConfig.js BEFORE React renders (see main.jsx),
 * so this store just surfaces them reactively and exposes a reload(). Nothing
 * secret lives here — the Supabase anon key is public by design (RLS-protected,
 * same trust model as a Firebase web config).
 */
import { makeAutoObservable, runInAction } from "mobx";
import {
  loadRuntimeConfig,
  getApiBase,
  getWsBase,
  getVapidPublicKey,
  getSupabaseUrl,
  getSupabaseAnonKey,
  getFeatures,
} from "../config/runtimeConfig";

export default class ConfigStore {
  apiBase = getApiBase();
  wsBase = getWsBase();
  vapidPublicKey = getVapidPublicKey();
  supabaseUrl = getSupabaseUrl();
  supabaseAnonKey = getSupabaseAnonKey();
  features = getFeatures();

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false });
  }

  get developerCommunityEnabled() {
    return Boolean(this.features?.developerCommunity);
  }

  async reload() {
    await loadRuntimeConfig();
    runInAction(() => {
      this.apiBase = getApiBase();
      this.wsBase = getWsBase();
      this.vapidPublicKey = getVapidPublicKey();
      this.supabaseUrl = getSupabaseUrl();
      this.supabaseAnonKey = getSupabaseAnonKey();
      this.features = getFeatures();
    });
  }
}
