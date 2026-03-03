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
- [Default Credentials](#-default-credentials)
- [Environment Variables](#-environment-variables)
- [Available Roles](#-available-roles)

---

## 🛠 Tech Stack

| Layer     | Technology                               |
|-----------|------------------------------------------|
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
dotnet add package Microsoft.AspNetCore.OpenApi
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package BCrypt.Net-Next
```

Restore and build:

```bash
dotnet restore
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
VITE_API_URL=http://localhost:5000
```

#### 5. Access the Application

| Service      | URL                      |
|--------------|--------------------------|
| Frontend     | http://localhost:5173    |
| Backend API  | http://localhost:5029    |

---

### Docker Installation

> [!IMPORTANT]
> Make sure [Docker Desktop](https://www.docker.com/get-started/) is installed and running before proceeding.

#### 1. Clone the repository

```bash
git clone https://github.com/RonRon-Dev/ENIC-INTERNS-PROJECT.git
cd ENIC-INTERNS-PROJECT
```

#### 2. Build and start all containers

```bash
docker-compose up -d --build

# If images are already built:
docker-compose up -d
```

#### 3. Apply database migrations

```bash
docker-compose exec api dotnet ef database update
```

#### 4. Access the Application

| Service      | URL                      |
|--------------|--------------------------|
| Frontend     | http://localhost:5173    |
| Backend API  | http://localhost:5029    |

#### 5. Stop the containers

```bash
docker-compose down
```

---

## 🔐 Default Credentials

The following accounts are automatically seeded into the database on first run.

> [!WARNING]
> Change these credentials immediately in a production environment.

| Role       | Username               | Password        |
|------------|------------------------|-----------------|
| Superadmin | `enic.mis@superadmin`  | `Superadmin@123` |
| Admin      | `enic.mis@admin`       | `Admin@123`      |

---

## 🌍 Environment Variables

| Variable       | Default                   | Description                        |
|----------------|---------------------------|------------------------------------|
| `VITE_API_URL` | `http://localhost:5000`   | Base URL for the backend API       |

---

## 👥 Available Roles

The following roles are seeded automatically on startup:

| Role           | Description                        |
|----------------|------------------------------------|
| Guest          | Limited read-only access           |
| Admin          | General administrative access      |
| Superadmin     | Full system access                 |
| Developer      | Development team access            |
| Operations     | Operations team access             |
| Marketing      | Marketing team access              |
| Managers       | Management-level access            |
| Documentations | Documentation team access          |
| IT             | IT department access               |
| Others         | Miscellaneous / unassigned roles   |

---

## 🗄️ Database Management

To drop and recreate the database during development:

```bash
# Drop the existing database
dotnet ef database drop

# Re-apply all migrations (also re-seeds default data)
dotnet ef database update
```

---

<div align="center">

Made with ❤️ by ENIC Interns

</div>