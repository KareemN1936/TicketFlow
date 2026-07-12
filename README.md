# TicketFlow

TicketFlow is a full-stack IT support ticket management system for employees, IT support agents, managers, and administrators. It helps teams submit support requests, assign and track work, communicate on tickets, review activity, and monitor service desk performance.

## Features

- JWT authentication with ASP.NET Identity
- Role-based access for Admin, IT Support Agent, Manager, and Employee users
- Ticket creation, editing, assignment, status updates, comments, and audit activity
- File attachment support with validation
- Real-time in-app notifications with SignalR
- Dashboard analytics and reporting
- Admin user management
- Optional AI-assisted ticket categorization and priority suggestions through Groq
- Export-ready reports using ClosedXML and QuestPDF

## Tech Stack

- Frontend: React, Vite, React Router, Axios, Recharts
- Backend: ASP.NET Core, Entity Framework Core, ASP.NET Identity, SignalR
- Database: SQL Server / SQL Server Express
- API Documentation: Swagger / OpenAPI

## Repository Structure

```text
backend/TicketFlow.API/   ASP.NET Core Web API
frontend/ticketflow/      React/Vite frontend
database/                 SQL schema, seed data, and ER diagrams
docs/                     Requirements, workflows, and wireframes
```

## Prerequisites

- .NET SDK 10
- Node.js and npm
- SQL Server or SQL Server Express
- Optional: a Groq API key for AI features

## Getting Started

1. Clone the repository.

```bash
git clone <repository-url>
cd TicketFlow
```

2. Configure the backend.

Update `backend/TicketFlow.API/appsettings.json` or create an ignored `appsettings.Development.json` with your local SQL Server connection string, JWT secret, email settings, and frontend URL.

For AI features, copy the example environment file and add your Groq key:

```bash
cd backend/TicketFlow.API
copy .env.example .env
```

3. Run the backend API.

```bash
dotnet run --project backend/TicketFlow.API/TicketFlow.API.csproj
```

The API applies migrations and seeds local development roles/users on startup. Swagger is available in development at `/swagger`.

4. Run the frontend.

```bash
cd frontend/ticketflow
npm install
npm run dev
```

The frontend expects the API at `http://localhost:5215/api`.

## Seeded Development Accounts

The backend seeds these accounts for local testing:

| Role | Email | Password |
|---|---|---|
| Admin | admin@ticketflow.com | Password123. |
| IT Support Agent | itsupportagent@ticketflow.com | Password123. |
| Employee | employee@ticketflow.com | Password123. |
| Manager | manager@ticketflow.com | Password123. |

## Verification

From the repository root:

```bash
dotnet build backend/TicketFlow.API/TicketFlow.API.csproj
```

From `frontend/ticketflow`:

```bash
npm run build
npm run lint
npm audit --audit-level=high
```

## Documentation

- Requirements: `docs/requirements.md`
- Workflow diagrams: `docs/workflows/system-workflows.md`
- Wireframes: `docs/wireframes/wireframes.md`
- Database schema and ER diagrams: `database/`

## Security Notes

- Do not commit real `.env` files, SMTP passwords, JWT secrets, or production connection strings.
- `appsettings.Development.json`, `.env`, uploaded files, build outputs, logs, and dependency folders are ignored by Git.
- Replace the placeholder JWT secret before running outside local development.
