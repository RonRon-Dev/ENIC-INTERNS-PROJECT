import axios, { AxiosError } from "axios";
import { authenticationApi } from "./auth";

type SessionExpiredDetail = {
  reason?: string;
};

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(null);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (originalRequest?.url?.includes("/auth/refresh-token")) {
      return Promise.reject(error);
    }

    // Don't intercept auth endpoints
    if (
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh-token') ||
      originalRequest.url?.includes('/auth/iam')
    ) {
      return Promise.reject(error);
    }

    // Skip if it's already a retry or not a 401
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const initialReason =
      (error.response?.data as { message?: string } | undefined)?.message ??
      "Your session is no longer valid. Please sign in again.";

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(originalRequest))
        .catch((err: unknown) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      await authenticationApi.refreshToken();
      processQueue();
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as AxiosError);
      const refreshReason =
        ((refreshError as AxiosError)?.response?.data as { message?: string } | undefined)
          ?.message ?? initialReason;

      window.dispatchEvent(
        new CustomEvent<SessionExpiredDetail>("session:expired", {
          detail: { reason: refreshReason },
        })
      );
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
