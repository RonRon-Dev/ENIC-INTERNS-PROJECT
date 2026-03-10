// ─── Date Utilities ───────────────────────────────────────────────────────────
// Generic helpers — not specific to the spreadsheet tool.

// ─── Date Utilities ───────────────────────────────────────────────────────────
// Generic helpers — not specific to the spreadsheet tool.
import type { Row } from "@/types/spreadsheet";

const DATE_RE = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;

/**
 * Returns true if a column looks like it contains dates.
 * Samples the first 20 non-empty, non-NULL values against M/D/YY or M/D/YYYY.
 */
export function isDateColumn(col: string, rows: Row[]): boolean {
  let checked = 0;
  for (const row of rows) {
    const val = String(row[col] ?? "").trim();
    if (!val || val.toUpperCase() === "NULL") continue;
    if (!DATE_RE.test(val)) return false;
    if (++checked >= 20) break;
  }
  return checked > 0;
}

/**
 * Parses M/D/YY or M/D/YYYY → Date.
 * Returns null on failure.
 */
export function parseDate(val: string): Date | null {
  const match = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!match) return null;
  let year = parseInt(match[3], 10);
  if (year < 100) year += year < 50 ? 2000 : 1900;
  const d = new Date(year, parseInt(match[1], 10) - 1, parseInt(match[2], 10));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Converts a YYYY-MM-DD `<input type="date">` value → Date.
 * Returns null for empty strings.
 */
export function inputToDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}
