import { Outlet, useLocation, Link } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import React, { useEffect, useMemo, useRef } from "react";
import NProgress from "@/lib/nprogress";
import { SearchProvider } from "@/components/search-provider";
import { Search } from "@/components/search";
import { toolsData } from "@/data/tools";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDialog } from "@/components/dialogs/dialog-provider";

function toTitleCase(segment: string) {
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildBreadcrumbMap(): Record<string, string> {
  const map: Record<string, string> = {};

  for (const tool of toolsData) {
    if (tool.url) {
      const segment = tool.url.split("/").filter(Boolean).pop();
      if (segment) map[segment] = tool.title;
    }

    if (tool.subtools) {
      for (const sub of tool.subtools) {
        const segments = sub.url.split("/").filter(Boolean);
        if (segments[0]) map[segments[0]] = tool.title;
        if (segments[1]) map[segments[1]] = sub.title;
      }
    }
  }

  return map;
}

export default function AppLayout() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(Boolean);
  const isHome = location.pathname === "/home";
  // const { setOpen } = useDialog()
  // const hasOpened = useRef(false)
  const breadcrumbNameMap = useMemo(() => buildBreadcrumbMap(), []);

  const breadcrumbSegments =
    pathnames.length <= 2 ? pathnames : pathnames.slice(-2);

  // dialog — guarded against double-mount
  // useEffect(() => {
  //   if (hasOpened.current) return
  //   hasOpened.current = true
  //   setOpen('passwordReset')
  // }, [setOpen])

  useEffect(() => {
    NProgress.start();
    const timeout = setTimeout(() => NProgress.done(), 300);
    return () => clearTimeout(timeout);
  }, [location]);

  return (
    <>
      <SearchProvider>
        <SidebarProvider
          style={{ "--sidebar-width": "19rem" } as React.CSSProperties}
        >
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />

              {/* Breadcrumb */}
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbSegments.map((segment, index) => {
                    const routeTo =
                      "/" +
                      pathnames
                        .slice(0, pathnames.indexOf(segment) + 1)
                        .join("/");
                    const isLast = index === breadcrumbSegments.length - 1;
                    const title =
                      breadcrumbNameMap[segment] || toTitleCase(segment);

                    return (
                      <React.Fragment key={routeTo}>
                        {index !== 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem>
                          {isLast ? (
                            <>
                              <title>{title + " - ENIC"}</title>
                              <span className="font-semibold">{title}</span>
                            </>
                          ) : index === 0 && pathnames.length > 1 ? (
                            <span className="text-muted-foreground">
                              {title}
                            </span>
                          ) : (
                            <Link to={routeTo}>{title}</Link>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>

              <div className="flex ml-auto gap-2">
                {!isHome && (
                  <Button
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors h-8 shadow-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}
                {!isHome && <Search className="mr-20" />}
              </div>

              <div>
                
              </div>
            </header>

            {/* Page Content */}
            <div className="flex flex-1 flex-col gap-4 px-[100px] pt-10">
              <Outlet />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SearchProvider>
    </>
  );
}
