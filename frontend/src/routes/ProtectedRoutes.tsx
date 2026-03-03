import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth-context";

// ProtectedRoute component that checks if the user is authenticated before rendering the child components
export default function ProtectedRoute({ children }) {
  const auth = useAuth();

  if (auth.loading) return <div>Loading...</div>;

  if (!auth.isAuthenticated)
    return <Navigate to="/login" />;

  return children;
}
