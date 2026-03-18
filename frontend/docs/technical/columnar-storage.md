# Columnar Storage

The worker stores all data in a **columnar layout** — column-by-column rather than row-by-row.

## Why Columnar?

Most operations in the Data Cleaning Tool are **column-wise**: search all rows in column A, filter by column B, sort by column C. A columnar layout makes these operations cache-friendly and avoids allocating row objects per query.

## Storage Arrays

```ts
colStore[columnIndex][rowIndex]      // display value — formatted string shown in UI
colStoreRaw[columnIndex][rowIndex]   // original raw value — LAZY, only for retyped columns
colStoreLower[columnIndex][rowIndex] // pre-lowercased display value — built at COMMIT
colEpoch[columnIndex][rowIndex]      // date columns as epoch-day integers
```

### `colStore`
Primary display values. All cells are stored as formatted strings. Currency values like `₱ 2,600.00` are stored as-is after stripping symbols for numeric operations.

### `colStoreRaw` (lazy)
Only allocated for columns the user has manually retyped. This halves peak memory usage compared to always keeping a full parallel copy.

### `colStoreLower`
Built once at `COMMIT` time. Used for O(1) global search — no per-query allocations, no `toLowerCase()` calls per cell during search.

### `colEpoch`
Only built for date columns at `COMMIT`. Stores dates as integer epoch-day values (days since Unix epoch). Date filter comparisons become simple integer comparisons — no `dayjs` calls per cell during filtering.

## Row Cap

Hard cap at **500,000 rows**. Excess rows are dropped and a `ROW_CAP` message is sent to the main thread with the actual loaded count.

## Memory Efficiency

- `colStoreRaw` is lazy — only allocated when a column is retyped
- `colEpoch` is only allocated for date columns
- `allFilteredIds` in `RESULT` is an `Int32Array` sent as a **transferable** — zero-copy across the thread boundary
