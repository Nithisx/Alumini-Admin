import axios from "axios";
import { authHeader } from "./authToken";
import { refreshSession, endSession } from "./sessionRefresh";
import { isRefreshable } from "../services/errorCodes";

const SKIP_UNAUTHORIZED_REDIRECT_HEADER = "x-skip-unauthorized-redirect";
const CSRF_SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

function getHeaderValue(headers, name) {
  if (!headers) return null;
  if (typeof headers.get === "function") return headers.get(name);
  const lowerName = name.toLowerCase();
  return headers[name] ?? headers[lowerName] ?? headers[name.toUpperCase()] ?? null;
}

// The httpOnly auth cookie is an ambient credential, so every unsafe request
// relying on it (no Authorization header, or even alongside one — cheap to
// always send) must carry Django's CSRF token as a header. The token itself
// lives in the (deliberately non-httpOnly) "csrftoken" cookie, set the
// moment the backend issues the auth cookie (see api/tokens.py::attach_auth_cookie).
function getCsrfToken() {
  const match = document.cookie.match(/(?:^|; )csrftoken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function shouldSkipUnauthorizedHandling(init) {
  return Boolean(getHeaderValue(init?.headers, SKIP_UNAUTHORIZED_REDIRECT_HEADER));
}

// Intercept native fetch: attach the auth header (JWT Bearer / legacy Token,
// still read by the many call sites not yet migrated to cookie-only auth)
// AND ensure the httpOnly auth cookie + CSRF header are sent on API/chat
// requests — the backend accepts either, but the browser only attaches
// cookies cross-origin if `credentials` says so. This gives every raw
// fetch() call in the app authenticated requests without touching each call
// site individually.
const _originalFetch = window.fetch;
// sessionRefresh must call the UNPATCHED fetch, or refreshing would recurse
// through this interceptor on its own 401 and loop forever.
window.__rawFetch = (...a) => _originalFetch.apply(window, a);

function decorate(input, init = {}) {
  const url = typeof input === "string" ? input : input?.url || "";
  const isApi = /\/api\/|\/chat\//.test(url) || url.includes("karpagamalumni");
  if (!isApi) return init;
  const method = (init.method || "GET").toUpperCase();
  const header = authHeader();
  const existingAuth = getHeaderValue(init.headers, "Authorization");
  const csrfToken = !CSRF_SAFE_METHODS.has(method) ? getCsrfToken() : null;
  const existingCsrf = getHeaderValue(init.headers, "X-CSRFToken");
  const needsHeaders = (header && !existingAuth) || (csrfToken && !existingCsrf);
  const headers = needsHeaders ? new Headers(init.headers || {}) : init.headers;
  if (header && !existingAuth) headers.set("Authorization", header);
  if (csrfToken && !existingCsrf) headers.set("X-CSRFToken", csrfToken);
  return { ...init, headers, credentials: init.credentials || "include" };
}

window.fetch = async function (...args) {
  const [input, init = {}] = args;
  try {
    args[1] = decorate(input, init);
  } catch {
    // never let auth wiring break a request
  }

  let response = await _originalFetch.apply(this, args);

  // The refresh endpoint's own 401 must never trigger a refresh: refreshSession()
  // would hand back the very promise that is awaiting this call (deadlock), and
  // conceptually a failed refresh is already terminal.
  const reqUrl = typeof input === "string" ? input : input?.url || "";
  const isRefreshCall = reqUrl.includes("/auth/refresh/");

  if (response.status === 401 && !isRefreshCall && !shouldSkipUnauthorizedHandling(args[1])) {
    // The 5-minute access token expired — swap it for a fresh one and replay
    // this request once. Only TOKEN_EXPIRED is recoverable; anything else
    // (revoked, tampered, reuse-detected) means the session is truly gone.
    const code = await peekErrorCode(response);
    if (isRefreshable(code) && (await refreshSession())) {
      args[1] = decorate(input, init); // re-attach the now-current CSRF token
      response = await _originalFetch.apply(this, args);
      if (response.status !== 401) return response;
    }
    endSession();
  }
  return response;
};

/** Read the standard error `code` without consuming the caller's body. */
async function peekErrorCode(response) {
  try {
    const body = await response.clone().json();
    return body?.code;
  } catch {
    return undefined;
  }
}

const axiosInstance = axios.create();
axiosInstance.defaults.withCredentials = true;

// Attach the auth header (if any credential is stored) and, for unsafe
// methods, the CSRF header the ambient auth cookie needs.
axiosInstance.interceptors.request.use((config) => {
  const header = authHeader();
  if (header && !getHeaderValue(config.headers, "Authorization")) {
    config.headers = config.headers || {};
    config.headers.Authorization = header;
  }
  const method = (config.method || "get").toUpperCase();
  if (!CSRF_SAFE_METHODS.has(method) && !getHeaderValue(config.headers, "X-CSRFToken")) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers = config.headers || {};
      config.headers["X-CSRFToken"] = csrfToken;
    }
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const response = error?.response;
    const config = error?.config || {};

    const isRefreshCall = String(config.url || "").includes("/auth/refresh/");

    if (
      response?.status === 401 &&
      !isRefreshCall &&
      !getHeaderValue(config.headers, SKIP_UNAUTHORIZED_REDIRECT_HEADER)
    ) {
      // Recoverable: the 5-minute access token aged out. Refresh once (shared
      // across all concurrent 401s) and replay this request. `_retried` stops a
      // request that 401s *again* after a successful refresh from looping.
      if (isRefreshable(response.data?.code) && !config._retried) {
        config._retried = true;
        if (await refreshSession()) {
          return axiosInstance(config);
        }
      }
      // Not recoverable (revoked / tampered / reuse detected / refresh failed).
      endSession();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
