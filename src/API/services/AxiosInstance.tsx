import axios from "axios";
import { EndPoint } from "../../utils/EndPoint";

const axiosInstance = axios.create({
  baseURL: EndPoint,
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("token");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const currentPath = window.location.pathname;

    // Jangan redirect kalau sedang login
    if (
      currentPath !== "/signin" &&
      error.response &&
      [401, 403].includes(error.response.status)
    ) {
      localStorage.clear();
      window.location.href = "/signin";
    }

    // Untuk server error (500), jangan redirect, biar form yang handle
    return Promise.reject(error);
  }
);

export default axiosInstance;
