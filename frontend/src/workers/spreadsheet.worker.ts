// ─── Spreadsheet Web Worker ───────────────────────────────────────────────────
// ALL data lives here. The main thread never holds the full row array.
//
// Main → Worker messages:
//   PARSE    { buffer: ArrayBuffer }                        transferable, zero-copy
//   COMMIT   { headerRowIndex: number }
//   QUERY    { search, filters, dateFilters, sort, page, pageSize }
//   SELECT   { mode: "toggle"|"all"|"clear"|"all_query"|"deselect_query", id?, ids?, query? }
//   EXPORT   { config: ExportConfig, visibleCols: string[] }
//   RETYPE   { colTypes: Record<string, string> }
//   RESET
//
// Worker → Main messages:
//   PREVIEW      { rows: string[][] }
//   READY        { cols: string[], totalRows: number, detectedTypes: Record<string, string> }
//   RESULT       { pagedRows, totalRows, processedCount, totalPages, clampedPage, allFilteredIds, allFilteredSelected, selectedCount }
//   RETYPE_DONE
//   EXPORT_DONE  { kind: "file"|"zip"|"files", url?, fileName?, files?, description }
//   EXPORT_ERROR { message: string }
//   SELECTION    { selectedCount: number }
//   ERROR        { message: string }

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import JSZip from "jszip";
import * as XLSX from "xlsx";

dayjs.extend(customParseFormat);

declare const self: Worker;

// ── Internal state ────────────────────────────────────────────────────────────
let allRows: Record<string, unknown>[] = [];
let rawValues: Record<string, unknown>[] = []; // parallel — pre-conversion cell values
let columns: string[] = [];
let selectedIds = new Set<number>();
let storedWorksheet: XLSX.WorkSheet | null = null;
let colTypes: Record<string, string> = {}; // user-assigned overrides
let detectedColIndices = new Set<number>(); // date col indices from last COMMIT

const PAGE_SIZE = 50;
const ZIP_THRESHOLD = 5;

const EXCEL_DATE_MIN = 25569; // Jan 1 1970
const EXCEL_DATE_MAX = 73050; // Jan 1 2100

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
  const trimmed = val.trim();
  if (!trimmed) return null;
  for (const fmt of CELL_DATE_FORMATS) {
    const parsed = dayjs(trimmed, fmt, true);
    if (parsed.isValid()) return parsed.toDate();
  }
  return null;
}

function inputToDate(s: string): Date | null {
  if (!s) return null;
  const parsed = dayjs(s, "YYYY-MM-DD", true);
  return parsed.isValid() ? parsed.toDate() : null;
}

const excelSerialToDate = (serial: number): string => {
  const ms = (serial - 25569) * 86400 * 1000;
  const d = new Date(ms);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
};

// ── Type conversion ───────────────────────────────────────────────────────────
function applyColType(raw: unknown, type: string, colIndex: number): unknown {
  if (type === "text") return String(raw ?? "");

  if (type === "number") {
    const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));
    return isNaN(n) ? String(raw ?? "") : n;
  }

  if (type === "date") {
    if (raw instanceof Date)
      return `${
        raw.getUTCMonth() + 1
      }/${raw.getUTCDate()}/${raw.getUTCFullYear()}`;
    if (typeof raw === "number") return excelSerialToDate(raw);
    return String(raw ?? "");
  }

  // "auto" — use detected logic
  if (raw instanceof Date)
    return `${(raw as Date).getUTCMonth() + 1}/${(raw as Date).getUTCDate()}/${(
      raw as Date
    ).getUTCFullYear()}`;
  if (typeof raw === "number" && detectedColIndices.has(colIndex))
    return excelSerialToDate(raw as number);
  if (typeof raw === "number" && !isFinite(raw as number)) return "";
  if (typeof raw === "number" && Math.abs(raw as number) > 999_999_999_999)
    return (raw as number).toLocaleString("en", {
      useGrouping: false,
      maximumFractionDigits: 0,
    });
  return raw ?? "";
}

// ── Query ─────────────────────────────────────────────────────────────────────
function runQuery(msg: {
  search: string;
  filters: Record<string, string[]>;
  dateFilters: Record<string, { from: string; to: string }>;
  sort: { col: string | null; dir: "asc" | "desc" | null };
  page: number;
  pageSize?: number;
}) {
  const ps = msg.pageSize ?? PAGE_SIZE;
  let result = allRows;

  const filterEntries = Object.entries(msg.filters).filter(
    ([, vals]) => vals.length > 0
  );
  if (filterEntries.length > 0) {
    const sets = filterEntries.map(
      ([col, vals]) => [col, new Set(vals)] as const
    );
    result = result.filter((row) =>
      sets.every(([col, s]) => s.has(String(row[col] ?? "")))
    );
  }

  const dateEntries = Object.entries(msg.dateFilters).filter(
    ([, r]) => r.from || r.to
  );
  if (dateEntries.length > 0) {
    result = result.filter((row) =>
      dateEntries.every(([col, range]) => {
        const cellDate = parseDate(String(row[col] ?? ""));
        if (!cellDate) return false;
        const from = inputToDate(range.from);
        const to = inputToDate(range.to);
        if (from && cellDate < from) return false;
        if (to && cellDate > to) return false;
        return true;
      })
    );
  }

  if (msg.search.trim()) {
    const q = msg.search.toLowerCase();
    result = result.filter((row) =>
      columns.some((col) =>
        String(row[col] ?? "")
          .toLowerCase()
          .includes(q)
      )
    );
  }

  if (msg.sort.col && msg.sort.dir) {
    const col = msg.sort.col;
    const dir = msg.sort.dir === "asc" ? 1 : -1;
    result = [...result].sort((a, b) => {
      const av = String(a[col] ?? ""),
        bv = String(b[col] ?? "");
      const an = parseFloat(av),
        bn = parseFloat(bv);
      if (!isNaN(an) && !isNaN(bn)) return (an - bn) * dir;
      return av.localeCompare(bv) * dir;
    });
  }

  const processedCount = result.length;
  const totalPages = Math.max(1, Math.ceil(processedCount / ps));
  const clampedPage = Math.min(msg.page, totalPages);
  const pagedRows = result.slice((clampedPage - 1) * ps, clampedPage * ps);
  const allFilteredIds = result.map((r) => (r as { __id: number }).__id);
  const selectedFilteredCount = allFilteredIds.reduce(
    (acc, id) => acc + (selectedIds.has(id) ? 1 : 0),
    0
  );
  const allFilteredSelected =
    allFilteredIds.length > 0 &&
    selectedFilteredCount === allFilteredIds.length;

  return {
    pagedRows,
    totalRows: allRows.length,
    processedCount,
    totalPages,
    clampedPage,
    allFilteredIds,
    allFilteredSelected,
    selectedCount: selectedIds.size,
  };
}

// ── Export helpers ────────────────────────────────────────────────────────────
function getRawXml(row: Record<string, unknown>): string {
  return Object.values(row)
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .join("\n");
}

function buildFileBytes(
  data: Record<string, unknown>[],
  format: string
): Uint8Array<ArrayBuffer> | string {
  if (format === "xml") return data.map(getRawXml).join("\n");
  const ws = XLSX.utils.json_to_sheet(data, {
    raw: true,
  } as XLSX.JSON2SheetOpts);
  if (format === "xlsx") {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Export");
    const raw = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    }) as Uint8Array;
    return new Uint8Array(
      raw.buffer.slice(
        raw.byteOffset,
        raw.byteOffset + raw.byteLength
      ) as ArrayBuffer
    );
  }
  const delim = format === "tsv" ? "\t" : ",";
  return XLSX.utils.sheet_to_csv(ws, { FS: delim });
}

function resolveName(
  row: Record<string, unknown>,
  fileNameCol: string,
  fallback: string
): string {
  if (!fileNameCol) return fallback;
  const val = String(row[fileNameCol] ?? "").trim();
  const isEmpty = !val || /^(null|undefined|n\/a|-)$/i.test(val);
  return isEmpty ? fallback : val;
}

// ── Message handler ───────────────────────────────────────────────────────────
self.onmessage = async (e: MessageEvent) => {
  const msg = e.data;

  // ── PARSE ──
  if (msg.type === "PARSE") {
    try {
      const data = new Uint8Array(msg.buffer as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array", dense: true });
      storedWorksheet = workbook.Sheets[workbook.SheetNames[0]];
      const preview = XLSX.utils.sheet_to_json<string[]>(storedWorksheet, {
        header: 1,
        defval: "",
        raw: false,
        range: { s: { r: 0, c: 0 }, e: { r: 19, c: 999 } },
      }) as string[][];
      self.postMessage({ type: "PREVIEW", rows: preview });
    } catch (err) {
      self.postMessage({ type: "ERROR", message: String(err) });
    }

    // ── COMMIT ──
  } else if (msg.type === "COMMIT") {
    if (!storedWorksheet) {
      self.postMessage({
        type: "ERROR",
        message: "No worksheet — please re-upload.",
      });
      return;
    }
    try {
      const rawRows = XLSX.utils.sheet_to_json<
        (string | number | boolean | null | Date)[]
      >(storedWorksheet, {
        header: 1,
        defval: "",
        raw: true,
        cellDates: true,
      } as XLSX.Sheet2JSONOpts) as (
        | string
        | number
        | boolean
        | null
        | Date
      )[][];

      storedWorksheet = null;

      const headerRow = rawRows[msg.headerRowIndex as number] ?? [];
      const dataRows = rawRows.slice((msg.headerRowIndex as number) + 1);

      const colCounts: Record<string, number> = {};
      columns = headerRow.map((h) => {
        const key = String(h ?? "").trim() || "Column";
        colCounts[key] = (colCounts[key] ?? 0) + 1;
        return colCounts[key] > 1 ? `${key}_${colCounts[key]}` : key;
      });

      // Detect date columns — scan first 20 rows per column
      detectedColIndices = new Set<number>();
      const SAMPLE_SIZE = 20;
      const sampleRows = dataRows.slice(0, SAMPLE_SIZE);
      for (let ci = 0; ci < columns.length; ci++) {
        for (const row of sampleRows) {
          const val = row[ci];
          if (val instanceof Date) {
            detectedColIndices.add(ci);
            break;
          }
          if (
            typeof val === "number" &&
            val >= EXCEL_DATE_MIN &&
            val <= EXCEL_DATE_MAX
          ) {
            detectedColIndices.add(ci);
            break;
          }
        }
      }

      // Build detectedTypes map to send to main thread
      const detectedTypes: Record<string, string> = {};
      for (let ci = 0; ci < columns.length; ci++) {
        detectedTypes[columns[ci]] = detectedColIndices.has(ci)
          ? "date"
          : "text";
      }

      // Reset user overrides on new import
      colTypes = {};

      // Build allRows + rawValues
      allRows = new Array(dataRows.length);
      rawValues = new Array(dataRows.length);
      let count = 0;
      for (let i = 0; i < dataRows.length; i++) {
        const r = dataRows[i];
        if (!r.some((c) => c !== null && c !== "")) continue;
        const obj: Record<string, unknown> = { __id: count };
        const raw: Record<string, unknown> = {};
        for (let ci = 0; ci < columns.length; ci++) {
          const cell = r[ci];
          raw[columns[ci]] = cell;
          const type = colTypes[columns[ci]] ?? "auto";
          obj[columns[ci]] = applyColType(cell, type, ci);
        }
        allRows[count] = obj;
        rawValues[count] = raw;
        count++;
      }
      allRows.length = count;
      rawValues.length = count;
      selectedIds = new Set();

      self.postMessage({
        type: "READY",
        cols: columns,
        totalRows: count,
        detectedTypes,
      });
    } catch (err) {
      self.postMessage({ type: "ERROR", message: String(err) });
    }

    // ── QUERY ──
  } else if (msg.type === "QUERY") {
    self.postMessage({ type: "RESULT", ...runQuery(msg) });

    // ── SELECT ──
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

    // ── RETYPE ──
  } else if (msg.type === "RETYPE") {
    const newTypes = msg.colTypes as Record<string, string>;
    colTypes = { ...colTypes, ...newTypes };

    const changedCols = Object.keys(newTypes);
    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      const raw = rawValues[i];
      for (const col of changedCols) {
        const ci = columns.indexOf(col);
        if (ci === -1) continue;
        row[col] = applyColType(raw[col], colTypes[col] ?? "auto", ci);
      }
    }
    self.postMessage({ type: "RETYPE_DONE" });

    // ── EXPORT ──
  } else if (msg.type === "EXPORT") {
    try {
      const config = msg.config;
      const visibleCols: string[] = msg.visibleCols;

      let exportRows = allRows.filter((r) =>
        selectedIds.has((r as { __id: number }).__id)
      );

      const project = (r: Record<string, unknown>) =>
        Object.fromEntries(visibleCols.map((c) => [c, r[c]]));

      const isNullName = (r: Record<string, unknown>) => {
        if (!config.fileNameCol) return false;
        const val = String(r[config.fileNameCol] ?? "").trim();
        return !val || /^(null|undefined|n\/a|-)$/i.test(val);
      };

      if (config.mode === "per-row" && config.skipNullNames)
        exportRows = exportRows.filter((r) => !isNullName(r));

      const skippedCount = selectedIds.size - exportRows.length;

      if (config.mode === "single") {
        const bytes = buildFileBytes(exportRows.map(project), config.format);
        const blob =
          config.format === "xlsx"
            ? new Blob([bytes as Uint8Array<ArrayBuffer>], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              })
            : new Blob([bytes as string], { type: "text/plain" });
        self.postMessage({
          type: "EXPORT_DONE",
          kind: "file",
          url: URL.createObjectURL(blob),
          fileName: `${config.fileName || "export"}.${config.format}`,
          description: `${exportRows.length} rows saved`,
        });
      } else if (
        config.mode === "per-row" &&
        exportRows.length > ZIP_THRESHOLD
      ) {
        const zip = new JSZip();
        const usedNames = new Map<string, number>();
        for (let i = 0; i < exportRows.length; i++) {
          const row = exportRows[i];
          const safeName = resolveName(
            row,
            config.fileNameCol,
            `row_${i + 1}`
          ).replace(/[/:*?"<>|]/g, "_");
          const cnt = usedNames.get(safeName) ?? 0;
          usedNames.set(safeName, cnt + 1);
          zip.file(
            `${cnt === 0 ? safeName : `${safeName}_${cnt + 1}`}.${
              config.format
            }`,
            buildFileBytes([project(row)], config.format)
          );
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        self.postMessage({
          type: "EXPORT_DONE",
          kind: "zip",
          url: URL.createObjectURL(zipBlob),
          fileName: `${config.zipFileName || "export"}.zip`,
          description: `${exportRows.length} files zipped${
            skippedCount > 0 ? ` · ${skippedCount} skipped` : ""
          }`,
        });
      } else {
        const files: { url: string; fileName: string }[] = [];
        const usedNames = new Map<string, number>();
        for (let i = 0; i < exportRows.length; i++) {
          const row = exportRows[i];
          const safeName = resolveName(
            row,
            config.fileNameCol,
            `row_${i + 1}`
          ).replace(/[/:*?"<>|]/g, "_");
          const cnt = usedNames.get(safeName) ?? 0;
          usedNames.set(safeName, cnt + 1);
          const bytes = buildFileBytes([project(row)], config.format);
          files.push({
            url: URL.createObjectURL(
              new Blob([bytes as Uint8Array<ArrayBuffer>], {
                type: "text/plain",
              })
            ),
            fileName: `${cnt === 0 ? safeName : `${safeName}_${cnt + 1}`}.${
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

    // ── RESET ──
  } else if (msg.type === "RESET") {
    allRows = [];
    rawValues = [];
    columns = [];
    colTypes = {};
    detectedColIndices = new Set();
    selectedIds = new Set();
    storedWorksheet = null;
  }
};
