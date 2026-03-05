import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth-context";
import { UnauthorisedError } from "@/components/errors/401";
import type { UserRole } from "@/data/schema";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
};

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-muted-foreground text-sm">DESIGN LOADING HERE FOR HARD RESET</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.roleName?.toLowerCase() as UserRole | undefined;

  if (allowedRoles && allowedRoles.length > 0) {
    const normalised = allowedRoles.map((r) => r.toLowerCase() as UserRole);
    if (!userRole || !normalised.includes(userRole)) {
      return <UnauthorisedError />;
    }
  }

  return <>{children}</>;
}
