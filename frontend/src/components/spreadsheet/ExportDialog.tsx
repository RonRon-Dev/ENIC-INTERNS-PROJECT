import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ExportConfig,
  ExportFormat,
  ExportMode,
  XmlValidationResult,
} from "@/types/spreadsheet";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileDown,
  FileText,
  Loader2,
  SplitSquareHorizontal,
  Table2,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (config: ExportConfig, visibleCols: string[]) => void;
  onValidateXml: (visibleCol: string) => void;
  /** Visible (export) columns — what gets written into the file */
  columns: string[];
  /** All columns from the file — used for the per-row filename picker only */
  allColumns: string[];
  selectedCount: number;
  isExporting?: boolean;
  isValidating?: boolean;
  exportError?: boolean;
  xmlValidation?: XmlValidationResult | null;
}

export function ExportDialog({
  open,
  onClose,
  onExport,
  onValidateXml,
  columns,
  allColumns,
  selectedCount,
  isExporting = false,
  isValidating = false,
  exportError = false,
  xmlValidation = null,
}: ExportDialogProps) {
  // Compute today lazily so a dialog left open past midnight still gets the right date.
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
  });

  // Whether the user has acknowledged the XML warning and chosen to proceed
  const [xmlWarningAcknowledged, setXmlWarningAcknowledged] = useState(false);

  const columnsRef = React.useRef(columns);
  React.useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);
  const allColumnsRef = React.useRef(allColumns);
  React.useEffect(() => {
    allColumnsRef.current = allColumns;
  }, [allColumns]);

  // Reset config and acknowledgement each time the dialog opens
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
      });
      setXmlWarningAcknowledged(false);
    }
    prevOpenRef.current = open;
  }, [open]);

  // Auto-update file names when format or mode changes
  const prevFormatRef = React.useRef(config.format);
  const prevModeRef = React.useRef(config.mode);
  React.useEffect(() => {
    const formatChanged = prevFormatRef.current !== config.format;
    const modeChanged = prevModeRef.current !== config.mode;
    if (formatChanged || modeChanged) {
      const newName = makeFileName(config.format, config.mode);
      setConfig((prev) => ({ ...prev, fileName: newName, zipFileName: newName }));
      prevFormatRef.current = config.format;
      prevModeRef.current = config.mode;
    }
  }, [config.format, config.mode]);

  // Reset XML acknowledgement whenever a new validation result arrives
  React.useEffect(() => {
    setXmlWarningAcknowledged(false);
  }, [xmlValidation]);

  // Auto-close only on successful export completion
  const prevExportingRef = React.useRef(false);
  React.useEffect(() => {
    if (prevExportingRef.current && !isExporting && !exportError) {
      onClose();
    }
    prevExportingRef.current = isExporting;
  }, [isExporting, exportError, onClose]);

  const set = <K extends keyof ExportConfig>(key: K, val: ExportConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: val }));

  // XML is only meaningful when exactly 1 column is visible.
  // Clicking it with multiple columns fires a toast instead of selecting.
  const handleFormatClick = (fmt: ExportFormat) => {
    if (fmt === "xml" && columns.length !== 1) {
      toast.warning("XML export unavailable", {
        description:
          "Hide all columns except your XML column first, then select XML format.",
      });
      return;
    }
    set("format", fmt);
  };

  const isPerRow = config.mode === "per-row";
  const isXml = config.format === "xml";
  const hasValidationResult = xmlValidation !== null;
  const hasXmlWarning = hasValidationResult && xmlValidation.invalidCount > 0;

  // Export button is disabled when:
  // - currently exporting or validating
  // - per-row mode with no filename column selected
  // - XML has warnings that haven't been acknowledged
  const perRowMissingFileName = isPerRow && !config.fileNameCol;
  const xmlNeedsAck = isXml && hasXmlWarning && !xmlWarningAcknowledged;
  const canExport =
    !isExporting && !isValidating && !perRowMissingFileName && !xmlNeedsAck;

  // Two-step for XML: first click validates, second click exports
  const handleExportClick = () => {
    if (isXml && !hasValidationResult && !isValidating) {
      onValidateXml(columns[0] ?? "");
      return;
    }
    onExport(config, columns);
  };

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
      desc: columns.length === 1 ? "Single column" : "1 column needed",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Download className="h-4 w-4 text-muted-foreground" />
            Export Configuration
          </DialogTitle>
          <DialogDescription className="text-xs">
            Configure how{" "}
            <span className="font-medium text-foreground">
              {selectedCount.toLocaleString()}
            </span>{" "}
            selected row{selectedCount !== 1 ? "s" : ""} will be exported.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {/* ── Format ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">
              Format
            </label>
            <div className="grid grid-cols-4 gap-2">
              {formatOptions.map((opt) => {
                const isXmlUnavailable =
                  opt.value === "xml" && columns.length !== 1;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleFormatClick(opt.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all ${
                      config.format === opt.value
                        ? "border-primary bg-primary/5 text-primary"
                        : isXmlUnavailable
                        ? "border-border text-muted-foreground/40 cursor-pointer"
                        : "border-border hover:border-border/80 hover:bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    {opt.icon}
                    <span className="text-xs font-medium">{opt.label}</span>
                    <span className="text-[10px] opacity-60">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Mode ── */}
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
                    : "Each row as its own file, bundled in a zip";
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
          </div>

          {/* ── Single file name ── */}
          {!isPerRow && (
            <div className="flex flex-col gap-1.5">
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
            </div>
          )}

          {/* ── Per-row options ── */}
          {isPerRow && (
            <div className="flex flex-col gap-3">
              {/* Filename column — shadcn Select matching ColumnDialog's type selector style */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">
                  Filename column{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Select
                  value={config.fileNameCol}
                  onValueChange={(val) => set("fileNameCol", val)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="— select a column —" />
                  </SelectTrigger>
                  <SelectContent>
                    {allColumns.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">
                        {c}
                        {!columns.includes(c) && (
                          <span className="ml-1 text-muted-foreground/50">
                            (hidden)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground/60">
                  Each row's file will be named after this column's value.
                  Blank values fall back to row number.
                </p>
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
                      ? "Rows where the filename column is blank will be skipped"
                      : "Blank names fall back to row number"}
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

              {/* Zip file name */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
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
            </div>
          )}

          {/* ── XML validation result panel ── */}
          {isXml && hasValidationResult && (
            <div
              className={`rounded-lg border px-3 py-3 flex flex-col gap-2 ${
                hasXmlWarning
                  ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30"
                  : "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/30"
              }`}
            >
              <div className="flex items-start gap-2">
                {hasXmlWarning ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                )}
                <div className="flex flex-col gap-0.5">
                  {hasXmlWarning ? (
                    <>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                        {xmlValidation.invalidCount.toLocaleString()} of{" "}
                        {xmlValidation.totalScanned.toLocaleString()} rows may
                        have invalid XML
                      </p>
                      <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80">
                        Sample row
                        {xmlValidation.sampleRows.length > 1 ? "s" : ""}:{" "}
                        {xmlValidation.sampleRows.join(", ")}. These files may
                        be malformed.
                      </p>
                    </>
                  ) : (
                    <p className="text-xs font-semibold text-green-700 dark:text-green-300">
                      All {xmlValidation.totalScanned.toLocaleString()} rows
                      passed the XML check
                    </p>
                  )}
                </div>
              </div>

              {/* Acknowledgement checkbox — only shown when there are warnings */}
              {hasXmlWarning && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="xml-ack"
                    type="checkbox"
                    checked={xmlWarningAcknowledged}
                    onChange={(e) =>
                      setXmlWarningAcknowledged(e.target.checked)
                    }
                    className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
                  />
                  <label
                    htmlFor="xml-ack"
                    className="text-[11px] text-amber-700 dark:text-amber-300 cursor-pointer select-none"
                  >
                    I understand, export anyway
                  </label>
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
            disabled={isExporting || isValidating}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-1.5 min-w-[130px]"
            disabled={!canExport}
            onClick={handleExportClick}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Exporting…
              </>
            ) : isValidating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Validating…
              </>
            ) : isXml && !hasValidationResult ? (
              <>
                <Download className="h-3.5 w-3.5" />
                Validate & Export
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                Export {selectedCount.toLocaleString()} row
                {selectedCount !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}