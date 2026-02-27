import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/AdminDashboardPage";
import AppLayout from "@/layouts/AppLayout";
import InventoryToolPage from "@/pages/tools/InventoryToolPage";
import OperationsToolPage from "@/pages/tools/OperationsToolPage";
import GeneralHomePage from "@/pages/GeneralHomePage";
import AuthPage from "@/pages/auth/AuthPage";
import UserManagementPage from "@/pages/UserManagementPage";
import SubToolTestPage from "@/pages/tools/subtools/SubToolPage";
// import { ForgotPasswordForm } from "@/pages/auth/ForgotPasswordForm";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Default Landing */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public Routes */}
      <Route path="/login" element={<AuthPage />} />

    
      {/* <Route
        path="/test"
        element={
          <ForgotPasswordForm
            onBack={() => {
              console.log("Navigation back triggered from test route");
               useNavigate() 
            }}
          />
        }
      /> */}

      {/* Protected Application Layout */}
      <Route element={<AppLayout />}>
        <Route path="/home" element={<GeneralHomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UserManagementPage />} />

        {/* Nested Inventory Routes */}
        <Route path="/inventory">
          <Route index element={<InventoryToolPage />} />
          <Route path="subtool_1" element={<SubToolTestPage />} />
          <Route path="subtool_2" element={<SubToolTestPage />} />
        </Route>

        <Route path="/operations" element={<OperationsToolPage />} />
      </Route>

      {/* Fall back */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
