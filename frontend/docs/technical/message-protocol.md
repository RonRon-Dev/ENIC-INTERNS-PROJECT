# Worker Message Protocol

Full reference of all messages exchanged between the main thread and the Web Worker.

## Main → Worker

| Message | Payload | Description |
|---|---|---|
| `PARSE` | `{ buffer: ArrayBuffer, fileName: string }` | Send raw file bytes to the worker for parsing |
| `COMMIT` | `{ headerRowIndex: number }` | Confirm the header row and build the columnar store |
| `QUERY` | `{ search, filters, dateFilters, sort, page, pageSize }` | Request a filtered/sorted/paged result |
| `SELECT` | `{ mode, id?, ids?, query? }` | Update row selection state |
| `EXPORT` | `{ config: ExportConfig, visibleCols: string[] }` | Build and return an export file |
| `RETYPE` | `{ colTypes: ColTypes }` | Override detected column types |
| `GET_FILTER_VALUES` | `{ columns: string[] }` | Request full distinct values for filter drawer |
| `VALIDATE_XML` | `{ visibleCol: string }` | Heuristic XML scan on selected rows before export |
| `RESET` | — | Clear all data and reset worker state |

## Worker → Main

| Message | Payload | Description |
|---|---|---|
| `PREVIEW` | `{ rows: string[][] }` | First N rows after PARSE — shown in header picker |
| `READY` | `{ cols, totalRows, detectedTypes }` | Columnar store is built and ready after COMMIT |
| `PROGRESS` | `{ phase: string, pct: number }` | Parse/commit progress update |
| `SIZE_WARNING` | `{ sizeMB: number }` | File exceeds the 20 MB soft warning threshold |
| `ROW_CAP` | `{ capped: number, loaded: number }` | File exceeded 500,000 row hard cap |
| `RESULT` | `{ pagedRows, totalRows, processedCount, totalPages, clampedPage, allFilteredIds, allFilteredSelected, selectedCount }` | Response to QUERY |
| `FILTER_VALUES` | `{ values: Record<string, string[]> }` | Response to GET_FILTER_VALUES |
| `XML_VALIDATION` | `{ invalidCount, totalScanned, sampleRows }` | Response to VALIDATE_XML |
| `RETYPE_DONE` | — | Column retype complete |
| `EXPORT_DONE` | `{ kind, url, fileName, description }` | Export complete — blob URL ready |
| `EXPORT_ERROR` | `{ message: string }` | Export failed |
| `SELECTION` | `{ selectedCount: number }` | Selection state changed |
| `ERROR` | `{ message: string }` | General worker error |

## Notes

- `allFilteredIds` in `RESULT` is an `Int32Array` sent as a **transferable object** — zero-copy across the thread boundary
- `GET_FILTER_VALUES` caps at **500 distinct values per column** — a `__CAPPED__` sentinel is appended to capped columns
- `VALIDATE_XML` only scans the currently selected rows, not all rows
- `EXPORT_DONE` returns a `blob:` URL — it is revoked after 30 seconds to prevent memory leaks, or immediately on `RESET`
