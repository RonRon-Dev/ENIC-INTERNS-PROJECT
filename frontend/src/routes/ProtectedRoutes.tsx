import { useAuth } from "@/auth-context";
import { UnauthorisedError } from "@/components/errors/403";
import { MaintenanceError } from "@/components/errors/503";
import type { UserRole } from "@/data/schema";
import { usePagePrivileges } from "@/hooks/use-page-privileges";
import { notifToast } from "@/lib/notifToast";
import { Atom } from "lucide-react";
import { useEffect } from "react";
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
  const { isAuthenticated, loading, user, sessionExpired } = useAuth();
  const { privileges, maintenance, loading: privilegesLoading } = usePagePrivileges();
  const { pathname } = useLocation();

//   if (loading || privilegesLoading) return <LoadingScreen />;

//   if (sessionExpired) return null;

//   if (!isAuthenticated) return <Navigate to="/login" replace />;

//   // Role check — DB privileges take precedence over toolsData.allowedRoles
//   const userRole = user?.roleName?.toLowerCase() as UserRole | undefined;
//   const dbRoles = privileges[pathname]; // undefined if page not in DB yet

//   // Only enforce roles when either DB has an entry or toolsData specified allowedRoles
//   if (dbRoles !== undefined || (allowedRoles && allowedRoles.length > 0)) {
//     const effectiveRoles =
//       dbRoles !== undefined
//         ? (dbRoles as UserRole[]) // already lowercase from backend
//         : allowedRoles!.map((r) => r.toLowerCase() as UserRole);

//     if (effectiveRoles.length > 0 && (!userRole || !effectiveRoles.includes(userRole))) {
//       if (!toastFired.current) {
//         notifToast({ reason: "403 Unauthorized role" }, "error");
//         toastFired.current = true
//       }
//       return <Navigate to="/home" replace />
//     }
//   }

//   return <>{children}</>;
// }

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user, sessionExpired } = useAuth();
  const { privileges, loading: privilegesLoading } = usePagePrivileges();
  const { pathname } = useLocation();

  const userRole = user?.roleName?.toLowerCase() as UserRole | undefined;
  const dbRoles = privileges[pathname];

  const effectiveRoles =
    dbRoles !== undefined
      ? (dbRoles as UserRole[])
      : allowedRoles?.map((r) => r.toLowerCase() as UserRole) ?? [];

  const isUnauthorized =
    (dbRoles !== undefined || (allowedRoles && allowedRoles.length > 0)) &&
    effectiveRoles.length > 0 &&
    (!userRole || !effectiveRoles.includes(userRole));

  useEffect(() => {
    if (isUnauthorized) {
      notifToast({ reason: "403 Unauthorized role" }, "error");
    }
  }, [isUnauthorized]);

  if (loading || privilegesLoading) return <LoadingScreen />;
  if (sessionExpired) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isUnauthorized) return <Navigate to="/home" replace />;

  if (maintenance[pathname]) {
    return <MaintenanceError />;
  }

  return <>{children}</>;
}
