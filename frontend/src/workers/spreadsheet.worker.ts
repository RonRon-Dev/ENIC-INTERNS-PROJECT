// ─── Spreadsheet Web Worker ───────────────────────────────────────────────────
// ALL data lives here. The main thread never holds the full row array.
//
// STORAGE MODEL: Columnar
//   Instead of allRows[i] = { col1: val, col2: val, ... }  (1 object per row)
//   we store   colStore[colIndex][rowIndex] = val           (1 flat string array per column)
//
//   For 1M rows × 20 cols this reduces heap from ~400 MB to ~40 MB because:
//   - No JS object overhead per row (hidden class, property slots, hash table)
//   - V8 stores flat string arrays far more densely than Record<string,unknown>[]
//   - rawValues is abolished — colStoreRaw[ci][ri] holds original strings for RETYPE
//
// PARSE strategy by file type:
//   .csv/.tsv  → native TextDecoder chunked + fast CSV parser (no SheetJS)
//   .xlsx      → JSZip unzip → manual regex XML parse (no SheetJS for read)
//   .xls       → SheetJS fallback (old binary format, no alternative)
//
// Row cap: 500 000 rows. Excess rows dropped with ROW_CAP message to main thread.
//
// Main → Worker messages:
//   PARSE    { buffer: ArrayBuffer, fileName: string }
//   COMMIT   { headerRowIndex: number }
//   QUERY    { search, filters, dateFilters, sort, page, pageSize }
//   SELECT   { mode, id?, ids?, query? }
//   EXPORT   { config, visibleCols }
//   RETYPE   { colTypes }
//   RESET
//
// Worker → Main messages:
//   PREVIEW      { rows: string[][] }
//   READY        { cols, totalRows, detectedTypes }
//   PROGRESS     { phase, pct }
//   SIZE_WARNING { sizeMB }
//   ROW_CAP      { capped: number, loaded: number }
//   RESULT       { pagedRows, totalRows, processedCount, totalPages, clampedPage, allFilteredIds, allFilteredSelected, selectedCount }
//   RETYPE_DONE
//   EXPORT_DONE  { kind, url?, fileName?, files?, description }
//   EXPORT_ERROR { message }
//   SELECTION    { selectedCount }
//   ERROR        { message }

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import JSZip from "jszip";
import * as XLSX from "xlsx";

dayjs.extend(customParseFormat);
declare const self: Worker;

// ── State ─────────────────────────────────────────────────────────────────────
// Columnar: colStore[ci][ri] = display value, colStoreRaw[ci][ri] = original string
let colStore: string[][] = [];
let colStoreRaw: string[][] = [];
let colIndex: Map<string, number> = new Map(); // col name → colStore index (O(1) lookup)
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
const CHUNK_SIZE = 2_000;
const FILE_SIZE_WARN_BYTES = 20 * 1024 * 1024; // 20 MB
const CSV_CHUNK_BYTES = 10 * 1024 * 1024; // 10 MB decode slice
const LARGE_CSV_THRESHOLD = 50 * 1024 * 1024; // 50 MB → single-pass stream
const ROW_CAP = 500_000;

const EXCEL_DATE_MIN = 25569;
const EXCEL_DATE_MAX = 73050;

// ── Helpers ───────────────────────────────────────────────────────────────────
function yieldToEventLoop(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

function resetState() {
  colStore = [];
  colStoreRaw = [];
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

// Rebuild the column name→index map and full index cache after data is loaded
function buildIndexStructures() {
  colIndex = new Map(columns.map((c, i) => [c, i]));
  // fullIndexCache built lazily on first unfiltered query — avoids allocation at load time
  fullIndexCache = null;
}

function dedupeColumns(header: string[]): string[] {
  const counts: Record<string, number> = {};
  return header.map((h) => {
    const key = String(h ?? "").trim() || "Column";
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

function inputToDate(s: string): Date | null {
  if (!s) return null;
  const p = dayjs(s, "YYYY-MM-DD", true);
  return p.isValid() ? p.toDate() : null;
}

function formatDate(d: Date): string {
  return dayjs(d).format("MM/DD/YYYY");
}

function isExcelSerial(n: number): boolean {
  return Number.isInteger(n) && n >= EXCEL_DATE_MIN && n <= EXCEL_DATE_MAX;
}

function excelSerialToDate(n: number): string {
  return formatDate(new Date(Math.round((n - 25569) * 86400 * 1000)));
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

// ── Columnar row materialiser (on-demand, for paging / export only) ───────────
function getRow(ri: number): Record<string, string> {
  const obj: Record<string, string> = {};
  for (let ci = 0; ci < columns.length; ci++)
    obj[columns[ci]] = colStore[ci][ri] ?? "";
  return obj;
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

  const BLOCK = 100_000;
  let capacity = 0;

  const ensureCapacity = () => {
    if (ri >= capacity) {
      capacity += BLOCK;
      for (let ci = 0; ci < csvCols.length; ci++) {
        colStore[ci].length = capacity;
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
      colStore = csvCols.map(() => new Array<string>(BLOCK));
      colStoreRaw = csvCols.map(() => []);
      capacity = BLOCK;
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
        for (let pRi = 0; pRi < ri; pRi++) {
          for (const ci of detectedColIndices) {
            const d = parseDate(colStore[ci][pRi] ?? "");
            if (d) colStore[ci][pRi] = formatDate(d);
          }
        }
      }
    }

    for (let ci = 0; ci < csvCols.length; ci++) {
      const raw = row[ci] ?? "";
      colStore[ci][ri] =
        dateDetected && detectedColIndices.has(ci)
          ? applyColType(raw, "date", ci)
          : raw;
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

  for (let ci = 0; ci < csvCols.length; ci++) {
    colStore[ci].length = ri;
  }
  totalRows = ri;

  if (!dateDetected && sample.length > 0) {
    detectedColIndices = detectDateCols(sample, csvCols.length);
    if (detectedColIndices.size > 0) {
      for (let start = 0; start < ri; start += CHUNK_SIZE) {
        const end = Math.min(start + CHUNK_SIZE, ri);
        for (let pRi = start; pRi < end; pRi++) {
          for (const ci of detectedColIndices) {
            const d = parseDate(colStore[ci][pRi] ?? "");
            if (d) colStore[ci][pRi] = formatDate(d);
          }
        }
        await yieldToEventLoop();
      }
    }
  }

  if (ri >= ROW_CAP)
    self.postMessage({ type: "ROW_CAP", capped: ROW_CAP, loaded: ri });

  const detectedTypes: Record<string, string> = {};
  detectedColIndices.forEach((ci) => {
    if (csvCols[ci]) detectedTypes[csvCols[ci]] = "date";
  });

  buildIndexStructures();
  return { cols: csvCols, detectedTypes, totalRows: ri };
}

// ── Commit string[][] → columnar store (small/xlsx/xls files) ────────────────
async function commitToColStore(
  rawRows: string[][],
  headerRowIndex: number
): Promise<{
  cols: string[];
  detectedTypes: Record<string, string>;
  totalRows: number;
}> {
  const headerRow = rawRows[headerRowIndex] ?? [];
  const dataEnd = Math.min(rawRows.length, headerRowIndex + 1 + ROW_CAP);
  const dataRows = rawRows.slice(headerRowIndex + 1, dataEnd);
  const capped = rawRows.length - headerRowIndex - 1 > ROW_CAP;

  columns = dedupeColumns(headerRow as string[]);
  const numCols = columns.length;
  const numRows = dataRows.length;

  const sample = dataRows
    .slice(0, 50)
    .map((r) => r.slice(0, numCols) as string[]);
  detectedColIndices = detectDateCols(sample, numCols);

  const detectedTypes: Record<string, string> = {};
  detectedColIndices.forEach((ci) => {
    if (columns[ci]) detectedTypes[columns[ci]] = "date";
  });

  colStore = columns.map(() => new Array<string>(numRows));
  colStoreRaw = columns.map(() => new Array<string>(numRows));
  totalRows = numRows;

  for (let start = 0; start < numRows; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE, numRows);
    for (let ri = start; ri < end; ri++) {
      const srcRow = dataRows[ri];
      for (let ci = 0; ci < numCols; ci++) {
        const raw = String(srcRow[ci] ?? "");
        colStoreRaw[ci][ri] = raw;
        colStore[ci][ri] = applyColType(
          raw,
          colTypes[columns[ci]] ?? "auto",
          ci
        );
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
  let siMatch: RegExpExecArray | null;
  while ((siMatch = siRe.exec(xml)) !== null) {
    let text = "";
    let tMatch: RegExpExecArray | null;
    tRe.lastIndex = 0;
    while ((tMatch = tRe.exec(siMatch[1])) !== null) text += tMatch[1];
    strings.push(decodeXmlEntities(text));
  }
  return strings;
}

function parseDateStyleIndices(stylesXml: string): Set<number> {
  const builtIn = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47]);
  const dateNumFmtIds = new Set<number>();
  const numFmtRe = /<numFmt\b([^>]*)\/>/g;
  let m: RegExpExecArray | null;
  while ((m = numFmtRe.exec(stylesXml)) !== null) {
    const idM = /numFmtId="(\d+)"/.exec(m[1]);
    const codeM = /formatCode="([^"]*)"/.exec(m[1]);
    if (idM && codeM && /[ymd]/i.test(codeM[1]) && !/\[/.test(codeM[1]))
      dateNumFmtIds.add(parseInt(idM[1], 10));
  }
  const indices = new Set<number>();
  const xfsMatch = /<cellXfs>([\s\S]*?)<\/cellXfs>/.exec(stylesXml);
  if (xfsMatch) {
    const xfRe = /<xf\b([^>]*)(?:\/>|>[\s\S]*?<\/xf>)/g;
    let xi = 0;
    let xfM: RegExpExecArray | null;
    while ((xfM = xfRe.exec(xfsMatch[1])) !== null) {
      const idM = /numFmtId="(\d+)"/.exec(xfM[1]);
      if (idM) {
        const id = parseInt(idM[1], 10);
        if (builtIn.has(id) || dateNumFmtIds.has(id)) indices.add(xi);
      }
      xi++;
    }
  }
  return indices;
}

function parseSheetXml(
  xml: string,
  sharedStrings: string[],
  dateStyleIndices: Set<number>
): string[][] {
  const rows: string[][] = [];
  const rowRe = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  const cellRe = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
  const vRe = /<v>([^<]*)<\/v>/;
  const isRe = /<is>[\s\S]*?<t>([^<]*)<\/t>[\s\S]*?<\/is>/;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(xml)) !== null) {
    const cells: string[] = [];
    cellRe.lastIndex = 0;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRe.exec(rowMatch[1])) !== null) {
      const attrs = cellMatch[1],
        inner = cellMatch[2];
      const refM = /\br="([A-Z]+)\d+"/.exec(attrs);
      if (refM) {
        let colIdx = 0;
        for (const ch of refM[1])
          colIdx = colIdx * 26 + (ch.charCodeAt(0) - 64);
        colIdx--;
        while (cells.length < colIdx) cells.push("");
      }
      const typeM = /\bt="([^"]*)"/.exec(attrs);
      const sM = /\bs="(\d+)"/.exec(attrs);
      const cellType = typeM ? typeM[1] : "";
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
            styleIdx >= 0 &&
            dateStyleIndices.has(styleIdx) &&
            isExcelSerial(num)
              ? excelSerialToDate(num)
              : vM[1];
        }
      }
      cells.push(value);
    }
    if (cells.length > 0) rows.push(cells);
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
    const sheetM = /<sheet\b[^>]*r:id="([^"]*)"/.exec(wbXml);
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
    storedRawRows = null;
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

  if (!hasFilters && !hasDateFilter && !hasSearch && !hasSort) {
    const processedCount = totalRows;
    const totalPages = Math.max(1, Math.ceil(processedCount / ps));
    const clampedPage = Math.min(msg.page, totalPages);
    const start = (clampedPage - 1) * ps;
    const pagedRows = [];
    for (let i = start; i < Math.min(start + ps, totalRows); i++)
      pagedRows.push({ ...getRow(i), __id: i });
    if (!fullIndexCache) {
      fullIndexCache = new Int32Array(totalRows);
      for (let i = 0; i < totalRows; i++) fullIndexCache[i] = i;
    }
    return {
      pagedRows,
      totalRows,
      processedCount,
      totalPages,
      clampedPage,
      allFilteredIds: Array.from(fullIndexCache),
      allFilteredSelected: selectedIds.size === totalRows && totalRows > 0,
      selectedCount: selectedIds.size,
    };
  }

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
      const col_arr = colStore[ci];
      const from = inputToDate(range.from),
        to = inputToDate(range.to);
      for (let ri = 0; ri < totalRows; ri++) {
        if (!pass[ri]) continue;
        const cellDate = parseDate(col_arr[ri] ?? "");
        if (!cellDate) {
          pass[ri] = 0;
          continue;
        }
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

  if (hasSearch) {
    const q = msg.search.toLowerCase();
    const numCols = columns.length;
    for (let ri = 0; ri < totalRows; ri++) {
      if (!pass[ri]) continue;
      let found = false;
      for (let ci = 0; ci < numCols && !found; ci++) {
        if ((colStore[ci][ri] ?? "").toLowerCase().includes(q)) found = true;
      }
      if (!found) pass[ri] = 0;
    }
  }

  const indices: number[] = [];
  for (let ri = 0; ri < totalRows; ri++) {
    if (pass[ri]) indices.push(ri);
  }

  if (hasSort) {
    const sortCi = colIndex.get(msg.sort.col!) ?? -1;
    const dir = msg.sort.dir === "asc" ? 1 : -1;
    if (sortCi >= 0) {
      const sortCol = colStore[sortCi];
      indices.sort((a, b) => {
        const av = sortCol[a] ?? "",
          bv = sortCol[b] ?? "";
        const an = parseFloat(av),
          bn = parseFloat(bv);
        if (!isNaN(an) && !isNaN(bn)) return (an - bn) * dir;
        return av.localeCompare(bv) * dir;
      });
    }
  }

  const processedCount = indices.length;
  const totalPages = Math.max(1, Math.ceil(processedCount / ps));
  const clampedPage = Math.min(msg.page, totalPages);
  const pageIndices = indices.slice((clampedPage - 1) * ps, clampedPage * ps);
  const pagedRows = pageIndices.map((ri) => ({ ...getRow(ri), __id: ri }));
  const selCount = indices.reduce(
    (acc, id) => acc + (selectedIds.has(id) ? 1 : 0),
    0
  );

  return {
    pagedRows,
    totalRows,
    processedCount,
    totalPages,
    clampedPage,
    allFilteredIds: indices,
    allFilteredSelected: indices.length > 0 && selCount === indices.length,
    selectedCount: selectedIds.size,
  };
}

// ── Export helpers ────────────────────────────────────────────────────────────

/**
 * Build raw file bytes for the given data + format.
 *
 * FIX 1 — `map` on undefined:
 *   Added `Array.isArray` guard so an accidental non-array never throws.
 *   Also switched xml path from Object.values to Object.entries with null-guard.
 *
 * FIX 2 — `slice` of undefined (xlsx path):
 *   XLSX.write with type:"array" can return a plain number[] in some SheetJS
 *   versions, meaning .buffer/.byteOffset/.byteLength are all undefined.
 *   Fix: always wrap with `new Uint8Array(raw)` instead of relying on .buffer.
 */
function buildFileBytes(
  data: Record<string, unknown>[],
  format: string
): Uint8Array | string {
  const safeData = Array.isArray(data) ? data : [];

  if (format === "xml")
    return safeData
      .map((r) =>
        Object.entries(r ?? {})
          .map(([, v]) => String(v ?? "").trim())
          .filter(Boolean)
          .join("\n")
      )
      .join("\n");

  const ws = XLSX.utils.json_to_sheet(safeData, {
    raw: true,
  } as XLSX.JSON2SheetOpts);

  if (format === "xlsx") {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Export");
    // XLSX.write may return number[] or Uint8Array — re-wrap to guarantee Uint8Array
    const raw = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    }) as ArrayLike<number>;
    return new Uint8Array(raw);
  }

  return XLSX.utils.sheet_to_csv(ws, { FS: format === "tsv" ? "\t" : "," });
}

/**
 * Build a correctly typed Blob for any export format.
 *
 * FIX 3 — corrupted CSV/TSV blob in per-row small-batch path:
 *   The old code hardcast buildFileBytes output as Uint8Array even for CSV/TSV
 *   which returns a string — producing a garbled file. This helper picks the
 *   right Blob constructor based on format.
 */
function buildBlob(data: Record<string, unknown>[], format: string): Blob {
  const bytes = buildFileBytes(data, format);
  if (format === "xlsx") {
    // FIX: Uint8Array<ArrayBufferLike> is not a valid BlobPart in strict TS.
    // Copy into a guaranteed plain ArrayBuffer via slice() to satisfy the type.
    const u8 = bytes as Uint8Array;
    const plain = u8.buffer.slice(
      u8.byteOffset,
      u8.byteOffset + u8.byteLength
    ) as ArrayBuffer;
    return new Blob([plain], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }
  // csv, tsv, xml → plain text
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
    self.postMessage({ type: "RESULT", ...runQuery(msg) });
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
      const hasRaw = colStoreRaw[ci]?.length > 0;
      for (let ri = 0; ri < totalRows; ri++) {
        const raw = hasRaw ? colStoreRaw[ci][ri] ?? "" : colStore[ci][ri] ?? "";
        colStore[ci][ri] = applyColType(raw, type, ci);
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

      const project = (ri: number) => {
        const row = getRow(ri);
        return Object.fromEntries(visCols.map((c) => [c, row[c] ?? ""]));
      };

      if (config.mode === "single") {
        // FIX 2 applied via buildBlob — correct Blob type for all formats
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
          // JSZip accepts both Uint8Array and string — buildFileBytes is fine here
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
        // FIX 3 — was hardcasting string result as Uint8Array for CSV/TSV
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
