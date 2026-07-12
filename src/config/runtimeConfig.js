/**
 * Runtime configuration served by the backend at GET /api/v1/config/.
 *
 * The Vite bundle bakes in NO secrets — only VITE_API_ORIGIN (where to reach
 * the backend). Everything else (WS base, browser VAPID key, Supabase
 * URL/anon key) is fetched at boot, cached in localStorage for offline PWA
 * use, and read through the getters below. Google OAuth is driven by the
 * Supabase JS SDK client-side (see lib/supabaseClient.js) — the earlier
 * backend-orchestrated redirect flow didn't survive third-party-cookie
 * blocking during the Google<->Supabase leg, so the frontend talks to
 * Supabase directly again, same as before that flow existed.
 *
 * Boot order (main.jsx): loadRuntimeConfig() resolves BEFORE React renders, so
 * every getter is populated by first paint. Env vars remain as fallbacks so the
 * app degrades gracefully if the backend is briefly unreachable.
 */

const APP_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';
const LS_KEY = 'app:runtimeConfig';

const ENV_API_ORIGIN = import.meta.env.VITE_API_ORIGIN || APP_ORIGIN;

// Live, in-memory config. Seeded from env so imports that run before boot still
// get sane values; overwritten by loadRuntimeConfig().
const state = {
  apiOrigin: ENV_API_ORIGIN,
  apiBase: import.meta.env.VITE_API_BASE_URL
    || (import.meta.env.DEV ? (import.meta.env.VITE_DEV_API_BASE_URL || '/api/v1') : `${ENV_API_ORIGIN}/api/v1`),
  chatBase: '',
  wsBase: import.meta.env.VITE_WS_BASE_URL || '',
  vapidPublicKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || '',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  features: {},
  loaded: false,
};

function applyPayload(data) {
  if (!data) return;
  if (data.apiBase) state.apiBase = data.apiBase;
  if (data.chatBase) state.chatBase = data.chatBase;
  if (data.wsBase) state.wsBase = data.wsBase;
  if (data.vapidPublicKey) state.vapidPublicKey = data.vapidPublicKey;
  if (data.supabaseUrl) state.supabaseUrl = data.supabaseUrl;
  if (data.supabaseAnonKey) state.supabaseAnonKey = data.supabaseAnonKey;
  if (data.features) state.features = data.features;
}

/**
 * Fetch backend config before render. Falls back to a localStorage cache, then
 * to env defaults — never throws, so a slow/unreachable backend can't block the
 * PWA shell from booting.
 */
export async function loadRuntimeConfig() {
  // Hydrate from cache first so offline boots have values immediately.
  try {
    const cached = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (cached) applyPayload(cached);
  } catch { /* ignore corrupt cache */ }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    // In dev, fetch via the same-origin Vite proxy (/api → backend) to avoid
    // CORS; in prod, hit the configured API origin directly.
    const configUrl = import.meta.env.DEV
      ? '/api/v1/config/'
      : `${ENV_API_ORIGIN}/api/v1/config/`;
    const res = await fetch(configUrl, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const body = await res.json();
      const data = body?.data ?? body; // tolerate {success,data} envelope or bare object
      applyPayload(data);
      try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /* quota */ }
    }
  } catch {
    // offline / backend down — keep cached-or-env values
  } finally {
    state.loaded = true;
  }
  return state;
}

export const getApiOrigin = () => state.apiOrigin;
export const getApiBase = () => state.apiBase;
export const getChatBase = () => state.chatBase;
export const getWsBase = () => state.wsBase;
export const getVapidPublicKey = () => state.vapidPublicKey;
export const getSupabaseUrl = () => state.supabaseUrl;
export const getSupabaseAnonKey = () => state.supabaseAnonKey;
export const getFeatures = () => state.features;
export const isConfigLoaded = () => state.loaded;
