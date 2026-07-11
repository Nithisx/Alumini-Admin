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
  if (
    uri.startsWith("http://") ||
    uri.startsWith("https://") ||
    uri.startsWith("file://") ||
    uri.startsWith("data:") ||
    uri.startsWith("blob:")
  ) {
    return uri;
  }
  return uri.startsWith("/") ? `${MEDIA_BASE}${uri}` : `${MEDIA_BASE}/${uri}`;
};
