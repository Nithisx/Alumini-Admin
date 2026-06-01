import axios from "axios";

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
  if (response.status === 401) {
    handleUnauthorized();
  }
  return response;
};

const axiosInstance = axios.create();

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
