/**
 * AuthStore — session identity + all login/logout/OAuth logic.
 *
 * The real credential is the backend-set httpOnly cookie; this store only
 * tracks the cached role (the "am I logged in / which role" UI hint) and owns
 * every auth network call so no page/component builds its own. Google OAuth is
 * driven client-side via the Supabase SDK; the resulting access_token is
 * exchanged with our backend here.
 */
import { makeAutoObservable, runInAction } from "mobx";
import api from "../services/apiClient";
import {
  API_LOGIN_ALUMNI,
  API_LOGOUT,
  API_GOOGLE_OAUTH,
} from "../config/api";
import { getRole, storeLoginCredential, clearAuth } from "../lib/authToken";
import { getSupabaseClient } from "../lib/supabaseClient";

const ROLE_TO_KEY = { Admin: "admin", Staff: "staff", Alumni: "alumni", Student: "student" };

export default class AuthStore {
  role = getRole();
  loading = false;
  error = null;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false });
  }

  get isAuthenticated() {
    return Boolean(this.role);
  }

  get roleKey() {
    return ROLE_TO_KEY[this.role] || "alumni";
  }

  /** Persist a login/OAuth response and seed permissions. */
  _applyLogin(data) {
    storeLoginCredential(data, data?.role_key);
    runInAction(() => { this.role = data?.role || getRole(); });
    this.root.permissions?.seedFromLogin(data);
  }

  /** Username/password login. Returns the raw payload for the caller to route on. */
  async login(username, password) {
    this.loading = true;
    this.error = null;
    try {
      const data = await api.post(API_LOGIN_ALUMNI, { username, password });
      if (!data?.jwt && !data?.token) {
        throw new Error(data?.error || "Login failed: no token received");
      }
      this._applyLogin(data);
      return data;
    } catch (err) {
      runInAction(() => { this.error = err.message; });
      throw err;
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  /** Kick off the Supabase-driven Google OAuth redirect. */
  async startGoogleOAuth(redirectPath = "/oauth/complete") {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${redirectPath}` },
    });
    if (error) throw new Error(error.message || "Failed to start Google sign-in.");
  }

  /** Read the Supabase session left in the URL after the OAuth redirect. */
  async readOAuthSession() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getSession();
    const accessToken = data?.session?.access_token;
    if (error || !accessToken) throw new Error("No Supabase session found.");
    return accessToken;
  }

  /** Exchange a Supabase access_token with our backend. Returns the payload. */
  async completeGoogleOAuth(accessToken) {
    const data = await api.post(API_GOOGLE_OAUTH, { access_token: accessToken });
    if (data?.jwt || data?.token) this._applyLogin(data);
    return data;
  }

  async logout() {
    // Backend clears the httpOnly cookie + revokes the token; push cleanup is
    // handled by the notification store before we drop the session.
    const endpoint = this.root.notifications?.cachedPushEndpoint(this.role) || null;
    try {
      await api.post(API_LOGOUT, endpoint ? { endpoint } : {});
    } catch { /* non-fatal — clear locally regardless */ }
    this.root.notifications?.unregisterPush(this.role);
    clearAuth();
    this.root.permissions?.clear();
    runInAction(() => { this.role = null; });
  }
}
