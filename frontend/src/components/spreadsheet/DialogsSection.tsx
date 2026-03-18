// ─── DialogsSection ──────────────────────────────────────────────────────────
// Houses all six dialogs / drawers used by the Data Cleaning page.
// Previously these were inlined at the bottom of DataCleaningPage, making
// that component ~300 lines long. Extracting them here:
//
//   • Keeps DataCleaningPage under ~90 lines
//   • Makes each dialog's wiring auditable in isolation
//   • Lets us test dialog behaviour without mounting the full page
//
// Props are split into three groups:
//   spreadsheet  — from useSpreadsheetData()
//   dialogs      — from useDataCleaningDialogs()
//   callbacks    — derived or sidebar-specific handlers from the page

import { ConfirmDialog } from "@/components/confirm-dialog";
import { ColumnDialog } from "@/components/spreadsheet/ColumnDialog";
import { ExportDialog } from "@/components/spreadsheet/ExportDialog";
import { FilterDrawer } from "@/components/spreadsheet/FilterDrawer";
import { HeaderPickerDialog } from "@/components/spreadsheet/HeaderPickerDialog";
import type { useDataCleaningDialogs } from "@/hooks/useDataCleaningDialogs";
import type { useSpreadsheetData } from "@/hooks/useSpreadsheetData";

type SpreadsheetData = ReturnType<typeof useSpreadsheetData>;
type DialogState = ReturnType<typeof useDataCleaningDialogs>;

interface DialogsSectionProps {
  /** Full return value of useSpreadsheetData — only the keys used here matter */
  spreadsheet: SpreadsheetData;
  /** Full return value of useDataCleaningDialogs */
  dialogs: DialogState;
  /** Visible (non-hidden) columns — used by ExportDialog and FilterDrawer */
  visibleColumns: string[];
  /** Called when ColumnDialog closes — also marks rowsReady when needed */
  onColDialogClose: () => void;
  /** Called when FilterDrawer opens — triggers GET_FILTER_VALUES in the worker */
  onFilterDrawerOpen: () => void;
  /** Controls the app sidebar (collapse it after file import) */
  setSidebarOpen: (open: boolean) => void;
  /** From useUnsavedChanges */
  showBlocker: boolean;
  confirmLeave: () => void;
  cancelLeave: () => void;
}

export function DialogsSection({
  spreadsheet: s,
  dialogs: d,
  visibleColumns,
  onColDialogClose,
  onFilterDrawerOpen,
  setSidebarOpen,
  showBlocker,
  confirmLeave,
  cancelLeave,
}: DialogsSectionProps) {
  return (
    <>
      {/* ── 1. Header row picker — shown right after file parse ── */}
      <HeaderPickerDialog
        open={s.showHeaderPicker}
        rawData={s.rawSheetData}
        onConfirm={(rowIndex) =>
          s.commitWithHeaderRow(rowIndex, () => {
            d.openColDialog();
            d.closeFilterPanel();
            setSidebarOpen(false);
          })
        }
        onClose={s.dismissHeaderPicker}
      />

      {/* ── 2. Filter drawer ── */}
      <FilterDrawer
        open={d.showFilterPanel}
        columns={s.columns}
        visibleCols={s.colVisibility}
        filterValues={s.filterValues}
        filterValuesLoading={s.filterValuesLoading}
        onOpen={onFilterDrawerOpen}
        activeFilters={s.activeFilters}
        onFiltersChange={s.updateActiveFilters}
        dateRangeFilters={s.dateRangeFilters}
        onDateRangeChange={s.updateDateRangeFilters}
        onClearAll={s.clearAllFilters}
        onClose={d.closeFilterPanel}
      />

      {/* ── 3. Column visibility / order / type dialog ── */}
      <ColumnDialog
        open={d.showColDialog}
        columns={s.columns}
        visibility={s.colVisibility}
        colTypes={s.colTypes}
        detectedTypes={s.detectedTypes}
        onChange={s.setColVisible}
        onReorder={s.setColumns}
        onSetColType={s.setColType}
        onClose={onColDialogClose}
      />

      {/* ── 4. Export dialog ── */}
      <ExportDialog
        open={d.showExportDialog}
        onClose={d.closeExportDialog}
        onExport={s.handleExport}
        onValidateXml={s.validateExport}
        columns={visibleColumns}
        allColumns={s.columns}
        selectedCount={s.selectedCount}
        isExporting={s.isExporting}
        isValidating={s.isValidating}
        exportError={s.exportError}
        xmlValidation={s.xmlValidation}
      />

      {/* ── 5. Clear selection confirm ── */}
      <ConfirmDialog
        open={d.showClearConfirm}
        onOpenChange={(v) => !v && d.closeClearConfirm()}
        title="Clear selection?"
        desc={`This will deselect all ${s.selectedCount.toLocaleString()} selected rows.`}
        handleConfirm={() => {
          s.clearSelection();
          d.closeClearConfirm();
        }}
        destructive
      />

      {/* ── 6. Replace file confirm ── */}
      <ConfirmDialog
        open={d.showReplaceConfirm}
        onOpenChange={(v) => !v && d.closeReplaceConfirm()}
        title="Replace file?"
        desc="This will clear all current data and selection. You'll be prompted to upload a new file."
        handleConfirm={() => {
          s.resetData();
          d.closeReplaceConfirm();
        }}
        destructive
      />

      {/* ── 7. Navigation blocker (unsaved changes guard) ── */}
      <ConfirmDialog
        open={showBlocker}
        onOpenChange={(v) => !v && cancelLeave()}
        title="Leave page?"
        desc="You have unsaved data. Leaving will clear all imported rows and selections."
        confirmText="Leave"
        handleConfirm={confirmLeave}
        destructive
      />
    </>
  );
}
