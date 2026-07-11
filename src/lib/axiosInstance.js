import axios from "axios";
import { authHeader, clearAuth, getToken } from "./authToken";

const SKIP_UNAUTHORIZED_REDIRECT_HEADER = "x-skip-unauthorized-redirect";

function getHeaderValue(headers, name) {
  if (!headers) return null;
  if (typeof headers.get === "function") return headers.get(name);
  const lowerName = name.toLowerCase();
  return headers[name] ?? headers[lowerName] ?? headers[name.toUpperCase()] ?? null;
}

function shouldSkipUnauthorizedHandling(init) {
  return Boolean(getHeaderValue(init?.headers, SKIP_UNAUTHORIZED_REDIRECT_HEADER));
}

function handleUnauthorized() {
  // Only redirect if the user was actually logged in (has a token)
  if (!getToken()) return;
  clearAuth();
  window.location.href = "/login";
}

// Intercept native fetch: attach the auth header (JWT Bearer / legacy Token,
// back-compat during the httpOnly-cookie migration) AND ensure the httpOnly
// auth cookie is sent on API/chat requests — the backend now accepts either,
// but the browser only attaches cookies cross-origin if `credentials` says
// so. This gives every raw fetch() call in the app authenticated requests
// without touching each call site.
const _originalFetch = window.fetch;
window.fetch = async function (...args) {
  const [input, init = {}] = args;
  try {
    const url = typeof input === "string" ? input : input?.url || "";
    const isApi = /\/api\/|\/chat\//.test(url) || url.includes("karpagamalumni");
    if (isApi) {
      const header = authHeader();
      const existing = getHeaderValue(init.headers, "Authorization");
      const headers = header && !existing ? new Headers(init.headers || {}) : init.headers;
      if (header && !existing) headers.set("Authorization", header);
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

// Attach auth header to every axios request unless one is already present.
axiosInstance.interceptors.request.use((config) => {
  const header = authHeader();
  if (header && !getHeaderValue(config.headers, "Authorization")) {
    config.headers = config.headers || {};
    config.headers.Authorization = header;
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
