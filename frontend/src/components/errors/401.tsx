import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Home, ShieldOff } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export function UnauthorisedError() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl flex flex-col items-center gap-6 rounded-xl border-2 border-dashed border-border bg-muted/30 p-12 text-center">

        {/* Icon */}
        <div className="relative flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-background">
            <ShieldOff className="h-9 w-9 text-muted-foreground" />
          </div>
          <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-destructive/10 border border-destructive/30">
            <span className="text-[10px] font-bold text-destructive">401</span>
          </div>
        </div>

        {/* Badge */}
        <Badge className="text-xs font-normal bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/10 shadow-none">
          Unauthorized Access
        </Badge>

        {/* Title + description */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-foreground">
            You don't have permission
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Your current role does not have access to this page. Contact your
            administrator if you think this is a mistake.
          </p>
        </div>

        <Separator className="w-full border-dashed" />

        {/* Path hint */}
        <div className="flex items-start gap-3 text-left px-2 w-full">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background border border-border mt-0.5">
            <ShieldOff className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-0.5 pt-0.5">
            <p className="text-xs font-medium text-muted-foreground">
              Restricted route
            </p>
            <code className="text-[11px] font-mono text-muted-foreground">
              {location.pathname}
            </code>
          </div>
        </div>

        <Separator className="w-full border-dashed" />

        {/* Footer actions */}
        <div className="flex items-center justify-between w-full">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground -ml-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Go back
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => navigate("/home")}
          >
            <Home className="h-3.5 w-3.5" />
            Back to Home
          </Button>
        </div>

      </div>
    </div>
  );
}