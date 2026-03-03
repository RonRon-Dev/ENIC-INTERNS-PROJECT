import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { getIam } from "./services/auth";

// Define the shape of the user object and the authentication context
type User = {
  name: string;
  userName: string;
  nameIdentifier: string;
  roleName?: string;
  forcePasswordChange: boolean;
};

// Define the shape of the authentication context
type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
};

// Create the authentication context
const AuthContext = createContext<AuthContextType | null>(null);

// Function to fetch the authenticated user's information from the server
async function getAuthenticatedUser() {
  const data = await getIam();
  return {
    name: data.name,
    userName: data.userName,
    nameIdentifier: data.nameIdentifier,
    roleName: data.roleName,
    forcePasswordChange: data.forcePasswordChange,
  };
}

// Authentication provider component that wraps the app and provides authentication context
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await getAuthenticatedUser();
      setUser(data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      await refreshUser();
      setLoading(false);
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        isAuthenticated: !!user,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to access the authentication context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
