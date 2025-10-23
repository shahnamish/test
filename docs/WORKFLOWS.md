# Development Workflows

This document outlines common workflows for developing in this monorepo.

## Daily Development Flow

### 1. Starting Work

```bash
# Pull latest changes
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feat/my-feature

# Install/update dependencies if needed
make install
```

### 2. Making Changes

#### For Go Services

```bash
cd apps/backend/go/auditlog-service
# Make code changes
go test ./...
go vet ./...
```

#### For Python Services

```bash
cd apps/backend/python
poetry shell
# Make code changes
poetry run pytest
poetry run black .
poetry run ruff check .
```

#### For Frontend

```bash
cd apps/frontend/web
npm run dev
# Make code changes
npm run type-check
npm run lint
```

### 3. Committing Changes

```bash
# Stage files
git add .

# Pre-commit hooks run automatically
git commit -m "feat: Add new feature"

# Push to remote
git push origin feat/my-feature
```

Pre-commit hooks will:
- Format code (black, gofmt)
- Run linters (ruff, eslint)
- Check for common issues
- Validate YAML/JSON

### 4. Creating Pull Request

1. Push your branch to GitHub
2. Create a pull request to `develop`
3. GitHub Actions will run:
   - Go tests and builds
   - Python tests and linting
   - Frontend builds and type checks
4. Request review from team members
5. Address feedback
6. Merge when approved

## Adding a New Service

### Go Service

```bash
cd apps/backend/go
mkdir my-service
cd my-service

# Initialize Go module
go mod init github.com/example/monorepo/apps/backend/go/my-service

# Create directory structure
mkdir -p cmd/server internal/config

# Create main.go
cat > cmd/server/main.go <<EOF
package main

import (
    "fmt"
    "log"
    "net/http"
)

func main() {
    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        fmt.Fprintf(w, "OK")
    })
    log.Println("Service starting on :8081")
    log.Fatal(http.ListenAndServe(":8081", nil))
}
EOF

# Update workspace
cd /home/engine/project
# Edit go.work to add: ./apps/backend/go/my-service
```

### Python Service

```bash
cd apps/backend/python/src
mkdir my_service
cd my_service

# Create __init__.py
echo '__version__ = "0.1.0"' > __init__.py

# Create main.py
cat > main.py <<EOF
from fastapi import FastAPI

app = FastAPI(title="My Service")

@app.get("/health")
async def health_check():
    return {"status": "ok"}
EOF

# Update pyproject.toml to include the new package
```

## Testing Workflows

### Unit Tests

```bash
# Test specific service
make test-go
make test-python

# Test all
make test
```

### Integration Tests

```bash
# Start all services
docker-compose up -d

# Run integration tests
cd tests
pytest integration/

# Clean up
docker-compose down
```

### Manual Testing

```bash
# Start individual service

# Go
cd apps/backend/go/auditlog-service
go run cmd/server/main.go

# Python
cd apps/backend/python
poetry run uvicorn audit_service.main:app --reload

# Frontend
cd apps/frontend/web
npm run dev
```

## Release Workflow

### Creating a Release

1. Ensure all tests pass on `develop`
2. Create release branch: `git checkout -b release/v1.0.0`
3. Update version numbers in:
   - `apps/backend/python/pyproject.toml`
   - `apps/frontend/web/package.json`
   - Any version files in Go services
4. Update CHANGELOG.md
5. Create PR to `main`
6. After merge, tag the release: `git tag v1.0.0`
7. Push tag: `git push origin v1.0.0`

### Hotfix Workflow

1. Create hotfix branch from `main`: `git checkout -b hotfix/fix-critical-bug main`
2. Make fixes
3. Test thoroughly
4. Create PR to both `main` and `develop`
5. Tag hotfix release

## CI/CD Pipeline Details

### On Pull Request

- **Go workflow**: Runs on changes to `apps/backend/go/**`
  - Downloads dependencies
  - Runs `go vet`
  - Runs tests with race detector
  - Builds binaries

- **Python workflow**: Runs on changes to `apps/backend/python/**`
  - Installs dependencies via Poetry
  - Runs black, ruff, mypy
  - Runs pytest with coverage

- **Frontend workflow**: Runs on changes to `apps/frontend/web/**`
  - Installs npm dependencies
  - Runs type checking
  - Runs ESLint
  - Builds production bundle

### On Merge to Main

All of the above, plus:
- Container images are built
- Images are pushed to registry
- Deployment pipelines are triggered (if configured)

## Troubleshooting Common Issues

### Pre-commit Hook Failures

```bash
# Run pre-commit manually to see details
pre-commit run --all-files

# Update hooks
pre-commit autoupdate

# Skip hooks (use sparingly)
git commit --no-verify
```

### Go Module Issues

```bash
cd apps/backend/go/auditlog-service
go mod tidy
go clean -modcache
go mod download
```

### Poetry Lock Issues

```bash
cd apps/backend/python
poetry lock --no-update
poetry install
```

### NPM Dependency Issues

```bash
cd apps/frontend/web
rm -rf node_modules package-lock.json
npm install
```

### Docker Build Failures

```bash
# Build specific service
docker-compose build auditlog-service

# Rebuild without cache
docker-compose build --no-cache

# Check logs
docker-compose logs -f auditlog-service
```

## Code Review Guidelines

### As a Reviewer

- Check that tests are included
- Verify linters pass
- Ensure documentation is updated
- Look for security issues
- Validate API contracts haven't broken

### As an Author

- Keep PRs focused and small
- Write descriptive commit messages
- Add tests for new features
- Update relevant documentation
- Respond to feedback promptly

## Best Practices

1. **Commit early, commit often**: Make small, atomic commits
2. **Test locally first**: Run tests before pushing
3. **Update documentation**: Keep README and docs in sync with code
4. **Use feature flags**: For large features, use feature flags to enable gradual rollout
5. **Monitor deployments**: Watch logs and metrics after deployment
