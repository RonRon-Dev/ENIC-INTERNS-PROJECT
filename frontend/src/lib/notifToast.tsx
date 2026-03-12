import {
  Check,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserCog,
  UserPlus,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

type ToastMode =
  | "create"
  | "edit"
  | "approve"
  | "reject"
  | "activate"
  | "deactivate"
  | "addrole"
  | "appsettings"
  | "error"
  | "updateprivileges"
  | "copy"
  | "approveReset";

type ToastData = {
  username?: string;
  name?: string;
  role?: string;
  reason?: string;
  tempPassword?: string;
};

const modeConfig: Record<
  ToastMode,
  {
    title: string;
    description: (data: ToastData) => string;
    icon: React.ElementType;
    iconClass: string;
  }
> = {
  create: {
    title: "User Created",
    description: ({ name }) => `${name} has been added to the system.`,
    icon: UserPlus,
    iconClass: "text-blue-600 bg-blue-300",
  },
  edit: {
    title: "User Updated",
    description: ({ name }) => `${name}'s details have been updated.`,
    icon: UserCog,
    iconClass: "text-yellow-600 bg-yellow-300",
  },
  approve: {
    title: "User Approved",
    description: ({ name, role }) =>
      `${name}'s request has been granted ${role}.`,
    icon: UserCheck,
    iconClass: "text-success bg-success/70",
  },
  reject: {
    title: "User Rejected",
    description: ({ name }) => `${name}'s request has been denied.`,
    icon: UserX,
    iconClass: "text-red-600 bg-red-300",
  },
  activate: {
    title: "User Activated",
    description: ({ name, role }) => `${role} ${name} has been reactivated.`,
    icon: ShieldCheck,
    iconClass: "text-success bg-success/70",
  },
  deactivate: {
    title: "User Deactivated",
    description: ({ name, role }) => `${role} ${name} has been deactivated.`,
    icon: ShieldOff,
    iconClass: "text-destructive bg-destructive/70",
  },
  addrole: {
    title: "Role Added",
    description: ({ name }) =>
      `${name} has been added as a role to the system.`,
    icon: ShieldCheck,
    iconClass: "text-success bg-success/70",
  },
  appsettings: {
    title: "Settings Updated",
    description: () => "Your application settings have been saved.",
    icon: UserCog,
    iconClass: "text-purple-600 bg-purple-300",
  },
  error: {
    title: "Error",
    description: ({ reason }) => reason ?? "Something went wrong.",
    icon: UserX,
    iconClass: "text-destructive bg-destructive/70",
  },
  updateprivileges: {
    title: "Privilege Updated",
    description: ({ name }) => `${name} page privileges have been updated.`,
    icon: ShieldCheck,
    iconClass: "text-blue-600 bg-blue-300",
  },
  copy: {
    title: "Copied",
    description: ({ reason }) => reason ?? "Saved to clipboard.",
    icon: Check,
    iconClass: "text-success bg-success/70",
  },
  approveReset: {
    title: "Password Reset Approved",
    description: ({ name, tempPassword }) =>
      `${name}'s password reset request has been approved. Temporary password: ${tempPassword}`,
    icon: UserCheck,
    iconClass: "text-success bg-success/70",
  },
};

function formatName(value?: string) {
  if (!value) return "";
  return value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function notifToast(data: ToastData, mode: ToastMode = "create") {
  const config = modeConfig[mode];
  const Icon = config.icon;
  const formatted: ToastData = {
    name: formatName(data.name),
    role: formatName(data.role),
    reason: data.reason,
    tempPassword: data.tempPassword,
    username: data.username,
  };

  toast.message(() => (
    <div className="flex items-center gap-3 bg-background">
      <div
        className={`${config.iconClass} rounded-full p-1.5 w-8 h-8 flex items-center justify-center shrink-0`}
      >
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <p className="text-sm font-semibold">{config.title}</p>
        <p className="text-xs text-muted-foreground font-normal">
          {config.description(formatted)}
        </p>
      </div>
    </div>
  ));
}
