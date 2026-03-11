"use client";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import {
  type ActivityLog,
  type Payload,
} from "@/data/schema";
import { roles, userTypes } from "@/data/const";
import { useAuth } from "@/auth-context";
import {
  Bot,
  CircleCheck,
  CircleX,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useActivityLogParsing } from "@/hooks/activity-log-parsing";
import AccMgmtLogDesc from "./logs-desc/acc-mgmt-desc";
import SettingLogDesc from "./logs-desc/setting-log-desc";
import PrivilegeLogDesc from "./logs-desc/privilege-log-desc";

type DescViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: ActivityLog;
};

const getDeviceIcon = (deviceType: string) => {
  switch (deviceType) {
    case "Mobile":
      return <Smartphone className="w-3 h-3" />;
    case "Tablet":
      return <Tablet className="w-3 h-3" />;
    case "Bot":
      return <Bot className="w-3 h-3" />;
    default:
      return <Monitor className="w-3 h-3" />;
  }
};

export function DescViewDialog({
  open,
  onOpenChange,
  currentRow,
}: DescViewDialogProps) {
  const roleConfig = roles.find((r) => r.value === currentRow.user.role);
  const RoleIcon = roleConfig?.icon;
  const displayName = currentRow.user.name
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const { user } = useAuth();
  const payload: Payload = currentRow.payload as Payload;
  const { ipData, deviceData } = useActivityLogParsing(
    payload.IpAddress,
    payload.UserAgent,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 pb-10">
        <DialogHeader className="flex-row items-center p-8 pb-2">
          <Avatar className="h-10 w-10 rounded border bg-muted mr-3 text-muted-foreground p-4">
            <AvatarFallback>
              {displayName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex w-full justify-between">
            <div className="flex flex-col">
              <div className="font-bold">{displayName}</div>
              <div className="font-medium text-muted-foreground text-sm">
                {currentRow.user.username}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className="w-fit gap-x-1 py-1">
                {RoleIcon && <RoleIcon className="h-4 w-4" />}
                <span>
                  {currentRow.user.role
                    .toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              </Badge>

              <Badge
                variant="outline"
                className={userTypes.get(currentRow.user.status) + " w-fit"}
              >
                {currentRow.user.status.charAt(0).toUpperCase() +
                  currentRow.user.status.slice(1)}
              </Badge>
            </div>
          </div>
        </DialogHeader>
        <div className="px-10 grid grid-cols-2 border-y py-4 mb-4 gap-y-2">
          <span className="text-muted-foreground text-sm">Reference ID</span>
          <span className="text-right text-sm">{currentRow.id}</span>

          <span className="text-muted-foreground text-sm">Date & Time</span>
          <span className="text-right text-sm">
            {new Date(
              currentRow.date + "T" + currentRow.time,
            ).toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}{" "}
            {new Date(
              currentRow.date + "T" + currentRow.time,
            ).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </span>

          <span className="text-muted-foreground text-sm">Activity Type</span>
          <span className="text-right text-sm capitalize">
            {currentRow.type}
          </span>

          <span className="text-muted-foreground text-sm">Action Taken</span>
          <span className="text-right text-sm">{currentRow.description}</span>

          {user?.roleName === "Superadmin" && (
            <>
              <span className="text-muted-foreground text-sm">IP Address</span>
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-mono">{ipData.cleaned}</span>
                <Badge variant={ipData.variant} className="text-xs">
                  {ipData.type}
                </Badge>
              </div>

              <span className="text-muted-foreground text-sm">Client Info</span>
              <div className="text-right space-y-1">
                <div className="flex items-center justify-end gap-2">
                  {getDeviceIcon(deviceData.deviceType)}
                  <span className="text-sm">
                    {deviceData.browser}
                    {deviceData.browserVersion &&
                      ` ${deviceData.browserVersion}`}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                  <span>
                    {deviceData.os}
                    {deviceData.osVersion && ` ${deviceData.osVersion}`}
                  </span>
                  <span>·</span>
                  <span>{deviceData.deviceType}</span>
                  {deviceData.isBot && (
                    <>
                      <span>·</span>
                      <Badge variant="outline" className="text-xs py-0">
                        Bot
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          <span className="text-muted-foreground text-sm">Result</span>
          <div className="flex justify-end">
            <Badge
              variant="outline"
              className={`gap-x-1 py-1 ${currentRow.success
                ? "text-green-600 border-green-600 bg-green-50"
                : "text-red-500 border-red-500 bg-red-50"
                }
              `}
            >
              {currentRow.success ? (
                <CircleCheck className="w-4 h-4" />
              ) : (
                <CircleX className="w-4 h-4" />
              )}
              {currentRow.success ? "Success" : "Failed"}
            </Badge>
          </div>
          {currentRow.type === "account management" && (
            <AccMgmtLogDesc currentRow={currentRow} />
          )}
          {currentRow.type === "settings" && (
            <SettingLogDesc currentRow={currentRow} />
          )}
          {currentRow.type === "privilege" && (
            <PrivilegeLogDesc currentRow={currentRow} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

//Used for future implementation if we want to show more details for auth logs.
/* function AuthLogDesc({ currentRow }: { currentRow: ActivityLog }) {
  const payload: Payload = currentRow.payload as Payload;
  const { ipData, deviceData } = useActivityLogParsing(
    payload.IpAddress,
    payload.UserAgent,
  );
  console.log(ipData, deviceData);
  // for auth logs, additional dato is null
  return (
    <>
    </>
  );
} */



