import * as React from "react"
import {
  BadgeDollarSign,
  BotIcon,
  CirclePile,
  Command,
  HandshakeIcon,
  HardHat,
  Home,
  LayoutDashboard,
} from "lucide-react"

import { NavDash } from "@/components/nav-dash"
import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { NavHome } from "@/components/nav-home"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"


const data = {
  user: {
    name: "Enic Developer",
    role: "Administrator",
    avatar: "/avatars/shadcn.jpg",
  },

  navHome: [
    {
      title: "Home",
      url: "/home",
      icon: Home,
    },
  ],

  navDash: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: false,
      items: [
        {
          title: "Overview",
          url: "#",
        },
        {
          title: "User Management",
          url: "#",
        },
      ],
    },
  ],

  navMain: [
    {
      title: "Inventory & Assets",
      url: "/inventory",
      icon: CirclePile,
      isActive: false,
      items: [
        {
          title: "Subtool 1",
          url: "subtool_1",
        },
        {
          title: "Subtool 2",
          url: "#",
        },
        {
          title: "Subtool 3",
          url: "#",
        },
      ],
    },
    {
      title: "Operations",
      url: "/operations",
      icon: HardHat,
      items: [
        {
          title: "Subtool 1",
          url: "#",
        },
        {
          title: "Subtool 2",
          url: "#",
        },
        {
          title: "Subtool 3",
          url: "#",
        },
      ],
    },
    {
      title: "Finance",
      url: "#",
      icon: BadgeDollarSign,
      items: [
        {
          title: "Subtool 1",
          url: "#",
        },
        {
          title: "Subtool 2",
          url: "#",
        },
        {
          title: "Subtool 3",
          url: "#",
        },
      ],
    },
    {
      title: "Marketing",
      url: "#",
      icon: HandshakeIcon,
      items: [
        {
          title: "Subtool 1",
          url: "#",
        },
        {
          title: "Subtool 2",
          url: "#",
        },
        {
          title: "Subtool 3",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Automation",
      url: "#",
      icon: BotIcon,
    },
  ],

  // navSecondary: [
  //   {
  //     title: "Support",
  //     url: "#",
  //     icon: LifeBuoy,
  //   },
  // ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
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
        <NavHome items={data.navHome} />
        <NavDash items={data.navDash} />
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
