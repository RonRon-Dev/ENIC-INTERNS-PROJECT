import { DialogProvider } from "@/components/dialogs/dialog-provider";
import { Dialogs } from "@/components/dialogs/dialogs";
import { useIsMobile } from "@/hooks/use-mobile";
import { Monitor } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center h-screen text-center px-6 bg-background">
        <Monitor className="w-10 h-10 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Widescreen Only</h1>
        <p className="text-muted-foreground mt-2">
          This app works best on a desktop or laptop.<br />
          Please switch to a wider screen to continue.
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