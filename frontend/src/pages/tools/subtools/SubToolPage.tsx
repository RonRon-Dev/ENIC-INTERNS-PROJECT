import { useLocation, useNavigate } from "react-router-dom";
import { toolsData } from "@/data/tools";
import { ArrowLeft, Construction, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ---------------------------------------------------------------------------
// Resolve page meta from toolsData by matching pathname
// ---------------------------------------------------------------------------
function resolvePageMeta(pathname: string): {
  title: string;
  description: string;
  parentTitle?: string;
  icon?: React.ElementType;
} {
  for (const tool of toolsData) {
    if (tool.url && tool.url === pathname) {
      return {
        title: tool.title,
        description: tool.description ?? "",
        icon: tool.icon,
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
          };
        }
      }
    }
  }

  const segment = pathname.split("/").filter(Boolean).pop() ?? "page";
  return {
    title: segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    description: "This page is currently under development.",
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SubToolTestPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = resolvePageMeta(location.pathname);
  const Icon = meta.icon;

  return (
    <div className="flex items-center justify-center w-full px-4">
      <div className="w-full h-full border-2 border-dashed rounded-2xl bg-card p-10 flex flex-col items-center gap-6 text-center">
        {/* Icon */}
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted border">
            {Icon ? (
              <Icon className="h-7 w-7 text-muted-foreground" />
            ) : (
              <Wrench className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-background border">
            <Construction className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        {/* Parent badge */}
        {meta.parentTitle && (
          <Badge variant="secondary" className="text-xs font-normal">
            {meta.parentTitle}
          </Badge>
        )}

        {/* Title + description */}
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">{meta.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            {meta.description}
          </p>
        </div>

        {/* Status row */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span>Under development</span>
          <span className="h-3 w-px bg-border" />
          <span className="font-mono text-[11px]">{location.pathname}</span>
        </div>

        <Separator />

        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground w-full"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </Button>
      </div>
    </div>
  );
}
