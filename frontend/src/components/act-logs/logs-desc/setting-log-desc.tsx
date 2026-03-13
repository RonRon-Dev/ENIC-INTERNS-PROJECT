import type { ActivityLog, Payload, SettingsPayload } from "@/data/schema";
import { ArrowRight } from "lucide-react";

export default function SettingLogDesc({ currentRow }: { currentRow: ActivityLog }) {
  const payload: Payload = currentRow.payload as Payload;
  const additionalData: SettingsPayload =
    payload.AdditionalData as SettingsPayload;

  return (
    <>
      <span className="text-muted-foreground text-sm col-span-2">Updated Fields</span>
      {/* <span className="text-sm col-span-2">
        {Array.isArray(additionalData.UpdatedFields)
          ? additionalData.UpdatedFields.join(", ")
          : additionalData.UpdatedFields}
      </span> */}
      {additionalData.UpdatedFields.includes("Name") && (
        <>
          <span className="text-muted-foreground text-sm">Name</span>
          <span className="text-right text-sm capitalize flex items-center justify-end gap-1">
            {additionalData.OldValues.Name || "N/A"}
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {additionalData.NewValues.Name || "N/A"}
          </span>
        </>
      )}

      {additionalData.UpdatedFields.includes("Username") && (
        <>
          <span className="text-muted-foreground text-sm">Username</span>
          <span className="text-right text-sm flex items-center justify-end gap-1">
            {additionalData.OldValues.Username || "N/A"}
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {additionalData.NewValues.Username || "N/A"}
          </span>
        </>
      )}
    </>
  );
}

