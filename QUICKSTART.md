# Quick Start Guide

Get up and running with the monorepo in minutes.

## Prerequisites

Ensure you have the following installed:

- **Go** 1.21+ ([download](https://go.dev/dl/))
- **Python** 3.11+ ([download](https://www.python.org/downloads/))
- **Poetry** ([install guide](https://python-poetry.org/docs/#installation))
- **Node.js** 20+ ([download](https://nodejs.org/))
- **Docker & Docker Compose** ([install](https://docs.docker.com/get-docker/))
- **Git**

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Install Dependencies

Use the Makefile to install all dependencies:

```bash
make install
```

This will:
- Download Go dependencies
- Install Python packages via Poetry
- Install frontend npm packages

### 3. Install Pre-commit Hooks

```bash
make pre-commit-install
```

## Running Services

### Option 1: Run with Docker Compose (Recommended)

Start all services and the observability stack:

```bash
docker-compose up -d
```

Services will be available at:
- **Go Audit Log Service**: http://localhost:8080
- **Python Audit Service**: http://localhost:8000
- **Web Frontend**: http://localhost:5173
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)
- **Kibana**: http://localhost:5601

### Option 2: Run Services Individually

#### Go Service

```bash
cd apps/backend/go/auditlog-service
go run cmd/server/main.go
```

#### Python Service

```bash
cd apps/backend/python
poetry shell
uvicorn audit_service.main:app --reload
```

#### Frontend

```bash
cd apps/frontend/web
npm run dev
```

## Development Workflow

### Run Tests

```bash
# All tests
make test

# Specific stack
make test-go
make test-python
```

### Run Linters

```bash
# All linters
make lint

# Specific stack
make lint-go
make lint-python
make lint-frontend
```

### Format Code

```bash
make format
```

## Next Steps

- Read the [Development Guide](docs/DEVELOPMENT_GUIDE.md)
- Review [Architecture Documentation](docs/ARCHITECTURE.md)
- Check out [Workflows](docs/WORKFLOWS.md)
- Explore [ADRs](docs/adr/)

## Troubleshooting

### Go Issues

```bash
cd apps/backend/go/auditlog-service
go mod tidy
```

### Python Issues

```bash
cd apps/backend/python
poetry lock
poetry install
```

### Frontend Issues

```bash
cd apps/frontend/web
rm -rf node_modules package-lock.json
npm install
```

## Getting Help

- Check documentation in `docs/`
- Review existing [GitHub Issues](link-to-issues)
- Contact maintainers@example.com
