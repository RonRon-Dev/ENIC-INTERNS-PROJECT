import type { ActivityLog, Payload, PrivilegePayload } from "@/data/schema";
import { ArrowRight } from "lucide-react";

export default function PrivilegeLogDesc({ currentRow }: { currentRow: ActivityLog }) {
  const payload: Payload = currentRow.payload as Payload;
  const additionalData: PrivilegePayload =
    payload.AdditionalData as PrivilegePayload;
  console.log(payload);
  return (
    <>
      <span className="text-muted-foreground text-sm">edser </span>
      <span className="text-right text-sm"></span>

      <span className="text-muted-foreground text-sm">Name</span>
      <span className="text-right text-sm capitalize">
        {additionalData?.target_user?.name || "N/A"}
      </span>

      <span className="text-muted-foreground text-sm">Username</span>
      <span className="text-right text-sm">
        {additionalData?.target_user?.username || "N/A"}
      </span>

      {additionalData?.target_user?.past_role &&
        additionalData?.target_user?.new_role ? (
        <>
          <span className="text-muted-foreground text-sm">Role Changed</span>
          <span className="text-right text-sm">
            {additionalData.target_user.past_role}
            <ArrowRight className="inline w-4 h-4 text-muted-foreground shrink-0" />
            {additionalData.target_user.new_role}
          </span>
        </>
      ) : (
        <>
          <span className="text-muted-foreground text-sm">Role</span>
          <span className="text-right text-sm">
            {additionalData?.target_user?.role || "N/A"}
          </span>
        </>
      )}
    </>
  );
}

