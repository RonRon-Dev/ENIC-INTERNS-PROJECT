import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/AdminDashboardPage";
import AppLayout from "@/layouts/AppLayout";
import InventoryToolPage from "@/pages/tools/InventoryToolPage";
import OperationsToolPage from "@/pages/tools/OperationsToolPage";
import GeneralHomePage from "@/pages/GeneralHomePage";
import AuthPage from "@/pages/auth/AuthPage";
import UserManagementPage from "@/pages/UserManagementPage";
import SubToolTestPage from "@/pages/tools/subtools/SubToolPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />

      <Route element={<AppLayout />}>
        <Route index element={<GeneralHomePage />} />
        <Route path="/home" element={<GeneralHomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UserManagementPage />} />

        <Route path="/inventory">
          <Route index element={<InventoryToolPage />} />

          <Route path="subtool_1" element={<SubToolTestPage />} />
          {/* <Route path="analytics" element={<InventoryAnalyticsPage />} /> */}
        </Route>

        <Route path="/operations" element={<OperationsToolPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
