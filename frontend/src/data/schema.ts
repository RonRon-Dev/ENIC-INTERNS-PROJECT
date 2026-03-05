import { z } from "zod";
import type { LinkProps } from "react-router-dom";

const userStatusSchema = z.union([
  z.literal("active"),
  z.literal("deactivated"),
  z.literal("pending"),
]);

const userRoleSchema = z.enum([
  "guest",
  "admin",
  "superadmin",
  "dev",
  "operations",
  "marketing",
  "managers",
  "documentations",
  "it",
]);

const activityTypeSchema = z.union([
  z.literal("authentication"),
  z.literal("privilege"),
  z.literal("account management"),
]);

export type UserRole = z.infer<typeof userRoleSchema>;

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  status: userStatusSchema,
  role: userRoleSchema,
});

export type UserStatus = z.infer<typeof userStatusSchema>;
export type User = z.infer<typeof userSchema>;
export type ActivityType = z.infer<typeof activityTypeSchema>;

export const userListSchema = z.array(userSchema);

// ---------------------------------------------------------------------------
// Nav / Sidebar types
// ---------------------------------------------------------------------------

type BaseNavItem = {
  title: string;
  badge?: string;
  icon?: React.ElementType;
  allowedRoles?: UserRole[];
};

export type NavLink = BaseNavItem & {
  url: LinkProps["to"];
  items?: never;
  description?: string;
};

export type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps["to"]; description?: string })[];
  url?: never;
  description?: string;
};

export type NavItem = NavLink | NavCollapsible;

export type NavGroup = {
  title?: string;
  items: NavItem[];
};

export type SidebarData = {
  user: User;
  navGroups: NavGroup[];
};

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------

type ActivityLog = {
  id: string;
  user: User;
  description: string;
  time: string;
  date: string;
  type: ActivityType;
};

export type { ActivityLog };
