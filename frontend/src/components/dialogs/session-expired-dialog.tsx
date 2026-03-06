import { useAuth } from "@/auth-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SessionExpiredDialog() {
  const { sessionExpired, idleSecondsLeft, dismissSessionExpired } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    dismissSessionExpired();
    navigate("/login", { replace: true });
  };

  const handleStillHere = () => {
    window.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  };

  // ── Countdown warning ──────────────────────────────────────────────────────
  if (idleSecondsLeft !== null && !sessionExpired) {
    return (
      <Dialog open>
        <DialogContent
          className="sm:max-w-sm [&>button:last-child]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <DialogTitle className="text-base">Still there?</DialogTitle>
            </div>
            <DialogDescription className="text-sm leading-relaxed">
              You've been idle for a while. Your session will expire in{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {idleSecondsLeft}s
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button className="w-full" onClick={handleStillHere}>
              I'm still here
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Session expired ────────────────────────────────────────────────────────
  if (sessionExpired) {
    return (
      <Dialog open>
        <DialogContent
          className="sm:max-w-sm [&>button:last-child]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <DialogTitle className="text-base">Session Expired</DialogTitle>
            </div>
            <DialogDescription className="text-sm leading-relaxed">
              Your session has expired due to inactivity. Please log in again to
              continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button className="w-full" onClick={handleLogin}>
              Go to Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
