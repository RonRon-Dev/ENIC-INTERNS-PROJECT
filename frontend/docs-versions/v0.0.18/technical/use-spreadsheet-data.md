# useSpreadsheetData Hook

`useSpreadsheetData` is the main React hook that manages the Web Worker lifecycle and exposes all spreadsheet state and actions to the UI.

## Location

`frontend/src/hooks/useSpreadsheetData.ts`

## Design

The hook is a **thin message-passing shell**. It:
- Spawns and manages the worker
- Sends messages to the worker
- Receives messages and maps them to React state
- Never holds the full row dataset — only paged rows, column names, and UI state

## State Exposed

| State | Type | Description |
|---|---|---|
| `columns` | `string[]` | Column names from the committed header row |
| `pagedRows` | `Row[]` | Current page of rows (max `pageSize`) |
| `totalRows` | `number` | Total rows in the dataset |
| `processedCount` | `number` | Rows matching current filters |
| `totalPages` | `number` | Total pages for current query |
| `clampedPage` | `number` | Current page (clamped to valid range) |
| `selectedCount` | `number` | Number of currently selected rows |
| `allFilteredSelected` | `boolean` | Whether all filtered rows are selected |
| `selectedIds` | `Set<number>` | Row indices selected on the current page |
| `colVisibility` | `ColVisibility` | Per-column visibility map |
| `detectedTypes` | `ColTypes` | Auto-detected column types |
| `activeFilters` | `ActiveFilters` | Active value filters per column |
| `dateRangeFilters` | `DateRangeFilters` | Active date range filters per column |
| `filterValues` | `Record<string, string[]>` | Full distinct values per column (from worker) |
| `filterValuesLoading` | `boolean` | Whether filter values are being fetched |
| `isLoading` | `boolean` | File is being parsed |
| `isExporting` | `boolean` | Export is in progress |
| `hasData` | `boolean` | Whether a file has been committed |
| `showHeaderPicker` | `boolean` | Whether the header picker dialog should show |
| `rawSheetData` | `string[][]` | Preview rows for the header picker |
| `xmlValidation` | `XmlValidationResult \| null` | Last XML validation result |

## Actions

| Action | Description |
|---|---|
| `uploadFile(file)` | Parse a file — sends `PARSE` to worker |
| `commitHeader(rowIndex)` | Confirm header row — sends `COMMIT` |
| `runQuery()` | Re-run current query — sends `QUERY` |
| `selectRow(id)` | Toggle selection of a single row |
| `selectPage(ids)` | Select/deselect all rows on current page |
| `selectAll()` | Select all filtered rows across all pages |
| `clearSelection()` | Deselect all rows |
| `requestExport(config)` | Start export — sends `EXPORT` |
| `validateXml(col)` | Run XML validation — sends `VALIDATE_XML` |
| `requestFilterValues(cols)` | Fetch distinct values — sends `GET_FILTER_VALUES` |
| `retypeColumns(colTypes)` | Override column types — sends `RETYPE` |
| `clearAllFilters()` | Reset all active filters and re-query |
| `resetData()` | Terminate worker, clear all state |

## Constants

```ts
DEFAULT_PAGE_SIZE = 12
PAGE_SIZE_OPTIONS = [12, 25, 50, 100]
MAX_FILTER_VALUES = 500     // matches worker cap
SEARCH_DEBOUNCE_MS = 500
REVOKE_DELAY_MS = 30_000    // blob URL cleanup delay
```
