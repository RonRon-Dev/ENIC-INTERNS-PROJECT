import AppLayout from "@/layouts/AppLayout";
import AuthPage from "@/pages/auth/AuthPage";
import { ProtectedRoute } from "@/routes/ProtectedRoutes";
import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
// import {  LoadingScreen } from "@/routes/ProtectedRoutes";
import { useAuth } from "@/auth-context";
import type { UserRole } from "@/data/schema";
import type { SubTool, Tool } from "@/data/tools";
import { toolsData } from "@/data/tools";
import DevPage from "@/pages/DevPage";
import EurolinkPage from "@/pages/EuroLandingPage";
import AboutDevPage from "@/pages/general/AboutDevPage";
import SettingsPage from "@/pages/general/SettingsPage";
import GeneralHomePage from "@/pages/GeneralHomePage";
import AppOverviewPage from "@/pages/LandingPage";
import AccountPage from "@/pages/settings/AccountPage";
import PreferencesPage from "@/pages/settings/PreferencesPage";
import DevelopmentToolPage from "@/pages/tools/DevelopmentToolPage";

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

function FallbackRoute() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/home" : "/login"} replace />;
}

function PageComponent({ tool }: { tool: Tool | SubTool }) {
  const Component = tool.component ?? DevelopmentToolPage;
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
          {/* Loading… */}
        </div>
      }
    >
      <Component />
    </Suspense>
  );
}

function generateRoutes() {
  const MANUAL = ["Home"];

  return toolsData
    .filter((tool) => !MANUAL.includes(tool.title))
    .flatMap((tool) => {
      // Collapsible tool with subtools
      if (tool.subtools && tool.subtools.length > 0) {
        // Skip entirely if no subtool has an internal url (all external)
        const firstUrl = tool.subtools.find((s) => s.url)?.url;
        if (!firstUrl) return [];

        const basePath = firstUrl.split("/").slice(0, 2).join("/");

        return (
          <Route key={basePath} path={basePath}>
            {tool.component && (
              <Route
                index
                element={
                  <ProtectedRoute
                    allowedRoles={tool.allowedRoles as UserRole[]}
                  >
                    <PageComponent tool={tool} />
                  </ProtectedRoute>
                }
              />
            )}
            {/* Only generate routes for subtools with internal urls — skip external ones */}
            {tool.subtools
              .filter((sub) => !!sub.url)
              .map((sub) => {
                const segment = sub.url!.split("/").slice(2).join("/");
                return (
                  <Route
                    key={sub.url}
                    path={segment}
                    element={
                      <ProtectedRoute
                        allowedRoles={
                          (sub.allowedRoles ?? tool.allowedRoles) as UserRole[]
                        }
                      >
                        <PageComponent tool={sub} />
                      </ProtectedRoute>
                    }
                  />
                );
              })}
          </Route>
        );
      }

      // Leaf tool — skip if external only (no internal url)
      if (!tool.url) return [];
      return (
        <Route
          key={tool.url}
          path={tool.url}
          element={
            <ProtectedRoute allowedRoles={tool.allowedRoles as UserRole[]}>
              <PageComponent tool={tool} />
            </ProtectedRoute>
          }
        />
      );
    });
}

// ---------------------------------------------------------------------------
// AppRoutes
// ---------------------------------------------------------------------------
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/profile" element={<EurolinkPage />} />
      <Route path="/overview">
        <Route index element={<AppOverviewPage />} />
        <Route path="developers" element={<DevPage />} />
      </Route>

      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<GeneralHomePage />} />
        <Route path="/settings" element={<SettingsPage />}>
          <Route index element={<Navigate to="/settings/account" replace />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="preferences" element={<PreferencesPage />} />
        </Route>
        <Route path="/about-developers" element={<AboutDevPage />} />
        {generateRoutes()}
      </Route>

      <Route path="*" element={<FallbackRoute />} />
    </Routes>
  );
}
