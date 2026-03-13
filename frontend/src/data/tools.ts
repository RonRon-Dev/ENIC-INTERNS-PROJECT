import {
  BadgeDollarSign,
  BotIcon,
  CirclePile,
  ExternalLinkIcon,
  FileText,
  HandshakeIcon,
  HardHat,
  Home,
  LayoutDashboard,
  MonitorCog,
  User2Icon,
} from "lucide-react";
import type { ComponentType, ElementType } from "react";
import { lazy } from "react";
import type { UserRole } from "./schema";

export interface SubTool {
  title: string;
  url?: string;
  externalUrl?: string; // if set, opens in new tab instead of navigating
  description?: string;
  allowedRoles?: UserRole[];
  component?: ComponentType;
}

export interface Tool {
  title: string;
  url?: string;
  externalUrl?: string; // if set, opens in new tab instead of navigating
  description?: string;
  icon?: ElementType;
  allowedRoles?: UserRole[];
  subtools?: SubTool[];
  component?: ComponentType;
}

// ---------------------------------------------------------------------------
// To connect a real page:
//   1. Build your component e.g. src/pages/tools/inventory/AssetListPage.tsx
//   2. Uncomment the lazy import below
//   3. Set component: ComponentName on the matching tool/subtool entry
//   4. Done — route, sidebar, home card, command menu all just work
//
// To add an external tool:
//   1. Add a new Tool entry with externalUrl instead of url
//   2. No component or route needed — it opens in a new tab automatically
//   Example:
//     {
//       title: "Legacy HR System",
//       externalUrl: "https://hr.company.com",
//       icon: ExternalLinkIcon,
//       description: "Existing HR portal",
//       allowedRoles: ["superadmin", "admin"],
//     }
// ---------------------------------------------------------------------------
const Dashboard = lazy(() => import("@/pages/AdminDashboardPage"));
const UserManagementPage = lazy(() => import("@/pages/UserManagementPage"));
// const AIAssistant = lazy(() => import("@/pages/AIAssistantPage"));
const AssetListPage = lazy(
  () => import("@/pages/tools/inventory/AssetListPage")
);
const DataCleaningPage = lazy(
  () => import("@/pages/tools/operations/DataCleaningPage")
);
// const TaskBoard = lazy(() => import("@/pages/tools/operations/TaskBoardPage"));
// const ShiftSchedules = lazy(() => import("@/pages/tools/operations/ShiftSchedulesPage"));
// const ExpenseTracker = lazy(() => import("@/pages/tools/finance/ExpenseTrackerPage"));
// const BudgetPlanner = lazy(() => import("@/pages/tools/finance/BudgetPlannerPage"));
// const Campaigns = lazy(() => import("@/pages/tools/marketing/CampaignsPage"));
// const Leads = lazy(() => import("@/pages/tools/marketing/LeadsPage"));
// const DocumentationPage = lazy(() => import("@/pages/tools/documentation/DocumentationPage"));
// const ITTicketsPage = lazy(() => import("@/pages/tools/it/ITTicketsPage"));
// const ITAssetsPage = lazy(() => import("@/pages/tools/it/ITAssetsPage"));

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
        // component: AssetReports,
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
        title: "Data Cleaning",
        url: "/operations/automation",
        description: "Process data tables from clients",
        allowedRoles: ["superadmin", "operations"],
        component: DataCleaningPage,
      },
      // {
      //   title: "Shift Schedules",
      //   url: "/operations/shifts",
      //   description: "Manage employee shifts",
      //   allowedRoles: ["superadmin"],
      //   component: ShiftSchedules,
      // },
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
        // component: ExpenseTracker,
      },
      {
        title: "Budget Planner",
        url: "/finance/budget",
        description: "Plan and monitor budgets",
        allowedRoles: ["superadmin", "managers"],
        // component: BudgetPlanner,
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
        // component: Campaigns,
      },
      {
        title: "Leads",
        url: "/marketing/leads",
        description: "View and manage leads",
        allowedRoles: ["superadmin", "marketing"],
        // component: Leads,
      },
    ],
  },
  {
    title: "Documentation",
    icon: FileText,
    description: "Internal documentation and knowledge base",
    allowedRoles: ["superadmin", "admin", "operations", "managers", "marketing"],
    subtools: [
      {
        title: "Knowledge Base",
        url: "/documentation/knowledge-base",
        description: "Browse and search internal documents",
        allowedRoles: ["superadmin", "admin", "operations", "managers", "marketing"],
        // component: DocumentationPage,
      },
      {
        title: "SOPs",
        url: "/documentation/sops",
        description: "Standard operating procedures",
        allowedRoles: ["superadmin", "admin", "operations"],
        // component: SOPsPage,
      },
      {
        title: "Policies",
        url: "/documentation/policies",
        description: "Company policies and guidelines",
        allowedRoles: ["superadmin", "admin"],
        // component: PoliciesPage,
      },
    ],
  },
  {
    title: "IT",
    icon: MonitorCog,
    description: "IT support, infrastructure, and asset management",
    allowedRoles: ["superadmin", "admin", "it"],
    subtools: [
      {
        title: "Tickets",
        url: "/it/tickets",
        description: "Submit and track IT support tickets",
        allowedRoles: ["superadmin", "admin", "operations", "managers", "marketing"],
        // component: ITTicketsPage,
      },
      {
        title: "IT Assets",
        url: "/it/assets",
        description: "Manage IT hardware and software assets",
        allowedRoles: ["superadmin", "admin", "it"],
        // component: ITAssetsPage,
      },
      {
        title: "System Health",
        url: "/it/system-health",
        description: "Monitor system uptime and performance",
        allowedRoles: ["superadmin", "it"],
        // component: SystemHealthPage,
      },
    ],
  },

  {
    title: "AI Assistant",
    url: "/ai-assistant",
    icon: BotIcon,
    description: "AI-powered workflow assistant",
    allowedRoles: ["superadmin", "admin"],
    // component: AIAssistant,
  },

  // ── External Tools —
  {
    title: "Legacy HR System",
    externalUrl: "https://hr.company.com",
    icon: ExternalLinkIcon,
    description: "Existing HR portal hosted separately",
    allowedRoles: ["superadmin", "admin", "operations"],
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

/**
 * Like hasAccess, but checks DB privileges (by URL) first.
 * Falls back to toolsData.allowedRoles when the page has no DB entry yet.
 */
export function hasAccessForUrl(
  userRole: UserRole | undefined,
  url: string | undefined,
  toolAllowedRoles: UserRole[] | undefined,
  dbPrivileges: Record<string, string[]>
): boolean {
  if (!userRole) return false;
  if (url && url in dbPrivileges) {
    const roles = dbPrivileges[url];
    // Empty array = all roles allowed
    return roles.length === 0 || roles.includes(userRole.toLowerCase());
  }
  return hasAccess(userRole, toolAllowedRoles);
}

// ---------------------------------------------------------------------------
// Components to create — check off as you build each page
// ---------------------------------------------------------------------------
//   [x] DashboardPage  →  @/pages/DashboardPage.tsx
//   [x] UserManagementPage  →  @/pages/UserManagementPage.tsx
//   [ ] AIAssistantPage  →  @/pages/AIAssistantPage.tsx
//   [x] AssetListPage  →  @/pages/tools/inventory/AssetListPage.tsx
//   [ ] AssetReportsPage  →  @/pages/tools/inventory/AssetReportsPage.tsx
//   [ ] TaskBoardPage  →  @/pages/tools/operations/TaskBoardPage.tsx
//   [ ] ShiftSchedulesPage  →  @/pages/tools/operations/ShiftSchedulesPage.tsx
//   [ ] ExpenseTrackerPage  →  @/pages/tools/finance/ExpenseTrackerPage.tsx
//   [ ] BudgetPlannerPage  →  @/pages/tools/finance/BudgetPlannerPage.tsx
//   [ ] CampaignsPage  →  @/pages/tools/marketing/CampaignsPage.tsx
//   [ ] LeadsPage  →  @/pages/tools/marketing/LeadsPage.tsx
//   [ ] DocumentationPage  →  @/pages/tools/documentation/DocumentationPage.tsx
//   [ ] SOPsPage           →  @/pages/tools/documentation/SOPsPage.tsx
//   [ ] PoliciesPage       →  @/pages/tools/documentation/PoliciesPage.tsx
//   [ ] ITTicketsPage      →  @/pages/tools/it/ITTicketsPage.tsx
//   [ ] ITAssetsPage       →  @/pages/tools/it/ITAssetsPage.tsx
//   [ ] SystemHealthPage   →  @/pages/tools/it/SystemHealthPage.tsx

