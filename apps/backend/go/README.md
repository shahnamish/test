# Go Backend Services

This directory contains Go microservices that power high-throughput and performance-critical features.

## Workspace

The repository root includes a `go.work` file that references all Go services. Add new services to the workspace to share dependencies and tools.

```bash
# Add new service to workspace
go work use ./apps/backend/go/my-new-service
```

## Common Commands

```bash
# Run unit tests
cd apps/backend/go/auditlog-service
go test ./...

# Run with race detector
go test -race ./...

# Build binary
go build -o bin/auditlog-service cmd/server/main.go

# Format source
gofmt -w -s .
```

## Adding a New Service

1. Create a directory under `apps/backend/go/`
2. Initialize a module: `go mod init github.com/example/monorepo/apps/backend/go/<service>`
3. Create `cmd/server/main.go`
4. Update `go.work` to include the new service

## Code Style

- Use `gofmt` for formatting (enforced via pre-commit)
- Run `go vet` for static analysis
- Add package-level documentation for exported packages

## Observability

- Expose `/health` endpoint for health checks
- Use structured logging
- Plan to expose `/metrics` (Prometheus) and tracing in future updates
