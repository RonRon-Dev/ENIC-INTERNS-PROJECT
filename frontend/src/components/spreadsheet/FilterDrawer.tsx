import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type {
  ActiveFilters,
  ColVisibility,
  DateRangeFilters,
  Row,
} from "@/types/spreadsheet";
import { isDateColumn } from "@/utils/dateUtils";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";

interface FilterDrawerProps {
  open: boolean;
  columns: string[];
  visibleCols: ColVisibility;
  rows: Row[];
  activeFilters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
  dateRangeFilters: DateRangeFilters;
  onDateRangeChange: (filters: DateRangeFilters) => void;
  onClose: () => void;
}

export function FilterDrawer({
  open,
  columns,
  visibleCols,
  rows,
  activeFilters,
  onFiltersChange,
  dateRangeFilters,
  onDateRangeChange,
  onClose,
}: FilterDrawerProps) {
  const [expandedCols, setExpandedCols] = useState<Set<string>>(new Set());
  const [colSearch, setColSearch] = useState("");
  const [valueSearch, setValueSearch] = useState<Record<string, string>>({});

  const filterableCols = columns.filter((c) => visibleCols[c] !== false);
  const displayCols = colSearch.trim()
    ? filterableCols.filter((c) =>
        c.toLowerCase().includes(colSearch.toLowerCase())
      )
    : filterableCols;

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

  const dateColSet = useMemo(() => {
    const set = new Set<string>();
    for (const col of filterableCols) {
      if (isDateColumn(col, rows)) set.add(col);
    }
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, columns]);

  const getDistinctValues = (col: string) => distinctValuesMap[col] ?? [];

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

                {isExpanded && (
                  <div className="px-4 pb-3 flex flex-col gap-2 bg-muted/10">
                    {isDate ? (
                      <div className="flex flex-col gap-2 pt-1">
                        <p className="text-[11px] text-muted-foreground">
                          Filter by date range
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {(["from", "to"] as const).map((bound) => (
                            <div
                              key={bound}
                              className="flex items-center gap-2"
                            >
                              <label className="text-[11px] text-muted-foreground w-8 shrink-0 capitalize">
                                {bound}
                              </label>
                              <input
                                type="date"
                                className="flex-1 rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                value={dateRange?.[bound] ?? ""}
                                onChange={(e) =>
                                  onDateRangeChange({
                                    ...dateRangeFilters,
                                    [col]: {
                                      from: dateRange?.from ?? "",
                                      to: dateRange?.to ?? "",
                                      [bound]: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                          ))}
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
