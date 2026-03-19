# Configuring Columns

After selecting the header row, the **Configure Columns** dialog appears. This lets you control which columns are visible in the table and how their data types are interpreted.

## Column Visibility

Toggle any column on or off using the checkboxes. Hidden columns are excluded from the table view but are still available when filtering.

::: info
Column visibility also affects exports — only visible columns are included in the exported file.
:::

## Column Types

The system automatically detects column types:

| Type | What it means |
|---|---|
| `auto` | System decides based on content |
| `date` | Treated as a date — enables date range filtering |
| `text` | Treated as plain text |
| `number` | Treated as a number — enables numeric sorting |

You can override the detected type for any column if the system got it wrong.

## Date Detection

The system detects date columns automatically using the following rules:

- Excel date serial numbers are identified **by cell style** (not by value) — this prevents false positives on large numeric columns like claim IDs and peso amounts
- Ambiguous formats like `01/02/2024` are resolved **per column** using MDY vs DMY voting across a sample of values

## Applying

Click **Apply** to load the data into the table.

→ [Filtering & Searching](/user-manual/filtering)
