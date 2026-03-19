# Exporting Data

Click the **Export** button in the toolbar to open the Export Configuration dialog.

## Step 1 — Choose a Format

| Format | Extension | Best For |
|---|---|---|
| Excel | `.xlsx` | Default — opens in Excel/LibreOffice |
| CSV | `.csv` | Comma-separated, universal compatibility |
| TSV | `.tsv` | Tab-separated |
| XML | `.xml` | Single-column XML output for system uploads |

::: warning XML format
XML export is only available when **exactly one column is visible**. If you need XML, hide all other columns first using the Columns button in the toolbar, then select XML.

The system also runs a **validation scan** before allowing XML export — it checks that all selected rows contain valid XML content. If any invalid rows are found, you will see a warning with sample row numbers before you can proceed.
:::

## Step 2 — Choose an Export Mode

### Single File
All selected rows are exported into **one file**. This is the default.

- Set a **filename** for the output file
- The date is automatically appended

### One File Per Row
Each selected row is exported as its **own file**, then all files are bundled into a **ZIP archive**.

- Choose which column to use as the **filename** for each row file
- Optionally enable **Skip rows where filename column is empty** to exclude rows with blank or null filename values
- Set a **ZIP archive name**

::: info
Duplicate filenames are automatically resolved by appending `_2`, `_3`, etc.
:::

## Step 3 — Export

Click **Export N rows** to start. The file downloads automatically when ready.

If an error occurs, the dialog stays open with an error message — it does **not** close automatically on failure.

→ [Managing Users](/user-manual/managing-users)
