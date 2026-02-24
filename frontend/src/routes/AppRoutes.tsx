import { Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "@/pages/LoginPage"
import SignupPage from "@/pages/SignupPage"
import Dashboard from "@/pages/AdminDashboardPage"
import AppLayout from "@/layouts/AppLayout"
import InventoryToolPage from "@/pages/tools/InventoryToolPage"
import OperationsToolPage from "@/pages/tools/OperationsToolPage"
import GeneralHomePage from "@/pages/GeneralHomePage"

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected / App routes */}
      <Route element={<AppLayout />}>
        <Route index element={<GeneralHomePage />} />
        <Route path="/home" element={<GeneralHomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Tool page routes */}
        <Route path="/inventory" element={<InventoryToolPage />} />
        <Route path="/operations" element={<OperationsToolPage />} />
      </Route>

      {/* Default */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}
