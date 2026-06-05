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
    // Ambil accessToken langsung dari memory state Zustand
    const accessToken = usePersistAuthStore.getState().accessToken;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. RESPONSE INTERCEPTOR: Tangani Token Expired (401/403)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const currentPath = window.location.pathname;

    // Jika token kedaluwarsa atau tidak valid di tengah jalan
    if (
      currentPath !== "/signin" &&
      error.response &&
      [401, 403].includes(error.response.status)
    ) {
      // Panggil resetAuth untuk membersihkan state global dan storage terenkripsi
      usePersistAuthStore.getState().resetAuth();
      
      // Bersihkan sisa storage lainnya
      localStorage.clear();
      sessionStorage.clear();

      // Terlempar secara aman ke halaman login
      window.location.href = "/signin";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;