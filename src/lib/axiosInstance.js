import axios from "axios";
import { authHeader, clearAuth, getRole } from "./authToken";

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

function handleUnauthorized() {
  // Only redirect if the user was actually logged in (has a cached role)
  if (!getRole()) return;
  clearAuth();
  window.location.href = "/login";
}

// Intercept native fetch: attach the auth header (JWT Bearer / legacy Token,
// still read by the many call sites not yet migrated to cookie-only auth)
// AND ensure the httpOnly auth cookie + CSRF header are sent on API/chat
// requests — the backend accepts either, but the browser only attaches
// cookies cross-origin if `credentials` says so. This gives every raw
// fetch() call in the app authenticated requests without touching each call
// site individually.
const _originalFetch = window.fetch;
window.fetch = async function (...args) {
  const [input, init = {}] = args;
  try {
    const url = typeof input === "string" ? input : input?.url || "";
    const isApi = /\/api\/|\/chat\//.test(url) || url.includes("karpagamalumni");
    if (isApi) {
      const method = (init.method || "GET").toUpperCase();
      const header = authHeader();
      const existingAuth = getHeaderValue(init.headers, "Authorization");
      const csrfToken = !CSRF_SAFE_METHODS.has(method) ? getCsrfToken() : null;
      const existingCsrf = getHeaderValue(init.headers, "X-CSRFToken");
      const needsHeaders = (header && !existingAuth) || (csrfToken && !existingCsrf);
      const headers = needsHeaders ? new Headers(init.headers || {}) : init.headers;
      if (header && !existingAuth) headers.set("Authorization", header);
      if (csrfToken && !existingCsrf) headers.set("X-CSRFToken", csrfToken);
      args[1] = { ...init, headers, credentials: init.credentials || "include" };
    }
  } catch {
    // never let auth wiring break a request
  }
  const response = await _originalFetch.apply(this, args);
  if (response.status === 401 && !shouldSkipUnauthorizedHandling(args[1])) {
    handleUnauthorized();
  }
  return response;
};

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
  (error) => {
    if (error?.response?.status === 401 && !getHeaderValue(error?.config?.headers, SKIP_UNAUTHORIZED_REDIRECT_HEADER)) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
