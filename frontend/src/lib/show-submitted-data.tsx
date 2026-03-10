import {
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserCog,
  UserPlus,
  UserX,
} from 'lucide-react'
import { toast } from 'sonner'

type ToastMode = 'create' | 'edit' | 'approve' | 'reject' | 'activate' | 'deactivate' | 'addrole' | 'appsettings' | 'error'

const modeConfig: Record<
  ToastMode,
  {
    title: string
    description: (name?: string, role?: string) => string
    icon: React.ElementType
    iconClass: string
  }
> = {
  create: {
    title: 'User Created',
    description: (name) => `${name} has been added to the system.`,
    icon: UserPlus,
    iconClass: 'text-blue-600 bg-blue-300',
  },
  edit: {
    title: 'User Updated',
    description: (name) => `${name} details have been updated.`,
    icon: UserCog,
    iconClass: 'text-yellow-600 bg-yellow-300',
  },
  approve: {
    title: 'User Approved',
    description: (name?: string, role?: string) => `${name} has been requested has been granted ${role}.`,
    icon: UserCheck,
    iconClass: 'text-green-600 bg-green-300',
  },
  reject: {
    title: 'User Rejected',
    description: (name?: string) => `${name}'s request has been denied.`,
    icon: UserX,
    iconClass: 'text-red-600 bg-red-300',
  },
  activate: {
    title: 'User Activated',
    description: (name?: string, role?: string) => `${role} ${name} has been reactivated.`,
    icon: ShieldCheck,
    iconClass: 'text-green-600 bg-green-300',
  },
  deactivate: {
    title: 'User Deactivated',
    description: (name?: string, role?: string) => `${role} ${name} has been deactivated.`,
    icon: ShieldOff,
    iconClass: 'text-destructive bg-red-300',
  },
  addrole: {
    title: 'User Role Added',
    description: (name?: string) => `${name} has been added as a role to the system.`,
    icon: ShieldCheck,
    iconClass: 'text-green-600 bg-green-300',
  },
  appsettings: {
    title: 'Settings Updated',
    description: () => 'Your application settings have been saved.',
    icon: UserCog,
    iconClass: 'text-purple-600 bg-purple-300',
  },
  error: {
    title: 'Error',
    description: (name?: string) => `${name} invalid input.`,
    icon: UserX,
    iconClass: 'text-red-600 bg-red-300',
  }
}

export function notifToast(
  data: unknown,
  mode: ToastMode = 'create',
) {
  const config = modeConfig[mode]
  const Icon = config.icon
  const name = String((data as Record<string, unknown>).name).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
  const role = String((data as Record<string, unknown>).role).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
  const reason = String((data as Record<string, unknown>).reason)

  toast.message(() => (
    <div className="flex items-center gap-3 bg-background">
      <div className={`${config.iconClass} rounded-full p-1.5 w-8 h-8 flex items-center justify-center shrink-0`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <p className="text-sm font-semibold">{config.title}</p>
        <p className="text-xs text-muted-foreground font-normal">{config.description(name, role)}</p>
        {reason != 'undefined' && (
          <p className="text-xs text-muted-foreground font-normal">Reason: {reason}</p>
        )}
      </div>
    </div>
  ))
}