import { Button } from "@/components/ui/button";
import { useSpreadsheetData } from "@/hooks/useSpreadsheetData";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { ColumnDialog } from "@/components/spreadsheet/ColumnDialog";
import { DataTable } from "@/components/spreadsheet/DataTable";
import { ExportDialog } from "@/components/spreadsheet/ExportDialog";
import { FilterDrawer } from "@/components/spreadsheet/FilterDrawer";
import { HeaderPickerDialog } from "@/components/spreadsheet/HeaderPickerDialog";
import { UploadZone } from "@/components/spreadsheet/UploadZone";
import { useSidebar } from "@/components/ui/sidebar";

const PAGE_SIZE = 50;

export default function DataCleaningPage() {
  // const { setOpen: setSidebarOpen } = useSidebar();

  const {
    rows,
    columns,
    setColumns,
    colVisibility,
    setColVisible,
    fileName,
    hasData,
    rawSheetData,
    showHeaderPicker,
    commitWithHeaderRow,
    dismissHeaderPicker,
    isLoading,
    progress,
    activeFilters,
    updateActiveFilters,
    dateRangeFilters,
    updateDateRangeFilters,
    clearAllFilters,
    sort,
    handleSort,
    search,
    updateSearch,
    processedRows,
    totalPages,
    clampedPage,
    pagedRows,
    setPage,
    selectedIds,
    selectedCount,
    toggleRow,
    toggleAll,
    clearSelection,
    allFilteredSelected,
    parseFile,
    handleExport,
    resetData,
    rowsReady,
    setRowsReady,
  } = useSpreadsheetData();

  // ── Unsaved changes guard ──
  const { showBlocker, confirmLeave, cancelLeave } = useUnsavedChanges(
    hasData,
    "You have unsaved data. Leaving will clear all imported rows and selections."
  );

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showColDialog, setShowColDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  const activeFilterCount =
    Object.keys(activeFilters).length + Object.keys(dateRangeFilters).length;
  const { setOpen: setSidebarOpen } = useSidebar();

  return (
    <div className="flex flex-col flex-1 min-w-0 gap-4 rounded-xl border border-border bg-card p-6 h-full">
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
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
              <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
              <span className="font-mono max-w-[140px] truncate">
                {fileName}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span className="line-clamp-1">{rows.length.toLocaleString()} rows</span>
            </div>

            <div className="h-5 w-px bg-border" />

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => setShowColDialog(true)}
            >
              <Columns3 className="h-3.5 w-3.5" />
              Columns
            </Button>

            <Button
              variant={showFilterPanel ? "secondary" : "outline"}
              size="sm"
              className="gap-1.5 text-xs h-8 relative"
              onClick={() => setShowFilterPanel((v) => !v)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => setShowReplaceConfirm(true)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Replace
            </Button>

            <div className="h-5 w-px bg-border" />

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

      {/* ── Waiting for column confirmation ── */}
      {hasData && !rowsReady && !isLoading && (
        <div className={`flex flex-col flex-1 items-center justify-center gap-3 text-center`}>
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
          <button
            className="text-xs text-primary underline underline-offset-2"
            onClick={() => setShowColDialog(true)}
          >
            Open Column Settings
          </button>
        </div>
      )}

      {/* ── Data view ── */}
      {hasData && rowsReady && (
        <div className="flex flex-col flex-1 min-h-0 max-w-full gap-3">
          {/* Search */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input
                className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Search all columns…"
                value={search}
                onChange={(e) => updateSearch(e.target.value)}
              />
              {search && (
                <button
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  onClick={() => updateSearch("")}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <span className="text-xs text-muted-foreground ml-auto">
              {processedRows.length.toLocaleString()} row
              {processedRows.length !== 1 ? "s" : ""}
              {(search || activeFilterCount > 0) && " (filtered)"}
            </span>
          </div>

          {/* Filter chips */}
          {activeFilterCount > 0 && (
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
                      updateActiveFilters(next);
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
                      updateDateRangeFilters(next);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                className="text-[11px] text-muted-foreground hover:text-foreground hover:underline px-1"
                onClick={clearAllFilters}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Table */}
          <div className="flex-1 min-h-0 max-w-full overflow-auto">
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
      )}

      {/* ── Dialogs ── */}
      <HeaderPickerDialog
        key={rawSheetData.length + (rawSheetData[0]?.join("") ?? "")}
        open={showHeaderPicker}
        rawData={rawSheetData}
        onConfirm={(rowIndex) =>
          commitWithHeaderRow(rowIndex, () => {
            setShowColDialog(true);
            setShowFilterPanel(false);
            setSidebarOpen(false);
          })
        }
        onClose={dismissHeaderPicker}
      />

      <FilterDrawer
        open={showFilterPanel}
        columns={columns}
        visibleCols={colVisibility}
        rows={rows}
        activeFilters={activeFilters}
        onFiltersChange={updateActiveFilters}
        dateRangeFilters={dateRangeFilters}
        onDateRangeChange={updateDateRangeFilters}
        onClose={() => setShowFilterPanel(false)}
      />

      <ColumnDialog
        open={showColDialog}
        columns={columns}
        visibility={colVisibility}
        onChange={setColVisible}
        onReorder={setColumns}
        onClose={() => {
          setShowColDialog(false);
          // Mark rows as ready to render on first close after import
          if (!rowsReady) setRowsReady(true);
        }}
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
        onOpenChange={(v) => !v && setShowClearConfirm(false)}
        title="Clear selection?"
        desc={`This will deselect all ${selectedCount} selected rows.`}
        handleConfirm={() => {
          clearSelection();
          setShowClearConfirm(false);
        }}
        destructive
      />

      <ConfirmDialog
        open={showReplaceConfirm}
        onOpenChange={(v) => !v && setShowReplaceConfirm(false)}
        title="Replace file?"
        desc="This will clear all current data and selection. You'll be prompted to upload a new file."
        handleConfirm={() => {
          resetData();
          setShowReplaceConfirm(false);
        }}
        destructive
      />

      {/* ── Navigation guard ── */}
      <ConfirmDialog
        open={showBlocker}
        onOpenChange={(v) => !v && cancelLeave()}
        title="Leave page?"
        desc="You have unsaved data. Leaving will clear all imported rows and selections."
        confirmText="Leave"
        handleConfirm={confirmLeave}
        destructive
      />
    </div>
  );
}
