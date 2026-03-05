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
import React, { useEffect, useMemo } from "react";
import NProgress from "@/lib/nprogress";
import { SearchProvider } from "@/components/search-provider";
import { Search } from "@/components/search";
import { toolsData } from "@/data/tools";

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

  const breadcrumbNameMap = useMemo(() => buildBreadcrumbMap(), []);

  const breadcrumbSegments =
    pathnames.length <= 2 ? pathnames : pathnames.slice(-2);

  useEffect(() => {
    NProgress.start();
    const timeout = setTimeout(() => NProgress.done(), 300);
    return () => clearTimeout(timeout);
  }, [location]);

  // const pageTitle =
  //   breadcrumbNameMap[pathnames[pathnames.length - 1]] ??
  //   pathnames[pathnames.length - 1] ??
  //   "ENIC";

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
                    const title = breadcrumbNameMap[segment] || segment;

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

              {!isHome && <Search className="ml-auto mr-20" />}
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
