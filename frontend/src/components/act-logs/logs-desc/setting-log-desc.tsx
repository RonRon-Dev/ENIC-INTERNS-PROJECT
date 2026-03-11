import { ArrowRight } from "lucide-react";
import type { ActivityLog, Payload, SettingsPayload } from "@/data/schema";

export default function SettingLogDesc({ currentRow }: { currentRow: ActivityLog }) {
  const payload: Payload = currentRow.payload as Payload;
  const additionalData: SettingsPayload =
    payload.AdditionalData as SettingsPayload;

  return (
    <>
      <span className="text-muted-foreground text-sm">Updated Values </span>
      <span className="text-right text-sm">{additionalData.UpdatedFields}</span>

      {additionalData.UpdatedFields.includes("Name") && (
        <>
          <span className="text-muted-foreground text-sm">Name</span>
          <span className="text-right text-sm capitalize">
            {additionalData.OldValues.Name || "N/A"}
            <ArrowRight className="inline w-4 h-4 text-muted-foreground shrink-0" />
            {additionalData.NewValues.Name || "N/A"}
          </span>
        </>
      )}
      {additionalData.UpdatedFields.includes("Username") && (
        <>
          <span className="text-muted-foreground text-sm">Username</span>
          <span className="text-right text-sm capitalize">
            {additionalData.OldValues.Username || "N/A"}
            <ArrowRight className="inline w-4 h-4 text-muted-foreground shrink-0" />
            {additionalData.NewValues.Username || "N/A"}
          </span>
        </>
      )}
    </>
  );
}

