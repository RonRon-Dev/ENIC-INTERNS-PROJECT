// ─── useSpreadsheetData ───────────────────────────────────────────────────────
// Thin message-passing shell. ALL data lives in the worker.
// Main thread only holds: paged rows, column names, UI state.
// No full Row[] ever crosses the thread boundary after COMMIT.
//
// Changes in this version:
//   - filterValues: Record<string,string[]> — populated from worker GET_FILTER_VALUES
//     response, covering the FULL dataset (not just current page)
//   - requestFilterValues(cols) — sends GET_FILTER_VALUES to worker
//   - allFilteredIds from RESULT is now an Int32Array (transferable) — converted
//     to number[] only when needed for SELECT messages
//   - selectedIds Set removed from main thread — selection UI driven by
//     selectedCount + allFilteredSelected from worker (authoritative)
//   - clearAllFilters now exported (was already in hook, not wired to UI)

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
// Matches MAX_FILTER_VALUES in the worker
export const MAX_FILTER_VALUES = 500;

const FILE_SIZE_WARN_MB = 20;
const SEARCH_DEBOUNCE_MS = 500;
// 30s revoke delay — blob needs to stay alive until browser queues the download
const REVOKE_DELAY_MS = 30_000;

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

  // Selection state — driven by worker, not maintained locally
  // selectedIds Set is NOT kept on main thread (was duplicate of worker state)
  const [selectedCount, setSelectedCount] = useState(0);
  const [allFilteredSelected, setAllFilteredSelected] = useState(false);
  // Kept only for DataTable checkbox rendering (current page)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Filter values from the FULL dataset — populated via GET_FILTER_VALUES worker message
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>(
    {}
  );
  const [filterValuesLoading, setFilterValuesLoading] = useState(false);

  // Last allFilteredIds from worker (Int32Array) — used for SELECT all/deselect
  const lastFilteredIdsRef = useRef<Int32Array | null>(null);
  const lastQueryRef = useRef<QueryMsg | null>(null);

  // ── Spawn worker ────────────────────────────────────────────────────────────
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
        setDetectedTypes(
          msg.detectedTypes
            ? Object.fromEntries(
                Object.entries(msg.detectedTypes as Record<string, string>).map(
                  ([k, v]) => [k, v as ColumnType]
                )
              )
            : {}
        );
        setTotalRows(msg.totalRows as number);
        setHasData(true);
        setIsLoading(false);
        setProgress(0);
      } else if (msg.type === "RESULT") {
        setPagedRows(msg.pagedRows as Row[]);
        setTotalRows(msg.totalRows as number);
        setProcessedCount(msg.processedCount as number);
        setTotalPages(msg.totalPages as number);
        setClampedPage(msg.clampedPage as number);
        setAllFilteredSelected(msg.allFilteredSelected as boolean);
        setSelectedCount(msg.selectedCount as number);
        setIsFiltering(false);

        // allFilteredIds is now a transferred Int32Array — store ref for SELECT
        if (msg.allFilteredIds instanceof Int32Array) {
          lastFilteredIdsRef.current = msg.allFilteredIds;
          // Rebuild main-thread selectedIds for DataTable checkbox rendering
          // (only current page rows need to be checked — avoids iterating 100k)
          setSelectedIds((prev) => {
            const next = new Set<number>();
            // We don't know which rows are selected globally — only count comes from worker.
            // For checkbox rendering we track selection state per visible row via selectedCount.
            // So we keep selectedIds only for the current page:
            for (const row of msg.pagedRows as Row[]) {
              if (prev.has(row.__id)) next.add(row.__id);
            }
            return next;
          });
        }
      } else if (msg.type === "FILTER_VALUES") {
        setFilterValues(msg.values as Record<string, string[]>);
        setFilterValuesLoading(false);
      } else if (msg.type === "SELECTION") {
        setSelectedCount(msg.selectedCount as number);
        // Sync selectedIds for current page after selection changes
        workerRef.current?.postMessage({
          type: "QUERY",
          ...lastQueryRef.current,
        });
      } else if (msg.type === "PROGRESS") {
        setProgress(msg.pct as number);
        setLoadingPhase(msg.phase as string);
      } else if (msg.type === "SIZE_WARNING") {
        toast.warning("Large file detected", {
          description: `${msg.sizeMB} MB file. Processing may take a moment on lower-spec machines.`,
          duration: 6000,
        });
      } else if (msg.type === "ROW_CAP") {
        toast.warning("Row limit reached", {
          description: `Loaded ${(msg.loaded as number).toLocaleString()} of ${(
            msg.capped as number
          ).toLocaleString()} rows. Maximum is 500,000.`,
          duration: 8000,
        });
      } else if (msg.type === "RETYPE_DONE") {
        // Re-query to reflect type changes in the table
        if (lastQueryRef.current) {
          workerRef.current?.postMessage(lastQueryRef.current);
        }
      } else if (msg.type === "EXPORT_DONE") {
        setIsExporting(false);
        const { kind, url, fileName: dlName, files, description } = msg;
        if (kind === "file" || kind === "zip") {
          const a = document.createElement("a");
          a.href = url;
          a.download = dlName;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
          toast.success("Export complete", { description });
        } else if (kind === "files") {
          for (const f of files as { url: string; fileName: string }[]) {
            const a = document.createElement("a");
            a.href = f.url;
            a.download = f.fileName;
            a.click();
            setTimeout(() => URL.revokeObjectURL(f.url), REVOKE_DELAY_MS);
          }
          toast.success("Export complete", { description });
        }
      } else if (msg.type === "EXPORT_ERROR") {
        setIsExporting(false);
        toast.error("Export failed", { description: msg.message as string });
      } else if (msg.type === "ERROR") {
        setIsLoading(false);
        setIsExporting(false);
        toast.error("Worker error", { description: msg.message as string });
      }
    };

    worker.onerror = (err) => {
      setIsLoading(false);
      toast.error("Worker crashed", { description: err.message });
    };

    workerRef.current = worker;
    return worker;
  }, []);

  // ── Build & send query ──────────────────────────────────────────────────────
  const buildQuery = useCallback(
    (overrides?: Partial<QueryMsg>): QueryMsg => ({
      type: "QUERY",
      search: searchCommitted,
      filters: Object.fromEntries(
        Object.entries(activeFilters).map(([k, v]) => [k, Array.from(v)])
      ),
      dateFilters: dateRangeFilters,
      sort,
      page,
      pageSize,
      ...overrides,
    }),
    [searchCommitted, activeFilters, dateRangeFilters, sort, page, pageSize]
  );

  const sendQuery = useCallback(
    (overrides?: Partial<QueryMsg>) => {
      if (!workerRef.current) return;
      setIsFiltering(true);
      const q = buildQuery(overrides);
      lastQueryRef.current = q;
      workerRef.current.postMessage(q);
    },
    [buildQuery]
  );

  // Re-query whenever filter/sort/page/search state changes
  useEffect(() => {
    if (!hasData) return;
    sendQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchCommitted, activeFilters, dateRangeFilters, sort, page, pageSize]);

  // ── Parse file ──────────────────────────────────────────────────────────────
  const parseFile = useCallback(
    (file: File) => {
      const mb = file.size / 1024 / 1024;
      if (mb > FILE_SIZE_WARN_MB) {
        toast.warning("Large file", {
          description: `${mb.toFixed(
            1
          )} MB detected. Processing will start shortly.`,
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
      setFilterValues({});

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
        // Transfer buffer — zero-copy hand-off to worker
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

  // ── Commit header row ───────────────────────────────────────────────────────
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
          // Restore normal handler FIRST and forward READY through it —
          // this ensures setColumns/setTotalRows/setDetectedTypes all fire
          // before onSuccess opens ColumnDialog. Without this, ColumnDialog
          // opens with columns=[] because the READY message was swallowed.
          workerRef.current!.onmessage = originalOnMessage;
          (originalOnMessage as (e: MessageEvent) => void)(e);
          toast.success("File imported", {
            description: `${(
              e.data.totalRows as number
            ).toLocaleString()} rows · ${
              (e.data.cols as string[]).length
            } columns · "${pendingFile.name}"`,
          });
          onSuccess?.();
          const q = buildQuery({ page: 1 });
          lastQueryRef.current = q;
          workerRef.current!.postMessage(q);
        } else {
          (originalOnMessage as (e: MessageEvent) => void)(e);
        }
      };

      workerRef.current.postMessage({ type: "COMMIT", headerRowIndex });
    },
    [pendingFile, buildQuery]
  );

  const dismissHeaderPicker = useCallback(() => {
    setShowHeaderPicker(false);
    setPendingFile(null);
    setRawSheetData([]);
  }, []);

  // ── Column visibility ───────────────────────────────────────────────────────
  const setColVisible = useCallback((col: string, v: boolean) => {
    setColVisibility((prev) => ({ ...prev, [col]: v }));
  }, []);

  // ── Column type ─────────────────────────────────────────────────────────────
  const setColType = useCallback((col: string, type: ColumnType) => {
    setColTypesState((prev) => ({ ...prev, [col]: type }));
    workerRef.current?.postMessage({
      type: "RETYPE",
      colTypes: { [col]: type },
    });
  }, []);

  // ── Search ──────────────────────────────────────────────────────────────────
  const updateSearch = useCallback((val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setSearchCommitted(val);
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const updateActiveFilters = useCallback((filters: ActiveFilters) => {
    setPage(1);
    setActiveFilters(filters);
  }, []);

  const updateDateRangeFilters = useCallback((filters: DateRangeFilters) => {
    setPage(1);
    setDateRangeFilters(filters);
  }, []);

  const clearAllFilters = useCallback(() => {
    setPage(1);
    setActiveFilters({});
    setDateRangeFilters({});
  }, []);

  // ── Filter values (full dataset) ─────────────────────────────────────────────
  // Call this when the FilterDrawer opens to request distinct values from worker.
  const requestFilterValues = useCallback((cols: string[]) => {
    if (!workerRef.current || cols.length === 0) return;
    setFilterValuesLoading(true);
    workerRef.current.postMessage({ type: "GET_FILTER_VALUES", columns: cols });
  }, []);

  // ── Sort ────────────────────────────────────────────────────────────────────
  const handleSort = useCallback((col: string) => {
    setSort((prev) => ({
      col,
      dir:
        prev.col === col
          ? prev.dir === "asc"
            ? "desc"
            : prev.dir === "desc"
            ? null
            : "asc"
          : "asc",
    }));
    setPage(1);
  }, []);

  // ── Page size ───────────────────────────────────────────────────────────────
  const setPageSize = useCallback((ps: number) => {
    setPageSizeState(ps);
    setPage(1);
  }, []);

  // ── Selection ───────────────────────────────────────────────────────────────
  const toggleRow = useCallback((id: number) => {
    // Optimistic local update for instant checkbox feedback
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    workerRef.current?.postMessage({ type: "SELECT", mode: "toggle", id });
  }, []);

  const toggleAll = useCallback((select: boolean) => {
    const ids = lastFilteredIdsRef.current
      ? Array.from(lastFilteredIdsRef.current)
      : [];
    workerRef.current?.postMessage({
      type: "SELECT",
      mode: select ? "all" : "deselect",
      ids,
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    workerRef.current?.postMessage({ type: "SELECT", mode: "clear" });
  }, []);

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = useCallback(
    (config: ExportConfig, visibleCols: string[]) => {
      if (!workerRef.current) return;
      setIsExporting(true);
      workerRef.current.postMessage({ type: "EXPORT", config, visibleCols });
    },
    []
  );

  // ── Reset ───────────────────────────────────────────────────────────────────
  const resetData = useCallback(() => {
    workerRef.current?.postMessage({ type: "RESET" });
    workerRef.current?.terminate();
    workerRef.current = null;
    lastFilteredIdsRef.current = null;
    lastQueryRef.current = null;
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
    setFilterValues({});
    setAllFilteredSelected(false);
  }, []);

  // ── Cleanup ─────────────────────────────────────────────────────────────────
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

    // Filter values from full dataset — request via requestFilterValues()
    filterValues,
    filterValuesLoading,
    requestFilterValues,

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
