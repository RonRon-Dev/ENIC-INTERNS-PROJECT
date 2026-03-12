import type { AccMgmtPayload, ActivityLog, Payload } from "@/data/schema";

export default function AccMgmtLogDesc({ currentRow }: { currentRow: ActivityLog }) {
  const payload: Payload = currentRow.payload as Payload;
  const additionalData: AccMgmtPayload =
    payload.AdditionalData as AccMgmtPayload;

  console.log(payload);

  return (
    <>
      <span className="text-foreground text-sm">Target User </span>
      <span className="text-right text-sm"></span>

      <span className="text-muted-foreground text-sm">Name</span>
      <span className="text-right text-sm capitalize">
        {additionalData?.target_user?.name || "N/A"}
      </span>

      <span className="text-muted-foreground text-sm">Username</span>
      <span className="text-right text-sm">
        {additionalData?.target_user?.username || "N/A"}
      </span>

      <span className="text-muted-foreground text-sm">Role Assigned</span>
      <span className="text-right text-sm">
        {additionalData?.target_user?.role || "N/A"}
      </span>

      <span className="text-muted-foreground text-sm">Password Generated</span>
      <span className="text-right text-sm">
        {additionalData?.temp_generated_password ? "Yes" : "No"}
      </span>
    </>
  );
}

