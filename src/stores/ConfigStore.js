/**
 * ConfigStore — frontend configuration, surfaced to the store layer.
 *
 * Values come from config/appConfig.js, i.e. Vite env vars baked in at BUILD
 * time. The backend's `GET /api/v1/config/` bootstrap has been removed, so this
 * is now a static, synchronous read — there is nothing to fetch and nothing to
 * await before render.
 *
 * Nothing secret lives here: the Supabase ANON key and the VAPID PUBLIC key are
 * both designed to ship to browsers (see appConfig.js for the reasoning).
 */
import { makeAutoObservable } from "mobx";
import {
  API_BASE,
  API_ORIGIN,
  CHAT_HOST,
  WS_BASE,
  VAPID_PUBLIC_KEY,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  FEATURES,
} from "../config/appConfig";

export default class ConfigStore {
  apiOrigin = API_ORIGIN;
  apiBase = API_BASE;
  chatHost = CHAT_HOST;
  wsBase = WS_BASE;
  vapidPublicKey = VAPID_PUBLIC_KEY;
  supabaseUrl = SUPABASE_URL;
  supabaseAnonKey = SUPABASE_ANON_KEY;
  features = FEATURES;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false });
  }

  get developerCommunityEnabled() {
    return Boolean(this.features?.developerCommunity);
  }

  /** True when the app has everything it needs to talk to the backend. */
  get isConfigured() {
    return Boolean(this.apiBase && this.supabaseUrl && this.supabaseAnonKey);
  }
}
