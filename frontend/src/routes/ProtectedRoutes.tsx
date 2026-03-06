import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth-context";
import { UnauthorisedError } from "@/components/errors/401";
import type { UserRole } from "@/data/schema";
import { Atom } from "lucide-react";
import { useEffect } from "react";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
};

export function LoadingScreen() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background">
      {/* Pulsing logo */}
      <div className="relative flex items-center justify-center">
        <span className="absolute inline-flex h-16 w-16 rounded-full bg-primary/10 animate-ping" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
          <Atom className="h-6 w-6" />
        </div>
      </div>

      {/* Bouncing dots */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>

      {/* Label */}
      <p className="text-xs text-muted-foreground tracking-wide">
        ENIC Systems
      </p>
    </div>
  );
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const userRole = user?.roleName?.toLowerCase() as UserRole | undefined;

  if (allowedRoles && allowedRoles.length > 0) {
    const normalised = allowedRoles.map((r) => r.toLowerCase() as UserRole);

    if (!userRole || !normalised.includes(userRole)) {
      return <UnauthorisedError />;
    }
  }

  return <>{children}</>;
}
