import type { ColVisibility, Row, SortState } from "@/types/spreadsheet";
import {
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Minus,
  Square,
} from "lucide-react";
import React from "react";

interface DataTableProps {
  rows: Row[];
  columns: string[];
  visibleCols: ColVisibility;
  selectedIds: Set<number>;
  onToggleRow: (id: number) => void;
  onToggleAll: () => void;
  sort: SortState;
  onSort: (col: string) => void;
  allFilteredSelected: boolean;
  page: number;
  pageSize: number;
}

export const DataTable = React.memo(function DataTable({
  rows,
  columns,
  visibleCols,
  selectedIds,
  onToggleRow,
  onToggleAll,
  sort,
  onSort,
  allFilteredSelected,
  page,
  pageSize,
}: DataTableProps) {
  const visibleColumns = columns.filter((c) => visibleCols[c] !== false);
  const someSelected = rows.some((r) => selectedIds.has(r.__id));

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              <th
                className="w-10 px-3 py-2.5 text-center cursor-pointer"
                onClick={onToggleAll}
              >
                {allFilteredSelected ? (
                  <CheckSquare className="h-3.5 w-3.5 text-primary mx-auto" />
                ) : someSelected ? (
                  <Minus className="h-3.5 w-3.5 text-primary mx-auto" />
                ) : (
                  <Square className="h-3.5 w-3.5 text-muted-foreground/40 mx-auto" />
                )}
              </th>
              <th className="w-12 px-2 py-2.5 text-right font-medium text-muted-foreground/30 select-none">
                #
              </th>
              {visibleColumns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2.5 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                  onClick={() => onSort(col)}
                >
                  <span className="flex items-center gap-1">
                    {col}
                    {sort.col === col ? (
                      sort.dir === "asc" ? (
                        <ChevronUp className="h-3 w-3 shrink-0" />
                      ) : (
                        <ChevronDown className="h-3 w-3 shrink-0" />
                      )
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isSelected = selectedIds.has(row.__id);
              return (
                <tr
                  key={row.__id}
                  onClick={() => onToggleRow(row.__id)}
                  className={`border-b border-border/40 cursor-pointer transition-colors duration-100 ${
                    isSelected
                      ? "bg-primary/10 hover:bg-primary/[0.13]"
                      : i % 2 === 0
                      ? "hover:bg-muted/50"
                      : "bg-muted/20 hover:bg-muted/50"
                  }`}
                >
                  <td className="px-3 py-2 text-center">
                    {isSelected ? (
                      <CheckSquare className="h-3.5 w-3.5 text-primary mx-auto" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-muted-foreground/25 mx-auto" />
                    )}
                  </td>
                  <td
                    className="px-2 py-2 text-right font-mono text-muted-foreground/25 select-none"
                    style={{ fontSize: 10 }}
                  >
                    {(page - 1) * pageSize + i + 1}
                  </td>
                  {visibleColumns.map((col) => (
                    <td
                      key={col}
                      className={`px-3 py-2 whitespace-nowrap max-w-[220px] truncate transition-colors duration-100 ${
                        isSelected ? "text-foreground" : "text-foreground/70"
                      }`}
                      title={String(row[col] ?? "")}
                    >
                      {String(row[col] ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={visibleColumns.length + 2}
                  className="py-14 text-center text-xs text-muted-foreground/40"
                >
                  No rows match your search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
