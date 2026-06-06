import axios from "axios";

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
  if (!localStorage.getItem("Token")) return;
  localStorage.removeItem("Token");
  localStorage.removeItem("Role");
  window.location.href = "/login";
}

// Intercept native fetch for 401s
const _originalFetch = window.fetch;
window.fetch = async function (...args) {
  const response = await _originalFetch.apply(this, args);
  if (response.status === 401 && !shouldSkipUnauthorizedHandling(args[1])) {
    handleUnauthorized();
  }
  return response;
};

const axiosInstance = axios.create();

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
