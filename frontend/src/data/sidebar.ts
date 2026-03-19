import type { NavGroup, UserRole } from "./schema";
import { hasAccessForUrl, toolsData } from "./tools";

// ---------------------------------------------------------------------------
// Build filtered nav groups for a given role.
// Pass dbPrivileges from PagePrivilegesContext so DB changes are reflected live.
// ---------------------------------------------------------------------------
export function buildNavGroups(
  userRole: UserRole | undefined,
  dbPrivileges: Record<string, string[]> = {}
): NavGroup[] {
  const groups: NavGroup[] = [];

  // ── Group 1: Home (always visible to authenticated users) ──────────────
  const homeTool = toolsData.find((t) => t.title === "Home");
  if (
    homeTool &&
    hasAccessForUrl(userRole, homeTool.url, homeTool.allowedRoles, dbPrivileges)
  ) {
    groups.push({
      items: [
        {
          title: homeTool.title,
          url: homeTool.url ?? "/home",
          icon: homeTool.icon,
          description: homeTool.description,
        },
      ],
    });
  }

  // ── Group 2: Management ────────────────────────────────────────────────
  const managementTitles = ["Dashboard", "User Management", "Analytics"];
  const managementItems = toolsData
    .filter(
      (t) =>
        managementTitles.includes(t.title) &&
        hasAccessForUrl(userRole, t.url, t.allowedRoles, dbPrivileges)
    )
    .map((t) => ({
      title: t.title,
      url: t.url ?? "#",
      icon: t.icon,
      description: t.description,
      allowedRoles: t.allowedRoles,
    }));

  if (managementItems.length > 0) {
    groups.push({ title: "Management", items: managementItems });
  }

  // ── Group 3: Modules (tools with subtools) ─────────────────────────────
  const excludedTitles = ["Home", "Dashboard", "User Management", "Analytics"];
  const moduleItems = toolsData
    .filter((t) => {
      if (excludedTitles.includes(t.title)) return false;
      // For parent groups (no URL), show if user can access ANY child subtool
      if (!t.url && t.subtools) {
        return t.subtools.some(
          (sub) =>
            !!sub.url &&
            hasAccessForUrl(
              userRole,
              sub.url,
              sub.allowedRoles ?? t.allowedRoles,
              dbPrivileges
            )
        );
      }
      return hasAccessForUrl(userRole, t.url, t.allowedRoles, dbPrivileges);
    })
    .map((tool) => {
      // Filter subtools the user can access AND have an internal url
      // External-only subtools (externalUrl only, no url) are excluded from sidebar
      const visibleSubtools = (tool.subtools ?? []).filter(
        (sub) =>
          !!sub.url &&
          hasAccessForUrl(
            userRole,
            sub.url,
            sub.allowedRoles ?? tool.allowedRoles,
            dbPrivileges
          )
      );

      if (tool.url) {
        // Leaf tool — NavLink
        return {
          title: tool.title,
          url: tool.url,
          icon: tool.icon,
          description: tool.description,
          allowedRoles: tool.allowedRoles,
        };
      }

      // Collapsible tool — NavCollapsible
      return {
        title: tool.title,
        icon: tool.icon,
        description: tool.description,
        allowedRoles: tool.allowedRoles,
        items: visibleSubtools.map((sub) => ({
          title: sub.title,
          url: sub.url!, // safe — filtered above to only include subtools with url
          description: sub.description,
          allowedRoles: sub.allowedRoles,
        })),
      };
    })
    // Drop collapsibles that have no visible children
    .filter((item) => !("items" in item) || (item.items ?? []).length > 0);

  if (moduleItems.length > 0) {
    groups.push({ title: "Modules", items: moduleItems });
  }

  return groups;
}
