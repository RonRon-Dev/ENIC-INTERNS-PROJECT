<div align="center">

# 🌐 ENIC — Management Information System

**Eurolink Network International Corporation**

A centralized MIS platform where employees can access and manage a variety of internal tools and resources within the organization.

[![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-10.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQL Server](https://img.shields.io/badge/SQL_Server-LocalDB%20%7C%20Docker-CC2927?logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Manual Installation](#manual-installation)
  - [Docker Installation](#docker-installation)
- [Contributing Guide](#-contributing-guide) 
  - [Commit Types](#-commit-types)
  - [Version Bumping](#-version-bumping)
  - [Examples](#-examples)
  - [Workflow](#-workflow)
  - [Before Pushing](#-before-pushing)
  - [Pull Request Checklist](#-pull-request-checklist)
- [Default Credentials](#-default-credentials)
- [Environment Variables](#-environment-variables)
- [Available Roles](#-available-roles)
- [Database Management](#-database-management)
- [Frontend Architecture](#-frontend-architecture)
- [Adding a New Tool / Page](#-adding-a-new-tool--page)

---

## 🛠 Tech Stack

| Layer     | Technology                               |
| --------- | ---------------------------------------- |
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS |
| Backend   | ASP.NET Core 10, Entity Framework Core   |
| Database  | Microsoft SQL Server                     |
| Container | Docker, Docker Compose                   |

---

## 📁 Project Structure

```
ENIC-INTERNS-PROJECT/
├── backend/            # ASP.NET Core Web API
├── frontend/           # React + TypeScript (Vite)
├── database/           # SQL Server Docker setup
└── docker-compose.yml
```

---

## 🚀 Getting Started

### Manual Installation

> **Prerequisites:** [.NET 10 SDK](https://dotnet.microsoft.com/download) and [Node.js](https://nodejs.org/) must be installed.

#### 1. Clone the repository

```bash
git clone https://github.com/RonRon-Dev/ENIC-INTERNS-PROJECT.git
cd ENIC-INTERNS-PROJECT
```

#### 2. Set up the Backend

```bash
cd backend
```

Install the EF Core CLI tool:

```bash
dotnet tool install --global dotnet-ef
```

Install required NuGet packages:

```bash
dotnet restore
```

Build the project:

```bash
dotnet build
```

Run database migrations:

```bash
# If no Migrations folder exists, generate one first:
dotnet ef migrations add InitialCreate

# Apply migrations and seed the database:
dotnet ef database update
```

Start the backend server:

```bash
dotnet watch run
```

#### 3. Set up the Frontend

```bash
cd ../frontend
npm install
npm run dev
```

#### 4. Configure Environment Variables

In the `frontend/` directory, create a `.env` file:

```env
VITE_API_URL=http://localhost:5029
```

#### 5. Access the Application

| Service     | URL                   |
| ----------- | --------------------- |
| Frontend    | http://localhost:5173 |
| Backend API | http://localhost:5029 |

---

### Docker Installation

> [!IMPORTANT]
> Make sure [Docker Desktop](https://www.docker.com/get-started/) is installed and running before proceeding.

> [!WARNING]
> You need to change the `VITE_API_URL` in `frontend/.env` 
> to point to the desired api url whether its for development or production.

#### Development Setup
> [!INFO] This setup is intended for development purposes. It uses `dotnet watch run` for hot-reloading 
> the backend and Vite's dev server for the frontend. 
> For production deployment, additional configuration is required.

##### 1. Clone the repository

```bash
git clone https://github.com/RonRon-Dev/ENIC-INTERNS-PROJECT.git
cd ENIC-INTERNS-PROJECT
```

##### 2. Build and start all containers

```bash
docker compose --profile dev up -d --build

# If images are already built:
docker-compose --profile dev up -d
```

##### 3. Create Migrations and Update Database

```bash
docker-compose exec api dotnet ef migrations add InitialCreate
docker-compose exec api dotnet ef database update
```

##### 4. Access the Application

| Service     | URL                   |
| ----------- | --------------------- |
| Frontend    | http://localhost:5173 |
| Backend API | http://localhost:5029 |

##### 5. Stop the containers

```bash
docker-compose down
```

#### Production Setup
> [!INFO] For production deployment, you just need build the container
> for both `web-prod` and `api-prod` it uses nginx to serve the frontend.
> The database will be hosted in a separate sql server instance.

##### 1. Build the production frontend container

```bash
docker compose --profile prod up -d --build
```

---

## Contributing Guide

### Commit Message Convention

This project uses **Conventional Commits** to automate versioning and deployments.
Every commit message must follow this format:
```
<type>: <short description>
```

---

## Commit Types

### Triggers Deployment

| Type | Description | Version Bump | Example |
|------|-------------|--------------|---------|
| `feat` | New feature | **Minor** (0.1.0) | `feat: add user dashboard` |
| `fix` | Bug fix | **Patch** (0.0.1) | `fix: resolve login redirect issue` |
| `refactor` | Code restructure, no feature/fix | **Patch** (0.0.1) | `refactor: simplify auth service` |
| `perf` | Performance improvement | **Patch** (0.0.1) | `perf: optimize database queries` |
| `BREAKING CHANGE` | Breaking API/feature change | **Major** (1.0.0) | `BREAKING CHANGE: redesign auth system` |

### Skips Deployment

| Type | Description | Example |
|------|-------------|---------|
| `chore` | Maintenance, dependencies | `chore: update npm packages` |
| `docs` | Documentation only | `docs: update API documentation` |
| `style` | Formatting, whitespace | `style: fix indentation` |
| `test` | Adding or updating tests | `test: add auth unit tests` |
| `misc` | Miscellaneous changes | `misc: update gitignore` |

---

## Version Bumping

Versions follow **Semantic Versioning** (`MAJOR.MINOR.PATCH`):
```
MAJOR → BREAKING CHANGE commits    (1.0.0 → 2.0.0)
MINOR → feat commits               (0.0.1 → 0.1.0)
PATCH → everything else            (0.0.1 → 0.0.2)
```

---

## Examples

### Good Commit Messages
```bash
feat: add employee management page
fix: resolve null reference in auth service
refactor: clean up dashboard controller
perf: add pagination to user list
BREAKING CHANGE: replace cookie auth with JWT
chore: bump version to beta-v0.1.0
docs: add setup instructions to README
style: format files with csharpier
test: add unit tests for auth service
misc: update .gitignore
```

### Bad Commit Messages
```bash
# too vague
fixed stuff
updated code
changes
wip

# no type prefix
add new feature
bug fix
clean up
```
---

## Workflow
```
1. Create a branch from develop
   git checkout -b feature/your-feature

2. Make your changes and commit
   git commit -m "feat: add your feature"

3. Push your branch
   git push origin feature/your-feature

4. Open a Pull Request to main
   - CI runs automatically (lint, format, type-check, build)
   - PR must pass all checks before merging

5. PR is reviewed and merged to main
   - CD deploys automatically
   - Version is bumped based on commit message
```

---

## Before Pushing

### Frontend
```bash
cd frontend
npm run lint          # check code quality
npm run format:check  # check formatting
npm run type-check    # check TypeScript types
npm run build         # verify build works
```

### Backend
```bash
cd backend
dotnet restore
dotnet format --verify-no-changes  # check formatting
dotnet build                        # verify build works
```

### Database Changes
```bash
# always create migrations before pushing model changes
cd backend
dotnet ef migrations add YourMigrationName
git add .
git commit -m "feat/fix: description of model change"
```

---

## Pull Request Checklist

Before opening a PR make sure:

- [ ] Commit message follows the convention above
- [ ] Code is formatted (`npm run format` / `dotnet format`)
- [ ] No lint errors (`npm run lint`)
- [ ] TypeScript types are correct (`npm run type-check`)
- [ ] Project builds successfully
- [ ] Migrations are created for any model changes
- [ ] `appsettings.Production.json` is **never** committed
- [ ] No secrets or credentials in code

---

## 🔐 Default Credentials

The following accounts are automatically seeded into the database on first run.

> [!WARNING]
> Change these credentials immediately in a production environment.

| Role       | Username              | Password         |
| ---------- | --------------------- | ---------------- |
| Superadmin | `enic.mis@superadmin` | `Superadmin@123` |
| Admin      | `enic.mis@admin`      | `Admin@123`      |

---

## 🌍 Environment Variables
> [!INFO] This is for Development.
> For production, pleas e set the environment variables according to your 
> hosting provider's guidelines (e.g. Azure App Service, AWS Elastic Beanstalk, etc.)

| Variable       | Default                 | Description                  |
| -------------- | ----------------------- | ---------------------------- |
| `VITE_API_URL` | `http://localhost:5029` | Base URL for the backend API |

---

## 👥 Available Roles

The following roles are seeded automatically on startup:

| Role           | Description                      |
| -------------- | -------------------------------- |
| Guest          | Limited read-only access         |
| Admin          | General administrative access    |
| Superadmin     | Full system access               |
| Developer      | Development team access          |
| Operations     | Operations team access           |
| Marketing      | Marketing team access            |
| Managers       | Management-level access          |
| Documentations | Documentation team access        |
| IT             | IT department access             |
| Others         | Miscellaneous / unassigned roles |

> **Note:** Role names are case-insensitive on the frontend. All role comparisons are normalised to lowercase automatically.

---

## 🗄️ Database Management

### Manual (Local)

```bash
dotnet ef database drop
dotnet ef migrations add <MigrationName>
dotnet ef database update
```

### Docker (inside running container)

Run these commands from your host machine — they execute inside the API container:

```bash
# 1. Drop the existing database
docker-compose exec api dotnet ef database drop

# 2. Add a new migration
docker-compose exec api dotnet ef migrations add <MigrationName>

# 3. Apply migrations and re-seed
docker-compose exec api dotnet ef database update
```

> [!WARNING] > **Before adding a new migration**, you must **delete all existing files inside the `Migrations/` folder** in the backend project first. Stale migration files will cause conflicts and `database update` will fail.
>
> ```
> backend/
> └── Migrations/     ← DELETE all files in here before running migrations add
> ```
>
> After clearing the folder, then run `dotnet ef migrations add <MigrationName>` followed by `dotnet ef database update`.

---

## 🧭 Frontend Architecture

The frontend uses a **single source of truth** pattern — all routing, sidebar navigation, home cards, and role-based access control are driven from a single file.

### Key Files

| File                                               | Purpose                                                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/data/tools.ts`                                | **Single source of truth** — defines all tools, routes, icons, allowed roles, and page components |
| `src/data/schema.ts`                               | TypeScript types and `UserRole` enum                                                              |
| `src/data/sidebar.ts`                              | Builds sidebar nav groups dynamically from `toolsData`, filtered by user role                     |
| `src/routes/AppRoutes.tsx`                         | Generates all protected routes dynamically from `toolsData`                                       |
| `src/routes/ProtectedRoutes.tsx`                   | Auth + RBAC guard — redirects unauthenticated users, shows 401 for unauthorized roles             |
| `src/layouts/AppLayout.tsx`                        | App shell — sidebar, breadcrumb (auto-derived from `toolsData`), NProgress bar                    |
| `src/pages/GeneralHomePage.tsx`                    | Home page — tool cards derived from `toolsData`, filtered by role, with live clock                |
| `src/components/app-sidebar.tsx`                   | Sidebar — calls `buildNavGroups(userRole)` at render time, no hardcoded nav                       |
| `src/components/command-menu.tsx`                  | Command palette — role-filtered, uses `buildNavGroups()`                                          |
| `src/pages/tools/subtools/DevelopmentToolPage.tsx` | Fallback for unbuilt routes — shows title, description, and component status                      |
| `src/components/errors/403.tsx`                    | Unauthorized error page — shows restricted route path                                             |
| `src/auth-context.tsx`                             | Auth provider — exposes `user`, `isAuthenticated`, `loading`                                      |

### How RBAC Works

1. User logs in → `auth-context` stores `user.roleName` from the API response
2. `ProtectedRoute` checks `isAuthenticated` and compares `user.roleName` against `allowedRoles`
3. Sidebar, home cards, and command menu all call `hasAccess(userRole, allowedRoles)` from `tools.ts`
4. Role comparisons are always **lowercased on both sides** to prevent casing mismatches
5. Typing `/login` while already authenticated redirects to `/home` (handled by `PublicRoute` in `AppRoutes.tsx`)

### Route Rules

- Maximum **2 levels deep**: `/module` and `/module/subtool` — never 3 levels
- Root module segments (e.g. `Inventory & Assets`) are **not clickable** in the breadcrumb — they have no index route
- The `*` fallback route redirects all unknown URLs to `/home`

---

## ➕ Adding a New Tool / Page

> Only `src/data/tools.ts` needs to be edited. Sidebar, home cards, routes, command menu, and breadcrumb all update automatically.

### Step 1 — Add the tool entry to `tools.ts`

```ts
{
  title: "Reports",
  url: "/reports",
  icon: FileBarChart,
  description: "View and generate system reports",
  allowedRoles: ["superadmin", "admin"],
  // component: ReportsPage,  ← uncomment when page is ready
}
```

### Step 2 — Build your page component

```tsx
// src/pages/tools/ReportsPage.tsx
export default function ReportsPage() {
  return <div>Reports</div>;
}
```

### Step 3 — Wire the component in `tools.ts`

```ts
import { lazy } from "react";
const ReportsPage = lazy(() => import("@/pages/tools/ReportsPage"));

// on the tool entry:
component: ReportsPage,
```

### Step 4 — Add the breadcrumb label

In `src/layouts/AppLayout.tsx`, add the URL segment to `breadcrumbNameMap`:

```ts
reports: "Reports",
```

### ✅ Done — everything else is automatic

> Until a component is assigned, the route renders `DevelopmentToolPage` which shows the tool title, description, and a green/grey indicator of whether a component is registered in `tools.ts`.

### Rules

- `allowedRoles` must use **lowercase** strings only — `"admin"` not `"Admin"`
- Every subtool must have a `url` — without it the home card won't navigate
- Adding a new role requires updating `userRoleSchema` in `src/data/schema.ts`
- Use `lazy()` imports in `tools.ts`, never direct imports — direct imports break the fallback logic

---

<div align="center">

Made with ❤️ by ENIC Interns

</div>
