import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  ExportConfig,
  ExportFormat,
  ExportMode,
} from "@/types/spreadsheet";
import {
  Download,
  FileDown,
  FileText,
  Loader2,
  SplitSquareHorizontal,
  Table2,
} from "lucide-react";
import React, { useState } from "react";

const ZIP_THRESHOLD = 5;

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (config: ExportConfig) => void;
  columns: string[];
  selectedCount: number;
  isExporting?: boolean;
}

export function ExportDialog({
  open,
  onClose,
  onExport,
  columns,
  selectedCount,
  isExporting = false,
}: ExportDialogProps) {
  const [config, setConfig] = useState<ExportConfig>({
    format: "xlsx",
    mode: "single",
    fileName: `export_${new Date().toISOString().slice(0, 10)}`,
    fileNameCol: columns[0] ?? "",
    zipFileName: `export_${new Date().toISOString().slice(0, 10)}`,
    skipNullNames: false,
  });

  // After the destructure and set helper:
  const prevExportingRef = React.useRef(false);
  React.useEffect(() => {
    if (prevExportingRef.current && !isExporting) {
      onClose();
    }
    prevExportingRef.current = isExporting;
  }, [isExporting, onClose]);

  const set = <K extends keyof ExportConfig>(key: K, val: ExportConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: val }));

  const formatOptions: {
    value: ExportFormat;
    label: string;
    icon: React.ReactNode;
    desc: string;
  }[] = [
    {
      value: "xlsx",
      label: "Excel",
      icon: <Table2 className="h-4 w-4" />,
      desc: ".xlsx workbook",
    },
    {
      value: "csv",
      label: "CSV",
      icon: <FileText className="h-4 w-4" />,
      desc: "Comma separated",
    },
    {
      value: "tsv",
      label: "TSV",
      icon: <FileText className="h-4 w-4" />,
      desc: "Tab separated",
    },
    {
      value: "xml",
      label: "XML",
      icon: <FileText className="h-4 w-4" />,
      desc: "Markup format",
    },
  ];

  const isPerRow = config.mode === "per-row";

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Download className="h-4 w-4 text-muted-foreground" />
            Export Configuration
          </DialogTitle>
          <DialogDescription className="text-xs">
            Configure how {selectedCount} selected row
            {selectedCount !== 1 ? "s" : ""} will be exported.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {/* Format */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">
              Format
            </label>
            <div className="grid grid-cols-4 gap-2">
              {formatOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => set("format", opt.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all ${
                    config.format === opt.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-border/80 hover:bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {opt.icon}
                  <span className="text-xs font-medium">{opt.label}</span>
                  <span className="text-[10px] opacity-60">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">
              Export mode
            </label>
            <div className="flex flex-col gap-2">
              {/* Single file */}
              {(["single", "per-row"] as ExportMode[]).map((value) => {
                const label =
                  value === "single" ? "Single file" : "One file per row";
                const icon =
                  value === "single" ? (
                    <FileDown className="h-4 w-4" />
                  ) : (
                    <SplitSquareHorizontal className="h-4 w-4" />
                  );
                const desc =
                  value === "single"
                    ? "All rows in one file"
                    : selectedCount > ZIP_THRESHOLD
                    ? "Bundled as .zip"
                    : `${selectedCount} individual files`;
                return (
                  <button
                    key={value}
                    onClick={() => set("mode", value)}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
                      config.mode === value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-border/80 hover:bg-muted/30"
                    }`}
                  >
                    <div
                      className={
                        config.mode === value
                          ? "text-primary"
                          : "text-muted-foreground"
                      }
                    >
                      {icon}
                    </div>
                    <div>
                      <p
                        className={`text-xs font-medium ${
                          config.mode === value
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {desc}
                      </p>
                    </div>
                    <div
                      className={`ml-auto h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        config.mode === value
                          ? "border-primary"
                          : "border-border"
                      }`}
                    >
                      {config.mode === value && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Single file name */}
          {config.mode === "single" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-foreground">
                File name
              </label>
              <div className="flex items-center">
                <input
                  className="flex-1 rounded-l-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  value={config.fileName}
                  onChange={(e) => set("fileName", e.target.value)}
                  placeholder="export"
                />
                <span className="rounded-r-md border border-l-0 border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                  .{config.format}
                </span>
              </div>
            </div>
          )}

          {/* Per-row config */}
          {isPerRow && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-foreground">
                Use column as file name
              </label>
              <p className="text-[11px] text-muted-foreground -mt-1">
                Each file will be named after this column's value
              </p>
              <select
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                value={config.fileNameCol}
                onChange={(e) => set("fileNameCol", e.target.value)}
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground/60">
                Files will be saved as:{" "}
                <span className="font-mono text-foreground/60">
                  [value].{config.format}
                </span>
              </p>

              {/* Skip null names toggle */}
              <div
                className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2 cursor-pointer"
                onClick={() => set("skipNullNames", !config.skipNullNames)}
              >
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Skip rows with no name
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {config.skipNullNames
                      ? "Rows where the name column is empty will be excluded"
                      : "Rows with no name will export as row_#"}
                  </p>
                </div>
                <div
                  className={`relative shrink-0 h-4 w-7 rounded-full transition-colors duration-200 ${
                    config.skipNullNames ? "bg-primary" : "bg-border"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform duration-200 ${
                      config.skipNullNames
                        ? "translate-x-3.5"
                        : "translate-x-0.5"
                    }`}
                  />
                </div>
              </div>

              {/* Zip file name — only when count exceeds threshold */}
              {config.mode === "per-row" && selectedCount > ZIP_THRESHOLD && (
                <div className="flex flex-col gap-2 pt-2 mt-1 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      {selectedCount} files
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      · will be bundled into a zip
                    </span>
                  </div>
                  <label className="text-xs font-medium text-foreground">
                    Zip file name
                  </label>
                  <div className="flex items-center">
                    <input
                      className="flex-1 rounded-l-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      value={config.zipFileName}
                      onChange={(e) => set("zipFileName", e.target.value)}
                      placeholder="export"
                    />
                    <span className="rounded-r-md border border-l-0 border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                      .zip
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={isExporting}
            onClick={() => onExport(config)}
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {isExporting
              ? "Exporting…"
              : `Export ${selectedCount} row${selectedCount !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
