import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldOff, ArrowLeft, Home } from "lucide-react";
import { useLocation } from "react-router-dom";

export function UnauthorisedError() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="w-full  flex flex-col items-center gap-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 p-12 text-center">
        {/* Icon */}
        <div className="relative flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <ShieldOff className="h-9 w-9 text-gray-400" />
          </div>
          <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800">
            <span className="text-[10px] font-bold text-red-500">401</span>
          </div>
        </div>

        {/* Badge */}
        <Badge className="text-xs font-normal bg-red-50 text-red-600 border-red-200 hover:bg-red-50 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 shadow-none">
          Unauthorized Access
        </Badge>

        {/* Title + description */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            You don't have permission
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
            Your current role does not have access to this page. Contact your
            administrator if you think this is a mistake.
          </p>
        </div>

        <Separator className="w-full border-dashed" />

        {/* Path hint */}
        <div className="flex items-start gap-3 text-left px-2 w-full">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mt-0.5">
            <ShieldOff className="h-3.5 w-3.5 text-gray-400" />
          </div>
          <div className="flex flex-col gap-0.5 pt-0.5">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
              Restricted route
            </p>
            <code className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
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
            className="gap-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 -ml-2"
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
