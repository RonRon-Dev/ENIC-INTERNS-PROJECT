import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import AuthPage from "@/pages/auth/AuthPage";
import { ProtectedRoute } from "@/routes/ProtectedRoutes";
// import {  LoadingScreen } from "@/routes/ProtectedRoutes";
import GeneralHomePage from "@/pages/GeneralHomePage";
import DevelopmentToolPage from "@/pages/tools/DevelopmentToolPage";
import { toolsData } from "@/data/tools";
import { useAuth } from "@/auth-context";
import type { Tool, SubTool } from "@/data/tools";
import type { UserRole } from "@/data/schema";
import SettingsPage from "@/pages/general/SettingsPage";
import AboutDevPage from "@/pages/general/AboutDevPage";
import AccountPage from "@/pages/settings/AccountPage";
import PreferencesPage from "@/pages/settings/PreferencesPage";

function PublicRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    // const { loading } = useAuth();

    /* if (loading) return <LoadingScreen />;
  */
    if (isAuthenticated) {
        return <Navigate to="/home" replace />;
    }

    return <>{children}</>;
}

function FallbackRoute() {
    const { isAuthenticated } = useAuth();

    return (
        <Navigate
            to={isAuthenticated ? "/home" : "/login"}
            replace
        />
    );
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
                const basePath = tool.subtools[0].url.split("/").slice(0, 2).join("/");

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
                        {tool.subtools.map((sub) => {
                            const segment = sub.url.split("/").slice(2).join("/");
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

            // Leaf tool
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
