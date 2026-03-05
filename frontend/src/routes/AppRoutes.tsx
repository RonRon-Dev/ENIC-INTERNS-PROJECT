import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import AuthPage from "@/pages/auth/AuthPage";
import ProtectedRoute from "./ProtectedRoutes";

// Pages
import GeneralHomePage from "@/pages/GeneralHomePage";
import Dashboard from "@/pages/AdminDashboardPage";
import UserManagementPage from "@/pages/UserManagementPage";
import InventoryToolPage from "@/pages/tools/InventoryToolPage";
import OperationsToolPage from "@/pages/tools/OperationsToolPage";
import SubToolTestPage from "@/pages/tools/subtools/SubToolPage";

import { toolsData } from "@/data/tools";

function rolesFor(title: string) {
  return toolsData.find((t) => t.title === title)?.allowedRoles;
}

function subRolesFor(parentTitle: string, subTitle: string) {
  const parent = toolsData.find((t) => t.title === parentTitle);
  return (
    parent?.subtools?.find((s) => s.title === subTitle)?.allowedRoles ??
    parent?.allowedRoles
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Default landing */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* Public */}
      <Route path="/login" element={<AuthPage />} />

      {/* Protected shell — any authenticated user */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Home — all authenticated users */}
        <Route path="/home" element={<GeneralHomePage />} />

        {/* Dashboard — superadmin, admin */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={rolesFor("Dashboard")}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* User Management — superadmin, admin */}
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={rolesFor("User Management")}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Inventory & Assets */}
        <Route path="/inventory">
          <Route
            index
            element={
              <ProtectedRoute allowedRoles={rolesFor("Inventory & Assets")}>
                <InventoryToolPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="assets"
            element={
              <ProtectedRoute
                allowedRoles={subRolesFor("Inventory & Assets", "Asset List")}
              >
                <SubToolTestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="assets/new_assets"
            element={
              <ProtectedRoute
                allowedRoles={subRolesFor(
                  "Inventory & Assets",
                  "Add New Asset"
                )}
              >
                <SubToolTestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute
                allowedRoles={subRolesFor(
                  "Inventory & Assets",
                  "Asset Reports"
                )}
              >
                <SubToolTestPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Operations */}
        <Route path="/operations">
          <Route
            index
            element={
              <ProtectedRoute allowedRoles={rolesFor("Operations")}>
                <OperationsToolPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="tasks"
            element={
              <ProtectedRoute
                allowedRoles={subRolesFor("Operations", "Task Board")}
              >
                <SubToolTestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="shifts"
            element={
              <ProtectedRoute
                allowedRoles={subRolesFor("Operations", "Shift Schedules")}
              >
                <SubToolTestPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Finance */}
        <Route path="/finance">
          <Route
            path="expenses"
            element={
              <ProtectedRoute
                allowedRoles={subRolesFor("Finance", "Expense Tracker")}
              >
                <SubToolTestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="budget"
            element={
              <ProtectedRoute
                allowedRoles={subRolesFor("Finance", "Budget Planner")}
              >
                <SubToolTestPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Marketing */}
        <Route path="/marketing">
          <Route
            path="campaigns"
            element={
              <ProtectedRoute
                allowedRoles={subRolesFor("Marketing", "Campaigns")}
              >
                <SubToolTestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="leads"
            element={
              <ProtectedRoute allowedRoles={subRolesFor("Marketing", "Leads")}>
                <SubToolTestPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
