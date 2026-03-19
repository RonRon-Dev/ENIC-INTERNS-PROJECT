# Data Flow

This page describes the full lifecycle of a file from upload to rendered table.

## 1. Upload

User drops or selects a file. The main thread reads it as an `ArrayBuffer` and sends it to the worker:

```
Main → Worker: PARSE { buffer: ArrayBuffer, fileName: string }
```

## 2. Parse (Worker)

The worker parses the file based on its extension:

| Extension | Strategy |
|---|---|
| `.csv` / `.tsv` | Native `TextDecoder` chunked parser — no SheetJS |
| `.xlsx` | JSZip unzip → manual regex XML parse — no SheetJS for read |
| `.xls` | SheetJS fallback (old binary format) |

Progress messages are sent back during parsing:
```
Worker → Main: PROGRESS { phase: string, pct: number }
```

Once complete:
```
Worker → Main: PREVIEW { rows: string[][] }  ← first N rows for header picker
```

## 3. Header Selection

The user selects which row is the header row. Main sends:

```
Main → Worker: COMMIT { headerRowIndex: number }
```

Worker builds the columnar store and sends back:
```
Worker → Main: READY { cols: string[], totalRows: number, detectedTypes: ColTypes }
```

## 4. Query

Every time the user changes search, filters, sort, or page — main sends:

```
Main → Worker: QUERY {
  search: string,
  filters: Record<string, string[]>,
  dateFilters: Record<string, { from: string, to: string }>,
  sort: { col: string, dir: 'asc' | 'desc' },
  page: number,
  pageSize: number
}
```

Worker responds with only the current page:
```
Worker → Main: RESULT {
  pagedRows: Row[],
  totalRows: number,
  processedCount: number,
  totalPages: number,
  clampedPage: number,
  allFilteredIds: Int32Array,   ← transferable, zero-copy
  allFilteredSelected: boolean,
  selectedCount: number
}
```

## 5. Export

```
Main → Worker: EXPORT { config: ExportConfig, visibleCols: string[] }
Worker → Main: EXPORT_DONE { kind, url, fileName, description }
```

The worker builds the file in-thread and returns a blob URL. The main thread triggers the browser download.
