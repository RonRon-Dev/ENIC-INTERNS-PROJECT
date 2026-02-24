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
import { Dot } from "lucide-react"

export default function AppLayout() {
  const location = useLocation()
  const pathnames = location.pathname.split("/").filter(Boolean)

  // Map route segments to user-friendly titles
  const breadcrumbNameMap: Record<string, string> = {
    dashboard: "Dashboard",
    automation: "Automation Tool",
    inventory: "Inventory & Assets",
    operations: "Operations",
    finance: "Finance",
    marketing: "Marketing",
    users: "User Management",
    settings: "Settings",
    signup: "Sign Up",
    login: "Login",
  }

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
              <BreadcrumbItem>
                <Link to="/">Home</Link>
              </BreadcrumbItem>

              {pathnames.map((segment, index) => {
                const routeTo = "/" + pathnames.slice(0, index + 1).join("/")
                const isLast = index === pathnames.length - 1
                const title = breadcrumbNameMap[segment] || segment

                return (
                  <React.Fragment key={routeTo}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {isLast ? (
                        <span className="font-semibold">{title}</span>
                      ) : (
                        <Link to={routeTo} className="capitalize">
                          {title}
                        </Link>
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