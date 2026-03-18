import { DataTable } from "@/components/spreadsheet/DataTable";
import { DialogsSection } from "@/components/spreadsheet/DialogsSection";
import { UploadZone } from "@/components/spreadsheet/UploadZone";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useDataCleaningDerived } from "@/hooks/useDataCleaningDerived";
import { useDataCleaningDialogs } from "@/hooks/useDataCleaningDialogs";
import {
  PAGE_SIZE_OPTIONS,
  useSpreadsheetData,
} from "@/hooks/useSpreadsheetData";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  FileSpreadsheet,
  FilterX,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useCallback } from "react";

export default function DataCleaningPage() {
  const { setOpen: setSidebarOpen } = useSidebar();

  // ── Data & worker state ─────────────────────────────────────────────────────
  const s = useSpreadsheetData();

  // ── Dialog open/close flags ─────────────────────────────────────────────────
  const d = useDataCleaningDialogs();

  // ── Navigation guard ────────────────────────────────────────────────────────
  const { showBlocker, confirmLeave, cancelLeave } = useUnsavedChanges(
    s.hasData,
    "You have unsaved data. Leaving will clear all imported rows and selections."
  );

  // ── Memoised derived values ─────────────────────────────────────────────────
  const { visibleColumns, activeFilterCount, paginationRange } =
    useDataCleaningDerived({
      columns: s.columns,
      colVisibility: s.colVisibility,
      activeFilters: s.activeFilters,
      dateRangeFilters: s.dateRangeFilters,
      clampedPage: s.clampedPage,
      totalPages: s.totalPages,
    });

  // Request full distinct values from worker when FilterDrawer opens.
  const handleFilterDrawerOpen = useCallback(() => {
    s.requestFilterValues(visibleColumns);
  }, [s, visibleColumns]);

  // Close ColumnDialog and mark rows as ready if this is the first open.
  const handleColDialogClose = useCallback(() => {
    d.closeColDialog();
    if (!s.rowsReady) s.setRowsReady(true);
  }, [d, s]);

  return (
    <div className="flex w-full flex-col h-full">
      <div className="w-full flex flex-col gap-4 rounded-xl border border-border bg-card p-6 h-full">
        {/* ── Header ── */}
        <div className="flex items-start justify-between shrink-0">
          <div>
            <h1 className="text-base font-semibold text-foreground">
              Spreadsheet Import Tool
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-[350px] truncate">
              Import hospital data files, configure columns, and export selected
              rows
            </p>
          </div>

          {s.hasData && (
            <div className="flex items-center gap-2">
              {/* File info badge */}
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
                <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
                <span className="font-mono max-w-[100px] truncate">
                  {s.fileName}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="max-w-[180px] truncate">
                  {s.processedCount < s.totalRows ? (
                    <>
                      <span className="text-foreground font-medium">
                        {s.processedCount.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        of {s.totalRows.toLocaleString()} rows
                      </span>
                    </>
                  ) : (
                    <>{s.totalRows.toLocaleString()} rows</>
                  )}
                </span>
              </div>

              <div className="h-5 w-px bg-border" />

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={d.openColDialog}
              >
                <Columns3 className="h-3.5 w-3.5" />
                Columns
              </Button>

              <Button
                variant={d.showFilterPanel ? "default" : "outline"}
                size="sm"
                className="gap-1.5 text-xs h-8 relative"
                onClick={d.toggleFilterPanel}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs h-8 text-muted-foreground hover:text-destructive"
                  onClick={s.clearAllFilters}
                >
                  <FilterX className="h-3.5 w-3.5" />
                  Clear filters
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={d.openReplaceConfirm}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Replace
              </Button>

              <div className="h-5 w-px bg-border" />

              {s.selectedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs h-8 text-muted-foreground hover:text-foreground"
                  onClick={d.openClearConfirm}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear ({s.selectedCount.toLocaleString()})
                </Button>
              )}

              <Button
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={d.openExportDialog}
                disabled={s.selectedCount === 0 || s.isExporting}
              >
                {s.isExporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {s.isExporting
                  ? "Exporting…"
                  : `Export${
                      s.selectedCount > 0
                        ? ` ${s.selectedCount.toLocaleString()}`
                        : ""
                    }`}
              </Button>
            </div>
          )}
        </div>

        {/* ── Search bar ── */}
        {s.hasData && s.rowsReady && (
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Search all columns…"
              value={s.search}
              onChange={(e) => s.updateSearch(e.target.value)}
            />
            {s.search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => s.updateSearch("")}
              >
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        )}

        {/* ── Upload zone ── */}
        {!s.hasData && (
          <UploadZone
            onFile={s.parseFile}
            progress={s.progress}
            isLoading={s.isLoading}
          />
        )}

        {/* ── Waiting for column confirmation ── */}
        {s.hasData && !s.rowsReady && !s.isLoading && (
          <div className="flex flex-col flex-1 items-center justify-center gap-3 text-center">
            <div className="rounded-full bg-muted p-4">
              <Columns3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Configure your columns
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review and select which columns to include, then close the panel
                to load the table.
              </p>
            </div>
          </div>
        )}

        {/* ── Data table + pagination ── */}
        {s.hasData && s.rowsReady && (
          <div className="flex flex-col flex-1 min-h-0 gap-3">
            <DataTable
              rows={s.pagedRows}
              columns={s.columns}
              visibleCols={s.colVisibility}
              selectedIds={s.selectedIds}
              onToggleRow={s.toggleRow}
              onToggleAll={s.toggleAll}
              sort={s.sort}
              onSort={s.handleSort}
              allFilteredSelected={s.allFilteredSelected}
              page={s.page}
              pageSize={s.pageSize}
            />

            {/* ── Pagination footer ── */}
            <div className="flex items-center justify-between shrink-0 text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                {s.selectedCount > 0 && (
                  <span className="text-primary font-medium">
                    {s.selectedCount.toLocaleString()} selected
                    {s.selectedCount !== s.totalRows && " across all pages"}
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <span>Rows per page:</span>
                  <select
                    className="rounded border border-border bg-background px-1.5 py-0.5 text-xs focus:outline-none"
                    value={s.pageSize}
                    onChange={(e) => s.setPageSize(Number(e.target.value))}
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className="mr-2 tabular-nums">
                  Page {s.clampedPage} of {s.totalPages.toLocaleString()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={s.clampedPage <= 1}
                  onClick={() => s.setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {paginationRange.map((p) => (
                  <Button
                    key={p}
                    variant={p === s.clampedPage ? "default" : "outline"}
                    size="sm"
                    className="h-7 w-7 p-0 text-xs"
                    onClick={() => s.setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={s.clampedPage >= s.totalPages}
                  onClick={() => s.setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── All dialogs ── */}
      <DialogsSection
        spreadsheet={s}
        dialogs={d}
        visibleColumns={visibleColumns}
        onColDialogClose={handleColDialogClose}
        onFilterDrawerOpen={handleFilterDrawerOpen}
        setSidebarOpen={setSidebarOpen}
        showBlocker={showBlocker}
        confirmLeave={confirmLeave}
        cancelLeave={cancelLeave}
      />
    </div>
  );
}
