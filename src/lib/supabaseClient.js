/**
 * Lazy Supabase client singleton, used only for the Google OAuth redirect
 * (signInWithOAuth). Everything else in this app talks to our own backend,
 * never Supabase directly — this is the one exception, and only because
 * Supabase's own SDK is the proven, well-tested way to drive an OAuth
 * provider redirect (see Pages/OAuthComplete.jsx for what happens with the
 * resulting session).
 *
 * Built lazily (not at module load) so nothing is constructed on a page that
 * never signs in. The URL/anon key come from build-time env (config/appConfig.js),
 * so they are available synchronously — no boot-time await.
 */
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "../config/appConfig";

let client = null;

export function getSupabaseClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error("Supabase is not configured (missing URL/anon key from runtime config).");
  }
  if (!client) {
    // Defaults left alone (persistSession, PKCE flow, storage) — the SDK's
    // own session persistence is unused (we discard it after extracting the
    // access_token and rely on our own JWT/DRF token instead), but the PKCE
    // code-verifier storage this depends on internally isn't worth
    // second-guessing with non-default options.
    client = createClient(url, anonKey, {
      auth: { detectSessionInUrl: true },
    });
  }
  return client;
}
