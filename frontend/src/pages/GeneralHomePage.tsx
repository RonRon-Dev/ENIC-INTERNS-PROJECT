"use client";

import { useEffect, useState } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BadgeDollarSignIcon,
  Building,
  CirclePile,
  FileDigit,
  FolderOpen,
  GitGraph,
  HandshakeIcon,
  HardHat,
  Link,
  Settings,
  Search,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth-context";

const tools = [
  {
    title: "Accounting Automation",
    description: "Automate journal entries and financial workflows.",
    icon: BadgeDollarSignIcon,
    isAccessible: true,
  },
  {
    title: "Inventory Management",
    description: "Track stock levels and warehouse movement.",
    icon: CirclePile,
    isAccessible: true,
  },
  {
    title: "Operations Center",
    description: "Monitor daily operational performance.",
    icon: HardHat,
    isAccessible: true,
  },
  {
    title: "HR Management",
    description: "Manage employees, attendance, and records.",
    icon: HandshakeIcon,
    isAccessible: true,
  },
  {
    title: "Reports & Analytics",
    description: "Generate insights and export reports.",
    icon: GitGraph,
    isAccessible: true,
  },
  {
    title: "Procurement",
    description: "Handle purchase orders and vendor tracking.",
    icon: Building,
    isAccessible: true,
  },
  {
    title: "CRM",
    description: "Manage clients and customer relationships.",
    icon: Link,
    isAccessible: true,
  },
  {
    title: "Project Management",
    description: "Track milestones and project progress.",
    icon: FolderOpen,
    isAccessible: false,
  },
  {
    title: "System Settings",
    description: "Configure platform preferences and controls.",
    icon: Settings,
    isAccessible: false,
  },
  {
    title: "Audit Logs",
    description: "Review system activities and changes.",
    icon: FileDigit,
    isAccessible: false,
  },
] as const;

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

type ToolCardProps = (typeof tools)[number];

function ToolCard({ title, description, icon: Icon, isAccessible }: ToolCardProps) {
  return (
    <Card
      className={cn(
        "flex items-center gap-4 p-5 transition-all duration-200 rounded-xl group relative",
        isAccessible
          ? "hover:bg-muted/60 cursor-pointer hover:border-gray-500"
          : "opacity-60 grayscale cursor-not-allowed bg-muted/5 border-dashed",
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 relative",
          isAccessible
            ? "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground"
            : "bg-muted/50 text-muted-foreground/30",
        )}
      >
        <Icon className="h-6 w-6" />
        {!isAccessible && (
          <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5 border shadow-sm">
            <Lock className="size-3 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <CardTitle className="text-base font-bold truncate">{title}</CardTitle>
        <CardDescription className="text-sm line-clamp-1">{description}</CardDescription>
      </div>
    </Card>
  );
}

export default function GeneralHomePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // const loading = !user;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);


  const filteredTools = tools.filter(
    (tool) =>
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "User";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-light italic">
            Welcome back, <span className="font-black">Mr. Charles!</span>
          </h1>
          <p className="ml-1 text-muted-foreground">
            Eurolink Network International Corporation
          </p>
        </div>

        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            className="pl-10 h-10 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            {loading ? (
              <Skeleton className="h-4 w-40" />
            ) : (
              "Select a tool to continue."
            )}
          </div>
          {!loading && searchQuery && (
            <p className="text-xs text-muted-foreground italic">
              Found {filteredTools.length} result{filteredTools.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
            </p>
          )}
        </div>

        {/* Tools Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            Array.from({ length: 9 }).map((_, i) => <ToolSkeleton key={i} />)
          ) : filteredTools.length > 0 ? (
            filteredTools.map((tool, index) => (
              <Card
                key={index}
                className={cn(
                  "flex items-center gap-4 p-5 transition-all duration-200 rounded-xl min-w-[30vh] group relative",
                  tool.isAccessible
                    ? "hover:bg-muted/60 cursor-pointer hover:border-gray-500"
                    : "opacity-60 grayscale cursor-not-allowed bg-muted/5 border-dashed",
                )}
              >
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 relative",
                    tool.isAccessible
                      ? "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground/30",
                  )}
                >
                  <tool.icon className="h-6 w-6" />
                  {!tool.isAccessible && (
                    <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5 border shadow-sm">
                      <Lock className="size-3 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 min-w-0">
                  <CardTitle className="text-base font-bold truncate">
                    {tool.title}
                  </CardTitle>
                  <CardDescription className="text-sm line-clamp-1">
                    {tool.description}
                  </CardDescription>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl bg-muted/20">
              <p className="text-muted-foreground">No matching tools found.</p>
              <Button
                variant="link"
                className="mt-2 text-primary"
                onClick={() => setSearchQuery("")}
              >
                Clear search results
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}