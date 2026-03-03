import * as requests from "@/validations";

import api from "./api";

//User Information and Permissions and Roles
export const getIam = async () => {
  const response = await api.get("/auth/iam");
  console.log("getIam response:", response);
  return response.data;
}

export const login = async (data: requests.LoginRequest) => {
  const response = await api.post("/auth/login", {
    userName: data.username,
    password: data.password,
  });
  return response.data;
};

export const signup = async (data: requests.SignupRequest) => {
  const response = await api.post("/auth/register", {
    name: data.fullname,
    userName: data.username,
    password: data.password,
  });
  return response.data;
};

export const forgotPassword = async (data: requests.ForgotPasswordRequest) => {
  const response = await api.post("/auth/forgot-password", {
    userName: data.username,
  });
  return response.data;
}

export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
}

