"use client";

import { useAuth } from "@/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserRole } from "@/data/schema";
import { hasAccessForUrl, toolsData } from "@/data/tools";
import { usePagePrivileges } from "@/hooks/use-page-privileges";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ChevronRight,
  Clock,
  ExternalLink,
  Lock,
  Search,
} from "lucide-react";
import type { ElementType } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Types ─────────────────────────────────────────────────────────────────────

type ToolCard = {
  title: string;
  description: string;
  icon: ElementType | null;
  url: string | null;
  externalUrl: string | null;
  parentTitle: string | null;
  isAccessible: boolean;
};

// ── Skeletons ─────────────────────────────────────────────────────────────────

function ToolSkeleton() {
  return (
    <div className="flex items-center gap-4 p-5 border rounded-xl bg-card/50">
      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

function PillSkeleton() {
  return <Skeleton className="h-7 w-20 rounded-full" />;
}

// ── Clock hook ────────────────────────────────────────────────────────────────

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EXCLUDED = ["Home", "Dashboard", "User Management", "Analytics"];
const FILTER_ALL = "All";
const FILTER_EXTERNAL = "External";

// ── Component ─────────────────────────────────────────────────────────────────

export default function GeneralHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>(FILTER_ALL);
  const [loading, setLoading] = useState(true);
  const now = useClock();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false));
    return () => clearTimeout(timer);
  }, []);

  const { privileges } = usePagePrivileges();
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

  // ── Build flat tool cards ────────────────────────────────────────────────

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
              url: sub.url ?? null,
              externalUrl: sub.externalUrl ?? null,
              parentTitle: tool.title,
              isAccessible: hasAccessForUrl(
                userRole,
                sub.url,
                sub.allowedRoles ?? tool.allowedRoles,
                privileges
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
            externalUrl: tool.externalUrl ?? null,
            parentTitle: null,
            isAccessible: hasAccessForUrl(userRole, tool.url, tool.allowedRoles, privileges),
          },
        ];
      });
  }, [userRole]);

  // ── Derive filter pills dynamically from parent titles ───────────────────

  const filterPills = useMemo<string[]>(() => {
    const parents = new Set<string>();
    tools.forEach((t) => {
      if (t.parentTitle) parents.add(t.parentTitle);
    });
    const hasExternal = tools.some((t) => !!t.externalUrl);
    return [
      FILTER_ALL,
      ...Array.from(parents),
      ...(hasExternal ? [FILTER_EXTERNAL] : []),
    ];
  }, [tools]);

  // ── Filter + search ──────────────────────────────────────────────────────

  const sortedTools = useMemo<ToolCard[]>(() => {
    const q = searchQuery.toLowerCase();

    return tools
      .filter((t) => {
        // search match
        const matchesSearch =
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q);

        // filter pill match
        const matchesFilter =
          activeFilter === FILTER_ALL ||
          (activeFilter === FILTER_EXTERNAL && !!t.externalUrl) ||
          t.parentTitle === activeFilter;

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => Number(b.isAccessible) - Number(a.isAccessible));
  }, [tools, searchQuery, activeFilter]);

  const accessibleCount = tools.filter((t) => t.isAccessible).length;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleToolClick = (tool: ToolCard) => {
    if (!tool.isAccessible) return;
    if (tool.externalUrl) {
      window.open(tool.externalUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (tool.url) navigate(tool.url);
  };

  const handleFilterClick = (pill: string) => {
    setActiveFilter((prev) => (prev === pill ? FILTER_ALL : pill));
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── Welcome Header ───────────────────────────────────────── */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-7 py-5 gap-6">
          {/* Left — initials + identity */}
          <div className="flex items-center gap-6 min-w-0">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-muted text-sm font-bold text-foreground select-none tracking-wide">
              {loading ? (
                <Skeleton className="h-14 w-14 rounded-lg" />
              ) : (
                initials
              )}
            </div>

            <div className="flex flex-col gap-0 min-w-0">
              {loading ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-6 w-52" />
                  <Skeleton className="h-3 w-36" />
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold leading-tight tracking-tight truncate">
                    Good{" "}
                    {now.getHours() < 12
                      ? "morning"
                      : now.getHours() < 17
                        ? "afternoon"
                        : "evening"}
                    , {firstName.charAt(0).toUpperCase() + firstName.slice(1)}!
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">
                      @{username}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs font-medium capitalize h-4 px-2 rounded-full text-muted-foreground"
                    >
                      {role}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right — date/time + search */}
          <div className="flex items-center gap-5 shrink-0">
            {!loading && (
              <div className="hidden lg:flex flex-col gap-0 items-end">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span className="tabular-nums">{formattedTime}</span>
                </div>
              </div>
            )}

            {!loading && (
              <Separator
                orientation="vertical"
                className="hidden lg:block h-10"
              />
            )}

            <div className="relative w-lg">
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

        {/* ── Filter pills row ─────────────────────────────────── */}
        <div className="px-7 py-2.5 border-t bg-muted/20 flex items-center justify-between gap-4">
          {/* Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <PillSkeleton key={i} />
              ))
              : filterPills.map((pill) => {
                const isActive = activeFilter === pill;
                const isExternal = pill === FILTER_EXTERNAL;
                return (
                  <button
                    key={pill}
                    onClick={() => handleFilterClick(pill)}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium border transition-all duration-150 select-none",
                      isActive
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    )}
                  >
                    {isExternal && (
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    )}
                    {pill}
                  </button>
                );
              })}
          </div>

          {/* Result count */}
          {!loading && (
            <p className="text-xs text-muted-foreground shrink-0">
              {accessibleCount} tool{accessibleCount !== 1 ? "s" : ""} available
            </p>
          )}
        </div>
      </div>

      {/* ── Tools Grid ───────────────────────────────────────────── */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 9 }).map((_, i) => <ToolSkeleton key={i} />)
        ) : sortedTools.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-3 py-20 border-2 border-dashed rounded-xl bg-muted/10 text-center">
            <Search className="h-8 w-8 text-muted-foreground/40" />
            <div className="space-y-1">
              <p className="text-sm font-medium">No results found</p>
              <p className="text-xs text-muted-foreground">
                {searchQuery ? (
                  <>
                    No tools match{" "}
                    <span className="font-medium text-foreground">
                      "{searchQuery}"
                    </span>
                    {activeFilter !== FILTER_ALL && (
                      <>
                        {" "}
                        in{" "}
                        <span className="font-medium text-foreground">
                          {activeFilter}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    No tools in{" "}
                    <span className="font-medium text-foreground">
                      {activeFilter}
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              )}
              {activeFilter !== FILTER_ALL && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveFilter(FILTER_ALL)}
                >
                  Clear filter
                </Button>
              )}
            </div>
          </div>
        ) : (
          sortedTools.map((tool, index) => {
            const Icon = tool.icon;
            const isExternal = !!tool.externalUrl;
            const clickable =
              tool.isAccessible && (!!tool.url || !!tool.externalUrl);

            return (
              <Card
                key={index}
                onClick={() => handleToolClick(tool)}
                className={cn(
                  "group relative flex items-center gap-4 p-5 transition-all duration-150",
                  clickable
                    ? "cursor-pointer hover:bg-accent hover:border-accent-foreground/20 hover:shadow-sm"
                    : tool.isAccessible
                      ? "cursor-default"
                      : "opacity-50 cursor-not-allowed bg-muted/20 border-dashed"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors duration-150",
                    tool.isAccessible
                      ? "bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
                      : "bg-muted/50 text-muted-foreground/30 border-dashed"
                  )}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                </div>

                {/* Lock */}
                {!tool.isAccessible && (
                  <div className="absolute top-4 right-4">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />
                  </div>
                )}

                {/* Content */}
                <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <CardTitle className="text-sm font-semibold leading-snug truncate">
                      {tool.title}
                    </CardTitle>
                    {isExternal && tool.isAccessible && (
                      <Badge
                        variant="outline"
                        className="shrink-0 h-4 px-1.5 text-[10px] font-medium rounded-full text-muted-foreground border-muted-foreground/30 gap-0.5 flex items-center"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        External
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs leading-relaxed truncate">
                    {tool.description}
                  </CardDescription>
                </div>

                {/* Trailing icon */}
                {clickable &&
                  (isExternal ? (
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                  ))}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
