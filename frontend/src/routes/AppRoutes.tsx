import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/AdminDashboardPage";
import AppLayout from "@/layouts/AppLayout";
import InventoryToolPage from "@/pages/tools/InventoryToolPage";
import OperationsToolPage from "@/pages/tools/OperationsToolPage";
import GeneralHomePage from "@/pages/GeneralHomePage";
import AuthPage from "@/pages/auth/AuthPage";
import UserManagementPage from "@/pages/UserManagementPage";
import SubToolTestPage from "@/pages/tools/subtools/SubToolPage";
import ProtectedRoute from "./ProtectedRoutes";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Default Landing */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* Public Route */}
      <Route path="/login" element={<AuthPage />} />

      {/* Protected Application Layout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<GeneralHomePage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Superadmin", "Admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["Superadmin", "Admin"]}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Nested Inventory Routes */}
        <Route path="/inventory">
          <Route index element={<InventoryToolPage />} />
          <Route path="subtool_1" element={<SubToolTestPage />} />
          <Route path="subtool_2" element={<SubToolTestPage />} />
        </Route>

        <Route path="/operations" element={<OperationsToolPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
