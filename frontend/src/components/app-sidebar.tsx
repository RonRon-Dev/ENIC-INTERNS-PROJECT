"use client";
import { useAuth } from "@/auth-context";
import { NavGroup } from "@/components/nav-group";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem
} from "@/components/ui/sidebar";
import type { UserRole } from "@/data/schema";
import { buildNavGroups } from "@/data/sidebar";
import { Atom } from "lucide-react";
import * as React from "react";
import { useMemo } from "react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  const filteredNavGroups = useMemo(() => {
    const role = user?.roleName?.toLowerCase() as UserRole | undefined
    return buildNavGroups(role)
  }, [user?.roleName])

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <a className="sidebar-user-trigger hover:bg-transparent w-full flex justify-start rounded-lg px-2 py-3 gap-2 cursor-pointer items-center" href="/home">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Atom className="h-6 w-6" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">ENIC Systems</span>
                <span className="truncate text-xs">version 1.0.0</span>
              </div>
            </a>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {filteredNavGroups.map((group) => (
          <NavGroup key={group.title ?? "root"} {...group} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
