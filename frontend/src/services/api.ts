import axios from "axios";

//api instance with baseURL and credentials
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

// Response interceptor
/* api.interceptors.response.use(
  (response: any) => response,
  (error: { response: { status: number; }; }) => {
    if (error.response?.status === 401) {
      // Session expired or invalid
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
); */
//Reject the promise without redirecting to login page, so that the caller can handle it (e.g., show a message or redirect manually)
api.interceptors.response.use(
  (res: any) => res,
  (error: { response: { status: number; }; }) => {
    if (error.response?.status === 401) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
