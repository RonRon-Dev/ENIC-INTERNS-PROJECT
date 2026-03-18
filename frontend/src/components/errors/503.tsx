import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toolsData } from "@/data/tools";
import {
  ArrowLeft,
  Clock4,
  Construction,
  GitBranch,
  Wrench,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

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

const hints = [
  {
    icon: Clock4,
    text: "Check back soon — this module is actively being built.",
  },
  {
    icon: Wrench,
    text: "Our team is working hard to bring this feature to life.",
  },
  {
    icon: GitBranch,
    text: "This page is in active development on a feature branch.",
  },
];

export default function SubToolTestPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = resolvePageMeta(location.pathname);
  const ModuleIcon = meta.icon;

  const hint = hints[location.pathname.length % hints.length];
  const HintIcon = hint.icon;

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="w-full flex flex-col items-center gap-6 rounded-xl border-2 border-spacing-1 border-dashed border-border bg-muted/30 p-12 text-center">

        {/* Top — module icon + construction overlay */}
        <div className="relative flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card">
            {ModuleIcon ? (
              <ModuleIcon className="h-9 w-9 text-muted-foreground" />
            ) : (
              <Construction className="h-9 w-9 text-muted-foreground" />
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-muted border border-border">
            <Construction className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {meta.parentTitle && (
            <Badge variant="secondary" className="text-xs font-normal">
              {meta.parentTitle}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
            Under Development
          </Badge>
        </div>

        {/* Title + description */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-foreground">
            {meta.title}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            {meta.description}
          </p>
        </div>

        <Separator className="w-full border-dashed" />

        {/* Hint row */}
        <div className="flex items-start gap-3 text-left px-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-card border border-border mt-0.5">
            <HintIcon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground/70 leading-relaxed pt-1">
            {hint.text}
          </p>
        </div>

        <Separator className="w-full border-dashed" />

        {/* Footer row */}
        <div className="flex items-center justify-between w-full">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Go back
          </Button>
          <span className="font-mono text-[11px] text-muted-foreground/40">
            {location.pathname}
          </span>
        </div>
      </div>
    </div>
  );
}