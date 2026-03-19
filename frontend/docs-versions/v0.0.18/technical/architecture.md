# System Overview

ENIC MIS is a full-stack web application built by the ENIC interns team over 12 weeks.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| UI | shadcn/ui, Tailwind CSS |
| Data Processing | Web Workers, JSZip, SheetJS (fallback) |
| Forms | React Hook Form + Zod |
| Backend | ASP.NET Core 10 |
| ORM | Entity Framework |
| Database | SQL Server |
| Container | Docker |

## Architecture Diagram

```
Browser
├── Main Thread
│   ├── React UI (DataCleaningPage)
│   ├── useSpreadsheetData hook (message bus)
│   └── Holds only: paged rows, column names, UI state
│
└── Web Worker (spreadsheet.worker.ts)
    ├── Holds ALL row data (columnar store)
    ├── Handles: PARSE → COMMIT → QUERY → SELECT → EXPORT
    └── Returns: paged rows, counts, IDs — never full dataset
```

## Core Design Principle

**The main thread never holds the full dataset.**

All row data lives inside the Web Worker. After a file is committed, the main thread only ever receives the current page of rows (e.g. 12 rows at a time), counts, and filtered row IDs. This is what allows the tool to handle 500,000 rows without freezing the browser.

## Modules

| Module | Description |
|---|---|
<!-- | [Web Worker Design](/technical/web-worker) | Internals of `spreadsheet.worker.ts` | -->
| [Data Flow](/technical/data-flow) | Upload → PARSE → COMMIT → QUERY lifecycle |
| [Columnar Storage](/technical/columnar-storage) | How row data is stored in memory |
| [Message Protocol](/technical/message-protocol) | Full Worker ↔ Main message reference |
| [Date Detection](/technical/date-detection) | How dates are detected and disambiguated |
| [useSpreadsheetData](/technical/use-spreadsheet-data) | Hook API reference |
