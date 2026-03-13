import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { MAX_FILTER_VALUES } from "@/hooks/useSpreadsheetData";
import type {
  ActiveFilters,
  ColVisibility,
  DateRangeFilters,
} from "@/types/spreadsheet";
import {
  ChevronDown,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface FilterDrawerProps {
  open: boolean;
  columns: string[];
  visibleCols: ColVisibility;
  // Full-dataset distinct values per column — from worker GET_FILTER_VALUES
  // (replaces the old rows prop which only had current-page data)
  filterValues: Record<string, string[]>;
  filterValuesLoading: boolean;
  onOpen: () => void; // called when drawer opens — triggers GET_FILTER_VALUES
  activeFilters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
  dateRangeFilters: DateRangeFilters;
  onDateRangeChange: (filters: DateRangeFilters) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export function FilterDrawer({
  open,
  columns,
  visibleCols,
  filterValues,
  filterValuesLoading,
  onOpen,
  activeFilters,
  onFiltersChange,
  dateRangeFilters,
  onDateRangeChange,
  onClearAll,
  onClose,
}: FilterDrawerProps) {
  const [expandedCols, setExpandedCols] = useState<Set<string>>(new Set());
  const [colSearch, setColSearch] = useState("");
  const [valueSearch, setValueSearch] = useState<Record<string, string>>({});

  // Request full filter values from worker when drawer opens
  useEffect(() => {
    if (open) {
      onOpen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filterableCols = useMemo(
    () => columns.filter((c) => visibleCols[c] !== false),
    [columns, visibleCols]
  );

  const displayCols = useMemo(
    () =>
      colSearch.trim()
        ? filterableCols.filter((c) =>
            c.toLowerCase().includes(colSearch.toLowerCase())
          )
        : filterableCols,
    [filterableCols, colSearch]
  );

  // Detect date columns from filterValues — a column is a date col if its
  // values look like dates (we check first non-empty value)
  const dateColSet = useMemo(() => {
    const DATE_RE = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
    const set = new Set<string>();
    for (const col of filterableCols) {
      const vals = filterValues[col] ?? [];
      const sample = vals.filter((v) => v && v !== "__CAPPED__").slice(0, 5);
      if (sample.length > 0 && sample.every((v) => DATE_RE.test(v))) {
        set.add(col);
      }
    }
    return set;
  }, [filterableCols, filterValues]);

  const getDistinctValues = (
    col: string
  ): { values: string[]; capped: boolean } => {
    const raw = filterValues[col] ?? [];
    const capped = raw[raw.length - 1] === "__CAPPED__";
    return {
      values: capped ? raw.slice(0, -1) : raw,
      capped,
    };
  };

  const toggleValue = (col: string, value: string) => {
    const next: ActiveFilters = { ...activeFilters };
    const current = new Set(next[col] ?? []);
    if (current.has(value)) current.delete(value);
    else current.add(value);
    if (current.size === 0) delete next[col];
    else next[col] = current;
    onFiltersChange(next);
  };

  const clearColFilter = (col: string) => {
    const next = { ...activeFilters };
    delete next[col];
    onFiltersChange(next);
  };

  const toggleExpanded = (col: string) => {
    setExpandedCols((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  const totalActiveFilters =
    Object.keys(activeFilters).length + Object.keys(dateRangeFilters).length;

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()} direction="right">
      <DrawerContent className="h-full w-80 ml-auto rounded-none flex flex-col">
        <DrawerHeader className="border-b border-border px-4 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              Filters
              {totalActiveFilters > 0 && (
                <span className="ml-1 h-5 min-w-[20px] rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground flex items-center justify-center">
                  {totalActiveFilters}
                </span>
              )}
            </DrawerTitle>
            <div className="flex items-center gap-1">
              {totalActiveFilters > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-[11px] text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded hover:bg-destructive/10"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-md p-1 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Column search */}
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Search columns…"
              value={colSearch}
              onChange={(e) => setColSearch(e.target.value)}
            />
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {filterValuesLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading filter values…
            </div>
          )}

          {!filterValuesLoading && displayCols.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">
              No columns match "{colSearch}"
            </p>
          )}

          {!filterValuesLoading &&
            displayCols.map((col) => {
              const isDate = dateColSet.has(col);
              const isExpanded = expandedCols.has(col);
              const colActiveFilter = activeFilters[col];
              const colDateFilter = dateRangeFilters[col];
              const hasActive =
                colActiveFilter?.size > 0 ||
                !!(colDateFilter?.from || colDateFilter?.to);

              if (isDate) {
                // Date range filter UI
                const range = dateRangeFilters[col] ?? { from: "", to: "" };
                return (
                  <div
                    key={col}
                    className="rounded-lg border border-border overflow-hidden"
                  >
                    <button
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
                      onClick={() => toggleExpanded(col)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium truncate">
                          {col}
                        </span>
                        {hasActive && (
                          <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isExpanded && (
                      <div className="border-t border-border px-3 py-2.5 space-y-2 bg-muted/10">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-muted-foreground">
                            From
                          </label>
                          <input
                            type="date"
                            className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            value={range.from}
                            onChange={(e) =>
                              onDateRangeChange({
                                ...dateRangeFilters,
                                [col]: { ...range, from: e.target.value },
                              })
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-muted-foreground">
                            To
                          </label>
                          <input
                            type="date"
                            className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            value={range.to}
                            onChange={(e) =>
                              onDateRangeChange({
                                ...dateRangeFilters,
                                [col]: { ...range, to: e.target.value },
                              })
                            }
                          />
                        </div>
                        {hasActive && (
                          <button
                            className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() => {
                              const next = { ...dateRangeFilters };
                              delete next[col];
                              onDateRangeChange(next);
                            }}
                          >
                            Clear date filter
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              // Value checkbox filter UI
              const { values: distinctValues, capped } = getDistinctValues(col);
              const vSearch = valueSearch[col] ?? "";
              const filteredValues = vSearch.trim()
                ? distinctValues.filter((v) =>
                    v.toLowerCase().includes(vSearch.toLowerCase())
                  )
                : distinctValues;

              return (
                <div
                  key={col}
                  className="rounded-lg border border-border overflow-hidden"
                >
                  <button
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => toggleExpanded(col)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium truncate">
                        {col}
                      </span>
                      {colActiveFilter?.size > 0 && (
                        <span className="shrink-0 rounded-full bg-primary/10 text-primary px-1.5 py-0 text-[10px] font-medium">
                          {colActiveFilter.size}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border bg-muted/10">
                      {/* Value search */}
                      {distinctValues.length > 10 && (
                        <div className="px-3 pt-2">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <input
                              className="w-full rounded border border-border bg-background pl-6 pr-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                              placeholder="Search values…"
                              value={vSearch}
                              onChange={(e) =>
                                setValueSearch((prev) => ({
                                  ...prev,
                                  [col]: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      )}

                      {/* Capped notice */}
                      {capped && (
                        <div className="px-3 pt-2">
                          <p className="text-[10px] text-amber-600 dark:text-amber-400">
                            Showing first {MAX_FILTER_VALUES} of many values.
                            Use search to find specific values.
                          </p>
                        </div>
                      )}

                      <div className="max-h-48 overflow-y-auto px-3 py-2 space-y-0.5">
                        {filteredValues.length === 0 ? (
                          <p className="py-2 text-center text-[11px] text-muted-foreground">
                            No matching values
                          </p>
                        ) : (
                          filteredValues.map((val) => {
                            const checked = colActiveFilter?.has(val) ?? false;
                            return (
                              <label
                                key={val}
                                className="flex items-center gap-2 rounded px-1 py-1 cursor-pointer hover:bg-muted/30 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  className="h-3 w-3 shrink-0 accent-primary"
                                  checked={checked}
                                  onChange={() => toggleValue(col, val)}
                                />
                                <span
                                  className="text-xs text-foreground/80 truncate"
                                  title={val}
                                >
                                  {val === "" ? (
                                    <span className="italic text-muted-foreground">
                                      empty
                                    </span>
                                  ) : (
                                    val
                                  )}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>

                      {colActiveFilter?.size > 0 && (
                        <div className="border-t border-border px-3 py-1.5">
                          <button
                            className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() => clearColFilter(col)}
                          >
                            Clear filter
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
