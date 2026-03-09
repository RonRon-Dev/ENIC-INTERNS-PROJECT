import * as requests from "@/validations";
import api from "./api";

// User Information, Permissions and Roles
export const authenticationApi = {
  refreshToken: async () => {
    const response = await api.post("/auth/refresh-token");
    return response.data;
  },
  getIam: async () => {
    const response = await api.get("/auth/iam");
    return response.data;
  },
  login: async (data: requests.LoginRequest) => {
    const response = await api.post("/auth/login", {
      userName: data.username,
      password: data.password,
    });
    return response.data;
  },
  signup: async (data: requests.SignupRequest) => {
    const response = await api.post("/auth/register", {
      name: data.fullname,
      userName: data.username,
      password: data.password,
    });
    return response.data;
  },
  forgotPassword: async (data: requests.ForgotPasswordRequest) => {
    const response = await api.post("/auth/forgot-password", {
      userName: data.username,
    });
    return response.data;
  },
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
  updatePassword: async (userName: string, newPassword: string) => {
    const response = await api.patch("/auth/update-password", {
      userName,
      newPassword,
    });
    return response.data;
  },
};
