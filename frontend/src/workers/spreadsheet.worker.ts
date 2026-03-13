// ─── Spreadsheet Web Worker ───────────────────────────────────────────────────
// ALL data lives here. The main thread never holds the full row array.
//
// STORAGE MODEL: Columnar
//   colStore[ci][ri]      = display value (formatted string)
//   colStoreRaw[ci][ri]   = original string — ONLY allocated for columns that
//                           have been user-retyped (lazy). Halves peak memory.
//   colStoreLower[ci][ri] = pre-lowercased display value — built once at commit,
//                           used for O(1) global search with no per-query allocs.
//   colEpoch[ci][ri]      = date column values as epoch-day integers (days since
//                           Unix epoch). Built at commit for date columns only.
//                           Date filter comparisons become integer ops (no dayjs).
//
// PARSE strategy by file type:
//   .csv/.tsv  → native TextDecoder chunked + fast CSV parser (no SheetJS)
//   .xlsx      → JSZip unzip → manual regex XML parse (no SheetJS for read)
//   .xls       → SheetJS fallback (old binary format, no alternative)
//
// Row cap: 500 000 rows. Excess rows dropped with ROW_CAP message to main thread.
//
// Main → Worker messages:
//   PARSE              { buffer: ArrayBuffer, fileName: string }
//   COMMIT             { headerRowIndex: number }
//   QUERY              { search, filters, dateFilters, sort, page, pageSize }
//   SELECT             { mode, id?, ids?, query? }
//   EXPORT             { config, visibleCols }
//   RETYPE             { colTypes }
//   GET_FILTER_VALUES  { columns: string[] }   ← NEW: returns full distinct values
//   RESET
//
// Worker → Main messages:
//   PREVIEW           { rows: string[][] }
//   READY             { cols, totalRows, detectedTypes }
//   PROGRESS          { phase, pct }
//   SIZE_WARNING      { sizeMB }
//   ROW_CAP           { capped: number, loaded: number }
//   RESULT            { pagedRows, totalRows, processedCount, totalPages,
//                       clampedPage, allFilteredIds: Int32Array (transferable),
//                       allFilteredSelected, selectedCount }
//   FILTER_VALUES     { values: Record<string, string[]> }   ← NEW
//   RETYPE_DONE
//   EXPORT_DONE       { kind, url?, fileName?, files?, description }
//   EXPORT_ERROR      { message }
//   SELECTION         { selectedCount }
//   ERROR             { message }

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import JSZip from "jszip";
import * as XLSX from "xlsx";

dayjs.extend(customParseFormat);
declare const self: Worker;

// ── State ─────────────────────────────────────────────────────────────────────
let colStore: string[][] = [];
// colStoreRaw is LAZY — only allocated per-column when the user retypes it.
// This halves memory vs always keeping a full parallel copy.
let colStoreRaw: Map<number, string[]> = new Map();
// Pre-lowercased store for zero-allocation global search
let colStoreLower: string[][] = [];
// Epoch-day cache for date columns — Int32Array per column index
// epoch day = Math.floor(Date.UTC(y,m,d) / 86400000)
let colEpoch: Map<number, Int32Array> = new Map();

let colIndex: Map<string, number> = new Map();
let columns: string[] = [];
let totalRows = 0;
let selectedIds = new Set<number>();
let colTypes: Record<string, string> = {};
let detectedColIndices = new Set<number>();
// Pre-built full index array — reused across queries, never rebuilt unless data changes
let fullIndexCache: Int32Array | null = null;

// Pre-commit storage
let storedRawRows: string[][] | null = null;
let storedLargeCSVBuffer: ArrayBuffer | null = null;

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 50;
const ZIP_THRESHOLD = 5;
// Smaller chunk size — yields to event loop more often on low-spec machines
const CHUNK_SIZE = 2_000;
// Initial column capacity — smaller than before to avoid over-allocation.
// Grows geometrically via ensureCapacity.
const INITIAL_BLOCK = 10_000;
const FILE_SIZE_WARN_BYTES = 20 * 1024 * 1024; // 20 MB
const CSV_CHUNK_BYTES = 10 * 1024 * 1024; // 10 MB decode slice
const LARGE_CSV_THRESHOLD = 50 * 1024 * 1024; // 50 MB → single-pass stream
const ROW_CAP = 500_000;
// Maximum distinct values returned per column for filter UI
const MAX_FILTER_VALUES = 500;

const EXCEL_DATE_MIN = 25569;
const EXCEL_DATE_MAX = 73050;

// ── Helpers ───────────────────────────────────────────────────────────────────
function yieldToEventLoop(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

function resetState() {
  colStore = [];
  colStoreRaw = new Map();
  colStoreLower = [];
  colEpoch = new Map();
  colIndex = new Map();
  columns = [];
  totalRows = 0;
  selectedIds = new Set();
  colTypes = {};
  detectedColIndices = new Set();
  storedRawRows = null;
  storedLargeCSVBuffer = null;
  fullIndexCache = null;
}

function buildIndexStructures() {
  colIndex = new Map(columns.map((c, i) => [c, i]));
  fullIndexCache = null;
}

function dedupeColumns(header: string[]): string[] {
  const counts: Record<string, number> = {};
  return header.map((h) => {
    const key = String(h ? h.trim() : "").trim() || "Column";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts[key] > 1 ? `${key}_${counts[key]}` : key;
  });
}

// ── Date helpers ──────────────────────────────────────────────────────────────
const CELL_DATE_FORMATS = [
  "M/D/YYYY H:mm:ss",
  "M/D/YYYY h:mm:ss A",
  "M/D/YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD",
  "YYYY-MM-DDTHH:mm:ss",
  "MMM D, YYYY",
  "MMMM D, YYYY",
  "D/M/YYYY",
  "DD/MM/YYYY",
  "D-MMM-YYYY",
  "MMM D YYYY",
];

function parseDate(val: string): Date | null {
  const t = val.trim();
  if (!t) return null;
  for (const fmt of CELL_DATE_FORMATS) {
    const p = dayjs(t, fmt, true);
    if (p.isValid()) return p.toDate();
  }
  return null;
}

/** Convert a display date string to epoch-day integer (days since Unix epoch).
 *  Returns -1 if unparseable — used in colEpoch arrays (Int32Array default 0
 *  would collide with Jan 1 1970, so we use -1 as sentinel). */
function toEpochDay(val: string): number {
  const d = parseDate(val);
  if (!d) return -1;
  return Math.floor(d.getTime() / 86_400_000);
}

/** Convert a YYYY-MM-DD input string to epoch-day integer. */
function inputToEpochDay(s: string): number {
  if (!s) return -1;
  const d = new Date(s + "T00:00:00");
  if (isNaN(d.getTime())) return -1;
  return Math.floor(d.getTime() / 86_400_000);
}

function inputToDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(d: Date): string {
  return dayjs(d).format("MM/DD/YYYY");
}

function isExcelSerial(n: number): boolean {
  // Accept both integer serials (date-only) and fractional serials (datetime).
  // Excel stores datetimes as serial + time fraction e.g. 46026.604 = date + time.
  // Serial 0 and 1 are Excel epoch artifacts (Jan 0/1 1900) — treat as invalid.
  const intPart = Math.floor(n);
  return intPart >= EXCEL_DATE_MIN && intPart <= EXCEL_DATE_MAX;
}

function excelSerialToDate(n: number): string {
  // Strip the time fraction — we only display the date part.
  // Excel serial days since 1899-12-30 (not 1900-01-01 — Excel has a leap year bug).
  const intPart = Math.floor(n);
  return formatDate(new Date(Math.round((intPart - 25569) * 86400 * 1000)));
}

// ── Column type ───────────────────────────────────────────────────────────────
function applyColType(raw: string, type: string, ci: number): string {
  if (!raw) return raw;
  if (type === "date" || (type === "auto" && detectedColIndices.has(ci))) {
    const d = parseDate(raw);
    if (d) return formatDate(d);
  }
  if (type === "number") {
    const n = parseFloat(raw);
    return isNaN(n) ? raw : String(n);
  }
  return raw;
}

// ── Date detection ────────────────────────────────────────────────────────────
function detectDateCols(sample: string[][], numCols: number): Set<number> {
  const result = new Set<number>();
  if (!sample.length) return result;
  for (let ci = 0; ci < numCols; ci++) {
    let hits = 0;
    for (const row of sample) {
      const v = row[ci] ?? "";
      if (v.trim() && parseDate(v)) hits++;
    }
    if (hits / sample.length >= 0.6) result.add(ci);
  }
  return result;
}

// ── Build epoch cache for date columns ────────────────────────────────────────
// Called after colStore is fully populated. Converts date columns to Int32Array
// of epoch-day integers for O(1) date range comparisons during queries.
function buildEpochCache() {
  colEpoch = new Map();
  for (const ci of detectedColIndices) {
    const arr = new Int32Array(totalRows);
    const col = colStore[ci];
    for (let ri = 0; ri < totalRows; ri++) {
      arr[ri] = toEpochDay(col[ri] ?? "");
    }
    colEpoch.set(ci, arr);
  }
}

// ── Columnar row materialiser (on-demand, for paging / export only) ───────────
function getRow(ri: number): Record<string, string> {
  const obj: Record<string, string> = {};
  for (let ci = 0; ci < columns.length; ci++)
    obj[columns[ci]] = colStore[ci][ri] ?? "";
  return obj;
}

// ── GET_FILTER_VALUES handler ─────────────────────────────────────────────────
// Scans the FULL columnar store (not paged rows) for distinct values.
// Caps at MAX_FILTER_VALUES per column to avoid sending huge arrays.
// This is the fix for FilterDrawer only seeing paged data.
function getFilterValues(requestedCols: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const col of requestedCols) {
    const ci = colIndex.get(col) ?? -1;
    if (ci < 0) {
      result[col] = [];
      continue;
    }
    const colArr = colStore[ci];
    const seen = new Set<string>();
    let capped = false;
    for (let ri = 0; ri < totalRows; ri++) {
      const val = colArr[ri] ?? "";
      seen.add(val);
      if (seen.size >= MAX_FILTER_VALUES) {
        capped = true;
        break;
      }
    }
    const sorted = Array.from(seen).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
    // Append a sentinel so the UI can show "Showing first 500 values" hint
    if (capped) sorted.push("__CAPPED__");
    result[col] = sorted;
  }
  return result;
}

// ── CSV parser (small files → string[][]) ────────────────────────────────────
async function parseCSVFromBuffer(buffer: ArrayBuffer): Promise<string[][]> {
  const rows: string[][] = [];
  let row: string[] = [],
    fb: string[] = [],
    inQuotes = false;
  const dec = new TextDecoder("utf-8");
  const total = buffer.byteLength;
  for (let off = 0; off < total; off += CSV_CHUNK_BYTES) {
    const isLast = off + CSV_CHUNK_BYTES >= total;
    const text = dec.decode(
      new Uint8Array(buffer.slice(off, Math.min(off + CSV_CHUNK_BYTES, total))),
      { stream: !isLast }
    );
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            fb.push('"');
            i++;
          } else inQuotes = false;
        } else fb.push(ch);
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === ",") {
          row.push(fb.join(""));
          fb = [];
        } else if (ch === "\n") {
          row.push(fb.join(""));
          fb = [];
          rows.push(row);
          row = [];
        } else if (ch !== "\r") fb.push(ch);
      }
    }
    await yieldToEventLoop();
  }
  if (fb.length || row.length) {
    row.push(fb.join(""));
    rows.push(row);
  }
  return rows;
}

// ── Large CSV → columnar stream ───────────────────────────────────────────────
async function streamCSVToColStore(
  buffer: ArrayBuffer,
  headerRowIndex: number
): Promise<{
  cols: string[];
  detectedTypes: Record<string, string>;
  totalRows: number;
}> {
  const dec = new TextDecoder("utf-8");
  const total = buffer.byteLength;

  let csvCols: string[] = [];
  let headerDone = false;
  let skippedRows = 0;
  let ri = 0;
  let fieldBuf: string[] = [];
  let inQuotes = false;
  let curRow: string[] = [];

  const sample: string[][] = [];
  const SAMPLE_SIZE = 50;
  let dateDetected = false;

  // Geometric growth: start small, grow by 50% each time
  let capacity = INITIAL_BLOCK;

  const ensureCapacity = () => {
    if (ri >= capacity) {
      const next = Math.min(
        capacity + Math.max(INITIAL_BLOCK, Math.floor(capacity * 0.5)),
        ROW_CAP
      );
      capacity = next;
      for (let ci = 0; ci < csvCols.length; ci++) {
        colStore[ci].length = capacity;
        colStoreLower[ci].length = capacity;
      }
    }
  };

  const flushRow = (row: string[]) => {
    if (!headerDone) {
      if (skippedRows < headerRowIndex) {
        skippedRows++;
        return;
      }
      csvCols = dedupeColumns(row);
      columns = csvCols;
      colStore = csvCols.map(() => new Array<string>(capacity));
      colStoreLower = csvCols.map(() => new Array<string>(capacity));
      headerDone = true;
      return;
    }

    if (ri >= ROW_CAP) return;
    ensureCapacity();

    if (!dateDetected) {
      if (sample.length < SAMPLE_SIZE) {
        sample.push(row.slice(0, csvCols.length));
      } else {
        detectedColIndices = detectDateCols(sample, csvCols.length);
        dateDetected = true;
        // Back-apply date formatting to already-stored rows
        for (let pRi = 0; pRi < ri; pRi++) {
          for (const ci of detectedColIndices) {
            const d = parseDate(colStore[ci][pRi] ?? "");
            if (d) {
              const formatted = formatDate(d);
              colStore[ci][pRi] = formatted;
              colStoreLower[ci][pRi] = formatted.toLowerCase();
            }
          }
        }
      }
    }

    for (let ci = 0; ci < csvCols.length; ci++) {
      const raw = row[ci] ?? "";
      const display =
        dateDetected && detectedColIndices.has(ci)
          ? applyColType(raw, "date", ci)
          : raw;
      colStore[ci][ri] = display;
      colStoreLower[ci][ri] = display.toLowerCase();
    }
    ri++;
  };

  for (let off = 0; off < total; off += CSV_CHUNK_BYTES) {
    const isLast = off + CSV_CHUNK_BYTES >= total;
    const text = dec.decode(
      new Uint8Array(buffer.slice(off, Math.min(off + CSV_CHUNK_BYTES, total))),
      { stream: !isLast }
    );
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            fieldBuf.push('"');
            i++;
          } else inQuotes = false;
        } else fieldBuf.push(ch);
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === ",") {
          curRow.push(fieldBuf.join(""));
          fieldBuf = [];
        } else if (ch === "\n") {
          curRow.push(fieldBuf.join(""));
          fieldBuf = [];
          flushRow(curRow);
          curRow = [];
        } else if (ch !== "\r") fieldBuf.push(ch);
      }
    }
    await yieldToEventLoop();
    self.postMessage({
      type: "PROGRESS",
      phase: "Reading CSV",
      pct: Math.round((Math.min(off + CSV_CHUNK_BYTES, total) / total) * 100),
    });
  }

  if (fieldBuf.length || curRow.length) {
    curRow.push(fieldBuf.join(""));
    flushRow(curRow);
  }

  // Trim to exact size
  for (let ci = 0; ci < csvCols.length; ci++) {
    colStore[ci].length = ri;
    colStoreLower[ci].length = ri;
  }
  totalRows = ri;

  // Final date detection pass if we never hit SAMPLE_SIZE
  if (!dateDetected && sample.length > 0) {
    detectedColIndices = detectDateCols(sample, csvCols.length);
    if (detectedColIndices.size > 0) {
      for (let start = 0; start < ri; start += CHUNK_SIZE) {
        const end = Math.min(start + CHUNK_SIZE, ri);
        for (let pRi = start; pRi < end; pRi++) {
          for (const ci of detectedColIndices) {
            const d = parseDate(colStore[ci][pRi] ?? "");
            if (d) {
              const formatted = formatDate(d);
              colStore[ci][pRi] = formatted;
              colStoreLower[ci][pRi] = formatted.toLowerCase();
            }
          }
        }
        await yieldToEventLoop();
      }
    }
  }

  if (ri >= ROW_CAP)
    self.postMessage({ type: "ROW_CAP", capped: ROW_CAP, loaded: ri });

  buildEpochCache();
  buildIndexStructures();

  const detectedTypes: Record<string, string> = {};
  detectedColIndices.forEach((ci) => {
    if (csvCols[ci]) detectedTypes[csvCols[ci]] = "date";
  });

  return { cols: csvCols, detectedTypes, totalRows: ri };
}

// ── Commit string[][] → columnar store (small/xlsx/xls files) ────────────────
// Processes rawRows in-place (index offsets) to avoid the memory cost of
// slicing a full dataRows sub-array.
async function commitToColStore(
  rawRows: string[][],
  headerRowIndex: number
): Promise<{
  cols: string[];
  detectedTypes: Record<string, string>;
  totalRows: number;
}> {
  const headerRow = rawRows[headerRowIndex] ?? [];
  columns = dedupeColumns(headerRow as string[]);
  const numCols = columns.length;

  // Compute row range without slicing the array
  const dataStart = headerRowIndex + 1;
  const dataEnd = Math.min(rawRows.length, dataStart + ROW_CAP);
  const numRows = dataEnd - dataStart;
  const capped = rawRows.length - dataStart > ROW_CAP;

  const sample = rawRows
    .slice(dataStart, Math.min(dataStart + 50, dataEnd))
    .map((r) => r.slice(0, numCols) as string[]);
  detectedColIndices = detectDateCols(sample, numCols);

  const detectedTypes: Record<string, string> = {};
  detectedColIndices.forEach((ci) => {
    if (columns[ci]) detectedTypes[columns[ci]] = "date";
  });

  colStore = columns.map(() => new Array<string>(numRows));
  colStoreLower = columns.map(() => new Array<string>(numRows));
  // colStoreRaw starts empty — allocated lazily per-column only on RETYPE
  colStoreRaw = new Map();
  totalRows = numRows;

  for (let start = 0; start < numRows; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE, numRows);
    for (let ri = start; ri < end; ri++) {
      const srcRow = rawRows[dataStart + ri]; // in-place indexing — no slice
      for (let ci = 0; ci < numCols; ci++) {
        const raw = String(srcRow?.[ci] ?? "");
        const display = applyColType(raw, colTypes[columns[ci]] ?? "auto", ci);
        colStore[ci][ri] = display;
        colStoreLower[ci][ri] = display.toLowerCase();
        // colStoreRaw: only save if this column has a user-set type (RETYPE needed)
        // Otherwise skip — saves ~50% memory for typical use.
        if (colTypes[columns[ci]]) {
          let rawCol = colStoreRaw.get(ci);
          if (!rawCol) {
            rawCol = new Array<string>(numRows);
            colStoreRaw.set(ci, rawCol);
          }
          rawCol[ri] = raw;
        }
      }
    }
    self.postMessage({
      type: "PROGRESS",
      phase: "Processing rows",
      pct: Math.round((end / numRows) * 100),
    });
    await yieldToEventLoop();
  }

  if (capped)
    self.postMessage({ type: "ROW_CAP", capped: ROW_CAP, loaded: numRows });

  buildEpochCache();
  buildIndexStructures();
  return { cols: columns, detectedTypes, totalRows: numRows };
}

// ── XLSX manual parser ────────────────────────────────────────────────────────
function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) =>
      String.fromCharCode(parseInt(h, 16))
    )
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)));
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const siRe = /<si>([\s\S]*?)<\/si>/g;
  const tRe = /<t(?:\s[^>]*)?>([^<]*)<\/t>/g;
  let m: RegExpExecArray | null;
  while ((m = siRe.exec(xml)) !== null) {
    const inner = m[1];
    let text = "";
    let tm: RegExpExecArray | null;
    tRe.lastIndex = 0;
    while ((tm = tRe.exec(inner)) !== null) text += decodeXmlEntities(tm[1]);
    strings.push(text);
  }
  return strings;
}

function parseDateStyleIndices(xml: string): Set<number> {
  // Built-in Excel date format IDs (14–22 = date/time, 45–47 = time)
  const dateNumFmtIds = new Set([
    14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47,
  ]);

  // Custom numFmt → is date? Detect by format code containing unescaped
  // date tokens (y, d, h) or m only when adjacent to y/d/h (not "mm:ss").
  // We use a conservative pattern that avoids false positives on "m" alone.
  const isDateFormatCode = (code: string): boolean => {
    // strip escaped chars and string literals first
    const stripped = code.replace(/"[^"]*"/g, "").replace(/\[[^\]]*\]/g, "");
    return (
      /[yY]/.test(stripped) ||
      /[dD]/.test(stripped) ||
      (/[hH]/.test(stripped) && !/^[^hH]*[mM][^hH]*$/.test(stripped))
    );
  };

  const numFmts = new Map<number, boolean>();
  const nfRe =
    /<numFmt(?=[\s>])[^>]*numFmtId="(\d+)"[^>]*formatCode="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = nfRe.exec(xml)) !== null) {
    numFmts.set(parseInt(m[1], 10), isDateFormatCode(m[2]));
  }

  // Extract ONLY the <cellXfs> block — cell s= attributes index into this,
  // NOT <cellStyleXfs>. Counting from the wrong block causes off-by-N errors.
  const cellXfsMatch = /<cellXfs(?=[\s>])[^>]*>([\s\S]*?)<\/cellXfs>/.exec(xml);
  const cellXfsXml = cellXfsMatch ? cellXfsMatch[1] : xml;

  const result = new Set<number>();
  // Match both self-closing <xf .../> AND open <xf ...> (real xlsx files use
  // non-self-closing xf elements when they contain child nodes like <alignment>)
  const xfRe = /<xf(?=[\s>/])([^>]*?)(?:\/>|>)/g;
  let idx = 0;
  xfRe.lastIndex = 0;
  while ((m = xfRe.exec(cellXfsXml)) !== null) {
    const attrs = m[1];
    const idM = /numFmtId="(\d+)"/.exec(attrs);
    if (idM) {
      const id = parseInt(idM[1], 10);
      if (dateNumFmtIds.has(id) || numFmts.get(id)) result.add(idx);
    }
    idx++;
  }
  return result;
}

// Convert Excel column letters (A, B, ..., Z, AA, AB, ...) to zero-based index.
// Used to place sparse cells at the correct position in the row array.
function colLetterToIndex(col: string): number {
  let idx = 0;
  for (let i = 0; i < col.length; i++)
    idx = idx * 26 + (col.charCodeAt(i) - 64); // A=1, B=2 ...
  return idx - 1; // zero-based
}

function parseSheetXml(
  xml: string,
  sharedStrings: string[],
  dateStyleIndices: Set<number>
): string[][] {
  const rows: string[][] = [];
  const rowRe = /<row(?=[\s>])[^>]*>([\s\S]*?)<\/row>/g;
  const cellRe = /<c(?=[\s>])([^>]*)>([\s\S]*?)<\/c>/g;
  // r= attribute gives the cell address e.g. r="AC4" — col letters + row number
  const rRe = /(?:^|\s)r="([A-Z]+)\d+"/;
  const tRe = /(?:^|\s)t="([^"]*)"/;
  const sRe = /(?:^|\s)s="(\d+)"/;
  const vRe = /<v>([^<]*)<\/v>/;
  const isRe = /<is>[\s\S]*?<t[^>]*>([^<]*)<\/t>/;
  let rm: RegExpExecArray | null;
  while ((rm = rowRe.exec(xml)) !== null) {
    const rowXml = rm[1];
    // Use a sparse object keyed by column index — filled gaps become "".
    // This is critical: Excel omits empty cells from the XML entirely.
    // Without r=-based placement, every skipped cell shifts all subsequent
    // columns left, putting data under the wrong header.
    const sparse: Record<number, string> = {};
    let maxColIdx = -1;
    let cm: RegExpExecArray | null;
    cellRe.lastIndex = 0;
    while ((cm = cellRe.exec(rowXml)) !== null) {
      const attrs = cm[1],
        inner = cm[2];

      // Determine target column index from r= attribute
      const rM = rRe.exec(attrs);
      const colIdx = rM ? colLetterToIndex(rM[1]) : -1;
      if (colIdx < 0) continue; // skip cells with no parseable reference

      const typeM = tRe.exec(attrs);
      const cellType = typeM ? typeM[1] : "";
      const sM = sRe.exec(attrs);
      const styleIdx = sM ? parseInt(sM[1], 10) : -1;
      let value = "";
      if (cellType === "s") {
        const vM = vRe.exec(inner);
        if (vM) value = sharedStrings[parseInt(vM[1], 10)] ?? "";
      } else if (cellType === "b") {
        const vM = vRe.exec(inner);
        value = vM ? (vM[1] === "1" ? "TRUE" : "FALSE") : "";
      } else if (cellType === "str" || cellType === "e") {
        const vM = vRe.exec(inner);
        value = vM ? decodeXmlEntities(vM[1]) : "";
      } else if (cellType === "inlineStr") {
        const iM = isRe.exec(inner);
        value = iM ? decodeXmlEntities(iM[1]) : "";
      } else {
        const vM = vRe.exec(inner);
        if (vM) {
          const num = parseFloat(vM[1]);
          value =
            // Only convert to date if the cell has an explicit date-formatted
            // style. This is the only safe signal — numeric columns like IDs,
            // amounts, and codes share the same integer range as date serials
            // and cannot be distinguished by value alone.
            styleIdx >= 0 &&
            dateStyleIndices.has(styleIdx) &&
            isExcelSerial(num)
              ? excelSerialToDate(num)
              : vM[1];
        }
      }
      sparse[colIdx] = value;
      if (colIdx > maxColIdx) maxColIdx = colIdx;
    }
    if (maxColIdx >= 0) {
      // Materialise sparse object into a dense array, filling gaps with ""
      const cells: string[] = new Array(maxColIdx + 1).fill("");
      for (const [idx, val] of Object.entries(sparse)) cells[Number(idx)] = val;
      rows.push(cells);
    }
  }
  return rows;
}

async function parseXlsxManual(buffer: ArrayBuffer): Promise<string[][]> {
  const zip = await JSZip.loadAsync(buffer);
  let sharedStrings: string[] = [];
  const ssFile = zip.file("xl/sharedStrings.xml");
  if (ssFile) sharedStrings = parseSharedStrings(await ssFile.async("string"));
  let dateStyleIndices = new Set<number>();
  const stylesFile = zip.file("xl/styles.xml");
  if (stylesFile)
    dateStyleIndices = parseDateStyleIndices(await stylesFile.async("string"));
  let sheetPath = "xl/worksheets/sheet1.xml";
  const wbFile = zip.file("xl/workbook.xml");
  if (wbFile) {
    const wbXml = await wbFile.async("string");
    const sheetM = /<sheet(?=[\s>])[^>]*r:id="([^"]*)"/.exec(wbXml);
    if (sheetM) {
      const relsFile = zip.file("xl/_rels/workbook.xml.rels");
      if (relsFile) {
        const relsXml = await relsFile.async("string");
        const relM = new RegExp(`Id="${sheetM[1]}"[^>]*Target="([^"]*)"`).exec(
          relsXml
        );
        if (relM)
          sheetPath = relM[1].startsWith("xl/") ? relM[1] : `xl/${relM[1]}`;
      }
    }
  }
  const sheetFile = zip.file(sheetPath);
  if (!sheetFile) throw new Error(`Sheet not found at ${sheetPath}`);
  return parseSheetXml(
    await sheetFile.async("string"),
    sharedStrings,
    dateStyleIndices
  );
}

// ── PARSE handler ─────────────────────────────────────────────────────────────
async function handleParse(buffer: ArrayBuffer, fileName: string) {
  resetState();
  if (buffer.byteLength > FILE_SIZE_WARN_BYTES)
    self.postMessage({
      type: "SIZE_WARNING",
      sizeMB: (buffer.byteLength / 1024 / 1024).toFixed(1),
    });

  try {
    const lower = fileName.toLowerCase();

    if (lower.endsWith(".csv") || lower.endsWith(".tsv")) {
      if (buffer.byteLength >= LARGE_CSV_THRESHOLD) {
        storedLargeCSVBuffer = buffer;
        const previewText = new TextDecoder("utf-8").decode(
          buffer.slice(0, Math.min(512 * 1024, buffer.byteLength))
        );
        const previewRows = await parseCSVFromBuffer(
          new TextEncoder().encode(previewText).buffer
        );
        self.postMessage({
          type: "PREVIEW",
          rows: previewRows.slice(0, 20).map((r) => r.map(String)),
        });
        return;
      }
      const rows = await parseCSVFromBuffer(buffer);
      storedRawRows = rows;
      self.postMessage({
        type: "PREVIEW",
        rows: rows.slice(0, 20).map((r) => r.map(String)),
      });
      return;
    }

    if (lower.endsWith(".xlsx")) {
      const rows = await parseXlsxManual(buffer);
      storedRawRows = rows;
      self.postMessage({
        type: "PREVIEW",
        rows: rows.slice(0, 20).map((r) => r.map(String)),
      });
      return;
    }

    // XLS fallback via SheetJS
    const workbook = XLSX.read(new Uint8Array(buffer), {
      type: "array",
      dense: false,
      cellDates: true,
      cellFormula: false,
      cellHTML: false,
      cellNF: false,
      sheetStubs: false,
    });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const xlsRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
      raw: true,
    });
    workbook.Sheets = {};
    const rows = xlsRows.map((r) =>
      (r as unknown[]).map((c) =>
        c instanceof Date ? formatDate(c) : String(c ?? "")
      )
    );
    storedRawRows = rows;
    self.postMessage({
      type: "PREVIEW",
      rows: rows.slice(0, 20).map((r) => r.map(String)),
    });
  } catch (err) {
    self.postMessage({ type: "ERROR", message: String(err) });
  }
}

// ── COMMIT handler ────────────────────────────────────────────────────────────
async function handleCommit(headerRowIndex: number) {
  try {
    if (storedLargeCSVBuffer) {
      const buf = storedLargeCSVBuffer;
      storedLargeCSVBuffer = null;
      const result = await streamCSVToColStore(buf, headerRowIndex);
      selectedIds = new Set();
      self.postMessage({ type: "READY", ...result });
      return;
    }
    if (!storedRawRows) {
      self.postMessage({
        type: "ERROR",
        message: "No data — please re-upload.",
      });
      return;
    }
    const rows = storedRawRows;
    storedRawRows = null; // Free pre-commit memory before processing
    const result = await commitToColStore(rows, headerRowIndex);
    selectedIds = new Set();
    self.postMessage({ type: "READY", ...result });
  } catch (err) {
    self.postMessage({ type: "ERROR", message: String(err) });
  }
}

// ── QUERY ─────────────────────────────────────────────────────────────────────
function runQuery(msg: {
  search: string;
  filters: Record<string, string[]>;
  dateFilters: Record<string, { from: string; to: string }>;
  sort: { col: string | null; dir: string | null };
  page: number;
  pageSize?: number;
}) {
  const ps = msg.pageSize ?? PAGE_SIZE;
  const hasFilters = Object.keys(msg.filters).length > 0;
  const hasDateFilter = Object.keys(msg.dateFilters).length > 0;
  const hasSearch = msg.search.trim().length > 0;
  const hasSort = !!(msg.sort.col && msg.sort.dir);

  // Fast path: no filtering needed at all
  if (!hasFilters && !hasDateFilter && !hasSearch && !hasSort) {
    const totalPages = Math.max(1, Math.ceil(totalRows / ps));
    const clampedPage = Math.min(msg.page, totalPages);
    const start = (clampedPage - 1) * ps;
    const pagedRows = [];
    for (let i = start; i < Math.min(start + ps, totalRows); i++)
      pagedRows.push({ ...getRow(i), __id: i });
    if (!fullIndexCache) {
      fullIndexCache = new Int32Array(totalRows);
      for (let i = 0; i < totalRows; i++) fullIndexCache[i] = i;
    }
    // Transfer fullIndexCache as a copy (slice) — keep original intact
    const transferable = fullIndexCache.slice();
    return {
      pagedRows,
      totalRows,
      processedCount: totalRows,
      totalPages,
      clampedPage,
      allFilteredIds: transferable,
      allFilteredSelected: selectedIds.size === totalRows && totalRows > 0,
      selectedCount: selectedIds.size,
    };
  }

  // Filter pass using Uint8Array bitmap — avoids JS object overhead
  const pass = new Uint8Array(totalRows).fill(1);

  if (hasFilters) {
    for (const [col, vals] of Object.entries(msg.filters)) {
      const ci = colIndex.get(col) ?? -1;
      if (ci < 0) continue;
      const col_arr = colStore[ci];
      const valSet = new Set(vals);
      for (let ri = 0; ri < totalRows; ri++) {
        if (pass[ri] && !valSet.has(col_arr[ri] ?? "")) pass[ri] = 0;
      }
    }
  }

  if (hasDateFilter) {
    for (const [col, range] of Object.entries(msg.dateFilters)) {
      const ci = colIndex.get(col) ?? -1;
      if (ci < 0) continue;
      // Use epoch cache for integer comparisons — no dayjs per cell
      const epochArr = colEpoch.get(ci);
      const fromEpoch = inputToEpochDay(range.from);
      const toEpoch = inputToEpochDay(range.to);
      if (epochArr) {
        for (let ri = 0; ri < totalRows; ri++) {
          if (!pass[ri]) continue;
          const ep = epochArr[ri];
          if (ep === -1) {
            pass[ri] = 0;
            continue;
          } // unparseable date
          if (fromEpoch !== -1 && ep < fromEpoch) {
            pass[ri] = 0;
            continue;
          }
          if (toEpoch !== -1 && ep > toEpoch) {
            pass[ri] = 0;
          }
        }
      } else {
        // Fallback for non-date columns used as date filters
        const col_arr = colStore[ci];
        for (let ri = 0; ri < totalRows; ri++) {
          if (!pass[ri]) continue;
          const cellDate = parseDate(col_arr[ri] ?? "");
          if (!cellDate) {
            pass[ri] = 0;
            continue;
          }
          const from = inputToDate(range.from),
            to = inputToDate(range.to);
          if (from && cellDate < from) {
            pass[ri] = 0;
            continue;
          }
          if (to && cellDate > to) {
            pass[ri] = 0;
          }
        }
      }
    }
  }

  if (hasSearch) {
    // Use pre-lowercased store — zero allocations per cell
    const q = msg.search.toLowerCase();
    const numCols = columns.length;
    for (let ri = 0; ri < totalRows; ri++) {
      if (!pass[ri]) continue;
      let found = false;
      for (let ci = 0; ci < numCols && !found; ci++) {
        if ((colStoreLower[ci]?.[ri] ?? "").includes(q)) found = true;
      }
      if (!found) pass[ri] = 0;
    }
  }

  // Count matches first to preallocate exact-size Int32Array — no push resizes
  let matchCount = 0;
  for (let ri = 0; ri < totalRows; ri++) if (pass[ri]) matchCount++;

  const indices = new Int32Array(matchCount);
  let idx = 0;
  for (let ri = 0; ri < totalRows; ri++) {
    if (pass[ri]) indices[idx++] = ri;
  }

  if (hasSort) {
    const sortCi = colIndex.get(msg.sort.col!) ?? -1;
    const dir = msg.sort.dir === "asc" ? 1 : -1;
    if (sortCi >= 0) {
      const sortCol = colStore[sortCi];
      // Convert to regular array for sorting (Int32Array.sort doesn't take comparator in all envs)
      const indicesArr = Array.from(indices);
      indicesArr.sort((a, b) => {
        const av = sortCol[a] ?? "",
          bv = sortCol[b] ?? "";
        const an = parseFloat(av),
          bn = parseFloat(bv);
        if (!isNaN(an) && !isNaN(bn)) return (an - bn) * dir;
        return av.localeCompare(bv) * dir;
      });
      indices.set(indicesArr);
    }
  }

  const processedCount = indices.length;
  const totalPages = Math.max(1, Math.ceil(processedCount / ps));
  const clampedPage = Math.min(msg.page, totalPages);
  const pageStart = (clampedPage - 1) * ps;
  const pageEnd = Math.min(pageStart + ps, processedCount);
  const pagedRows = [];
  for (let i = pageStart; i < pageEnd; i++)
    pagedRows.push({ ...getRow(indices[i]), __id: indices[i] });

  const selCount = indices.reduce(
    (acc, id) => acc + (selectedIds.has(id) ? 1 : 0),
    0
  );

  // Transfer indices as a copy so we retain ownership in the worker
  return {
    pagedRows,
    totalRows,
    processedCount,
    totalPages,
    clampedPage,
    allFilteredIds: indices.slice(), // transferable Int32Array
    allFilteredSelected: indices.length > 0 && selCount === indices.length,
    selectedCount: selectedIds.size,
  };
}

// ── Export helpers ────────────────────────────────────────────────────────────

function buildFileBytes(
  data: Record<string, unknown>[],
  format: string
): Uint8Array | string {
  const safeData = Array.isArray(data) ? data : [];
  if (format === "xml") {
    // XML export: data rows already contain only the xmlCol value under key "__xml"
    // (projected by the EXPORT handler). Each row's value is written verbatim.
    // If xmlWrap is set, each value is wrapped in <export>...</export>.
    // This is handled upstream — buildFileBytes just joins the values.
    const lines: string[] = [];
    for (const r of safeData) {
      const val = String(r["__xml"] ?? "").trim();
      if (val) lines.push(val);
    }
    return lines.join("\n");
  }
  const ws = XLSX.utils.json_to_sheet(safeData, {
    raw: true,
  } as XLSX.JSON2SheetOpts);
  if (format === "xlsx") {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Export");
    const raw = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    }) as ArrayLike<number>;
    return new Uint8Array(raw);
  }
  return XLSX.utils.sheet_to_csv(ws, { FS: format === "tsv" ? "\t" : "," });
}

function buildBlob(data: Record<string, unknown>[], format: string): Blob {
  const bytes = buildFileBytes(data, format);
  if (format === "xlsx") {
    const u8 = bytes as Uint8Array;
    const plain = u8.buffer.slice(
      u8.byteOffset,
      u8.byteOffset + u8.byteLength
    ) as ArrayBuffer;
    return new Blob([plain], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }
  return new Blob([bytes as string], { type: "text/plain" });
}

function resolveName(
  row: Record<string, string>,
  fileNameCol: string,
  fallback: string
): string {
  if (!fileNameCol) return fallback;
  const val = (row[fileNameCol] ?? "").trim();
  return !val || /^(null|undefined|n\/a|-)$/i.test(val) ? fallback : val;
}

// ── Message handler ───────────────────────────────────────────────────────────
self.onmessage = async (e: MessageEvent) => {
  const msg = e.data;

  if (msg.type === "PARSE") {
    await handleParse(
      msg.buffer as ArrayBuffer,
      (msg.fileName as string) ?? ""
    );
  } else if (msg.type === "COMMIT") {
    await handleCommit(msg.headerRowIndex as number);
  } else if (msg.type === "QUERY") {
    const result = runQuery(msg);
    // Transfer allFilteredIds as a transferable ArrayBuffer to avoid structured-clone overhead
    const transferBuf = result.allFilteredIds.buffer;
    self.postMessage({ type: "RESULT", ...result }, [transferBuf]);
  } else if (msg.type === "GET_FILTER_VALUES") {
    // Returns full distinct values from the entire dataset — not just current page
    const values = getFilterValues(msg.columns as string[]);
    self.postMessage({ type: "FILTER_VALUES", values });
  } else if (msg.type === "SELECT") {
    if (msg.mode === "toggle" && msg.id !== undefined) {
      if (selectedIds.has(msg.id)) selectedIds.delete(msg.id);
      else selectedIds.add(msg.id);
    } else if (msg.mode === "clear") {
      selectedIds = new Set();
    } else if (msg.mode === "all") {
      (msg.ids as number[]).forEach((id) => selectedIds.add(id));
    } else if (msg.mode === "deselect") {
      (msg.ids as number[]).forEach((id) => selectedIds.delete(id));
    } else if (msg.mode === "all_query") {
      runQuery(msg.query).allFilteredIds.forEach((id) => selectedIds.add(id));
    } else if (msg.mode === "deselect_query") {
      runQuery(msg.query).allFilteredIds.forEach((id) =>
        selectedIds.delete(id)
      );
    }
    self.postMessage({ type: "SELECTION", selectedCount: selectedIds.size });
  } else if (msg.type === "RETYPE") {
    const newTypes = msg.colTypes as Record<string, string>;
    colTypes = { ...colTypes, ...newTypes };
    for (const [col, type] of Object.entries(newTypes)) {
      const ci = colIndex.get(col) ?? -1;
      if (ci < 0) continue;
      // Lazily allocate raw storage for this column if not already present
      if (!colStoreRaw.has(ci)) {
        const rawCol = new Array<string>(totalRows);
        for (let ri = 0; ri < totalRows; ri++)
          rawCol[ri] = colStore[ci][ri] ?? "";
        colStoreRaw.set(ci, rawCol);
      }
      const rawCol = colStoreRaw.get(ci)!;
      for (let ri = 0; ri < totalRows; ri++) {
        const raw = rawCol[ri] ?? "";
        const display = applyColType(raw, type, ci);
        colStore[ci][ri] = display;
        colStoreLower[ci][ri] = display.toLowerCase();
      }
      // Rebuild epoch cache for this column if it's now/was a date type
      if (type === "date" || detectedColIndices.has(ci)) {
        const arr = new Int32Array(totalRows);
        for (let ri = 0; ri < totalRows; ri++)
          arr[ri] = toEpochDay(colStore[ci][ri] ?? "");
        colEpoch.set(ci, arr);
      }
    }
    self.postMessage({ type: "RETYPE_DONE" });
  } else if (msg.type === "EXPORT") {
    try {
      const config = msg.config;
      const visCols: string[] = Array.isArray(msg.visibleCols)
        ? msg.visibleCols
        : [];

      const exportIndices: number[] = [];
      for (let ri = 0; ri < totalRows; ri++) {
        if (selectedIds.has(ri)) exportIndices.push(ri);
      }

      const isNullName = (row: Record<string, string>) => {
        if (!config.fileNameCol) return false;
        const val = (row[config.fileNameCol] ?? "").trim();
        return !val || /^(null|undefined|n\/a|-)$/i.test(val);
      };

      let finalIndices = exportIndices;
      if (config.mode === "per-row" && config.skipNullNames)
        finalIndices = exportIndices.filter((ri) => !isNullName(getRow(ri)));
      const skippedCount = exportIndices.length - finalIndices.length;

      // For XML exports with xmlCol set, project only that column under the
      // reserved key "__xml" so buildFileBytes can write it verbatim.
      // For all other formats (and XML without xmlCol) project visible columns normally.
      const isXmlColMode = config.format === "xml" && !!config.xmlCol;

      const project = (ri: number): Record<string, unknown> => {
        const row = getRow(ri);
        if (isXmlColMode) {
          const raw = (row[config.xmlCol] ?? "").trim();
          // Apply optional wrap — user can toggle a root element around the value
          const val = config.xmlWrap ? `<export>\n${raw}\n</export>` : raw;
          return { __xml: val };
        }
        return Object.fromEntries(visCols.map((c) => [c, row[c] ?? ""]));
      };

      if (config.mode === "single") {
        const blob = buildBlob(finalIndices.map(project), config.format);
        self.postMessage({
          type: "EXPORT_DONE",
          kind: "file",
          url: URL.createObjectURL(blob),
          fileName: `${config.fileName || "export"}.${config.format}`,
          description: `${finalIndices.length} rows saved`,
        });
      } else if (
        config.mode === "per-row" &&
        finalIndices.length > ZIP_THRESHOLD
      ) {
        const zip = new JSZip();
        const usedNames = new Map<string, number>();
        for (let i = 0; i < finalIndices.length; i++) {
          const row = getRow(finalIndices[i]);
          const safe = resolveName(
            row,
            config.fileNameCol,
            `row_${i + 1}`
          ).replace(/[/:*?"<>|]/g, "_");
          const cnt = usedNames.get(safe) ?? 0;
          usedNames.set(safe, cnt + 1);
          zip.file(
            `${cnt === 0 ? safe : `${safe}_${cnt + 1}`}.${config.format}`,
            buildFileBytes([project(finalIndices[i])], config.format)
          );
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        self.postMessage({
          type: "EXPORT_DONE",
          kind: "zip",
          url: URL.createObjectURL(zipBlob),
          fileName: `${config.zipFileName || "export"}.zip`,
          description: `${finalIndices.length} files zipped${
            skippedCount > 0 ? ` · ${skippedCount} skipped` : ""
          }`,
        });
      } else {
        const files: { url: string; fileName: string }[] = [];
        const usedNames = new Map<string, number>();
        for (let i = 0; i < finalIndices.length; i++) {
          const row = getRow(finalIndices[i]);
          const safe = resolveName(
            row,
            config.fileNameCol,
            `row_${i + 1}`
          ).replace(/[/:*?"<>|]/g, "_");
          const cnt = usedNames.get(safe) ?? 0;
          usedNames.set(safe, cnt + 1);
          files.push({
            url: URL.createObjectURL(
              buildBlob([project(finalIndices[i])], config.format)
            ),
            fileName: `${cnt === 0 ? safe : `${safe}_${cnt + 1}`}.${
              config.format
            }`,
          });
        }
        self.postMessage({
          type: "EXPORT_DONE",
          kind: "files",
          files,
          description: `${files.length} files downloading${
            skippedCount > 0 ? ` · ${skippedCount} skipped` : ""
          }`,
        });
      }
    } catch (err) {
      self.postMessage({ type: "EXPORT_ERROR", message: String(err) });
    }
  } else if (msg.type === "RESET") {
    resetState();
  }
};
