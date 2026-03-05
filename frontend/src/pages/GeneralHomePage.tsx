"use client";

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Lock, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth-context";
import { toolsData, hasAccess } from "@/data/tools";
import type { ElementType } from "react";
import type { UserRole } from "@/data/schema";

type ToolCard = {
  title: string;
  description: string;
  icon: ElementType | null;
  url: string | null;
  parentTitle: string | null;
  isAccessible: boolean;
};

function ToolSkeleton() {
  return (
    <div className="flex items-center gap-4 p-5 border rounded-xl bg-card/50">
      <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const EXCLUDED = ["Home", "Dashboard", "User Management"];

export default function GeneralHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const now = useClock();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const userRole = user?.roleName?.toLowerCase() as UserRole | undefined;
  const firstName = user?.name?.split(" ")[0] ?? "User";
  const fullName = user?.name ?? "";
  const role = user?.roleName ?? "";
  const username = user?.userName ?? "";

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const formattedDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const tools = useMemo<ToolCard[]>(() => {
    return toolsData
      .filter((tool) => !EXCLUDED.includes(tool.title))
      .flatMap((tool): ToolCard[] => {
        if (tool.subtools && tool.subtools.length > 0) {
          return tool.subtools.map(
            (sub): ToolCard => ({
              title: sub.title,
              description: sub.description ?? tool.description ?? "",
              icon: tool.icon ?? null,
              url: sub.url,
              parentTitle: tool.title,
              isAccessible: hasAccess(
                userRole,
                sub.allowedRoles ?? tool.allowedRoles
              ),
            })
          );
        }
        return [
          {
            title: tool.title,
            description: tool.description ?? "",
            icon: tool.icon ?? null,
            url: tool.url ?? null,
            parentTitle: null,
            isAccessible: hasAccess(userRole, tool.allowedRoles),
          },
        ];
      });
  }, [userRole]);

  const sortedTools = useMemo<ToolCard[]>(() => {
    const q = searchQuery.toLowerCase();
    return tools
      .filter(
        (t: ToolCard) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      )
      .sort(
        (a: ToolCard, b: ToolCard) =>
          Number(b.isAccessible) - Number(a.isAccessible)
      );
  }, [tools, searchQuery]);

  const accessibleCount = tools.filter((t: ToolCard) => t.isAccessible).length;

  return (
    <div className="space-y-6">
      {/* ── Welcome Header ─────────────────────────────────────── */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Row 1 — date/time bar */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b bg-muted/30">
          {loading ? (
            <Skeleton className="h-3 w-48" />
          ) : (
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          )}
          {!loading && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="font-mono tabular-nums">{formattedTime}</span>
            </div>
          )}
        </div>

        {/* Row 2 — identity + search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4">
          {/* Avatar + name + username */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted border text-xs font-semibold text-muted-foreground select-none">
              {loading ? (
                <Skeleton className="h-10 w-10 rounded-lg" />
              ) : (
                initials
              )}
            </div>
            <div className="flex flex-col gap-1">
              {loading ? (
                <>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold leading-none">
                      Welcome back, {firstName}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-normal capitalize h-4 px-1.5"
                    >
                      {role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-none">
                    {username}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Stats + search */}
          <div className="flex items-center gap-4">
            {!loading && (
              <>
                <div className="flex items-center gap-3 text-muted-foreground shrink-0">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-sm font-semibold text-foreground leading-normal">
                      {accessibleCount}
                    </span>
                    <span className="text-[10px]">accessible</span>
                  </div>
                  <Separator orientation="vertical" className="h-6" />
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-sm font-semibold text-foreground leading-normal">
                      {tools.length}
                    </span>
                    <span className="text-[10px]">total</span>
                  </div>
                </div>
                <Separator orientation="vertical" className="h-6" />
              </>
            )}
            <div className="relative w-full sm:w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search tools..."
                className="pl-9 h-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tools Grid ─────────────────────────────────────────── */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 9 }).map((_, i) => <ToolSkeleton key={i} />)
        ) : sortedTools.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-3 py-20 border-2 border-dashed rounded-xl bg-muted/10 text-center">
            <Search className="h-8 w-8 text-muted-foreground/40" />
            <div className="space-y-1">
              <p className="text-sm font-medium">No results found</p>
              <p className="text-xs text-muted-foreground">
                No tools match{" "}
                <span className="font-medium text-foreground">
                  "{searchQuery}"
                </span>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </Button>
          </div>
        ) : (
          sortedTools.map((tool: ToolCard, index: number) => {
            const Icon = tool.icon;
            const clickable = tool.isAccessible && !!tool.url;
            return (
              <Card
                key={index}
                onClick={() => clickable && tool.url && navigate(tool.url)}
                className={cn(
                  "group relative flex items-center gap-4 p-5 transition-all duration-150",
                  clickable
                    ? "cursor-pointer hover:bg-accent hover:border-accent-foreground/20 hover:shadow-sm"
                    : tool.isAccessible
                    ? "cursor-default"
                    : "opacity-50 cursor-not-allowed bg-muted/20 border-dashed"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors duration-150 mt-0.5",
                    tool.isAccessible
                      ? "bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
                      : "bg-muted/50 text-muted-foreground/30 border-dashed"
                  )}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                </div>

                {!tool.isAccessible && (
                  <div className="absolute top-4 right-4">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />
                  </div>
                )}

                <div className="flex flex-col flex-1 min-w-0">
                  <CardTitle className="text-sm font-semibold leading-snug truncate">
                    {tool.title}
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed truncate">
                    {tool.description}
                  </CardDescription>
                </div>
                {clickable && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
