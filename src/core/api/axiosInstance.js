import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  triggerLogout,
} from "./tokenStore";
import { emitToast } from "../hooks/toastBus";

let baseURL = import.meta.env.VITE_API_BASE_URL;

if (import.meta.env.DEV) {
  const useDeployed = localStorage.getItem("USE_DEPLOYED_BACKEND") === "true";
  if (useDeployed) {
    baseURL = "https://rk-brothers-backend-870959582255.asia-south1.run.app/api/v1";
  } else {
    baseURL = "http://localhost:8080/api/v1";
  }
}

const axiosInstance = axios.create({ baseURL });

let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
}

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const isRefreshCall = originalRequest.url === "/auth/refresh";

    if (status === 401 && !originalRequest._retry && !isRefreshCall) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token available");

        const { data } = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken,
        });
        setTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        triggerLogout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    emitToast({ type: "error", message });

    return Promise.reject(error);
  },
);

export default axiosInstance;
