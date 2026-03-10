// ─── useSpreadsheetData ───────────────────────────────────────────────────────
// Encapsulates all data logic for the spreadsheet tool.
// The page component owns no business logic — it only wires UI to this hook.

import type {
  ActiveFilters,
  ColVisibility,
  DateRangeFilters,
  ExportConfig,
  Row,
  SortState,
} from "@/types/spreadsheet";
import { inputToDate, parseDate } from "@/utils/dateUtils";
import JSZip from "jszip";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const PAGE_SIZE = 50;
const ZIP_THRESHOLD = 5;

export { PAGE_SIZE, ZIP_THRESHOLD };

export function useSpreadsheetData() {
  // ── Core data ──
  const [rows, setRows] = useState<Row[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [colVisibility, setColVisibility] = useState<ColVisibility>({});
  const [fileName, setFileName] = useState<string | null>(null);

  // ── Raw / pending (before header row is confirmed) ──
  const [rawSheetData, setRawSheetData] = useState<string[][]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showHeaderPicker, setShowHeaderPicker] = useState(false);

  // ── Loading ──
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // ── Filters / sort / search / pagination ──
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [dateRangeFilters, setDateRangeFilters] = useState<DateRangeFilters>(
    {}
  );
  const [sort, setSort] = useState<SortState>({ col: null, dir: null });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // ── Selection ──
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

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

  // ── Phase 2: User confirmed header row ──
  const commitWithHeaderRow = useCallback(
    (headerRowIndex: number, onSuccess?: () => void) => {
      if (!rawSheetData.length || !pendingFile) return;

      const headerRow = rawSheetData[headerRowIndex];
      const dataRows = rawSheetData.slice(headerRowIndex + 1);

      const colCounts: Record<string, number> = {};
      const cols = headerRow.map((h) => {
        const key = String(h ?? "").trim() || "Column";
        colCounts[key] = (colCounts[key] ?? 0) + 1;
        return colCounts[key] > 1 ? `${key}_${colCounts[key]}` : key;
      });

      const tagged: Row[] = dataRows
        .filter((r) => r.some((cell) => String(cell ?? "").trim() !== ""))
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

      toast.success("File imported successfully", {
        description: `${tagged.length.toLocaleString()} rows · ${
          cols.length
        } columns · "${pendingFile.name}"`,
      });

      onSuccess?.();
    },
    [rawSheetData, pendingFile]
  );

  const dismissHeaderPicker = useCallback(() => {
    setShowHeaderPicker(false);
    setIsLoading(false);
    setPendingFile(null);
    setRawSheetData([]);
  }, []);

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

    const filterEntries = Object.entries(activeFilters).filter(
      ([, vals]) => vals.size > 0
    );
    if (filterEntries.length > 0) {
      result = result.filter((row) =>
        filterEntries.every(([col, vals]) => vals.has(String(row[col] ?? "")))
      );
    }

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

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // ── Column visibility ──
  const setColVisible = useCallback((col: string, visible: boolean) => {
    setColVisibility((prev) => ({ ...prev, [col]: visible }));
  }, []);

  // ── Filters ──
  const updateActiveFilters = useCallback((f: ActiveFilters) => {
    setActiveFilters(f);
    setPage(1);
  }, []);

  const updateDateRangeFilters = useCallback((f: DateRangeFilters) => {
    setDateRangeFilters(f);
    setPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
    setDateRangeFilters({});
    setPage(1);
  }, []);

  const updateSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  // ── Export ──
  const handleExport = useCallback(
    async (config: ExportConfig) => {
      const visibleColumns = columns.filter((c) => colVisibility[c] !== false);
      const selectedRows = rows
        .filter((r) => selectedIds.has(r.__id))
        .map((r) => Object.fromEntries(visibleColumns.map((c) => [c, r[c]])));

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
        }
        const delim = config.format === "tsv" ? "\t" : ",";
        return XLSX.utils.sheet_to_csv(ws, { FS: delim });
      };

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
        const zip = new JSZip();
        const usedNames = new Map<string, number>();

        selectedRows.forEach((row, i) => {
          const rawName = config.fileNameCol
            ? String(row[config.fileNameCol] ?? `row_${i + 1}`)
            : `row_${i + 1}`;
          const safeName = rawName.replace(/[\\/:*?"<>|]/g, "_");
          const count = usedNames.get(safeName) ?? 0;
          usedNames.set(safeName, count + 1);
          const uniqueName =
            count === 0 ? safeName : `${safeName}_${count + 1}`;
          zip.file(`${uniqueName}.${config.format}`, buildFileBytes([row]));
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
    },
    [columns, colVisibility, rows, selectedIds]
  );

  // ── Reset ──
  const resetData = useCallback(() => {
    setRows([]);
    setColumns([]);
    setFileName(null);
    setSelectedIds(new Set());
    setSearch("");
    setPage(1);
    setActiveFilters({});
    setDateRangeFilters({});
    setRawSheetData([]);
    setPendingFile(null);
  }, []);

  return {
    // Data
    rows,
    columns,
    setColumns,
    colVisibility,
    setColVisible,
    fileName,
    hasData,

    // Raw / header picker
    rawSheetData,
    pendingFile,
    showHeaderPicker,
    commitWithHeaderRow,
    dismissHeaderPicker,

    // Loading
    isLoading,
    progress,

    // Filters
    activeFilters,
    updateActiveFilters,
    dateRangeFilters,
    updateDateRangeFilters,
    clearAllFilters,

    // Sort
    sort,
    handleSort,

    // Search
    search,
    updateSearch,

    // Processed / paginated
    processedRows,
    totalPages,
    clampedPage,
    pagedRows,
    page,
    setPage,

    // Selection
    selectedIds,
    selectedCount: selectedIds.size,
    toggleRow,
    toggleAll,
    clearSelection,
    allFilteredSelected,

    // Actions
    parseFile,
    handleExport,
    resetData,
  };
}
