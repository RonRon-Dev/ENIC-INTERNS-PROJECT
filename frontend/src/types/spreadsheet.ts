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

export type ExportFormat = "xlsx" | "csv" | "tsv" | "xml";
export type ExportMode = "single" | "per-row";
export type ColumnType = "auto" | "date" | "text" | "number";
export type ColTypes = Record<string, ColumnType>;

export interface ExportConfig {
  format: ExportFormat;
  mode: ExportMode;
  fileName: string;
  /** Per-row only: column whose value drives the output filename */
  fileNameCol: string;
  /** Per-row only: name of the zip archive */
  zipFileName: string;
  /** Per-row only: skip rows where the filename column is null/empty */
  skipNullNames: boolean;
}

/** Result of a pre-export XML heuristic validation scan */
export interface XmlValidationResult {
  invalidCount: number;
  totalScanned: number;
  /** Up to 3 sample row numbers (1-based) that failed */
  sampleRows: number[];
  /** True if the column name could not be found in the worker's index */
  columnNotFound?: boolean;
}
