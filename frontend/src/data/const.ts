import { Shield, UserCheck, User, ShieldCheck, Code, Megaphone, Settings, Users, FileText, Cpu } from 'lucide-react'
import { type UserStatus, type ActivityLog, type ActivityType } from './schema'

export const userTypes = new Map<UserStatus, string>([
  ['active', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['deactivated', 'bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10'],
  ['pending', 'bg-gray-100/30 text-gray-900 dark:text-teal-200 border-gray-200'],
])

export const activityTypes = new Map<ActivityLog["type"], string>([
  ['authentication', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['privilege', 'bg-blue-100/30 text-blue-900 dark:text-blue-200 border-blue-200'],
  ['account management', 'bg-gray-100/30 text-gray-900 dark:text-gray-200 border-gray-200'],
])

export const roles = [
  { label: 'Guest', value: 'guest', icon: User },
  { label: 'Admin', value: 'admin', icon: Shield },
  { label: 'Superadmin', value: 'superadmin', icon: ShieldCheck },
  { label: 'Dev', value: 'dev', icon: Code },
  { label: 'Operations', value: 'operations', icon: Settings },
  { label: 'Marketing', value: 'marketing', icon: Megaphone },
  { label: 'Managers', value: 'managers', icon: Users },
  { label: 'Documentations', value: 'documentations', icon: FileText },
  { label: 'IT', value: 'it', icon: Cpu },
] as const
