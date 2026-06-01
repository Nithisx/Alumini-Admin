import axios from "axios";

const axiosInstance = axios.create();

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("Token");
      localStorage.removeItem("Role");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
