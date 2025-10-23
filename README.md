# Security, Compliance, and Auditing Platform Monorepo

This repository hosts the full stack for the Security, Compliance, and Auditing Platform. It is organized as a monorepo that includes infrastructure-as-code, backend microservices, and the frontend application. Shared tooling, linting, and documentation ensure a consistent developer experience across languages and stacks.

## Repository Layout

```
.
├── apps/
│   ├── backend/
│   │   ├── go/               # Go microservices and Go workspace
│   │   │   └── auditlog-service/
│   │   └── python/           # Python microservices managed with Poetry
│   │       ├── pyproject.toml
│   │       ├── src/
│   │       │   └── audit_service/
│   │       └── tests/
│   └── frontend/
│       └── web/              # React + TypeScript SPA built with Vite
├── docs/
│   └── adr/                  # Architecture Decision Records
├── infrastructure/           # Terraform, Kubernetes, and supporting tooling
├── scripts/                  # Development utilities
├── .github/workflows/        # CI pipelines per stack
└── .pre-commit-config.yaml   # Repository-wide hooks
```

## Backend Services

### Go Services
- Located under `apps/backend/go`
- Each service is its own Go module referenced from `apps/backend/go/go.work`
- Example service: `auditlog-service` exposing `/health` endpoint

#### Run locally
```bash
cd apps/backend/go/auditlog-service
go run cmd/server/main.go
```

#### Test and lint
```bash
cd apps/backend/go/auditlog-service
go test ./...
go vet ./...
```

### Python Services
- Located under `apps/backend/python`
- Managed with [Poetry](https://python-poetry.org/)
- Example FastAPI service: `audit_service`

#### Environment setup
```bash
cd apps/backend/python
poetry install
poetry run uvicorn audit_service.main:app --reload
```

#### Test and lint
```bash
poetry run pytest
poetry run ruff check .
poetry run mypy src
```

## Frontend Application

- Located under `apps/frontend/web`
- Built with React, TypeScript, and Vite
- Uses ESLint for linting

```bash
cd apps/frontend/web
npm install
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Lint source files
npm run type-check
```

## Tooling & Automation

- **Go formatting & vetting**: `gofmt`, `go vet`
- **Python formatting & linting**: `black`, `ruff`, `mypy`
- **JavaScript/TypeScript linting**: `eslint`
- **Pre-commit hooks**: Configured in `.pre-commit-config.yaml` for consistent style across languages
- **CI pipelines**: GitHub Actions workflows per stack (`.github/workflows/*`)

## Development Workflow

1. **Bootstrap tooling**
   - Install pre-commit hooks: `pre-commit install`
   - Ensure Go 1.21+, Python 3.11+, and Node.js 20+ are available

2. **Work on services**
   - Go: update code within service module, run `go test ./...`
   - Python: use Poetry virtualenv (`poetry shell`) for dependencies
   - Frontend: `npm run dev` for a live development server

3. **Run linters and tests**
   - Pre-commit hooks run language-specific linting on staged files
   - CI pipelines validate build, lint, and test for each stack

4. **Documentation**
   - Architecture decisions recorded in `docs/adr`
   - Service-specific documentation inside each service directory

## Architecture Overview

- **Service Boundaries**
  - `auditlog-service` (Go): ingest system-level audit events and expose health endpoint
  - `audit_service` (Python/FastAPI): high-level API for audit event ingestion and retrieval
  - `web` (React): UI visualization and interaction layer

- **Shared Contracts**
  - Services communicate via HTTP/REST
  - Common observability patterns (structured logging, health checks)

- **Deployment**
  - Infrastructure definitions stored in `infrastructure/`
  - CI pipelines produce artifacts suitable for containerization and deployment

## Contributing

1. Fork and clone the repository
2. Install dependencies for the relevant stack
3. Run tests and linters before opening a pull request
4. Document changes in README or ADRs as appropriate

Refer to `CONTRIBUTING.md` for detailed guidelines.
