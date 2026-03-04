"use client";

import * as React from "react";
import { useEffect, useState } from "react";
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

import { sidebarData } from "@/data/sidebar";
import { users } from "@/data/users";
import { useAuth } from "@/auth-context";
import { Atom } from "lucide-react";
import type { UserRole } from "@/data/schema";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [pendingCount, setPendingCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    users().then((data) => {
      const count = data.filter((u) => u.status === "pending").length;
      setPendingCount(count);
    });
  }, []);

  // Filter nav items based on allowedRoles
  const filteredNavGroups = sidebarData.navGroups
    .map((group) => ({
      ...group,
      items: group.items
        .filter(
          (item) =>
            !item.allowedRoles ||
            (user?.roleName &&
              item.allowedRoles
                .map((r: UserRole) => r.toLowerCase())
                .includes(user.roleName.toLowerCase()))
        )
        .map((item) => {
          // Add badge for /users
          if ("url" in item && item.url === "/users") {
            return {
              ...item,
              badge: pendingCount > 0 ? String(pendingCount) : undefined,
            };
          }
          return item;
        }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/home">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Atom className="h-6 w-6" />
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
