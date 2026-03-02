import { Shield, UserCheck, User } from 'lucide-react'
import { type UserStatus } from './schema'

export const callTypes = new Map<UserStatus, string>([
  ['active', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['inactive', 'bg-neutral-300/40 border-neutral-300'],
  ['deactivated', 'bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10'],
  ['pending', 'bg-gray-100/30 text-gray-900 dark:text-teal-200 border-gray-200'],
])

export const roles = [
  {
    label: 'Superadmin',
    value: 'superadmin',
    icon: Shield,
  },
  {
    label: 'Admin',
    value: 'admin',
    icon: UserCheck,
  },
  {
    label: 'Unassigned',
    value: 'unassigned',
    icon: User,
  },
] as const
