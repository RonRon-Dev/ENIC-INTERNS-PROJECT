import {
  BadgeDollarSign,
  BotIcon,
  CirclePile,
  HandshakeIcon,
  HardHat,
  Home,
  LayoutDashboard,
  User2Icon,
} from "lucide-react"
import type { SidebarData } from "./schema"
import { useAuth

  
 } from "@/auth-context"

export const sidebarData: SidebarData = {
  user: {
    id: "728ed521",
    name: "Enic Developer",
    username: "enicdev",
    status: "active",
    role: "superadmin",
  },

  navGroups: [
    {
      items: [
        {
          title: "Home",
          url: "/home",
          icon: Home,
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Users",
          url: "/users",
          icon: User2Icon,
        },
      ],
    },
    {
      title: "Modules",
      items: [
        {
          title: "Inventory & Assets",
          icon: CirclePile,
          items: [
            { title: "Subtool 1", url: "/inventory/subtool_1" },
            { title: "Subtool 2", url: "/inventory/subtool_2" },
            { title: "Subtool 3", url: "#" },
          ],
        },
        {
          title: "Operations",
          icon: HardHat,
          items: [
            { title: "Subtool 1", url: "#" },
            { title: "Subtool 2", url: "#" },
          ],
        },
        {
          title: "Finance",
          icon: BadgeDollarSign,
          items: [
            { title: "Subtool 1", url: "#" },
          ],
        },
        {
          title: "Marketing",
          icon: HandshakeIcon,
          items: [
            { title: "Subtool 1", url: "#" },
          ],
        },
      ],
    },
    {
      title: "Automation",
      items: [
        {
          title: "AI Assistant",
          url: "#",
          icon: BotIcon,
        },
      ],
    },
  ],
}