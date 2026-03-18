import { Code, Cpu, FileText, Megaphone, Settings, Shield, ShieldCheck, User, Users } from 'lucide-react'
import { type ActivityLog, type UserStatus } from './schema'

export const userTypes = new Map<UserStatus, string>([
  ['active', 'bg-success/15 text-success border-success/30 dark:bg-success/25'],
  ['deactivated', 'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/40'],
  ['pending', 'bg-muted text-muted-foreground border-border'],
  ['locked', 'bg-orange-100/30 text-orange-800/50 border-orange-300 dark:text-orange-300/50'],
])

export const activityTypes = new Map<ActivityLog["type"], string>([
  ['authentication', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['privilege', 'bg-blue-100/30 text-blue-900 dark:text-blue-200 border-blue-200'],
  ['account management', 'bg-gray-100/30 text-gray-900 dark:text-gray-200 border-gray-200'],
])

export const roles = [
  { label: 'guest', value: 'guest', icon: User },
  { label: 'admin', value: 'admin', icon: Shield },
  { label: 'superadmin', value: 'superadmin', icon: ShieldCheck },
  { label: 'dev', value: 'dev', icon: Code },
  { label: 'operations', value: 'operations', icon: Settings },
  { label: 'marketing', value: 'marketing', icon: Megaphone },
  { label: 'managers', value: 'managers', icon: Users },
  { label: 'documentations', value: 'documentations', icon: FileText },
  { label: 'it', value: 'it', icon: Cpu },
] as const
