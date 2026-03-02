import { z } from 'zod'
import type { LinkProps } from "react-router-dom"

const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('deactivated'),
  z.literal('pending'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

const userRoleSchema = z.union([
  z.literal('superadmin'),
  z.literal('admin'),
  z.literal('unassigned'),
])

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  status: userStatusSchema,
  role: userRoleSchema,
})

export type User = z.infer<typeof userSchema>
export const userListSchema = z.array(userSchema)

type BaseNavItem = {
  title: string
  badge?: string
  icon?: React.ElementType
}

type NavLink = BaseNavItem & {
  url: LinkProps["to"]
  items?: never
}

type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps["to"] })[]
  url?: never
}

type NavItem = NavLink | NavCollapsible

type NavGroup = {
  title?: string
  items: NavItem[]
}

type SidebarData = {
  user: User
  navGroups: NavGroup[]
}

export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink }

