# Development Guide

This guide provides detailed instructions for developing services in the monorepo.

## Prerequisites

Install the following tools:

- **Go**: Version 1.21 or higher
  ```bash
  wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
  sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
  export PATH=$PATH:/usr/local/go/bin
  ```

- **Python**: Version 3.11 or higher
  ```bash
  sudo apt-get update
  sudo apt-get install python3.11 python3.11-venv
  ```

- **Poetry**: For Python dependency management
  ```bash
  curl -sSL https://install.python-poetry.org | python3 -
  ```

- **Node.js**: Version 20 or higher
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

- **Pre-commit**: For git hooks
  ```bash
  pip install pre-commit
  ```

## Getting Started

### Clone and Set Up

```bash
git clone <repository-url>
cd <repository-directory>

# Install pre-commit hooks
make pre-commit-install

# Install all dependencies
make install
```

### Working with Go Services

#### Create a New Service

```bash
cd apps/backend/go
mkdir my-new-service
cd my-new-service
go mod init github.com/example/monorepo/apps/backend/go/my-new-service
```

Then add your service to the workspace in `/go.work`:

```
use (
	./apps/backend/go/auditlog-service
	./apps/backend/go/my-new-service
)
```

#### Run and Test

```bash
cd apps/backend/go/my-new-service
go run cmd/server/main.go

# Run tests
go test ./...

# Run with race detector
go test -race ./...
```

#### Build

```bash
go build -o bin/my-new-service cmd/server/main.go
```

### Working with Python Services

#### Directory Structure

```
apps/backend/python/
├── pyproject.toml          # Poetry config
├── src/
│   └── service_name/       # Service package
│       ├── __init__.py
│       └── main.py
└── tests/
    └── test_service.py
```

#### Add Dependencies

```bash
cd apps/backend/python
poetry add fastapi uvicorn
poetry add --group dev pytest-mock
```

#### Run Service Locally

```bash
cd apps/backend/python
poetry shell
uvicorn audit_service.main:app --reload --host 0.0.0.0 --port 8000
```

#### Run Tests

```bash
poetry run pytest
poetry run pytest --cov --cov-report=html
```

#### Linting and Type Checking

```bash
poetry run black .
poetry run ruff check .
poetry run mypy src
```

### Working with the Frontend

#### Install Dependencies

```bash
cd apps/frontend/web
npm install
```

#### Development Server

```bash
npm run dev
# Access at http://localhost:5173
```

#### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

#### Linting and Type Checking

```bash
npm run lint
npm run type-check
```

## Pre-commit Hooks

Pre-commit hooks automatically run linters and formatters on staged files before each commit.

### Install Hooks

```bash
make pre-commit-install
```

### Run Manually

```bash
pre-commit run --all-files
```

### Skip Hooks (Not Recommended)

```bash
git commit --no-verify
```

## CI/CD Pipelines

GitHub Actions workflows automatically run on push and pull requests. Workflows are located in `.github/workflows/`:

- `backend-go.yml`: Go service builds and tests
- `backend-python.yml`: Python service builds, lints, and tests
- `frontend-web.yml`: Frontend builds and lints

Workflows are triggered based on file path filters to optimize build times.

## Testing

### Go

```bash
make test-go
```

### Python

```bash
make test-python
```

### Integration Tests

Integration tests can be found in the top-level `tests/` directory and are run against Docker Compose stacks.

## Common Tasks

### Clean Build Artifacts

```bash
make clean
```

### Format All Code

```bash
make format
```

### Run All Linters

```bash
make lint
```

### Build All Services

```bash
make build-go build-python build-frontend
```

## Debugging

### Go Services

Use `dlv` (Delve) for debugging:

```bash
go install github.com/go-delve/delve/cmd/dlv@latest
cd apps/backend/go/auditlog-service
dlv debug cmd/server/main.go
```

### Python Services

Use `pdb` or IDE debuggers. For VS Code, create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["audit_service.main:app", "--reload"],
      "cwd": "${workspaceFolder}/apps/backend/python",
      "env": {"PYTHONPATH": "${workspaceFolder}/apps/backend/python/src"}
    }
  ]
}
```

### Frontend

Use browser DevTools or VS Code debugger.

## Environment Variables

Each service should have a `.env.example` file documenting required environment variables. Copy and customize:

```bash
cp .env.example .env
```

## Docker Development

For running services together:

```bash
docker-compose up -d
docker-compose logs -f
```

## Troubleshooting

### Go Module Issues

```bash
cd apps/backend/go/auditlog-service
go mod tidy
go mod download
```

### Python Dependency Issues

```bash
cd apps/backend/python
poetry lock --no-update
poetry install
```

### Frontend Build Issues

```bash
cd apps/frontend/web
rm -rf node_modules package-lock.json
npm install
```

## Additional Resources

- [ADR 001: Monorepo Structure](./adr/001-monorepo-structure.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
