// ─── Spreadsheet Web Worker ───────────────────────────────────────────────────
// ALL data lives here. The main thread never holds the full row array.
//
// Main → Worker messages:
//   PARSE    { buffer: ArrayBuffer }                        transferable, zero-copy
//   COMMIT   { headerRowIndex: number }
//   QUERY    { search, filters, dateFilters, sort, page, visibleCols, pageSize }
//   SELECT   { mode: "toggle"|"all"|"clear"|"toggleAll", id?: number }
//   EXPORT   { config: ExportConfig, selectedIds: number[] }
//   RESET
//
// Worker → Main messages:
//   PREVIEW  { rows: string[][] }
//   READY    { cols: string[], totalRows: number }
//   RESULT   { pagedRows, totalRows, processedCount, allFilteredSelected, selectedCount, allFilteredIds }
//   EXPORT_DONE { url: string, fileName: string, kind: "zip"|"file"|"folder_done" }
//   EXPORT_ERROR { message: string }
//   ERROR    { message: string }

import * as XLSX from "xlsx";
import JSZip from "jszip";

declare const self: Worker;

// ── Internal state ────────────────────────────────────────────────────────────
let allRows: Record<string, unknown>[] = [];   // full dataset, never leaves worker
let columns: string[] = [];
let selectedIds = new Set<number>();
let storedWorksheet: XLSX.WorkSheet | null = null;

const PAGE_SIZE = 50;
const ZIP_THRESHOLD = 5;

// ── Date helpers (inlined — worker can't import from src/) ────────────────────
const DATE_RE = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
function parseDate(val: string): Date | null {
  if (!DATE_RE.test(val.trim())) return null;
  const parts = val.trim().split("/");
  const m = parseInt(parts[0]), d = parseInt(parts[1]);
  let y = parseInt(parts[2]);
  if (y < 100) y += y < 50 ? 2000 : 1900;
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
}
function inputToDate(s: string): Date | null {
  if (!s) return null;
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

// ── Query: filter + sort + paginate entirely in worker ────────────────────────
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

  // Value filters
  const filterEntries = Object.entries(msg.filters).filter(([, vals]) => vals.length > 0);
  if (filterEntries.length > 0) {
    const sets = filterEntries.map(([col, vals]) => [col, new Set(vals)] as const);
    result = result.filter((row) => sets.every(([col, s]) => s.has(String(row[col] ?? ""))));
  }

  // Date range filters
  const dateEntries = Object.entries(msg.dateFilters).filter(([, r]) => r.from || r.to);
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

  // Search
  if (msg.search.trim()) {
    const q = msg.search.toLowerCase();
    result = result.filter((row) =>
      columns.some((col) => String(row[col] ?? "").toLowerCase().includes(q))
    );
  }

  // Sort
  if (msg.sort.col && msg.sort.dir) {
    const col = msg.sort.col;
    const dir = msg.sort.dir === "asc" ? 1 : -1;
    result = [...result].sort((a, b) => {
      const av = String(a[col] ?? ""), bv = String(b[col] ?? "");
      const an = parseFloat(av), bn = parseFloat(bv);
      if (!isNaN(an) && !isNaN(bn)) return (an - bn) * dir;
      return av.localeCompare(bv) * dir;
    });
  }

  const processedCount = result.length;
  const totalPages = Math.max(1, Math.ceil(processedCount / ps));
  const clampedPage = Math.min(msg.page, totalPages);
  const pagedRows = result.slice((clampedPage - 1) * ps, clampedPage * ps);

  // Selection stats against filtered set
  const allFilteredIds = result.map((r) => (r as { __id: number }).__id);
  const selectedFilteredCount = allFilteredIds.reduce(
    (acc, id) => acc + (selectedIds.has(id) ? 1 : 0), 0
  );
  const allFilteredSelected = allFilteredIds.length > 0 &&
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
  return Object.values(row).map((v) => String(v ?? "").trim()).filter(Boolean).join("\n");
}

function buildFileBytes(
  data: Record<string, unknown>[],
  format: string
): Uint8Array | string {
  if (format === "xml") return data.map(getRawXml).join("\n");
  const ws = XLSX.utils.json_to_sheet(data);
  if (format === "xlsx") {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Export");
    return XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
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
        header: 1, defval: "", raw: false,
        range: { s: { r: 0, c: 0 }, e: { r: 19, c: 999 } },
      }) as string[][];

      self.postMessage({ type: "PREVIEW", rows: preview });
    } catch (err) {
      self.postMessage({ type: "ERROR", message: String(err) });
    }

  // ── COMMIT ──
  } else if (msg.type === "COMMIT") {
    if (!storedWorksheet) {
      self.postMessage({ type: "ERROR", message: "No worksheet — please re-upload." });
      return;
    }
    try {
      const rawRows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(
        storedWorksheet, { header: 1, defval: "", raw: true }
      ) as (string | number | boolean | null)[][];

      storedWorksheet = null;

      const headerRow = rawRows[msg.headerRowIndex as number] ?? [];
      const dataRows = rawRows.slice((msg.headerRowIndex as number) + 1);

      const colCounts: Record<string, number> = {};
      columns = headerRow.map((h) => {
        const key = String(h ?? "").trim() || "Column";
        colCounts[key] = (colCounts[key] ?? 0) + 1;
        return colCounts[key] > 1 ? `${key}_${colCounts[key]}` : key;
      });

      // Build rows in worker — never sent to main thread
      allRows = [];
      allRows.length = dataRows.length;
      let count = 0;
      for (let i = 0; i < dataRows.length; i++) {
        const r = dataRows[i];
        if (!r.some((c) => c !== null && c !== "")) continue;
        const obj: Record<string, unknown> = { __id: count };
        for (let ci = 0; ci < columns.length; ci++) obj[columns[ci]] = r[ci] ?? "";
        allRows[count++] = obj;
      }
      allRows.length = count;
      selectedIds = new Set();

      self.postMessage({ type: "READY", cols: columns, totalRows: count });
    } catch (err) {
      self.postMessage({ type: "ERROR", message: String(err) });
    }

  // ── QUERY ──
  } else if (msg.type === "QUERY") {
    const result = runQuery(msg);
    self.postMessage({ type: "RESULT", ...result });

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
      // Select all rows matching the current query
      const result = runQuery(msg.query);
      result.allFilteredIds.forEach((id) => selectedIds.add(id));
    } else if (msg.mode === "deselect_query") {
      // Deselect all rows matching the current query
      const result = runQuery(msg.query);
      result.allFilteredIds.forEach((id) => selectedIds.delete(id));
    }
    self.postMessage({ type: "SELECTION", selectedCount: selectedIds.size });

  // ── EXPORT ──
  } else if (msg.type === "EXPORT") {
    try {
      const config = msg.config;
      const selectedIdSet = selectedIds;   // use worker's own set — never sent from main thread
      const visibleCols: string[] = msg.visibleCols;

      let exportRows = allRows.filter((r) => selectedIdSet.has((r as { __id: number }).__id));

      // Project to visible columns only
      const project = (r: Record<string, unknown>) =>
        Object.fromEntries(visibleCols.map((c) => [c, r[c]]));

      const isNullName = (r: Record<string, unknown>) => {
        if (!config.fileNameCol) return false;
        const val = String(r[config.fileNameCol] ?? "").trim();
        return !val || /^(null|undefined|n\/a|-)$/i.test(val);
      };

      if ((config.mode === "per-row" || config.mode === "folder") && config.skipNullNames) {
        exportRows = exportRows.filter((r) => !isNullName(r));
      }

      const skippedCount = selectedIdSet.size - exportRows.length;

      if (config.mode === "single") {
        const projected = exportRows.map(project);
        const bytes = buildFileBytes(projected, config.format);
        const blob = config.format === "xlsx"
          ? new Blob([bytes as Uint8Array], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
          : new Blob([bytes as string], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        self.postMessage({
          type: "EXPORT_DONE",
          kind: "file",
          url,
          fileName: `${config.fileName || "export"}.${config.format}`,
          description: `${exportRows.length} rows saved`,
        });

      } else if (config.mode === "per-row" && exportRows.length > ZIP_THRESHOLD) {
        const zip = new JSZip();
        const usedNames = new Map<string, number>();

        for (let i = 0; i < exportRows.length; i++) {
          const row = exportRows[i];
          const safeName = resolveName(row, config.fileNameCol, `row_${i + 1}`)
            .replace(/[/:*?"<>|]/g, "_");
          const count = usedNames.get(safeName) ?? 0;
          usedNames.set(safeName, count + 1);
          const uniqueName = count === 0 ? safeName : `${safeName}_${count + 1}`;
          zip.file(`${uniqueName}.${config.format}`, buildFileBytes([project(row)], config.format));
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const skipMsg = skippedCount > 0 ? ` · ${skippedCount} skipped` : "";
        self.postMessage({
          type: "EXPORT_DONE",
          kind: "zip",
          url,
          fileName: `${config.zipFileName || "export"}.zip`,
          description: `${exportRows.length} files zipped${skipMsg}`,
        });

      } else if (config.mode === "folder") {
        // Worker builds all file bytes; main thread writes them via File System Access API.
        const usedNames = new Map<string, number>();
        const fileList: { fileName: string; bytes: ArrayBuffer }[] = [];

        for (let i = 0; i < exportRows.length; i++) {
          const row = exportRows[i];
          const safeName = resolveName(row, config.fileNameCol, `row_${i + 1}`)
            .replace(/[/:*?"<>|]/g, "_");
          const cnt = usedNames.get(safeName) ?? 0;
          usedNames.set(safeName, cnt + 1);
          const uniqueName = cnt === 0 ? safeName : `${safeName}_${cnt + 1}`;
          const raw = buildFileBytes([project(row)], config.format);
          const ab = typeof raw === "string"
            ? new TextEncoder().encode(raw).buffer
            : (raw as Uint8Array).buffer.slice(0); // copy to own buffer
          fileList.push({ fileName: `${uniqueName}.${config.format}`, bytes: ab });
        }

        const transferables = fileList.map((f) => f.bytes);
        const skipMsg = skippedCount > 0 ? ` · ${skippedCount} skipped` : "";
        self.postMessage(
          { type: "EXPORT_FOLDER_FILES", files: fileList, description: `${fileList.length} files ready${skipMsg}` },
          transferables
        );

      } else {
        const files: { url: string; fileName: string }[] = [];
        const usedNames = new Map<string, number>();

        for (let i = 0; i < exportRows.length; i++) {
          const row = exportRows[i];
          const safeName = resolveName(row, config.fileNameCol, `row_${i + 1}`)
            .replace(/[/:*?"<>|]/g, "_");
          const count = usedNames.get(safeName) ?? 0;
          usedNames.set(safeName, count + 1);
          const uniqueName = count === 0 ? safeName : `${safeName}_${count + 1}`;
          const bytes = buildFileBytes([project(row)], config.format);
          const blob = new Blob([bytes], { type: "text/plain" });
          files.push({ url: URL.createObjectURL(blob), fileName: `${uniqueName}.${config.format}` });
        }

        const skipMsg = skippedCount > 0 ? ` · ${skippedCount} skipped` : "";
        self.postMessage({
          type: "EXPORT_DONE",
          kind: "files",
          files,
          description: `${files.length} files downloading${skipMsg}`,
        });
      }
    } catch (err) {
      self.postMessage({ type: "EXPORT_ERROR", message: String(err) });
    }

  // ── RESET ──
  } else if (msg.type === "RESET") {
    allRows = [];
    columns = [];
    selectedIds = new Set();
    storedWorksheet = null;
  }
};