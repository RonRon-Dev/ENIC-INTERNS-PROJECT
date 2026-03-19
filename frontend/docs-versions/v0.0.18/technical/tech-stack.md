# Tech Stack

## Frontend

| Package | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | Latest | Type safety |
| Vite | Latest | Build tool and dev server |
| Tailwind CSS | v4 | Utility-first styling |
| shadcn/ui | Latest | Component library built on Radix UI |
| React Hook Form | Latest | Form state management |
| Zod | Latest | Schema validation |
| dayjs | Latest | Date parsing and formatting |
| JSZip | Latest | ZIP archive creation for per-row export |
| SheetJS (xlsx) | Latest | `.xls` fallback parsing and `.xlsx` write |
| TanStack Table | Latest | Headless table logic |
| Sonner | Latest | Toast notifications |

## Backend

| Package | Purpose |
|---|---|
| ASP.NET Core 10 | Web API framework |
| Entity Framework Core | ORM for SQL Server |
| SQL Server | Primary database |

## Infrastructure

| Tool | Purpose |
|---|---|
| Docker | Containerization |
| GitHub Actions | CI/CD |
| Playwright | E2E testing |

## Key Architectural Decisions

### Why Web Workers?
Parsing 500,000 rows of claims data on the main thread blocks the browser UI for seconds. Moving all data processing to a Web Worker keeps the UI at 60fps regardless of file size.

### Why columnar storage?
Claims data queries are almost always column-wise operations (filter by column, search all columns). Columnar layout is cache-friendly for these access patterns.

### Why manual XML parsing for `.xlsx`?
SheetJS's default `.xlsx` reader is convenient but slow for large files and applies aggressive type coercion that causes false-positive date detection. The manual JSZip + regex approach gives full control over cell style inspection for accurate date detection.

### Why Zod + React Hook Form?
Type-safe form validation with automatic TypeScript inference. Zod schemas serve as the single source of truth for form shape — no duplication between validation rules and TypeScript types.
