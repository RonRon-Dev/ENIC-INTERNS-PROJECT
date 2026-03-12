// ─── useSpreadsheetData ───────────────────────────────────────────────────────
// Thin message-passing shell. ALL data lives in the worker.
// Main thread only holds: paged rows, column names, UI state.
// No full Row[] ever crosses the thread boundary after COMMIT.

import type {
  ActiveFilters,
  ColTypes,
  ColVisibility,
  ColumnType,
  DateRangeFilters,
  ExportConfig,
  Row,
  SortState,
} from "@/types/spreadsheet";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const DEFAULT_PAGE_SIZE = 12;
export const PAGE_SIZE_OPTIONS = [12, 25, 50, 100];
export const ZIP_THRESHOLD = 5;

// File size threshold for soft warning
const FILE_SIZE_WARN_MB = 20;

// Increased debounce — reduces filter thrashing on low-RAM machines
const SEARCH_DEBOUNCE_MS = 500;

interface QueryMsg {
  type: "QUERY";
  search: string;
  filters: Record<string, string[]>;
  dateFilters: Record<string, { from: string; to: string }>;
  sort: SortState;
  page: number;
  pageSize?: number;
}

export function useSpreadsheetData() {
  const workerRef = useRef<Worker | null>(null);

  const [columns, setColumns] = useState<string[]>([]);
  const [colVisibility, setColVisibility] = useState<ColVisibility>({});
  const [colTypes, setColTypesState] = useState<ColTypes>({});
  const [detectedTypes, setDetectedTypes] = useState<ColTypes>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);
  const [rowsReady, setRowsReady] = useState(false);

  const [rawSheetData, setRawSheetData] = useState<string[][]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showHeaderPicker, setShowHeaderPicker] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState("Reading file");

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [dateRangeFilters, setDateRangeFilters] = useState<DateRangeFilters>(
    {}
  );
  const [sort, setSort] = useState<SortState>({ col: null, dir: null });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [searchInput, setSearchInput] = useState("");
  const [searchCommitted, setSearchCommitted] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [pagedRows, setPagedRows] = useState<Row[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [clampedPage, setClampedPage] = useState(1);

  const [selectedCount, setSelectedCount] = useState(0);
  const [allFilteredSelected, setAllFilteredSelected] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const lastQueryRef = useRef<QueryMsg | null>(null);

  // ── Spawn worker ──────────────────────────────────────────────────────────
  const spawnWorker = useCallback(() => {
    if (workerRef.current) workerRef.current.terminate();
    const worker = new Worker(
      new URL("../workers/spreadsheet.worker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (e) => {
      const msg = e.data;

      if (msg.type === "PREVIEW") {
        setProgress(100);
        setRawSheetData(msg.rows);
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
          setLoadingPhase("Reading file");
          setShowHeaderPicker(true);
        }, 350);
      } else if (msg.type === "READY") {
        setColumns(msg.cols);
        setColVisibility(
          Object.fromEntries(
            (msg.cols as string[]).map((c: string) => [c, true])
          )
        );
        setDetectedTypes(msg.detectedTypes ?? {});
        setTotalRows(msg.totalRows);
        setHasData(true);
        setIsLoading(false);
        setProgress(0);
        setLoadingPhase("Reading file");
        const q: QueryMsg = {
          type: "QUERY",
          search: "",
          filters: {},
          dateFilters: {},
          sort: { col: null, dir: null },
          page: 1,
          pageSize: DEFAULT_PAGE_SIZE,
        };
        lastQueryRef.current = q;
        worker.postMessage(q);
      } else if (msg.type === "PROGRESS") {
        setLoadingPhase(msg.phase ?? "Processing rows");
        setProgress(msg.pct ?? 0);
      } else if (msg.type === "SIZE_WARNING") {
        toast.warning(`Large file detected (${msg.sizeMB} MB)`, {
          description:
            "Processing may take longer on devices with limited memory. Consider splitting the file if it becomes unresponsive.",
          duration: 8000,
        });
      } else if (msg.type === "ROW_CAP") {
        toast.warning(
          `Row limit reached — showing first ${msg.capped.toLocaleString()} rows`,
          {
            description: `The file contains more than ${msg.capped.toLocaleString()} rows. Split the file into smaller parts to load the rest.`,
            duration: 10000,
          }
        );
      } else if (msg.type === "RESULT") {
        setPagedRows(msg.pagedRows);
        setProcessedCount(msg.processedCount);
        setTotalPages(msg.totalPages);
        setClampedPage(msg.clampedPage);
        setAllFilteredSelected(msg.allFilteredSelected);
        setSelectedCount(msg.selectedCount);
        setSelectedIds((prev) => {
          const next = new Set<number>();
          (msg.pagedRows as Row[]).forEach((r) => {
            if (prev.has(r.__id) || msg.allFilteredSelected) next.add(r.__id);
          });
          return next;
        });
        setIsFiltering(false);
      } else if (msg.type === "SELECTION") {
        setSelectedCount(msg.selectedCount);
        if (lastQueryRef.current) worker.postMessage(lastQueryRef.current);
      } else if (msg.type === "RETYPE_DONE") {
        if (lastQueryRef.current) worker.postMessage(lastQueryRef.current);
      } else if (msg.type === "EXPORT_DONE") {
        setIsExporting(false);
        if (msg.kind === "file" || msg.kind === "zip") {
          const a = document.createElement("a");
          a.href = msg.url;
          a.download = msg.fileName;
          a.click();
          URL.revokeObjectURL(msg.url);
        } else if (msg.kind === "files") {
          (msg.files as { url: string; fileName: string }[]).forEach(
            ({ url, fileName }, i) => {
              setTimeout(() => {
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName;
                a.click();
                URL.revokeObjectURL(url);
              }, i * 80);
            }
          );
        }
        toast.success("Export complete", { description: msg.description });
      } else if (msg.type === "EXPORT_ERROR") {
        setIsExporting(false);
        toast.error("Export failed", { description: msg.message });
      } else if (msg.type === "ERROR") {
        setIsLoading(false);
        setProgress(0);
        setLoadingPhase("Reading file");
        toast.error("Error", { description: msg.message });
      }
    };

    worker.onerror = (err) => {
      setIsLoading(false);
      setProgress(0);
      setLoadingPhase("Reading file");
      toast.error("Worker error", { description: err.message });
    };

    workerRef.current = worker;
    return worker;
  }, []);

  const sendQuery = useCallback((q: QueryMsg) => {
    lastQueryRef.current = q;
    workerRef.current?.postMessage(q);
  }, []);

  // ── Parse file ────────────────────────────────────────────────────────────
  const parseFile = useCallback(
    (file: File) => {
      // Soft warning for large files
      const sizeMB = file.size / 1024 / 1024;
      if (sizeMB > FILE_SIZE_WARN_MB) {
        toast.warning(`Large file (${sizeMB.toFixed(1)} MB)`, {
          description: "This may take a while on devices with limited RAM.",
          duration: 6000,
        });
      }

      setIsLoading(true);
      setProgress(0);
      setLoadingPhase("Reading file");
      setHasData(false);
      setRowsReady(false);
      setSelectedIds(new Set());
      setSelectedCount(0);
      setSort({ col: null, dir: null });
      setSearchInput("");
      setSearchCommitted("");
      setPage(1);
      setPageSizeState(DEFAULT_PAGE_SIZE);
      setActiveFilters({});
      setDateRangeFilters({});
      setColTypesState({});
      setDetectedTypes({});

      const worker = spawnWorker();

      let tick = 0;
      const interval = setInterval(() => {
        tick += Math.random() * 14 + 6;
        setProgress(Math.min(82, Math.floor(tick)));
      }, 130);

      const reader = new FileReader();
      reader.onload = (ev) => {
        clearInterval(interval);
        setProgress(90);
        const buffer = ev.target!.result as ArrayBuffer;
        // KEY CHANGE: pass fileName so worker can pick CSV vs XLSX path
        worker.postMessage({ type: "PARSE", buffer, fileName: file.name }, [
          buffer,
        ]);
      };
      reader.onerror = () => {
        clearInterval(interval);
        setIsLoading(false);
        setProgress(0);
        toast.error("Failed to read file");
      };
      reader.readAsArrayBuffer(file);
      setPendingFile(file);
    },
    [spawnWorker]
  );

  // ── Commit header row ─────────────────────────────────────────────────────
  const commitWithHeaderRow = useCallback(
    (headerRowIndex: number, onSuccess?: () => void) => {
      if (!workerRef.current || !pendingFile) return;
      setShowHeaderPicker(false);
      setIsLoading(true);
      setProgress(0);
      setLoadingPhase("Processing rows");
      setFileName(pendingFile.name);

      const originalOnMessage = workerRef.current.onmessage!;
      workerRef.current.onmessage = (e) => {
        if (e.data.type === "READY") {
          toast.success("File imported", {
            description: `${(
              e.data.totalRows as number
            ).toLocaleString()} rows · ${
              (e.data.cols as string[]).length
            } columns · "${pendingFile.name}"`,
          });
          onSuccess?.();
          if (workerRef.current)
            workerRef.current.onmessage = originalOnMessage;
        }
        originalOnMessage.call(workerRef.current!, e);
      };

      workerRef.current.postMessage({ type: "COMMIT", headerRowIndex });
    },
    [pendingFile]
  );

  // ── Dismiss header picker ─────────────────────────────────────────────────
  const dismissHeaderPicker = useCallback(() => {
    setShowHeaderPicker(false);
    setIsLoading(false);
    setPendingFile(null);
    setRawSheetData([]);
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  // ── Build query ───────────────────────────────────────────────────────────
  const buildQuery = useCallback(
    (overrides: Partial<QueryMsg> = {}): QueryMsg => ({
      type: "QUERY",
      search: searchCommitted,
      filters: Object.fromEntries(
        Object.entries(activeFilters).map(([k, v]) => [k, [...v]])
      ),
      dateFilters: dateRangeFilters,
      sort,
      page,
      pageSize,
      ...overrides,
    }),
    [searchCommitted, activeFilters, dateRangeFilters, sort, page, pageSize]
  );

  useEffect(() => {
    if (!hasData) return;
    sendQuery(buildQuery());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasData,
    searchCommitted,
    activeFilters,
    dateRangeFilters,
    sort,
    page,
    pageSize,
  ]);

  // ── Sort ──────────────────────────────────────────────────────────────────
  const handleSort = useCallback((col: string) => {
    setSort((prev) => {
      if (prev.col !== col) return { col, dir: "asc" };
      if (prev.dir === "asc") return { col, dir: "desc" };
      return { col: null, dir: null };
    });
    setPage(1);
  }, []);

  // ── Search (500ms debounce) ───────────────────────────────────────────────
  const updateSearch = useCallback((val: string) => {
    setSearchInput(val);
    setIsFiltering(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchCommitted(val);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  // ── Filters ───────────────────────────────────────────────────────────────
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

  // ── Column visibility ─────────────────────────────────────────────────────
  const setColVisible = useCallback((col: string, visible: boolean) => {
    setColVisibility((prev) => ({ ...prev, [col]: visible }));
  }, []);

  // ── Column type ───────────────────────────────────────────────────────────
  const setColType = useCallback((col: string, type: ColumnType) => {
    setColTypesState((prev) => ({ ...prev, [col]: type }));
    workerRef.current?.postMessage({
      type: "RETYPE",
      colTypes: { [col]: type },
    });
  }, []);

  // ── Page size ─────────────────────────────────────────────────────────────
  const setPageSize = useCallback((ps: number) => {
    setPageSizeState(ps);
    setPage(1);
  }, []);

  // ── Selection ─────────────────────────────────────────────────────────────
  const toggleRow = useCallback((id: number) => {
    workerRef.current?.postMessage({ type: "SELECT", mode: "toggle", id });
  }, []);

  const toggleAll = useCallback(
    (select: boolean) => {
      const q = buildQuery();
      workerRef.current?.postMessage({
        type: "SELECT",
        mode: select ? "all_query" : "deselect_query",
        query: q,
      });
    },
    [buildQuery]
  );

  const clearSelection = useCallback(() => {
    workerRef.current?.postMessage({ type: "SELECT", mode: "clear" });
  }, []);

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = useCallback(
    (config: ExportConfig, visibleCols: string[]) => {
      if (!workerRef.current) return;
      setIsExporting(true);
      workerRef.current.postMessage({ type: "EXPORT", config, visibleCols });
    },
    []
  );

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetData = useCallback(() => {
    workerRef.current?.postMessage({ type: "RESET" });
    workerRef.current?.terminate();
    workerRef.current = null;
    setIsExporting(false);
    setColumns([]);
    setColVisibility({});
    setColTypesState({});
    setDetectedTypes({});
    setFileName(null);
    setHasData(false);
    setRowsReady(false);
    setRawSheetData([]);
    setPendingFile(null);
    setSelectedIds(new Set());
    setSelectedCount(0);
    setSearchInput("");
    setSearchCommitted("");
    setPage(1);
    setPageSizeState(DEFAULT_PAGE_SIZE);
    setActiveFilters({});
    setDateRangeFilters({});
    setPagedRows([]);
    setProcessedCount(0);
    setTotalRows(0);
    setLoadingPhase("Reading file");
  }, []);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      workerRef.current?.terminate();
    };
  }, []);

  return {
    rows: pagedRows,
    columns,
    setColumns,
    colVisibility,
    setColVisible,
    colTypes,
    setColType,
    detectedTypes,
    fileName,
    hasData,
    totalRows,

    rawSheetData,
    pendingFile,
    showHeaderPicker,
    commitWithHeaderRow,
    dismissHeaderPicker,

    isLoading,
    progress,
    loadingPhase,

    activeFilters,
    updateActiveFilters,
    dateRangeFilters,
    updateDateRangeFilters,
    clearAllFilters,

    sort,
    handleSort,

    search: searchInput,
    searchCommitted,
    updateSearch,
    isFiltering,

    processedRows: pagedRows,
    processedCount,
    totalPages,
    clampedPage,
    pagedRows,
    page,
    setPage,
    pageSize,
    setPageSize,

    selectedIds,
    selectedCount,
    toggleRow,
    toggleAll,
    clearSelection,
    allFilteredSelected,

    rowsReady,
    setRowsReady,
    parseFile,
    isExporting,
    handleExport,
    resetData,
  };
}
  