import type { ElementType, ComponentType } from "react";
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
  component?: ComponentType;
}

export interface Tool {
  title: string;
  url?: string;
  description?: string;
  icon?: ElementType;
  allowedRoles?: UserRole[];
  subtools?: SubTool[];
  component?: ComponentType;
}

// SUNDAN MAIGE
// ---------------------------------------------------------------------------
// To connect a real page:
//   1. Build your component e.g. src/pages/tools/inventory/AssetListPage.tsx
//   2. Uncomment the lazy import below
//   3. Set component: AssetListPage on the matching tool/subtool entry
//   4. Done — route, sidebar, home card, command menu all just work
// ---------------------------------------------------------------------------

import { lazy } from "react";

const Dashboard = lazy(() => import("@/pages/AdminDashboardPage"));
const UserManagementPage = lazy(() => import("@/pages/UserManagementPage"));
const AssetListPage = lazy(
  () => import("@/pages/tools/inventory/AssetListPage")
);

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
    component: Dashboard,
  },
  {
    title: "User Management",
    url: "/users",
    icon: User2Icon,
    description: "Manage users, roles, and permissions",
    allowedRoles: ["superadmin", "admin"],
    component: UserManagementPage,
  },
  {
    title: "Inventory & Assets",
    icon: CirclePile,
    description: "Track and manage inventory and assets",
    allowedRoles: ["superadmin", "admin", "operations"],
    // component: InventoryPage,
    subtools: [
      {
        title: "Asset List",
        url: "/inventory/assets",
        description: "View and edit all assets",
        allowedRoles: ["superadmin", "admin", "operations"],
        component: AssetListPage,
      },
      {
        title: "Asset Reports",
        url: "/inventory/reports",
        description: "Generate inventory and asset reports",
        allowedRoles: ["superadmin"],
        // component: AssetReportsPage,
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
        // component: TaskBoardPage,
      },
      {
        title: "Shift Schedules",
        url: "/operations/shifts",
        description: "Manage employee shifts",
        allowedRoles: ["superadmin"],
        // component: ShiftSchedulePage,
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
        // component: ExpenseTrackerPage,
      },
      {
        title: "Budget Planner",
        url: "/finance/budget",
        description: "Plan and monitor budgets",
        allowedRoles: ["superadmin", "managers"],
        // component: BudgetPlannerPage,
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
        // component: CampaignsPage,
      },
      {
        title: "Leads",
        url: "/marketing/leads",
        description: "View and manage leads",
        allowedRoles: ["superadmin", "marketing"],
        // component: LeadsPage,
      },
    ],
  },
  {
    title: "AI Assistant",
    url: "/ai-assistant",
    icon: BotIcon,
    description: "AI-powered workflow assistant",
    allowedRoles: ["superadmin", "admin"],
    // component: AIAssistantPage,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function hasAccess(
  userRole: UserRole | undefined,
  allowedRoles: UserRole[] | undefined
): boolean {
  if (!userRole) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole.toLowerCase() as UserRole);
}
