// ─── Spreadsheet Tool — Shared Types ─────────────────────────────────────────

export interface Row {
  __id: number;
  [key: string]: unknown;
}

export type SortDir = "asc" | "desc" | null;

export interface SortState {
  col: string | null;
  dir: SortDir;
}

export type ColVisibility = Record<string, boolean>;

/** col → set of allowed values. Empty set = no filter on that col. */
export type ActiveFilters = Record<string, Set<string>>;

/** col → { from, to } ISO date strings. Empty string = unbounded. */
export type DateRangeFilters = Record<string, { from: string; to: string }>;

export type ExportFormat = "xlsx" | "csv" | "tsv";
export type ExportMode = "single" | "per-row";

export interface ExportConfig {
  format: ExportFormat;
  mode: ExportMode;
  fileName: string;
  fileNameCol: string;
  zipFileName: string;
}
