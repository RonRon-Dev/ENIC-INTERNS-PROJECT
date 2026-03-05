import axios from "axios";

//api instance with baseURL and credentials
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(null);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Skip if it's already a retry or not a 401
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      // Queue until current refresh finishes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      console.log("Interceptor: Attempting token refresh..."); // ← debug log

      await api.post("/auth/refresh-token"); // browser sends refreshToken cookie automatically

      console.log("Interceptor: Refresh successful");

      processQueue(); // resolve queued requests

      return api(originalRequest); // retry original with new accessToken cookie
    } catch (refreshError) {
      console.error("Interceptor: Refresh failed", refreshError);

      processQueue(refreshError);
      window.location.href = "/login"; // or use your router: navigate("/login")
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
