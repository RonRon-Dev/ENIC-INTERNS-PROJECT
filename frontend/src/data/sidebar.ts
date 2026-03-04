import type { SidebarData, UserRole } from "./schema";
import { toolsData } from "./tools";

const castRoles = (roles?: string[]): UserRole[] => (roles ?? []) as UserRole[];

function generateNavGroups(): SidebarData["navGroups"] {
  // Home / Dashboard / Users
  const homeTool = toolsData.find((t) => t.title === "Home");
  const dashboardTool = toolsData.find((t) => t.title === "Dashboard");
  const usersTool = toolsData.find((t) => t.title === "Users");

  return [
    {
      items: [
        {
          title: homeTool?.title ?? "Home",
          url: homeTool?.url ?? "/home",
          icon: homeTool?.icon ?? undefined,
          description: homeTool?.description ?? "",
          allowedRoles: castRoles(homeTool?.allowedRoles),
        },
      ],
    },
    {
      title: "Management",
      items: [dashboardTool, usersTool].filter(Boolean).map((tool) => ({
        title: tool!.title,
        url: tool!.url ?? "#",
        icon: tool!.icon ?? undefined,
        description: tool!.description ?? "",
        allowedRoles: castRoles(tool!.allowedRoles),
      })),
    },
    {
      title: "Modules",
      items: toolsData
        .filter(
          (tool) =>
            !["Home", "Dashboard", "User Management"].includes(tool.title)
        )
        .map((tool) => ({
          title: tool.title,
          icon: tool.icon ?? undefined,
          description: tool.description ?? "",
          allowedRoles: castRoles(tool.allowedRoles),
          items:
            tool.subtools?.map((sub) => ({
              title: sub.title,
              url: sub.url ?? "#",
              description: sub.description ?? tool.description ?? "",
              allowedRoles: castRoles(sub.allowedRoles),
            })) ?? [],
        })),
    },
  ];
}

export const sidebarData: SidebarData = {
  user: {
    id: "",
    name: "",
    username: "",
    status: "active",
    role: "superadmin",
  },
  navGroups: generateNavGroups(),
};
