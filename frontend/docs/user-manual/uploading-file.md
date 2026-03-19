# Uploading a File

Navigate to **Operations → Data Cleaning** from the sidebar.

## Supported File Types

| Format | Extension | Notes |
|---|---|---|
| Excel Workbook | `.xlsx` | Recommended |
| CSV | `.csv` | Comma-separated |
| TSV | `.tsv` | Tab-separated |
| Legacy Excel | `.xls` | Older format, slower to process |

## How to Upload

1. You will see a **drop zone** in the center of the page with the text *"Drop your spreadsheet here"*
2. Either:
   - **Drag and drop** your file onto the drop zone, or
   - **Click** the drop zone to open a file browser and select your file
3. The file starts processing immediately — a progress indicator will appear

::: warning Large files
Files over **20 MB** will show a size warning. The system supports up to **500,000 rows**. Rows beyond this limit are dropped and you will be notified with a warning banner.
:::

## What Happens Next

Once the file is read, a **Header Row Picker** dialog opens automatically.

→ [Setting the Header Row](/user-manual/header-row)
