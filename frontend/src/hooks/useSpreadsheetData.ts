// ─── useSpreadsheetData ───────────────────────────────────────────────────────
// Thin message-passing shell. ALL data lives in the worker.
// Main thread only holds: 50 displayed rows, column names, UI state.
// No full Row[] ever crosses the thread boundary after COMMIT.

import type {
  ActiveFilters,
  ColVisibility,
  DateRangeFilters,
  ExportConfig,
  Row,
  SortState,
} from "@/types/spreadsheet";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const PAGE_SIZE = 12;
export const ZIP_THRESHOLD = 5;

// ── Query state shape sent to worker ─────────────────────────────────────────
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
  // ── Worker ──
  const workerRef = useRef<Worker | null>(null);

  // ── UI-only state (never the full dataset) ──
  const [columns, setColumns] = useState<string[]>([]);
  const [colVisibility, setColVisibility] = useState<ColVisibility>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);
  const [rowsReady, setRowsReady] = useState(false);

  // Header picker
  const [rawSheetData, setRawSheetData] = useState<string[][]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showHeaderPicker, setShowHeaderPicker] = useState(false);

  // Loading
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Filter / sort / search / page — kept in hook so UI is driven by React state
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [dateRangeFilters, setDateRangeFilters] = useState<DateRangeFilters>(
    {}
  );
  const [sort, setSort] = useState<SortState>({ col: null, dir: null });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchCommitted, setSearchCommitted] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Query results — only the current page
  const [pagedRows, setPagedRows] = useState<Row[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [clampedPage, setClampedPage] = useState(1);

  // Selection — counts only, ids live in worker
  const [selectedCount, setSelectedCount] = useState(0);
  const [allFilteredSelected, setAllFilteredSelected] = useState(false);
  // We keep a local mirror of selectedIds for row-level checkbox state in the table
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // ── Latest query ref — for re-issuing after SELECT ───────────────────────
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
          setShowHeaderPicker(true);
        }, 350);
      } else if (msg.type === "READY") {
        setColumns(msg.cols);
        setColVisibility(
          Object.fromEntries(
            (msg.cols as string[]).map((c: string) => [c, true])
          )
        );
        setTotalRows(msg.totalRows);
        setHasData(true);
        setIsLoading(false);
        setProgress(0);
        // Immediately run default query so table has data when user opens ColumnDialog
        const q: QueryMsg = {
          type: "QUERY",
          search: "",
          filters: {},
          dateFilters: {},
          sort: { col: null, dir: null },
          page: 1,
        };
        lastQueryRef.current = q;
        worker.postMessage(q);
      } else if (msg.type === "RESULT") {
        setPagedRows(msg.pagedRows);
        setProcessedCount(msg.processedCount);
        setTotalPages(msg.totalPages);
        setClampedPage(msg.clampedPage);
        setAllFilteredSelected(msg.allFilteredSelected);
        setSelectedCount(msg.selectedCount);
        // Sync local selectedIds mirror from allFilteredIds + count
        // We only need to know which IDs on the CURRENT PAGE are selected
        setSelectedIds((prev) => {
          // Rebuild only from what worker confirmed
          const next = new Set<number>();
          (msg.pagedRows as Row[]).forEach((r) => {
            if (
              prev.has(r.__id) ||
              // If allFilteredSelected we know all are selected
              msg.allFilteredSelected
            )
              next.add(r.__id);
          });
          return next;
        });
        setIsFiltering(false);
      } else if (msg.type === "SELECTION") {
        setSelectedCount(msg.selectedCount);
        // Re-run last query to get updated allFilteredSelected and page checkbox states
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
        toast.error("Error", { description: msg.message });
      }
    };

    worker.onerror = (err) => {
      setIsLoading(false);
      setProgress(0);
      toast.error("Worker error", { description: err.message });
    };

    workerRef.current = worker;
    return worker;
  }, []);

  // ── Send query to worker (debounced path calls this after commit) ─────────
  const sendQuery = useCallback((q: QueryMsg) => {
    lastQueryRef.current = q;
    workerRef.current?.postMessage(q);
  }, []);

  // ── Parse file ────────────────────────────────────────────────────────────
  const parseFile = useCallback(
    (file: File) => {
      setIsLoading(true);
      setProgress(0);
      setHasData(false);
      setRowsReady(false);
      setSelectedIds(new Set());
      setSelectedCount(0);
      setSort({ col: null, dir: null });
      setSearchInput("");
      setSearchCommitted("");
      setPage(1);
      setActiveFilters({});
      setDateRangeFilters({});

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
        // Transferable — zero-copy, buffer moves to worker
        worker.postMessage({ type: "PARSE", buffer }, [buffer]);
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
      setFileName(pendingFile.name);

      // Intercept the READY message once to fire onSuccess + toast
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
          // Restore normal handler
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

  // ── Query helpers — all send to worker ───────────────────────────────────
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
      pageSize: PAGE_SIZE,
      ...overrides,
    }),
    [searchCommitted, activeFilters, dateRangeFilters, sort, page]
  );

  // Re-query whenever filter/sort/page/search state changes
  useEffect(() => {
    if (!hasData) return;
    const q = buildQuery();
    sendQuery(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasData, searchCommitted, activeFilters, dateRangeFilters, sort, page]);

  // ── Sort ──────────────────────────────────────────────────────────────────
  const handleSort = useCallback((col: string) => {
    setSort((prev) => {
      if (prev.col !== col) return { col, dir: "asc" };
      if (prev.dir === "asc") return { col, dir: "desc" };
      return { col: null, dir: null };
    });
    setPage(1);
  }, []);

  // ── Search ────────────────────────────────────────────────────────────────
  const updateSearch = useCallback((value: string) => {
    setSearchInput(value);
    setIsFiltering(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchCommitted(value);
      setPage(1);
    }, 250);
  }, []);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

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

  // ── Selection ─────────────────────────────────────────────────────────────
  const toggleRow = useCallback((id: number) => {
    // Optimistic local update
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    workerRef.current?.postMessage({ type: "SELECT", mode: "toggle", id });
  }, []);

  const toggleAll = useCallback(() => {
    if (allFilteredSelected) {
      // Deselect all filtered — worker needs the IDs
      // Re-run query to get allFilteredIds then deselect
      workerRef.current?.postMessage({
        type: "SELECT",
        mode: "deselect_query",
        query: buildQuery(),
      });
      setSelectedIds(new Set());
    } else {
      workerRef.current?.postMessage({
        type: "SELECT",
        mode: "all_query",
        query: buildQuery(),
      });
    }
  }, [allFilteredSelected, buildQuery]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    workerRef.current?.postMessage({ type: "SELECT", mode: "clear" });
  }, []);

  // ── Column visibility ─────────────────────────────────────────────────────
  const setColVisible = useCallback((col: string, visible: boolean) => {
    setColVisibility((prev) => ({ ...prev, [col]: visible }));
  }, []);

  // ── Export ────────────────────────────────────────────────────────────────
  // Worker uses its own internal selectedIds — we just send config + visible cols.
  // No need to transfer the ID set back to the worker; it already has it.
  const handleExport = useCallback(
    (config: ExportConfig) => {
      const visibleCols = columns.filter((c) => colVisibility[c] !== false);
      setIsExporting(true);
      workerRef.current?.postMessage({
        type: "EXPORT",
        config,
        visibleCols,
      });
    },
    [columns, colVisibility]
  );

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetData = useCallback(() => {
    workerRef.current?.postMessage({ type: "RESET" });
    workerRef.current?.terminate();
    workerRef.current = null;
    setIsExporting(false);
    setColumns([]);
    setColVisibility({});
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
    setActiveFilters({});
    setDateRangeFilters({});
    setPagedRows([]);
    setProcessedCount(0);
    setTotalRows(0);
  }, []);

  return {
    // Data shape (no full rows array — main thread never holds it)
    rows: pagedRows, // alias so existing components don't break
    columns,
    setColumns,
    colVisibility,
    setColVisible,
    fileName,
    hasData,
    totalRows,

    // Header picker
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
    search: searchInput,
    searchCommitted,
    updateSearch,
    isFiltering,

    // Paginated results
    processedRows: pagedRows, // alias — components use processedRows for row count display
    processedCount,
    totalPages,
    clampedPage,
    pagedRows,
    page,
    setPage,

    // Selection
    selectedIds,
    selectedCount,
    toggleRow,
    toggleAll,
    clearSelection,
    allFilteredSelected,

    // Actions
    rowsReady,
    setRowsReady,
    parseFile,
    isExporting,
    handleExport,
    resetData,
  };
}
