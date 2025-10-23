# Repository Structure

Complete overview of the monorepo structure.

```
.
├── .github/
│   └── workflows/              # GitHub Actions CI/CD pipelines
│       ├── backend-go.yml      # Go services build/test
│       ├── backend-python.yml  # Python services build/test
│       └── frontend-web.yml    # Frontend build/test
│
├── apps/                       # Application code
│   ├── backend/
│   │   ├── go/                 # Go microservices
│   │   │   ├── auditlog-service/
│   │   │   │   ├── cmd/        # Application entry points
│   │   │   │   │   └── server/
│   │   │   │   │       └── main.go
│   │   │   │   ├── internal/   # Private application code
│   │   │   │   │   └── config/
│   │   │   │   │       └── config.go
│   │   │   │   ├── Dockerfile
│   │   │   │   ├── go.mod
│   │   │   │   ├── go.sum
│   │   │   │   └── README.md
│   │   │   └── README.md
│   │   │
│   │   └── python/             # Python microservices
│   │       ├── src/
│   │       │   └── audit_service/
│   │       │       ├── __init__.py
│   │       │       └── main.py
│   │       ├── tests/
│   │       │   └── test_health.py
│   │       ├── Dockerfile
│   │       ├── pyproject.toml  # Poetry configuration
│   │       └── README.md
│   │
│   ├── frontend/
│   │   └── web/                # React + TypeScript SPA
│   │       ├── public/
│   │       ├── src/
│   │       │   ├── App.tsx
│   │       │   ├── main.tsx
│   │       │   ├── main.css
│   │       │   └── vite-env.d.ts
│   │       ├── .eslintrc.cjs
│   │       ├── Dockerfile
│   │       ├── index.html
│   │       ├── nginx.conf
│   │       ├── package.json
│   │       ├── tsconfig.json
│   │       ├── tsconfig.node.json
│   │       ├── vite.config.ts
│   │       └── README.md
│   │
│   └── README.md
│
├── config/                     # Configuration files
│   ├── logging/
│   ├── monitoring/
│   │   ├── prometheus.yml
│   │   ├── security_rules.yml
│   │   ├── compliance_rules.yml
│   │   └── alertmanager.yml
│   └── security/
│
├── docs/                       # Documentation
│   ├── adr/                    # Architecture Decision Records
│   │   ├── 001-monorepo-structure.md
│   │   ├── 002-service-boundaries.md
│   │   └── README.md
│   ├── compliance/             # Compliance documentation
│   ├── operations/             # Operational runbooks
│   ├── ARCHITECTURE.md         # High-level architecture
│   ├── DEVELOPMENT_GUIDE.md    # Developer setup guide
│   ├── MIGRATION_NOTES.md      # Migration notes
│   └── WORKFLOWS.md            # Development workflows
│
├── infrastructure/             # Infrastructure as Code
│   ├── terraform/
│   └── docker-compose.yml
│
├── scripts/                    # Utility scripts
│
├── services/                   # Legacy Python services (retained)
│   ├── auditing/
│   ├── kyc_aml/
│   ├── logging/
│   ├── monitoring/
│   ├── permissions/
│   ├── security/
│   └── vulnerability/
│
├── tests/                      # Integration tests
│   ├── test_audit_logger.py
│   ├── test_kyc_service.py
│   ├── test_rbac.py
│   └── README.md
│
├── .editorconfig               # Editor configuration
├── .gitignore                  # Git ignore patterns
├── .pre-commit-config.yaml     # Pre-commit hooks configuration
├── CONTRIBUTING.md             # Contribution guidelines
├── docker-compose.yml          # Development environment
├── Dockerfile.audit            # Legacy audit Dockerfile
├── go.work                     # Go workspace configuration
├── Makefile                    # Development commands
├── pyproject.toml              # Legacy Poetry config (root)
├── QUICKSTART.md               # Quick start guide
├── README.md                   # Main documentation
├── requirements.txt            # Legacy Python dependencies
└── STRUCTURE.md                # This file

```

## Key Directories

### `/apps`
Contains all application code organized by layer (backend/frontend) and technology (Go/Python).

### `/docs`
All documentation including architecture decisions, development guides, and operational documentation.

### `/.github/workflows`
CI/CD pipelines that automatically build and test code on push/PR.

### `/config`
Configuration files for logging, monitoring, and security.

### `/infrastructure`
Infrastructure as Code (Terraform) and orchestration (Kubernetes manifests).

## Technology Stack

- **Backend Go**: Go 1.21+, standard library
- **Backend Python**: Python 3.11+, FastAPI, Poetry
- **Frontend**: React 18, TypeScript, Vite
- **Build Tools**: Make, npm, Poetry
- **CI/CD**: GitHub Actions
- **Observability**: Prometheus, Grafana, ELK, Jaeger
- **Infrastructure**: Terraform, Docker, Kubernetes

## Development Tools

- **Pre-commit hooks**: Automated formatting and linting
- **Go Workspace**: Unified dependency management for Go modules
- **Poetry**: Python dependency management
- **npm**: Frontend package management
- **Makefile**: Unified command interface

## Next Steps

- [Quick Start Guide](QUICKSTART.md)
- [Development Guide](docs/DEVELOPMENT_GUIDE.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
