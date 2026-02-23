import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import ForgotPassword from "../pages/ForgotPassword";


export default function AppRoutes() {
  return (
    <Routes>
      {/* Login page */}
      <Route path="/login" element={<Login />} />

      {/* Forgot password page */}
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Dashboard / home page */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Default route */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}