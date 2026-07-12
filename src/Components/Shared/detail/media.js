// Shared media/URL helpers for the standard detail views.

import { API_BASE, API_ORIGIN } from "../../../config/api";

export { API_BASE };
export const MEDIA_BASE = API_ORIGIN;

/**
 * Resolve a possibly-relative media path to an absolute URL.
 * Leaves already-absolute / data / blob / file URLs untouched.
 */
export const getMediaUrl = (uri) => {
  if (!uri) return "";
  const input = String(uri).trim();
  if (!input) return "";
  if (
    input.startsWith("http://") ||
    input.startsWith("https://") ||
    input.startsWith("file://") ||
    input.startsWith("data:") ||
    input.startsWith("blob:")
  ) {
    return input;
  }

  const origin = API_BASE.replace(/\/api\/v1\/?$/, "");
  if (input.startsWith("//")) return `${window.location.protocol}${input}`;
  if (input.startsWith("/api/")) return `${origin}${input}`;
  if (input.startsWith("/media/")) return `${origin}/api/v1${input}`;
  if (input.startsWith("/")) return `${origin}${input}`;
  if (input.startsWith("media/")) return `${origin}/api/v1/${input}`;
  return `${origin}/api/v1/media/${input}`;
};
