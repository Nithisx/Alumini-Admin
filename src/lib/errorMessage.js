/**
 * Central error classifier.
 *
 * Turns *any* error shape thrown across the app — a native fetch failure
 * (`TypeError: Failed to fetch`), a fetch `Response`, an axios error, a thrown
 * `Error` carrying an HTTP `status`, a bare status number, or a plain string —
 * into a consistent, user-friendly `{ kind, title, message, status }`.
 *
 * Use it everywhere a user could see an error so the wording stays consistent:
 *
 *   import { getErrorInfo, getErrorMessage, throwForStatus } from "../lib/errorMessage";
 *
 *   try {
 *     const res = await fetch(url);
 *     throwForStatus(res);            // turns 4xx/5xx into a status-aware Error
 *     const data = await res.json();
 *   } catch (err) {
 *     setError(err);                  // store the raw error
 *     toast.error(getErrorMessage(err));
 *   }
 *
 *   // In render:  <ErrorScreen error={error} onRetry={refetch} />
 */

export const ERROR_KIND = {
  OFFLINE: "offline",
  NETWORK: "network",
  TIMEOUT: "timeout",
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not_found",
  VALIDATION: "validation",
  RATE_LIMIT: "rate_limit",
  SERVER: "server",
  UNKNOWN: "unknown",
};

const COPY = {
  [ERROR_KIND.OFFLINE]: {
    title: "You're offline",
    message: "Check your internet connection and try again.",
  },
  [ERROR_KIND.NETWORK]: {
    title: "Connection problem",
    message: "We couldn't reach the server. Please check your connection and try again.",
  },
  [ERROR_KIND.TIMEOUT]: {
    title: "Request timed out",
    message: "The server took too long to respond. Please try again.",
  },
  [ERROR_KIND.UNAUTHORIZED]: {
    title: "Session expired",
    message: "Please sign in again to continue.",
  },
  [ERROR_KIND.FORBIDDEN]: {
    title: "Access denied",
    message: "You don't have permission to view this. Contact an administrator if you think this is a mistake.",
  },
  [ERROR_KIND.NOT_FOUND]: {
    title: "Not found",
    message: "The item you're looking for doesn't exist or may have been removed.",
  },
  [ERROR_KIND.VALIDATION]: {
    title: "Something doesn't look right",
    message: "Please review your input and try again.",
  },
  [ERROR_KIND.RATE_LIMIT]: {
    title: "Too many requests",
    message: "You're doing that a bit too fast. Please wait a moment and try again.",
  },
  [ERROR_KIND.SERVER]: {
    title: "Server error",
    message: "Something went wrong on our end. Please try again in a little while.",
  },
  [ERROR_KIND.UNKNOWN]: {
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
  },
};

const isOffline = () =>
  typeof navigator !== "undefined" && navigator.onLine === false;

/** Map an HTTP status code to an error kind. */
function kindFromStatus(status) {
  if (!status) return ERROR_KIND.UNKNOWN;
  if (status === 401) return ERROR_KIND.UNAUTHORIZED;
  if (status === 403) return ERROR_KIND.FORBIDDEN;
  if (status === 404) return ERROR_KIND.NOT_FOUND;
  if (status === 408) return ERROR_KIND.TIMEOUT;
  if (status === 429) return ERROR_KIND.RATE_LIMIT;
  if (status >= 500) return ERROR_KIND.SERVER;
  if (status >= 400) return ERROR_KIND.VALIDATION;
  return ERROR_KIND.UNKNOWN;
}

/** Recognise the well-known browser strings that mean "request never landed". */
function looksLikeNetworkString(text) {
  if (!text) return false;
  const t = String(text).toLowerCase();
  return (
    t.includes("failed to fetch") ||
    t.includes("networkerror") ||
    t.includes("network error") ||
    t.includes("load failed") ||
    t.includes("connection") ||
    t.includes("err_network") ||
    t.includes("err_internet_disconnected") ||
    t.includes("err_connection") ||
    t.includes("err_name_not_resolved") ||
    t.includes("fetch event") ||
    t.includes("aborterror") ||
    t === "typeerror"
  );
}

/** Pull a status code out of whatever error shape we were handed. */
function extractStatus(error) {
  if (error == null) return undefined;
  if (typeof error === "number") return error;
  // axios-style: error.response.status
  if (error.response && typeof error.response.status === "number") {
    return error.response.status;
  }
  // fetch Response, or an Error we tagged with .status
  if (typeof error.status === "number") return error.status;
  if (typeof error.statusCode === "number") return error.statusCode;
  return undefined;
}

/** Try to surface a server-provided message (DRF `detail`, etc.). */
function extractServerMessage(error) {
  const data = error?.response?.data ?? error?.data;
  if (!data) return undefined;
  if (typeof data === "string") return data.slice(0, 300);
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.message === "string") return data.message;
  if (typeof data.error === "string") return data.error;
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) {
    return String(data.non_field_errors[0]);
  }
  // First field error from a DRF-style validation payload.
  if (typeof data === "object") {
    for (const value of Object.values(data)) {
      if (typeof value === "string") return value;
      if (Array.isArray(value) && value.length && typeof value[0] === "string") {
        return value[0];
      }
    }
  }
  return undefined;
}

/**
 * Classify an error into a stable shape.
 * @returns {{ kind: string, title: string, message: string, status?: number }}
 */
export function getErrorInfo(error, fallbackMessage) {
  // Browser thinks we're offline — most reliable signal, check first.
  if (isOffline()) {
    return { kind: ERROR_KIND.OFFLINE, ...COPY[ERROR_KIND.OFFLINE] };
  }

  // axios timeout / aborted request
  if (error?.code === "ECONNABORTED" || error?.name === "AbortError") {
    return { kind: ERROR_KIND.TIMEOUT, ...COPY[ERROR_KIND.TIMEOUT] };
  }
  if (error?.code === "ERR_NETWORK") {
    return { kind: ERROR_KIND.NETWORK, ...COPY[ERROR_KIND.NETWORK] };
  }

  const status = extractStatus(error);
  if (status) {
    const kind = kindFromStatus(status);
    const serverMessage = extractServerMessage(error);
    // For validation errors a precise server message is usually most helpful.
    const message =
      kind === ERROR_KIND.VALIDATION && serverMessage
        ? serverMessage
        : COPY[kind].message;
    return { kind, title: COPY[kind].title, message, status };
  }

  // No status: an axios error with no response means the request never landed.
  if (error?.isAxiosError && !error.response) {
    return { kind: ERROR_KIND.NETWORK, ...COPY[ERROR_KIND.NETWORK] };
  }

  // Native fetch failure or a thrown Error/string that reads like a network fault.
  const text =
    typeof error === "string"
      ? error
      : error?.message || error?.name || "";
  if (error instanceof TypeError || looksLikeNetworkString(text)) {
    return { kind: ERROR_KIND.NETWORK, ...COPY[ERROR_KIND.NETWORK] };
  }

  // Otherwise treat any explicit string/message as a generic error, but keep
  // a human-readable fallback rather than leaking raw codes.
  const generic = COPY[ERROR_KIND.UNKNOWN];
  const message =
    fallbackMessage ||
    (typeof error === "string" && error.trim() ? error : null) ||
    generic.message;
  return { kind: ERROR_KIND.UNKNOWN, title: generic.title, message };
}

/** Convenience: just the user-facing message string. */
export function getErrorMessage(error, fallbackMessage) {
  return getErrorInfo(error, fallbackMessage).message;
}

/** Convenience: just the classified kind. */
export function getErrorKind(error) {
  return getErrorInfo(error).kind;
}

/**
 * Throw a status-aware Error when a fetch `Response` is not ok, so downstream
 * `catch` blocks (and `getErrorInfo`) can classify it precisely.
 * Returns the response untouched when ok, for chaining.
 */
export async function throwForStatus(response) {
  if (response && response.ok) return response;
  const status = response?.status;
  let data;
  try {
    const clone = typeof response?.clone === "function" ? response.clone() : response;
    const text = await clone.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  } catch {
    /* ignore body read failures */
  }
  const err = new Error(
    getErrorInfo(status).message || `Request failed with status ${status}`
  );
  err.status = status;
  err.data = data;
  return Promise.reject(err);
}

export default getErrorInfo;
