# ADR 001: Monorepo Structure

## Status

Accepted

## Context

We need to organize a platform that includes multiple backend microservices (written in Go and Python), a React frontend, infrastructure code, and shared documentation. The development team requires a unified repository that supports:

- Independent service development and deployment
- Shared tooling and standards
- Clear service boundaries
- Efficient CI/CD pipelines

## Decision

We will adopt a monorepo structure organized by application layer:

```
apps/
├── backend/
│   ├── go/          # Go microservices with Go workspace
│   └── python/      # Python microservices with Poetry
└── frontend/
    └── web/         # React + TypeScript SPA
```

### Key Principles

1. **Language Isolation**: Go and Python services are grouped separately to allow language-specific tooling and dependency management.

2. **Workspace Management**:
   - Go: Use Go workspaces (`go.work`) to manage multiple modules
   - Python: Use Poetry for dependency management and virtual environments
   - Frontend: Use npm for package management

3. **Infrastructure as Code**: Infrastructure definitions (Terraform, Kubernetes manifests) reside in `/infrastructure`.

4. **Documentation**: Architecture Decision Records (ADRs) and operational docs in `/docs`.

## Consequences

### Positive

- Unified codebase simplifies cross-service changes
- Shared CI/CD and tooling configuration
- Easier code reviews across service boundaries
- Single source of truth for documentation

### Negative

- Larger repository size
- More complex CI/CD pipelines (need path-based triggers)
- Potential for tighter coupling if boundaries aren't maintained

## Alternatives Considered

1. **Multi-repo (polyrepo)**: Each service in its own repository. Rejected due to overhead in managing shared tooling and cross-service changes.

2. **Flat monorepo**: All services at the same level. Rejected because it doesn't provide clear language/technology grouping.
