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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useSidebar } from "@/components/ui/sidebar";
import JSZip from "jszip";
import {
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Columns3,
  Download,
  FileDown,
  FileSpreadsheet,
  FileText,
  GripVertical,
  Minus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  SplitSquareHorizontal,
  Square,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Row {
  __id: number;
  [key: string]: unknown;
}

type SortDir = "asc" | "desc" | null;
interface SortState {
  col: string | null;
  dir: SortDir;
}
type ColVisibility = Record<string, boolean>;
// col → set of allowed values (empty set = no filter on that col)
type ActiveFilters = Record<string, Set<string>>;
// col → { from, to } date range filter (ISO strings or "")
type DateRangeFilters = Record<string, { from: string; to: string }>;

// Detect if a column looks like dates — sample first 20 non-empty values
const DATE_RE = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
function isDateColumn(col: string, rows: Row[]): boolean {
  let checked = 0;
  for (const row of rows) {
    const val = String(row[col] ?? "").trim();
    if (!val || val.toUpperCase() === "NULL") continue;
    if (!DATE_RE.test(val)) return false;
    if (++checked >= 20) break;
  }
  return checked > 0;
}

// Parse M/D/YY or M/D/YYYY → Date (returns null on failure)
function parseDate(val: string): Date | null {
  const match = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!match) return null;
  let year = parseInt(match[3], 10);
  if (year < 100) year += year < 50 ? 2000 : 1900;
  const d = new Date(year, parseInt(match[1], 10) - 1, parseInt(match[2], 10));
  return isNaN(d.getTime()) ? null : d;
}

// Convert YYYY-MM-DD input string → Date
function inputToDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}
type ExportFormat = "xlsx" | "csv" | "tsv";
type ExportMode = "single" | "per-row";

interface ExportConfig {
  format: ExportFormat;
  mode: ExportMode;
  fileName: string;
  fileNameCol: string;
  zipFileName: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;
const ZIP_THRESHOLD = 5; // per-row exports above this count get zipped

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({
  onFile,
  progress,
  isLoading,
}: {
  onFile: (file: File) => void;
  progress: number;
  isLoading: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1">
      <div
        className={`
          w-full max-w-lg flex flex-col items-center justify-center gap-5
          rounded-2xl border-2 border-dashed px-10 py-14
          transition-all duration-300
          ${
            isLoading
              ? "border-border cursor-default"
              : isDragging
              ? "border-primary bg-primary/5 scale-[1.015] cursor-pointer"
              : "border-border hover:border-primary/50 hover:bg-muted/20 cursor-pointer"
          }
        `}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isLoading) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
      >
        {/* Icon */}
        <div
          className={`rounded-2xl border p-5 transition-colors duration-300 ${
            isDragging
              ? "border-primary/40 bg-primary/10"
              : "border-border bg-muted/50"
          }`}
        >
          <FileSpreadsheet
            className={`h-9 w-9 transition-colors duration-300 ${
              isDragging ? "text-primary" : "text-muted-foreground"
            }`}
          />
        </div>

        {/* Text */}
        <div className="text-center flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">
            {isLoading
              ? "Importing file…"
              : isDragging
              ? "Release to import"
              : "Drop your spreadsheet here"}
          </p>
          {!isLoading && (
            <p className="text-xs text-muted-foreground">
              {isDragging
                ? "Supported: .xlsx · .xls · .csv"
                : "or click to browse · .xlsx, .xls, .csv"}
            </p>
          )}
        </div>

        {/* Progress bar — only shown while loading */}
        {isLoading && (
          <div className="w-full flex flex-col gap-1.5">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
              <span>Reading file</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </div>
    </div>
  );
}

// ─── Header Picker Dialog ─────────────────────────────────────────────────────

function HeaderPickerDialog({
  open,
  rawData,
  onConfirm,
  onClose,
}: {
  open: boolean;
  rawData: string[][];
  onConfirm: (rowIndex: number) => void;
  onClose: () => void;
}) {
  const previewRows = rawData.slice(0, 12);
  const previewCols = Math.min(
    8,
    Math.max(0, ...previewRows.map((r) => r.length))
  );

  // Lazy initializer runs once on mount. The parent resets this component by
  // changing its `key` prop whenever rawData changes, so this is always fresh.
  const [selectedRow, setSelectedRow] = useState(() => {
    if (rawData.length === 0) return 0;
    let best = 0;
    let bestScore = -1;
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
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Table2 className="h-4 w-4 text-muted-foreground" />
            Select Header Row
          </DialogTitle>
          <DialogDescription className="text-xs">
            Click the row that contains your column headers. Any rows above it
            (e.g. titles, summaries) will be skipped.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-auto max-h-[420px] p-4">
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
                    <td className="px-2 py-2 w-28">
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
                    </td>
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

// ─── Export Config Dialog ─────────────────────────────────────────────────────

function ExportDialog({
  open,
  onClose,
  onExport,
  columns,
  selectedCount,
}: {
  open: boolean;
  onClose: () => void;
  onExport: (config: ExportConfig) => void;
  columns: string[];
  selectedCount: number;
}) {
  const [config, setConfig] = useState<ExportConfig>({
    format: "xlsx",
    mode: "single",
    fileName: `export_${new Date().toISOString().slice(0, 10)}`,
    fileNameCol: columns[0] ?? "",
    zipFileName: `export_${new Date().toISOString().slice(0, 10)}`,
  });

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
  ];

  const modeOptions: {
    value: ExportMode;
    label: string;
    icon: React.ReactNode;
    desc: string;
  }[] = [
    {
      value: "single",
      label: "Single file",
      icon: <FileDown className="h-4 w-4" />,
      desc: `All ${selectedCount} rows in one file`,
    },
    {
      value: "per-row",
      label: "One file per row",
      icon: <SplitSquareHorizontal className="h-4 w-4" />,
      desc: `${selectedCount} separate files`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Download className="h-4 w-4 text-muted-foreground" />
            Export Configuration
          </DialogTitle>
          <DialogDescription className="text-xs">
            {selectedCount} row{selectedCount !== 1 ? "s" : ""} selected for
            export
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* Format */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-foreground">
              File format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {formatOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => set("format", opt.value)}
                  className={`
                    flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all
                    ${
                      config.format === opt.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-border/80 hover:bg-muted/30 text-muted-foreground"
                    }
                  `}
                >
                  {opt.icon}
                  <span className="text-xs font-medium">{opt.label}</span>
                  <span className="text-[10px] opacity-60">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-foreground">
              Export mode
            </label>
            <div className="flex flex-col gap-2">
              {modeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => set("mode", opt.value)}
                  className={`
                    flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all
                    ${
                      config.mode === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-border/80 hover:bg-muted/30"
                    }
                  `}
                >
                  <div
                    className={
                      config.mode === opt.value
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  >
                    {opt.icon}
                  </div>
                  <div>
                    <p
                      className={`text-xs font-medium ${
                        config.mode === opt.value
                          ? "text-primary"
                          : "text-foreground"
                      }`}
                    >
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {opt.desc}
                    </p>
                  </div>
                  <div
                    className={`ml-auto h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      config.mode === opt.value
                        ? "border-primary"
                        : "border-border"
                    }`}
                  >
                    {config.mode === opt.value && (
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* File name */}
          {config.mode === "single" && (
            <div
              className="flex flex-col gap-2"
              style={{ animation: "fadeSlideIn 0.15s ease-out" }}
            >
              <label className="text-xs font-medium text-foreground">
                File name
              </label>
              <div className="flex items-center gap-0">
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

          {/* Per-row file name column */}
          {config.mode === "per-row" && (
            <div
              className="flex flex-col gap-2"
              style={{ animation: "fadeSlideIn 0.15s ease-out" }}
            >
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

              {/* Zip section — only shown when above threshold */}
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
                  <div className="flex items-center gap-0">
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
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              onExport(config);
              onClose();
            }}
          >
            <Download className="h-3.5 w-3.5" />
            Export {selectedCount} row{selectedCount !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Filter Drawer ────────────────────────────────────────────────────────────

function FilterDrawer({
  open,
  columns,
  visibleCols,
  rows,
  activeFilters,
  onFiltersChange,
  dateRangeFilters,
  onDateRangeChange,
  onClose,
}: {
  open: boolean;
  columns: string[];
  visibleCols: ColVisibility;
  rows: Row[];
  activeFilters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
  dateRangeFilters: DateRangeFilters;
  onDateRangeChange: (filters: DateRangeFilters) => void;
  onClose: () => void;
}) {
  const [expandedCols, setExpandedCols] = useState<Set<string>>(new Set());
  const [colSearch, setColSearch] = useState("");
  const [valueSearch, setValueSearch] = useState<Record<string, string>>({});

  const filterableCols = columns.filter((c) => visibleCols[c] !== false);
  const displayCols = colSearch.trim()
    ? filterableCols.filter((c) =>
        c.toLowerCase().includes(colSearch.toLowerCase())
      )
    : filterableCols;

  // Compute distinct values for all filterable columns once, not on every render
  const distinctValuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const col of filterableCols) {
      const seen = new Set<string>();
      for (const row of rows) {
        const val = String(row[col] ?? "");
        seen.add(val);
        if (seen.size > 500) break;
      }
      map[col] = Array.from(seen).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      );
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, columns]);

  // Detect date columns once
  const dateColSet = useMemo(() => {
    const set = new Set<string>();
    for (const col of filterableCols) {
      if (isDateColumn(col, rows)) set.add(col);
    }
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, columns]);

  const getDistinctValues = (col: string): string[] =>
    distinctValuesMap[col] ?? [];

  const toggleValue = (col: string, value: string) => {
    const next: ActiveFilters = { ...activeFilters };
    const current = new Set(next[col] ?? []);
    if (current.has(value)) {
      current.delete(value);
    } else {
      current.add(value);
    }
    if (current.size === 0) {
      delete next[col];
    } else {
      next[col] = current;
    }
    onFiltersChange(next);
  };

  const clearCol = (col: string) => {
    const next = { ...activeFilters };
    delete next[col];
    onFiltersChange(next);
  };

  const toggleExpand = (col: string) => {
    setExpandedCols((prev) => {
      const next = new Set(prev);
      if (next.has(col)) {
        next.delete(col);
      } else {
        next.add(col);
      }
      return next;
    });
  };

  const activeCount =
    Object.keys(activeFilters).length + Object.keys(dateRangeFilters).length;

  return (
    <Drawer
      open={open}
      onOpenChange={(v: boolean) => !v && onClose()}
      direction="right"
    >
      <DrawerContent direction="right" className="flex flex-col w-80 p-0 gap-0">
        {/* Header */}
        <DrawerHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border bg-muted/30 gap-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <DrawerTitle className="text-sm font-semibold">Filters</DrawerTitle>
            {activeCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <button
                className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                onClick={() => {
                  onFiltersChange({});
                  onDateRangeChange({});
                }}
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DrawerHeader>

        {/* Column search */}
        <div className="px-4 py-2.5 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input
              className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Search columns…"
              value={colSearch}
              onChange={(e) => setColSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Column list */}
        <div className="flex-1 overflow-y-auto">
          {displayCols.map((col) => {
            const isExpanded = expandedCols.has(col);
            const colFilter = activeFilters[col];
            const hasValueFilter = colFilter && colFilter.size > 0;
            const dateRange = dateRangeFilters[col];
            const hasDateFilter = !!(dateRange?.from || dateRange?.to);
            const hasFilter = hasValueFilter || hasDateFilter;
            const isDate = isExpanded && dateColSet.has(col);
            const distinctValues =
              isExpanded && !isDate ? getDistinctValues(col) : [];
            const vSearch = valueSearch[col] ?? "";
            const filteredValues = vSearch.trim()
              ? distinctValues.filter((v) =>
                  v.toLowerCase().includes(vSearch.toLowerCase())
                )
              : distinctValues;

            return (
              <div
                key={col}
                className="border-b border-border/50 last:border-0"
              >
                {/* Column header row */}
                <div
                  className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors select-none"
                  onClick={() => toggleExpand(col)}
                >
                  <span className="text-xs flex-1 truncate font-medium text-foreground/80">
                    {col}
                  </span>
                  {hasFilter && (
                    <span className="text-[10px] font-semibold text-primary shrink-0">
                      {hasDateFilter
                        ? "date range"
                        : `${colFilter.size} selected`}
                    </span>
                  )}
                  {hasFilter && (
                    <button
                      className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearCol(col);
                        const next = { ...dateRangeFilters };
                        delete next[col];
                        onDateRangeChange(next);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform duration-150 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-3 flex flex-col gap-2 bg-muted/10">
                    {/* ── Date range picker ── */}
                    {isDate ? (
                      <div className="flex flex-col gap-2 pt-1">
                        <p className="text-[11px] text-muted-foreground">
                          Filter by date range
                        </p>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] text-muted-foreground w-8 shrink-0">
                              From
                            </label>
                            <input
                              type="date"
                              className="flex-1 rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                              value={dateRange?.from ?? ""}
                              onChange={(e) => {
                                onDateRangeChange({
                                  ...dateRangeFilters,
                                  [col]: {
                                    from: e.target.value,
                                    to: dateRange?.to ?? "",
                                  },
                                });
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] text-muted-foreground w-8 shrink-0">
                              To
                            </label>
                            <input
                              type="date"
                              className="flex-1 rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                              value={dateRange?.to ?? ""}
                              onChange={(e) => {
                                onDateRangeChange({
                                  ...dateRangeFilters,
                                  [col]: {
                                    from: dateRange?.from ?? "",
                                    to: e.target.value,
                                  },
                                });
                              }}
                            />
                          </div>
                        </div>
                        {hasDateFilter && (
                          <button
                            className="text-[11px] text-muted-foreground hover:underline self-start"
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = { ...dateRangeFilters };
                              delete next[col];
                              onDateRangeChange(next);
                            }}
                          >
                            Clear range
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Value search */}
                        {distinctValues.length > 8 && (
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <input
                              className="w-full rounded border border-border bg-background pl-7 pr-3 py-1 text-[11px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
                              placeholder="Search values…"
                              value={vSearch}
                              onChange={(e) =>
                                setValueSearch((prev) => ({
                                  ...prev,
                                  [col]: e.target.value,
                                }))
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}

                        {/* Value checkboxes */}
                        <div className="flex flex-col gap-0.5 max-h-52 overflow-y-auto">
                          {filteredValues.map((val) => {
                            const isChecked = colFilter?.has(val) ?? false;
                            return (
                              <label
                                key={val}
                                className="flex items-center gap-2 px-1 py-1 rounded hover:bg-muted/60 cursor-pointer group"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleValue(col, val);
                                }}
                              >
                                <div
                                  className={`h-3.5 w-3.5 shrink-0 rounded-sm border flex items-center justify-center transition-colors ${
                                    isChecked
                                      ? "border-primary bg-primary"
                                      : "border-border group-hover:border-muted-foreground/40"
                                  }`}
                                >
                                  {isChecked && (
                                    <svg
                                      viewBox="0 0 10 8"
                                      fill="none"
                                      className="w-2.5 h-2.5"
                                    >
                                      <path
                                        d="M1 4l3 3 5-6"
                                        stroke="white"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  )}
                                </div>
                                <span className="text-[11px] truncate flex-1 text-foreground/70">
                                  {val === "" ? (
                                    <em className="text-muted-foreground/40">
                                      empty
                                    </em>
                                  ) : (
                                    val
                                  )}
                                </span>
                              </label>
                            );
                          })}
                          {filteredValues.length === 0 && (
                            <p className="text-[11px] text-muted-foreground/40 py-3 text-center">
                              No values found
                            </p>
                          )}
                        </div>

                        {/* All / None row */}
                        <div className="flex gap-3 text-[11px] pt-1.5 border-t border-border/50">
                          <button
                            className="text-primary hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFiltersChange({
                                ...activeFilters,
                                [col]: new Set(distinctValues),
                              });
                            }}
                          >
                            Select all
                          </button>
                          <button
                            className="text-muted-foreground hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearCol(col);
                            }}
                          >
                            Clear
                          </button>
                          <span className="ml-auto text-muted-foreground/40">
                            {distinctValues.length} value
                            {distinctValues.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {displayCols.length === 0 && (
            <p className="text-xs text-muted-foreground/40 text-center py-10">
              No columns found
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// ─── Column Config Dialog — Side-by-side ─────────────────────────────────────

function ColumnDialog({
  open,
  columns,
  visibility,
  onChange,
  onReorder,
  onClose,
}: {
  open: boolean;
  columns: string[];
  visibility: ColVisibility;
  onChange: (col: string, v: boolean) => void;
  onReorder: (newOrder: string[]) => void;
  onClose: () => void;
}) {
  const [localVisibility, setLocalVisibility] = useState<ColVisibility>({});
  // localOrder tracks the order of VISIBLE columns only (the right panel)
  const [localOrder, setLocalOrder] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  // Drag state for right panel
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setLocalVisibility({ ...visibility });
      setLocalOrder(columns.filter((c) => visibility[c] !== false));
      setSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // When a column is toggled on the left, sync the right panel order
  const handleToggle = (col: string) => {
    const isCurrentlyVisible = localVisibility[col] !== false;
    const isNowVisible = !isCurrentlyVisible;
    setLocalVisibility((prev) => ({ ...prev, [col]: isNowVisible }));
    setLocalOrder((prev) =>
      isNowVisible ? [...prev, col] : prev.filter((c) => c !== col)
    );
  };

  const handleShowAll = () => {
    setLocalVisibility(Object.fromEntries(columns.map((c) => [c, true])));
    // Append newly-shown cols at the end, preserving existing order
    setLocalOrder((prev) => {
      const existing = new Set(prev);
      return [...prev, ...columns.filter((c) => !existing.has(c))];
    });
  };

  const handleHideAll = () => {
    setLocalVisibility(Object.fromEntries(columns.map((c) => [c, false])));
    setLocalOrder([]);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = index;
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
    const ghost = document.createElement("div");
    ghost.style.position = "absolute";
    ghost.style.top = "-9999px";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragEnter = (index: number) => {
    dragOver.current = index;
    setOverIndex(index);
  };

  const handleDragEnd = () => {
    if (
      dragItem.current !== null &&
      dragOver.current !== null &&
      dragItem.current !== dragOver.current
    ) {
      const next = [...localOrder];
      const [moved] = next.splice(dragItem.current, 1);
      next.splice(dragOver.current, 0, moved);
      setLocalOrder(next);
    }
    dragItem.current = null;
    dragOver.current = null;
    setDraggingIndex(null);
    setOverIndex(null);
  };

  const handleApply = () => {
    Object.entries(localVisibility).forEach(([col, v]) => onChange(col, v));
    const hidden = columns.filter((c) => localVisibility[c] === false);
    onReorder([...localOrder, ...hidden]);
    onClose();
  };

  const filtered = search.trim()
    ? columns.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    : columns;

  const selectedCount = localOrder.length;

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Columns3 className="h-4 w-4 text-muted-foreground" />
            Configure Columns
          </DialogTitle>
          <DialogDescription className="text-xs">
            Check columns to show them · drag on the right to reorder
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[420px]">
          {/* ── Left: All columns (select) ── */}
          <div className="flex flex-col w-1/2 border-r border-border">
            {/* Left header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                All columns
              </span>
              <div className="flex gap-2 text-[11px]">
                <button
                  onClick={handleShowAll}
                  className="text-primary hover:underline"
                >
                  All
                </button>
                <button
                  onClick={handleHideAll}
                  className="text-muted-foreground hover:underline"
                >
                  None
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-3 py-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input
                  className="w-full rounded-md border border-border bg-background pl-8 pr-7 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
                {search && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setSearch("")}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Column list */}
            <div className="flex-1 overflow-y-auto p-2">
              {filtered.map((col) => {
                const isVisible = localVisibility[col] !== false;
                return (
                  <div
                    key={col}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer group"
                    onClick={() => handleToggle(col)}
                  >
                    <div
                      className={`h-3.5 w-3.5 shrink-0 rounded-sm border flex items-center justify-center transition-colors ${
                        isVisible
                          ? "border-primary bg-primary"
                          : "border-border group-hover:border-muted-foreground/40"
                      }`}
                    >
                      {isVisible && (
                        <svg
                          viewBox="0 0 10 8"
                          fill="none"
                          className="w-2.5 h-2.5"
                        >
                          <path
                            d="M1 4l3 3 5-6"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-xs truncate transition-colors ${
                        isVisible
                          ? "text-foreground/80"
                          : "text-muted-foreground/50"
                      }`}
                    >
                      {col}
                    </span>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-xs text-muted-foreground/40 text-center py-8">
                  No columns found
                </p>
              )}
            </div>
          </div>

          {/* ── Right: Selected columns (arrange) ── */}
          <div className="flex flex-col w-1/2">
            {/* Right header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Display order
              </span>
              <span className="text-[11px] text-muted-foreground">
                {selectedCount} selected
              </span>
            </div>

            {/* Drag list */}
            <div className="flex-1 overflow-y-auto p-2">
              {localOrder.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
                  <Columns3 className="h-6 w-6 text-muted-foreground/20" />
                  <p className="text-xs text-muted-foreground/40">
                    Check columns on the left to add them here
                  </p>
                </div>
              ) : (
                localOrder.map((col, i) => {
                  const isDragging = draggingIndex === i;
                  const isOver = overIndex === i && draggingIndex !== i;
                  return (
                    <div
                      key={col}
                      draggable
                      onDragStart={(e) => handleDragStart(e, i)}
                      onDragEnter={() => handleDragEnter(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnd={handleDragEnd}
                      className={`
                        flex items-center gap-2 px-2 py-1.5 rounded-md select-none transition-all duration-100
                        ${isDragging ? "opacity-30" : "opacity-100"}
                        ${
                          isOver
                            ? "bg-primary/8 border border-primary/30"
                            : "border border-transparent hover:bg-muted/50"
                        }
                      `}
                    >
                      <span className="text-[10px] font-mono w-4 text-right text-muted-foreground/30 shrink-0">
                        {i + 1}
                      </span>
                      <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing" />
                      <span className="text-xs text-foreground/80 flex-1 truncate">
                        {col}
                      </span>
                      {/* Remove button */}
                      <button
                        className="shrink-0 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(col);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Data Table ───────────────────────────────────────────────────────────────

const DataTable = React.memo(function DataTable({
  rows,
  columns,
  visibleCols,
  selectedIds,
  onToggleRow,
  onToggleAll,
  sort,
  onSort,
  allFilteredSelected,
}: {
  rows: Row[];
  columns: string[];
  visibleCols: ColVisibility;
  selectedIds: Set<number>;
  onToggleRow: (id: number) => void;
  onToggleAll: () => void;
  sort: SortState;
  onSort: (col: string) => void;
  allFilteredSelected: boolean;
}) {
  const visibleColumns = columns.filter((c) => visibleCols[c] !== false);
  const someSelected = rows.some((r) => selectedIds.has(r.__id));

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              <th
                className="w-10 px-3 py-2.5 text-center cursor-pointer"
                onClick={onToggleAll}
              >
                {allFilteredSelected ? (
                  <CheckSquare className="h-3.5 w-3.5 text-primary mx-auto" />
                ) : someSelected ? (
                  <Minus className="h-3.5 w-3.5 text-primary mx-auto" />
                ) : (
                  <Square className="h-3.5 w-3.5 text-muted-foreground/40 mx-auto" />
                )}
              </th>
              <th className="w-12 px-2 py-2.5 text-right font-medium text-muted-foreground/30 select-none">
                #
              </th>
              {visibleColumns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2.5 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                  onClick={() => onSort(col)}
                >
                  <span className="flex items-center gap-1">
                    {col}
                    {sort.col === col ? (
                      sort.dir === "asc" ? (
                        <ChevronUp className="h-3 w-3 shrink-0" />
                      ) : (
                        <ChevronDown className="h-3 w-3 shrink-0" />
                      )
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isSelected = selectedIds.has(row.__id);
              return (
                <tr
                  key={row.__id}
                  onClick={() => onToggleRow(row.__id)}
                  className={`border-b border-border/40 cursor-pointer transition-colors duration-100 ${
                    isSelected
                      ? "bg-primary/10 hover:bg-primary/[0.13]"
                      : i % 2 === 0
                      ? "hover:bg-muted/50"
                      : "bg-muted/20 hover:bg-muted/50"
                  }`}
                >
                  <td className="px-3 py-2 text-center">
                    {isSelected ? (
                      <CheckSquare className="h-3.5 w-3.5 text-primary mx-auto" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-muted-foreground/25 mx-auto" />
                    )}
                  </td>
                  <td
                    className="px-2 py-2 text-right font-mono text-muted-foreground/25 select-none"
                    style={{ fontSize: 10 }}
                  >
                    {row.__id + 1}
                  </td>
                  {visibleColumns.map((col) => (
                    <td
                      key={col}
                      className={`px-3 py-2 whitespace-nowrap max-w-[220px] truncate transition-colors duration-100 ${
                        isSelected ? "text-foreground" : "text-foreground/70"
                      }`}
                      title={String(row[col] ?? "")}
                    >
                      {String(row[col] ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={visibleColumns.length + 2}
                  className="py-14 text-center text-xs text-muted-foreground/40"
                >
                  No rows match your search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
          <DialogDescription className="text-xs">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SpreadsheetAutomationPage() {
  const { setOpen } = useSidebar();
  const [rows, setRows] = useState<Row[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [colVisibility, setColVisibility] = useState<ColVisibility>({});
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sort, setSort] = useState<SortState>({ col: null, dir: null });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [dateRangeFilters, setDateRangeFilters] = useState<DateRangeFilters>(
    {}
  );
  const [showColDialog, setShowColDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // ── Header picker state ──
  const [rawSheetData, setRawSheetData] = useState<string[][]>([]);
  const [showHeaderPicker, setShowHeaderPicker] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const hasData = rows.length > 0;

  // ── Phase 1: Read file raw, open header picker ──
  const parseFile = useCallback((file: File) => {
    setIsLoading(true);
    setProgress(0);
    setSelectedIds(new Set());
    setSort({ col: null, dir: null });
    setSearch("");
    setPage(1);

    let tick = 0;
    const interval = setInterval(() => {
      tick += Math.random() * 14 + 6;
      setProgress(Math.min(85, Math.floor(tick)));
    }, 130);

    const reader = new FileReader();
    reader.onload = (e) => {
      clearInterval(interval);
      setProgress(92);
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Read as raw array-of-arrays — no header assumption yet
        const raw = XLSX.utils.sheet_to_json<string[]>(worksheet, {
          header: 1,
          defval: "",
          raw: false,
        }) as string[][];

        setRawSheetData(raw);
        setPendingFile(file);
        setProgress(100);

        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
          setShowHeaderPicker(true);
        }, 350);
      } catch (err) {
        console.error(err);
        clearInterval(interval);
        setIsLoading(false);
        setProgress(0);
        toast.error("Failed to read file", {
          description: "Make sure it's a valid .xlsx, .xls, or .csv file.",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // ── Phase 2: User confirmed header row — slice and commit ──
  const commitWithHeaderRow = useCallback(
    (headerRowIndex: number) => {
      if (!rawSheetData.length || !pendingFile) return;

      const headerRow = rawSheetData[headerRowIndex];
      const dataRows = rawSheetData.slice(headerRowIndex + 1);

      // Deduplicate column names
      const colCounts: Record<string, number> = {};
      const cols = headerRow.map((h) => {
        const key = String(h ?? "").trim() || "Column";
        colCounts[key] = (colCounts[key] ?? 0) + 1;
        return colCounts[key] > 1 ? `${key}_${colCounts[key]}` : key;
      });

      const tagged: Row[] = dataRows
        .filter((r) => r.some((cell) => String(cell ?? "").trim() !== "")) // skip blank rows
        .map((r, i) => {
          const obj: Row = { __id: i };
          cols.forEach((col, ci) => {
            obj[col] = r[ci] ?? "";
          });
          return obj;
        });

      setColumns(cols);
      setRows(tagged);
      setColVisibility(Object.fromEntries(cols.map((c) => [c, true])));
      setFileName(pendingFile.name);
      setSelectedIds(new Set());
      setSort({ col: null, dir: null });
      setSearch("");
      setPage(1);
      setActiveFilters({});
      setDateRangeFilters({});
      setShowHeaderPicker(false);
      setShowColDialog(true);
      setShowFilterPanel(false);
      setOpen(false);

      toast.success("File imported successfully", {
        description: `${tagged.length.toLocaleString()} rows · ${
          cols.length
        } columns · "${pendingFile.name}"`,
      });
    },
    [rawSheetData, pendingFile, setOpen]
  );

  // ── Sort ──
  const handleSort = useCallback((col: string) => {
    setSort((prev) => {
      if (prev.col !== col) return { col, dir: "asc" };
      if (prev.dir === "asc") return { col, dir: "desc" };
      return { col: null, dir: null };
    });
    setPage(1);
  }, []);

  // ── Processed rows ──
  const processedRows = useMemo(() => {
    let result = rows;
    // Column value filters
    const filterEntries = Object.entries(activeFilters).filter(
      ([, vals]) => vals.size > 0
    );
    if (filterEntries.length > 0) {
      result = result.filter((row) =>
        filterEntries.every(([col, vals]) => vals.has(String(row[col] ?? "")))
      );
    }
    // Date range filters
    const dateEntries = Object.entries(dateRangeFilters).filter(
      ([, r]) => r.from || r.to
    );
    if (dateEntries.length > 0) {
      result = result.filter((row) =>
        dateEntries.every(([col, range]) => {
          const cellDate = parseDate(String(row[col] ?? ""));
          if (!cellDate) return false;
          const from = inputToDate(range.from);
          const to = inputToDate(range.to);
          if (from && cellDate < from) return false;
          if (to && cellDate > to) return false;
          return true;
        })
      );
    }
    // Global search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) =>
          String(row[col] ?? "")
            .toLowerCase()
            .includes(q)
        )
      );
    }
    // Sort
    if (sort.col && sort.dir) {
      const col = sort.col;
      const dir = sort.dir === "asc" ? 1 : -1;
      result = [...result].sort((a, b) => {
        const av = String(a[col] ?? ""),
          bv = String(b[col] ?? "");
        const an = parseFloat(av),
          bn = parseFloat(bv);
        if (!isNaN(an) && !isNaN(bn)) return (an - bn) * dir;
        return av.localeCompare(bv) * dir;
      });
    }
    return result;
  }, [rows, columns, search, sort, activeFilters, dateRangeFilters]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(processedRows.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const pagedRows = processedRows.slice(
    (clampedPage - 1) * PAGE_SIZE,
    clampedPage * PAGE_SIZE
  );

  // ── Selection ──
  const toggleRow = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const allFilteredIds = useMemo(
    () => processedRows.map((r) => r.__id),
    [processedRows]
  );
  const allFilteredSelected = useMemo(
    () =>
      allFilteredIds.length > 0 &&
      allFilteredIds.every((id) => selectedIds.has(id)),
    [allFilteredIds, selectedIds]
  );

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allIds = allFilteredIds;
      const allSelected =
        allIds.length > 0 && allIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        allIds.forEach((id) => next.delete(id));
      } else {
        allIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [allFilteredIds]);

  // ── Export ──
  const handleExport = async (config: ExportConfig) => {
    const visibleColumns = columns.filter((c) => colVisibility[c] !== false);
    const selectedRows = rows
      .filter((r) => selectedIds.has(r.__id))
      .map((r) => Object.fromEntries(visibleColumns.map((c) => [c, r[c]])));

    // Returns raw file bytes (not triggers a download) — used for zip building
    const buildFileBytes = (
      data: Record<string, unknown>[]
    ): Uint8Array | string => {
      const ws = XLSX.utils.json_to_sheet(data);
      if (config.format === "xlsx") {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Export");
        return XLSX.write(wb, {
          bookType: "xlsx",
          type: "array",
        }) as Uint8Array;
      } else {
        const delim = config.format === "tsv" ? "\t" : ",";
        return XLSX.utils.sheet_to_csv(ws, { FS: delim });
      }
    };

    // Triggers an immediate browser download for a single file
    const downloadFile = (data: Record<string, unknown>[], name: string) => {
      const ws = XLSX.utils.json_to_sheet(data);
      if (config.format === "xlsx") {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Export");
        XLSX.writeFile(wb, `${name}.xlsx`);
      } else {
        const delim = config.format === "tsv" ? "\t" : ",";
        const csv = XLSX.utils.sheet_to_csv(ws, { FS: delim });
        const blob = new Blob([csv], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${name}.${config.format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    };

    if (config.mode === "single") {
      downloadFile(selectedRows, config.fileName || `export_${Date.now()}`);
      toast.success("Export complete", {
        description: `${selectedRows.length} row${
          selectedRows.length !== 1 ? "s" : ""
        } saved as "${config.fileName}.${config.format}"`,
      });
    } else if (selectedRows.length > ZIP_THRESHOLD) {
      // ── Batch zip export ──
      const zip = new JSZip();
      const usedNames = new Map<string, number>();

      selectedRows.forEach((row, i) => {
        const rawName = config.fileNameCol
          ? String(row[config.fileNameCol] ?? `row_${i + 1}`)
          : `row_${i + 1}`;
        const safeName = rawName.replace(/[\\/:*?"<>|]/g, "_");

        // Deduplicate filenames within the zip (e.g. two rows with same value)
        const count = usedNames.get(safeName) ?? 0;
        usedNames.set(safeName, count + 1);
        const uniqueName = count === 0 ? safeName : `${safeName}_${count + 1}`;

        const bytes = buildFileBytes([row]);
        zip.file(`${uniqueName}.${config.format}`, bytes);
      });

      try {
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${config.zipFileName || "export"}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Export complete", {
          description: `${selectedRows.length} files zipped as "${config.zipFileName}.zip"`,
        });
      } catch {
        toast.error("Zip failed", {
          description: "Something went wrong while creating the zip file.",
        });
      }
    } else {
      // ── Individual downloads (≤ ZIP_THRESHOLD) ──
      selectedRows.forEach((row, i) => {
        const nameVal = config.fileNameCol
          ? String(row[config.fileNameCol] ?? `row_${i + 1}`)
          : `row_${i + 1}`;
        const safeName = nameVal.replace(/[\\/:*?"<>|]/g, "_");
        setTimeout(() => downloadFile([row], safeName), i * 80);
      });
      toast.success("Export complete", {
        description: `${selectedRows.length} files downloading.`,
      });
    }
  };

  const resetData = () => {
    setRows([]);
    setColumns([]);
    setFileName(null);
    setSelectedIds(new Set());
    setSearch("");
    setPage(1);
    setActiveFilters({});
    setShowFilterPanel(false);
    setDateRangeFilters({});
    setRawSheetData([]);
    setPendingFile(null);
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="flex w-full flex-col h-full">
      <div className="w-full flex flex-col gap-4 rounded-xl border border-border bg-card p-6 h-full">
        {/* ── Header ── */}
        <div className="flex items-start justify-between shrink-0">
          <div>
            <h1 className="text-base font-semibold text-foreground">
              Spreadsheet Import Tool
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Import hospital data files, configure columns, and export selected
              rows
            </p>
          </div>

          {hasData && (
            <div className="flex items-center gap-2">
              {/* File info pill */}
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
                <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
                <span className="font-mono max-w-[140px] truncate">
                  {fileName}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span>{rows.length.toLocaleString()} rows</span>
              </div>

              {/* Divider */}
              <div className="h-5 w-px bg-border" />

              {/* Column config */}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => setShowColDialog(true)}
              >
                <Columns3 className="h-3.5 w-3.5" />
                Columns
              </Button>

              {/* Filters */}
              <Button
                variant={showFilterPanel ? "secondary" : "outline"}
                size="sm"
                className="gap-1.5 text-xs h-8 relative"
                onClick={() => setShowFilterPanel((v) => !v)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {Object.keys(activeFilters).length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                    {Object.keys(activeFilters).length}
                  </span>
                )}
              </Button>

              {/* Replace */}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => setShowReplaceConfirm(true)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Replace
              </Button>

              {/* Divider */}
              <div className="h-5 w-px bg-border" />

              {/* Clear selection */}
              {selectedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs h-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowClearConfirm(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear ({selectedCount})
                </Button>
              )}

              {/* Export */}
              <Button
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => setShowExportDialog(true)}
                disabled={selectedCount === 0}
              >
                <Download className="h-3.5 w-3.5" />
                Export{selectedCount > 0 ? ` ${selectedCount}` : ""}
              </Button>
            </div>
          )}
        </div>

        {/* ── Upload ── */}
        {!hasData && (
          <UploadZone
            onFile={parseFile}
            progress={progress}
            isLoading={isLoading}
          />
        )}

        {/* ── Data view ── */}
        {hasData && (
          <div className="flex flex-col flex-1 min-h-0 gap-3">
            {/* Search bar */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input
                  className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Search all columns…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                {search && (
                  <button
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              <span className="text-xs text-muted-foreground ml-auto">
                {processedRows.length.toLocaleString()} row
                {processedRows.length !== 1 ? "s" : ""}
                {(search ||
                  Object.keys(activeFilters).length > 0 ||
                  Object.keys(dateRangeFilters).length > 0) &&
                  " (filtered)"}
              </span>
            </div>

            {/* Active filter chips */}
            {(Object.keys(activeFilters).length > 0 ||
              Object.keys(dateRangeFilters).length > 0) && (
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {Object.entries(activeFilters).map(([col, vals]) => (
                  <div
                    key={col}
                    className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 pl-2.5 pr-1.5 py-0.5 text-[11px] text-primary"
                  >
                    <span className="font-medium">{col}:</span>
                    <span className="text-primary/70">
                      {vals.size === 1
                        ? Array.from(vals)[0] || "empty"
                        : `${vals.size} values`}
                    </span>
                    <button
                      className="ml-0.5 hover:text-primary/50"
                      onClick={() => {
                        const next = { ...activeFilters };
                        delete next[col];
                        setActiveFilters(next);
                        setPage(1);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {Object.entries(dateRangeFilters).map(([col, range]) => (
                  <div
                    key={col}
                    className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 pl-2.5 pr-1.5 py-0.5 text-[11px] text-primary"
                  >
                    <span className="font-medium">{col}:</span>
                    <span className="text-primary/70">
                      {range.from && range.to
                        ? `${range.from} → ${range.to}`
                        : range.from
                        ? `from ${range.from}`
                        : `until ${range.to}`}
                    </span>
                    <button
                      className="ml-0.5 hover:text-primary/50"
                      onClick={() => {
                        const next = { ...dateRangeFilters };
                        delete next[col];
                        setDateRangeFilters(next);
                        setPage(1);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  className="text-[11px] text-muted-foreground hover:text-foreground hover:underline px-1"
                  onClick={() => {
                    setActiveFilters({});
                    setDateRangeFilters({});
                    setPage(1);
                  }}
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Table + filter panel side by side */}
            <div className="flex flex-col flex-1 min-h-0 gap-3">
              {/* Table */}
              <div className="flex-1 min-h-0 overflow-auto">
                <DataTable
                  rows={pagedRows}
                  columns={columns}
                  visibleCols={colVisibility}
                  selectedIds={selectedIds}
                  onToggleRow={toggleRow}
                  onToggleAll={toggleAll}
                  sort={sort}
                  onSort={handleSort}
                  allFilteredSelected={allFilteredSelected}
                />
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between shrink-0 text-xs text-muted-foreground pt-0.5">
                <span>
                  Page {clampedPage} of {totalPages} ·{" "}
                  {(clampedPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(clampedPage * PAGE_SIZE, processedRows.length)} of{" "}
                  {processedRows.length.toLocaleString()}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={clampedPage <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 5) p = i + 1;
                    else if (clampedPage <= 3) p = i + 1;
                    else if (clampedPage >= totalPages - 2)
                      p = totalPages - 4 + i;
                    else p = clampedPage - 2 + i;
                    return (
                      <Button
                        key={p}
                        variant={p === clampedPage ? "default" : "outline"}
                        size="sm"
                        className="h-7 w-7 p-0 text-xs"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={clampedPage >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Dialogs ── */}

      {/* Header Row Picker — shown after file is read, before data is committed */}
      <HeaderPickerDialog
        key={rawSheetData.length + rawSheetData[0]?.join("")}
        open={showHeaderPicker}
        rawData={rawSheetData}
        onConfirm={commitWithHeaderRow}
        onClose={() => {
          setShowHeaderPicker(false);
          setIsLoading(false);
          setPendingFile(null);
          setRawSheetData([]);
        }}
      />

      <FilterDrawer
        open={showFilterPanel}
        columns={columns}
        visibleCols={colVisibility}
        rows={rows}
        activeFilters={activeFilters}
        onFiltersChange={(f) => {
          setActiveFilters(f);
          setPage(1);
        }}
        dateRangeFilters={dateRangeFilters}
        onDateRangeChange={(f) => {
          setDateRangeFilters(f);
          setPage(1);
        }}
        onClose={() => setShowFilterPanel(false)}
      />
      <ColumnDialog
        open={showColDialog}
        columns={columns}
        visibility={colVisibility}
        onChange={(col, v) =>
          setColVisibility((prev) => ({ ...prev, [col]: v }))
        }
        onReorder={(newOrder) => setColumns(newOrder)}
        onClose={() => setShowColDialog(false)}
      />

      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        columns={columns}
        selectedCount={selectedCount}
      />

      <ConfirmDialog
        open={showClearConfirm}
        title="Clear selection?"
        description={`This will deselect all ${selectedCount} selected rows.`}
        onConfirm={() => setSelectedIds(new Set())}
        onClose={() => setShowClearConfirm(false)}
      />

      <ConfirmDialog
        open={showReplaceConfirm}
        title="Replace file?"
        description="This will clear all current data and selection. You'll be prompted to upload a new file."
        onConfirm={resetData}
        onClose={() => setShowReplaceConfirm(false)}
      />
    </div>
  );
}
