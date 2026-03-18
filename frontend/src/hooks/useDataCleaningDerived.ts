// ─── useDataCleaningDerived ───────────────────────────────────────────────────
// Memoised computations that were previously inlined (and re-computed on every
// render) inside DataCleaningPage:
//
//   • visibleColumns      — columns.filter(visible)
//   • activeFilterCount   — Object.keys(activeFilters) + Object.keys(dateRangeFilters)
//   • paginationRange     — the window of page numbers shown in the footer
//
// All three are now stable references: they only change when their specific
// dependencies change, preventing unnecessary child re-renders.

import type {
  ActiveFilters,
  ColVisibility,
  DateRangeFilters,
} from "@/types/spreadsheet";
import { useMemo } from "react";

const PAGINATION_DELTA = 2; // pages shown either side of the current page

interface Params {
  columns: string[];
  colVisibility: ColVisibility;
  activeFilters: ActiveFilters;
  dateRangeFilters: DateRangeFilters;
  clampedPage: number;
  totalPages: number;
}

export function useDataCleaningDerived({
  columns,
  colVisibility,
  activeFilters,
  dateRangeFilters,
  clampedPage,
  totalPages,
}: Params) {
  // Columns that are currently toggled on — passed to ExportDialog and
  // requestFilterValues. Recalculates only when columns or visibility changes.
  const visibleColumns = useMemo(
    () => columns.filter((c) => colVisibility[c] !== false),
    [columns, colVisibility]
  );

  // Badge count shown on the Filters button.
  const activeFilterCount = useMemo(
    () =>
      Object.keys(activeFilters).length + Object.keys(dateRangeFilters).length,
    [activeFilters, dateRangeFilters]
  );

  // Sliding window of page numbers rendered in the pagination footer.
  // At most (2 * PAGINATION_DELTA + 1) buttons visible at a time.
  const paginationRange = useMemo(() => {
    const range: number[] = [];
    const left = Math.max(1, clampedPage - PAGINATION_DELTA);
    const right = Math.min(totalPages, clampedPage + PAGINATION_DELTA);
    for (let p = left; p <= right; p++) range.push(p);
    return range;
  }, [clampedPage, totalPages]);

  return { visibleColumns, activeFilterCount, paginationRange };
}
