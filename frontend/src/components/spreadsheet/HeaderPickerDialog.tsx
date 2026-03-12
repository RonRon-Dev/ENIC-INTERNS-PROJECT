import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table2 } from "lucide-react";
import { useState } from "react";

interface HeaderPickerDialogProps {
  open: boolean;
  rawData: string[][];
  onConfirm: (rowIndex: number) => void;
  onClose: () => void;
}

export function HeaderPickerDialog({
  open,
  rawData,
  onConfirm,
  onClose,
}: HeaderPickerDialogProps) {
  const previewRows = rawData.slice(0, 12);
  const previewCols = Math.min(
    8,
    Math.max(0, ...previewRows.map((r) => r.length))
  );

  const [selectedRow, setSelectedRow] = useState(() => {
    if (rawData.length === 0) return 0;
    let best = 0,
      bestScore = -1;
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const score = rawData[i].filter(
        (c) => c && isNaN(Number(c)) && String(c).trim().length > 0
      ).length;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    return best;
  });

  const dataRowCount = Math.max(0, rawData.length - selectedRow - 1);

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="max-w-7xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Table2 className="h-4 w-4 text-muted-foreground" />
            Select Header Row
          </DialogTitle>
          <DialogDescription className="text-xs">
            Click the row that contains your column headers. Any rows above it
            will be skipped.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-auto max-h-[420px] px-4 pb-4">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="w-8 px-2 py-1.5 text-left text-muted-foreground/40 font-normal border-b border-border sticky top-0 bg-background">
                  #
                </th>
                {Array.from({ length: previewCols }, (_, i) => (
                  <th
                    key={i}
                    className="px-3 py-1.5 text-left text-muted-foreground/40 font-normal border-b border-border whitespace-nowrap sticky top-0 bg-background"
                  >
                    col {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, ri) => {
                const isSelected = ri === selectedRow;
                const isAbove = ri < selectedRow;
                return (
                  <tr
                    key={ri}
                    onClick={() => setSelectedRow(ri)}
                    className={`cursor-pointer transition-all duration-100 border-b border-border/40 ${
                      isSelected
                        ? "bg-primary/10 ring-1 ring-inset ring-primary/30"
                        : isAbove
                        ? "opacity-30 hover:opacity-55 hover:bg-muted/30"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <td className="px-2 py-2 font-mono text-muted-foreground/30 text-[10px] shrink-0">
                      {ri + 1}
                    </td>
                    {Array.from({ length: previewCols }, (_, ci) => (
                      <td
                        key={ci}
                        className={`px-3 py-2 whitespace-nowrap max-w-[180px] truncate ${
                          isSelected
                            ? "font-semibold text-primary"
                            : isAbove
                            ? "text-muted-foreground"
                            : "text-foreground/70"
                        }`}
                        title={row[ci] ?? ""}
                      >
                        {row[ci] ?? (
                          <span className="text-muted-foreground/20">—</span>
                        )}
                      </td>
                    ))}
                    {/* <td className="px-2 py-2 w-28">
                      {isSelected && (
                        <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5 whitespace-nowrap">
                          ← header row
                        </span>
                      )}
                      {isAbove && (
                        <span className="text-[10px] text-muted-foreground/30 whitespace-nowrap">
                          skipped
                        </span>
                      )}
                    </td> */}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {rawData.length > 12 && (
            <p className="text-[11px] text-muted-foreground/40 text-center pt-3">
              Showing first 12 rows · {rawData.length} total rows in file
            </p>
          )}
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border gap-2 items-center">
          <p className="flex-1 text-xs text-muted-foreground">
            Row{" "}
            <span className="font-semibold text-foreground">
              {selectedRow + 1}
            </span>{" "}
            as header
            {" · "}
            <span className="font-semibold text-foreground">
              {dataRowCount.toLocaleString()}
            </span>{" "}
            data row{dataRowCount !== 1 ? "s" : ""} below
          </p>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => onConfirm(selectedRow)}
          >
            <Table2 className="h-3.5 w-3.5" />
            Use Row {selectedRow + 1} as Header
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
