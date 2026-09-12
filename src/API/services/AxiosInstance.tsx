/**
 * Canonical Axios instance for the whole WMS app (Fase 1 — 1 dunia API).
 * Semua service (API / DynamicAPI / OutboundSalesman) harus memakai instance ini.
 * Path lama `DynamicAPI/AxiosInstance` di-re-export ke file ini.
 */
import axios from "axios";
import { EndPoint } from "../../utils/EndPoint";
import { usePersistAuthStore } from "../store/AuthStore/PersistAuthStore";

const axiosInstance = axios.create({
  baseURL: EndPoint,
  timeout: 10000,
});

// 1. REQUEST INTERCEPTOR: Ambil token dari Zustand terenkripsi
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = usePersistAuthStore.getState().accessToken;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 2. RESPONSE INTERCEPTOR: Tangani Token Expired (401/403)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const currentPath = window.location.pathname;

    if (
      currentPath !== "/signin" &&
      error.response &&
      [401, 403].includes(error.response.status)
    ) {
      usePersistAuthStore.getState().resetAuth();

      localStorage.clear();
      sessionStorage.clear();

      window.location.href = "/signin";
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
