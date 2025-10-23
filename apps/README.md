# Applications

This directory contains all application services organized by layer and technology.

## Directory Structure

```
apps/
├── backend/
│   ├── go/          # High-performance Go microservices
│   └── python/      # Business logic Python services
└── frontend/
    └── web/         # React + TypeScript SPA
```

## Backend

### Go Services

- Language: Go 1.21+
- Managed via Go workspaces (`go.work` at repository root)
- Use cases: High-throughput ingestion, real-time processing

### Python Services

- Language: Python 3.11+
- Managed via Poetry
- Use cases: Complex business logic, API orchestration, compliance workflows

## Frontend

### Web Application

- Framework: React 18
- Language: TypeScript
- Build tool: Vite
- Styling: CSS (can be extended with Tailwind, CSS Modules, etc.)

## Development

See the [Development Guide](../docs/DEVELOPMENT_GUIDE.md) for detailed instructions on setting up and working with each application type.

## Service Communication

- Backend-to-backend: REST APIs, message queues (future)
- Frontend-to-backend: REST APIs
- All services expose `/health` endpoints for monitoring
