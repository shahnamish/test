# Audit Log Service (Go)

A high-performance audit logging microservice written in Go.

## Development

```bash
# Run the service
go run cmd/server/main.go

# Build
go build -o bin/auditlog-service cmd/server/main.go

# Test
go test ./...
```

## Configuration

Environment variables:
- `AUDITLOG_SERVICE_PORT`: Port to listen on (default: 8080)
