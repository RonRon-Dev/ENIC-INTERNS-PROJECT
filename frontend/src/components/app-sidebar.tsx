import * as React from "react";

import { NavUser } from "@/components/nav-user";
import { NavGroup } from "@/components/nav-group";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { sidebarData } from "@/data/sidebar"
import { Command } from "lucide-react";
import { useEffect, useState } from "react"
import { users } from "@/data/users"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    users().then((data) => {
      const count = data.filter((u) => u.status === "pending").length
      setPendingCount(count)
    })
  }, [])

  const dynamicNavGroups = sidebarData.navGroups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if ("url" in item && item.url === "/users") {
        return {
          ...item,
          badge: pendingCount > 0 ? String(pendingCount) : undefined,
        }
      }
      return item
    }),
  }))

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/home">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">ENIC Systems</span>
                  <span className="truncate text-xs">version 1.0.0</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Todo here tommoro, add rbac per page */}
        {dynamicNavGroups.map((group) => (
          <NavGroup key={group.title ?? "root"} {...group} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
