import { Outlet, useLocation, Link } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import React from "react"

export default function AppLayout() {
  const location = useLocation()
  const pathnames = location.pathname.split("/").filter(Boolean)

  // Map route segments to readable titles
  const breadcrumbNameMap: Record<string, string> = {
    home: "Home",
    dashboard: "Dashboard",
    automation: "Automation",
    inventory: "Inventory",
    operations: "Operations",
    finance: "Finance",
    marketing: "Marketing",
    users: "User Management",
    settings: "Settings",
    signup: "Sign Up",
    login: "Login",
  }

  // Only show last two segments: current page > subpage
  const breadcrumbSegments =
    pathnames.length <= 2 ? pathnames : pathnames.slice(-2)

  return (
    <SidebarProvider style={{ "--sidebar-width": "19rem" } as React.CSSProperties}>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />

          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbSegments.map((segment, index) => {
                const routeTo = "/" + pathnames.slice(0, pathnames.indexOf(segment) + 1).join("/")
                const isLast = index === breadcrumbSegments.length - 1
                const title = breadcrumbNameMap[segment] || segment

                return (
                  <React.Fragment key={routeTo}>
                    {index !== 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {isLast ? (
                        <span className="font-semibold">{title}</span>
                      ) : (
                        <Link to={routeTo}>{title}</Link>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Page Content */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}