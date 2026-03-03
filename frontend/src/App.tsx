// App.tsx
import AppRoutes from "./routes/AppRoutes";
import "./index.css" 
import { AuthProvider } from "./auth-context";

export default function App() {
  return (
    // Wrap the app with AuthProvider to provide authentication context to all components
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
