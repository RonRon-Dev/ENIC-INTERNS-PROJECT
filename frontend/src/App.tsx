import { DialogProvider } from "@/components/dialogs/dialog-provider";
import { Dialogs } from "@/components/dialogs/dialogs";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthProvider } from "./auth-context";
import { SessionExpiredDialog } from "./components/dialogs/session-expired-dialog";

import { PagePrivilegesProvider } from "@/hooks/use-page-privileges";
// =======
// import "./index.css";
 import AppRoutes from "./routes/AppRoutes";
// >>>>>>> 8192f3d31a1791e1baf5c81f9137afd045932718

export default function App() {
  const isMobile = useIsMobile();

  if (isMobile === undefined) return null;

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-6 bg-white">
        <h1 className="text-2xl font-bold text-gray-800">Desktop Only</h1>
        <p className="text-gray-500 mt-2">
          This app is not supported on mobile devices.<br />
          Please use a desktop or laptop.
        </p>
      </div>
    );
  }

  return (
    <AuthProvider>
      <PagePrivilegesProvider>
        <SessionExpiredDialog/>
        <DialogProvider>
          <AppRoutes />
          <Dialogs />
        </DialogProvider>
      </PagePrivilegesProvider>
    </AuthProvider>
  );
}