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

  // if (auth.loading) return <div>Loading...</div>;

  // Login Authetication
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role Restrictions
  if (allowedRoles && !allowedRoles.includes(auth.user?.roleName ?? "")) {
    return <UnauthorisedError />;
  }

  return <>{children}</>;
}
