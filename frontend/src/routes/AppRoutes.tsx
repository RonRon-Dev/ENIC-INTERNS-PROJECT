import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/LoginPage";
import Dashboard from "@/pages/DashboardPage";
// import ForgotPassword from "@/pages/ForgotPassword";
import SignupPage from "@/pages/SignupPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Login page */}
      <Route path="/login" element={<Login />} />

      {/* Forgot password page */}
      {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}

      {/* Sign up page */}
      <Route path="/signup" element={<SignupPage />} />

      {/* Dashboard / home page */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Default route */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}