import type { ElementType } from "react";
import {
  BadgeDollarSign,
  BotIcon,
  CirclePile,
  HandshakeIcon,
  HardHat,
  Home,
  LayoutDashboard,
  User2Icon,
} from "lucide-react";
import type { UserRole } from "./schema";

export interface SubTool {
  title: string;
  url: string;
  description?: string;
  allowedRoles?: UserRole[];
}

export interface Tool {
  title: string;
  url?: string;
  description?: string;
  icon?: ElementType;
  allowedRoles?: UserRole[];
  subtools?: SubTool[];
}

export const toolsData: Tool[] = [
  {
    title: "Home",
    url: "/home",
    icon: Home,
    description: "Welcome dashboard and main landing page",
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    description: "View system stats and analytics",
    allowedRoles: ["superadmin", "admin"],
  },
  {
    title: "User Management",
    url: "/users",
    icon: User2Icon,
    description: "Manage users, roles, and permissions",
    allowedRoles: ["superadmin", "admin"],
  },
  {
    title: "Inventory & Assets",
    icon: CirclePile,
    description: "Track and manage inventory and assets",
    allowedRoles: ["superadmin", "admin", "operations"],
    subtools: [
      {
        title: "Asset List",
        url: "/inventory/assets",
        description: "View and edit all assets",
        allowedRoles: ["superadmin", "admin", "operations"],
      },
      {
        title: "Add New Asset",
        url: "/inventory/new_assets",
        description: "Add a new asset to the system",
        allowedRoles: ["superadmin", "admin"],
      },
      {
        title: "Asset Reports",
        url: "/inventory/reports",
        description: "Generate inventory and asset reports",
        allowedRoles: ["superadmin"],
      },
    ],
  },
  {
    title: "Operations",
    icon: HardHat,
    description: "Manage daily operations workflow",
    allowedRoles: ["superadmin", "operations"],
    subtools: [
      {
        title: "Task Board",
        url: "/operations/tasks",
        description: "View and manage tasks",
        allowedRoles: ["superadmin", "operations"],
      },
      {
        title: "Shift Schedules",
        url: "/operations/shifts",
        description: "Manage employee shifts",
        allowedRoles: ["superadmin"],
      },
    ],
  },
  {
    title: "Finance",
    icon: BadgeDollarSign,
    description: "Financial management tools and reports",
    allowedRoles: ["superadmin", "managers"],
    subtools: [
      {
        title: "Expense Tracker",
        url: "/finance/expenses",
        description: "Track company expenses",
        allowedRoles: ["superadmin", "managers"],
      },
      {
        title: "Budget Planner",
        url: "/finance/budget",
        description: "Plan and monitor budgets",
        allowedRoles: ["superadmin", "managers"],
      },
    ],
  },
  {
    title: "Marketing",
    icon: HandshakeIcon,
    description: "CRM and marketing tools",
    allowedRoles: ["superadmin", "marketing"],
    subtools: [
      {
        title: "Campaigns",
        url: "/marketing/campaigns",
        description: "Manage marketing campaigns",
        allowedRoles: ["superadmin", "marketing"],
      },
      {
        title: "Leads",
        url: "/marketing/leads",
        description: "View and manage leads",
        allowedRoles: ["superadmin", "marketing"],
      },
    ],
  },
  {
    title: "AI Assistant",
    url: "/ai-assistant",
    icon: BotIcon,
    description: "AI-powered workflow assistant",
    allowedRoles: ["superadmin", "admin"],
  },
];

// ---------------------------------------------------------------------------
// Helper — check if a role has access to a tool or subtool
// Pass undefined allowedRoles → open to all authenticated users
// ---------------------------------------------------------------------------
export function hasAccess(
  userRole: UserRole | undefined,
  allowedRoles: UserRole[] | undefined
): boolean {
  if (!userRole) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole.toLowerCase() as UserRole);
}
