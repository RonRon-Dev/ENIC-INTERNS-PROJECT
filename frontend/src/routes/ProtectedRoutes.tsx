"use client";

import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth-context";
import { UnauthorisedError } from "@/components/errors/401";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: string[];
};

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const auth = useAuth();

  // Wait for auth to load if needed
  // if (auth.loading) return <div>Loading...</div>;

  // Authentication check
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role-based restriction
  if (allowedRoles && !allowedRoles.includes(auth.user?.roleName ?? "")) {
    return <UnauthorisedError />; // Or redirect: <Navigate to="/home" replace />
  }

  return <>{children}</>;
}
