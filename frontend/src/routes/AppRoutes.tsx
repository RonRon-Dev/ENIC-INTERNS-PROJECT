import { Routes, Route, Navigate } from "react-router-dom"
import Login from "@/pages/LoginPage"
import SignupPage from "@/pages/SignupPage"
import Dashboard from "@/pages/DashboardPage"
import AppLayout from "@/layouts/AppLayout"
import InventoryToolPage from "@/pages/tools/InventoryToolPage"
import OperationsToolPage from "@/pages/tools/OperationsToolPage"

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected / App routes */}
      <Route element={<AppLayout />}>
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