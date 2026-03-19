# Date Detection

Date detection is one of the trickiest parts of parsing Philippine claims data. This page documents the exact strategy used.

## The Problem

Claims data files contain columns with large numeric values — claim IDs, peso amounts (e.g. `₱ 2,600.00`), PINs, and serial numbers. Naively treating any number above `25569` (the Excel epoch for 1970-01-01) as a date would create massive false positives.

## Strategy: Style-Only Detection for Excel

For `.xlsx` files, date serial detection uses **cell style only** — the `numFmtId` from the cell's `s=` attribute in the XML. It never uses value thresholds.

```
Cell has s= attribute → look up numFmtId in styles.xml → is it a date format? → treat as date
Cell has no s= attribute → treat as plain number, never a date
```

This correctly handles:
- `ClaimNo` columns with values like `20240001234` → not a date (no date style)
- `ChequeDate` with Excel serial `45123` → correctly identified as date (has date style)
- Peso amount columns → not a date (no date style)

## Ambiguous Slash Formats

Text-based date strings like `01/02/2024` are ambiguous — is it Jan 2 or Feb 1?

Resolution is done **per column** via MDY/DMY voting:

1. Sample up to N non-empty values from the column
2. Try to parse each as MDY and DMY
3. Count which interpretation produces more valid dates
4. The winning interpretation becomes the `colDateOrder` for that column

This means `TransactionDate` and `ChequeDate` can resolve independently — one might be MDY, the other DMY.

## Sparse Column Handling

Some date columns like `ChequeDate` and `VoucherDate` are mostly empty (NULL). The sampling threshold is based on **non-empty cells** with a minimum of 3 non-empty cells required, not total rows. This prevents mostly-null columns from being missed.

```ts
// Correct
const hits = nonEmptySample.filter(isDate).length;
const threshold = hits / nonEmpty >= 0.6 && nonEmpty >= 3;

// Wrong (old approach — missed sparse columns)
const threshold = hits / sample.length >= 0.6;
```
