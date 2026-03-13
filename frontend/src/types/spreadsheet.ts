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
export type ExportMode = "single" | "per-row" | "folder";
export type ColumnType = "auto" | "date" | "text" | "number";
export type ColTypes = Record<string, ColumnType>;

export interface ExportConfig {
  format: ExportFormat;
  mode: ExportMode;
  fileName: string;
  fileNameCol: string;
  zipFileName: string;
  /** Per-row only: skip rows where the filename column is null/empty */
  skipNullNames: boolean;
  /**
   * XML only: column whose value is already-formatted XML and should be written
   * directly as the file content instead of generating XML from all columns.
   * Empty string = generate XML from all visible columns (legacy behaviour).
   */
  xmlCol: string;
  /**
   * XML only: when xmlCol is set, wrap the raw value in a root element.
   * Default false — the raw column value is written verbatim.
   */
  xmlWrap: boolean;
}
