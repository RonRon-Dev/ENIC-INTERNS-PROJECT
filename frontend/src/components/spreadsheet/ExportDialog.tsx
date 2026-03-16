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

// BUG FIX 1: Import ZIP_THRESHOLD from the hook so it stays in sync with the
// worker threshold. Previously a local const ZIP_THRESHOLD = 5 could desync.
import { ZIP_THRESHOLD } from "@/hooks/useSpreadsheetData";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (config: ExportConfig, visibleCols: string[]) => void;
  /** Visible (export) columns — what gets written into the file */
  columns: string[];
  /** All columns from the file — used for the per-row filename picker only */
  allColumns: string[];
  selectedCount: number;
  isExporting?: boolean;
  /** BUG FIX 5: Signal whether the last export ended in an error, so we
   *  don't auto-close the dialog on failure (only close on success). */
  exportError?: boolean;
}

export function ExportDialog({
  open,
  onClose,
  onExport,
  columns,
  allColumns,
  selectedCount,
  isExporting = false,
  exportError = false,
}: ExportDialogProps) {
  // BUG FIX 8: Compute today lazily inside makeFileName so it doesn't capture
  // a stale date if the dialog is left open past midnight.
  const makeFileName = (format: ExportFormat, mode: ExportMode) => {
    const today = new Date().toISOString().slice(0, 10);
    return `exported-${format}-${mode}_${today}`;
  };

  const [config, setConfig] = useState<ExportConfig>({
    format: "xlsx",
    mode: "single",
    fileName: makeFileName("xlsx", "single"),
    fileNameCol: allColumns[0] ?? "",
    zipFileName: makeFileName("xlsx", "single"),
    skipNullNames: false,
    xmlCol: "",
    xmlWrap: false,
  });

  // columnsRef / allColumnsRef always hold the latest prop values so the
  // open-reset effect can read them without stale closure issues.
  const columnsRef = React.useRef(columns);
  React.useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);
  const allColumnsRef = React.useRef(allColumns);
  React.useEffect(() => {
    allColumnsRef.current = allColumns;
  }, [allColumns]);

  // Reset config each time the dialog opens so stale values (e.g. a
  // fileNameCol that no longer exists after hiding columns) don't persist.
  const prevOpenRef = React.useRef(false);
  React.useEffect(() => {
    if (!prevOpenRef.current && open) {
      const newName = makeFileName("xlsx", "single");
      setConfig({
        format: "xlsx",
        mode: "single",
        fileName: newName,
        fileNameCol: allColumnsRef.current[0] ?? "",
        zipFileName: newName,
        skipNullNames: false,
        // BUG FIX 6: Always clear xmlCol on open so switching away from XML
        // format and back doesn't leave a stale column reference active.
        xmlCol: "",
        xmlWrap: false,
      });
    }
    prevOpenRef.current = open;
  }, [open]);

  // Auto-update fileName and zipFileName when format or mode changes.
  // Uses refs to detect changes without adding config to the dep array
  // (which would cause infinite loops via setConfig).
  const prevFormatRef = React.useRef(config.format);
  const prevModeRef = React.useRef(config.mode);
  React.useEffect(() => {
    const formatChanged = prevFormatRef.current !== config.format;
    const modeChanged = prevModeRef.current !== config.mode;
    if (formatChanged || modeChanged) {
      const newName = makeFileName(config.format, config.mode);
      setConfig((prev) => ({
        ...prev,
        fileName: newName,
        zipFileName: newName,
        // BUG FIX 6: Clear xmlCol when switching away from XML format so a
        // stale column selection doesn't persist and confuse the worker.
        xmlCol: config.format !== "xml" ? "" : prev.xmlCol,
        xmlWrap: config.format !== "xml" ? false : prev.xmlWrap,
      }));
      prevFormatRef.current = config.format;
      prevModeRef.current = config.mode;
    }
  }, [config.format, config.mode]);

  // BUG FIX 5: Only auto-close the dialog when export completes successfully.
  // Previously this effect fired on EXPORT_ERROR too (isExporting flips to
  // false in both cases), closing the dialog before the user saw the toast.
  const prevExportingRef = React.useRef(false);
  React.useEffect(() => {
    if (prevExportingRef.current && !isExporting && !exportError) {
      onClose();
    }
    prevExportingRef.current = isExporting;
  }, [isExporting, exportError, onClose]);

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
  const isXml = config.format === "xml";

  // BUG FIX 2: Warn in the UI when per-row mode with ≤ ZIP_THRESHOLD rows
  // will trigger individual file downloads (which browsers may block after
  // the first). We surface a note so users know to expect this.
  const willTriggerMultiDownload =
    isPerRow && selectedCount > 1 && selectedCount <= ZIP_THRESHOLD;

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
                    : `${selectedCount} individual file${
                        selectedCount !== 1 ? "s" : ""
                      }`;
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
                  </button>
                );
              })}
            </div>

            {/* BUG FIX 2: Warn user that ≤ ZIP_THRESHOLD files are downloaded
                individually — some browsers may block simultaneous downloads. */}
            {willTriggerMultiDownload && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                {selectedCount} files will download individually. If your
                browser blocks them, allow multiple downloads for this site or
                select more than {ZIP_THRESHOLD} rows to get a zip instead.
              </p>
            )}
          </div>

          {/* Single file name */}
          {!isPerRow && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-foreground">
                File name
              </label>
              <div className="flex items-center">
                <input
                  className="flex-1 rounded-l-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  value={config.fileName}
                  onChange={(e) => set("fileName", e.target.value)}
                  placeholder={makeFileName(config.format, config.mode)}
                />
                <span className="rounded-r-md border border-l-0 border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                  .{config.format}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/50">
                Auto-generated from format and mode. You can edit this freely.
              </p>
            </div>
          )}

          {/* XML options — shown only when format is XML */}
          {isXml && (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 px-3 py-3">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-foreground">
                  XML source column
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Select the column that already contains formatted XML. Its
                  value will be written directly to the file — no additional
                  wrapping or escaping.
                </p>
              </div>
              <select
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                value={config.xmlCol}
                onChange={(e) => set("xmlCol", e.target.value)}
              >
                <option value="">— generate XML from all columns —</option>
                {allColumns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Wrap toggle — only relevant when a column is selected */}
              {config.xmlCol && (
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => set("xmlWrap", !config.xmlWrap)}
                >
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Wrap in root element
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {config.xmlWrap
                        ? "Each file will be wrapped in <export>…</export>"
                        : "Raw column value written verbatim — no wrapper added"}
                    </p>
                  </div>
                  <div
                    className={`relative shrink-0 h-4 w-7 rounded-full transition-colors duration-200 ${
                      config.xmlWrap ? "bg-primary" : "bg-border"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform duration-200 ${
                        config.xmlWrap ? "translate-x-3.5" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Per-row options */}
          {isPerRow && (
            <div className="flex flex-col gap-3">
              {/* File name column */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">
                  File name column
                </label>
                <select
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  value={config.fileNameCol}
                  onChange={(e) => set("fileNameCol", e.target.value)}
                >
                  <option value="">— use row number —</option>
                  {allColumns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                      {columns.includes(c) ? "" : " (hidden)"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Skip null names toggle */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => set("skipNullNames", !config.skipNullNames)}
              >
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Skip rows with empty name
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {config.skipNullNames
                      ? "Rows where the filename column is blank or null will be skipped"
                      : "All rows exported — blank names fall back to row number"}
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
              {selectedCount > ZIP_THRESHOLD && (
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
                      placeholder={makeFileName(config.format, config.mode)}
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
            onClick={() => onExport(config, columns)}
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
