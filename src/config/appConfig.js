/**
 * appConfig — all frontend configuration, read from the build-time env.
 *
 * Replaces the old `runtimeConfig.js`, which fetched `GET /api/v1/config/` from
 * the backend before the app could render. That endpoint is gone; every value
 * now comes from Vite env vars (`.env` locally, Project Settings on Vercel).
 *
 * Consequences of that trade, worth knowing:
 *   + No blocking network request before first paint — the app boots faster and
 *     can't be held up (or white-screened) by a slow/unreachable backend.
 *   − Values are baked into the bundle at BUILD time. Changing an API host or
 *     key now needs a rebuild + redeploy, not just a backend restart.
 *
 * Nothing here is secret. Every value below is public by design and is visible
 * in the shipped bundle either way:
 *   - API/WS base URLs — obviously public.
 *   - Supabase ANON key — designed to be embedded in browsers; it is protected
 *     by Row Level Security, not by secrecy (same trust model as a Firebase web
 *     config). The service-role key is the secret one, and it never leaves the
 *     backend.
 *   - VAPID *public* key — the applicationServerKey the browser needs to
 *     subscribe to push. The private key stays on the backend.
 *
 * A real secret must NEVER be added to a VITE_ var: anything prefixed VITE_ is
 * inlined into the JavaScript that every visitor downloads.
 */

const env = import.meta.env;
const APP_ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

/** Backend origin, e.g. "https://api.karpagamalumni.in". */
export const API_ORIGIN = env.VITE_API_ORIGIN || APP_ORIGIN;

/**
 * REST base. In dev we default to a same-origin path so Vite's proxy handles it
 * and the browser never sees a cross-origin request (no CORS preflight).
 */
export const API_BASE =
  env.VITE_API_BASE_URL ||
  (env.DEV ? env.VITE_DEV_API_BASE_URL || "/api/v1" : `${API_ORIGIN}/api/v1`);

/** Host serving the chat REST endpoints. */
export const CHAT_HOST = env.VITE_CHAT_API_HOST || API_ORIGIN;

/** WebSocket origin, e.g. "wss://api.karpagamalumni.in". Derived if unset. */
export const WS_BASE =
  env.VITE_WS_BASE_URL ||
  API_ORIGIN.replace(/^http:/, "ws:").replace(/^https:/, "wss:");

/** Browser applicationServerKey (base64url) for Web Push. Public half only. */
export const VAPID_PUBLIC_KEY = env.VITE_FIREBASE_VAPID_KEY || "";

/** Supabase — used ONLY to drive the Google OAuth redirect (see lib/supabaseClient.js). */
export const SUPABASE_URL = env.VITE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || "";

export const FEATURES = {
  developerCommunity: true,
};

// ── Getters (kept so existing call sites read the same way as before) ────────
export const getApiOrigin = () => API_ORIGIN;
export const getApiBase = () => API_BASE;
export const getChatHost = () => CHAT_HOST;
export const getWsBase = () => WS_BASE;
export const getVapidPublicKey = () => VAPID_PUBLIC_KEY;
export const getSupabaseUrl = () => SUPABASE_URL;
export const getSupabaseAnonKey = () => SUPABASE_ANON_KEY;
export const getFeatures = () => FEATURES;

/**
 * Fail loudly in the console if a required var is missing, rather than dying
 * later with a cryptic error deep in a component. A missing VITE_* on Vercel is
 * the single most likely way this build breaks.
 */
export function assertConfig() {
  const missing = [];
  if (!env.VITE_API_ORIGIN && !env.VITE_API_BASE_URL) missing.push("VITE_API_ORIGIN");
  if (!SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing.push("VITE_SUPABASE_ANON_KEY");
  if (missing.length) {
    console.error(
      `[config] Missing required env var(s): ${missing.join(", ")}. ` +
        `Set them in .env (local) or the Vercel project settings, then rebuild — ` +
        `they are inlined at build time.`
    );
  }
  return missing;
}
