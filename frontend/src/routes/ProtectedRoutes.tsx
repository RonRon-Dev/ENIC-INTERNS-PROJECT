import { useAuth } from "@/auth-context";
import type { UserRole } from "@/data/schema";
import { usePagePrivileges } from "@/hooks/use-page-privileges";
import { notifToast } from "@/lib/notifToast";
import { Atom } from "lucide-react";
import { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
};

export function LoadingScreen() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background">
      {/* Pulsing logo */}
      <div className="relative flex items-center justify-center">
        <span className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-primary/10" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
          <Atom className="h-6 w-6" />
        </div>
      </div>

      {/* Bouncing dots */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40"
            style={{ animationDelay: `${index * 150}ms` }}
          />
        ))}
      </div>

      {/* Label */}
      <p className="text-xs tracking-wide text-muted-foreground">ENIC Systems</p>
    </div>
  );
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, user, sessionExpired } = useAuth();
  const {
    privileges,
    // maintenance,
    loading: privilegesLoading,
  } = usePagePrivileges();
  const { pathname } = useLocation();
  const unauthorizedToastShownRef = useRef(false);

  const userRole = user?.roleName?.toLowerCase() as UserRole | undefined;
  const dbRoles = privileges[pathname];
  const effectiveRoles =
    dbRoles !== undefined
      ? (dbRoles as UserRole[])
      : allowedRoles?.map((role) => role.toLowerCase() as UserRole) ?? [];

  const isUnauthorized =
    (dbRoles !== undefined || (allowedRoles && allowedRoles.length > 0)) &&
    effectiveRoles.length > 0 &&
    (!userRole || !effectiveRoles.includes(userRole));

  useEffect(() => {
    if (isUnauthorized && !unauthorizedToastShownRef.current) {
      notifToast({ reason: "403 Unauthorized role" }, "error");
      unauthorizedToastShownRef.current = true;
      return;
    }

    if (!isUnauthorized) {
      unauthorizedToastShownRef.current = false;
    }
  }, [isUnauthorized]);

  if (loading || privilegesLoading) return <LoadingScreen />;
  if (sessionExpired) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isUnauthorized) return <Navigate to="/home" replace />;
  // if (maintenance[pathname]) return <MaintenanceError />;

  return <>{children}</>;
}
