import { useLocation, useNavigate } from "react-router-dom";
import { toolsData } from "@/data/tools";
import {
  Construction,
  ArrowLeft,
  CircleCheck,
  CircleDashed,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function resolvePageMeta(pathname: string): {
  title: string;
  description: string;
  parentTitle?: string;
  icon?: React.ElementType;
  hasComponent: boolean;
} {
  for (const tool of toolsData) {
    if (tool.url && tool.url === pathname) {
      return {
        title: tool.title,
        description: tool.description ?? "",
        icon: tool.icon,
        hasComponent: !!tool.component,
      };
    }
    if (tool.subtools) {
      for (const sub of tool.subtools) {
        if (sub.url === pathname) {
          return {
            title: sub.title,
            description: sub.description ?? tool.description ?? "",
            parentTitle: tool.title,
            icon: tool.icon,
            hasComponent: !!sub.component,
          };
        }
      }
    }
  }
  const segment = pathname.split("/").filter(Boolean).pop() ?? "page";
  return {
    title: segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    description: "This page is currently under development.",
    hasComponent: false,
  };
}

export default function DevelopmentToolPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = resolvePageMeta(location.pathname);
  const ModuleIcon = meta.icon;

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="w-full flex flex-col items-center gap-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 p-12 text-center">
        {/* Icon */}
        <div className="relative flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            {ModuleIcon ? (
              <ModuleIcon className="h-9 w-9 text-gray-400" />
            ) : (
              <Construction className="h-9 w-9 text-gray-400" />
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-amber-900/60 border border-gray-300 dark:border-amber-700">
            <Construction className="h-3.5 w-3.5 text-gray-600" />
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {meta.parentTitle && (
            <Badge variant="secondary" className="text-xs font-normal">
              {meta.parentTitle}
            </Badge>
          )}
          <Badge className="text-xs font-normal bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-700 shadow-none">
            Under Development
          </Badge>
        </div>

        {/* Title + description */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {meta.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
            {meta.description}
          </p>
        </div>

        <Separator className="w-full border-dashed" />

        {/* Component status row */}
        <div className="flex items-start gap-3 text-left px-2 w-full">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border mt-0.5 ${
              meta.hasComponent
                ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
            }`}
          >
            {meta.hasComponent ? (
              <CircleCheck className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <CircleDashed className="h-3.5 w-3.5 text-gray-400" />
            )}
          </div>
          <div className="flex flex-col gap-0.5 pt-0.5">
            <p
              className={`text-xs font-medium ${
                meta.hasComponent
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {meta.hasComponent
                ? "Component created and registered"
                : "No component assigned yet"}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              {meta.hasComponent
                ? `A component is wired to this route in tools.ts but this fallback page is still rendering. Check AppRoutes.tsx.`
                : `Assign a component to this route in src/data/tools.ts to replace this page.`}
            </p>
          </div>
        </div>

        <Separator className="w-full border-dashed" />

        {/* Footer */}
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
          <span className="font-mono text-[11px] text-gray-300 dark:text-gray-600">
            {location.pathname}
          </span>
        </div>
      </div>
    </div>
  );
}
