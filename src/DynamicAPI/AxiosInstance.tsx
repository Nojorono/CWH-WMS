import axios from "axios";
import { EndPoint } from "../utils/EndPoint";

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
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.clear();
      window.location.reload();
      setTimeout(() => {
        window.location.href = "/signin";
      }, 100);

      // console.log("Unauthorized access - redirecting to sign-in page");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
