# Migration Notes

This document tracks the evolution of the repository structure.

## Monorepo Transition

The repository has been restructured as a monorepo to support multiple application types:

### New Structure (Current)

- **Backend Go Services**: `apps/backend/go/`
- **Backend Python Services**: `apps/backend/python/`
- **Frontend Applications**: `apps/frontend/web/`

### Legacy Structure (Retained for Compatibility)

The following directories remain from the original Python-only codebase:

- `services/` - Original Python service implementations
- `tests/` - Original integration tests
- `pyproject.toml` (root) - Legacy Poetry configuration
- `requirements.txt` - Legacy pip requirements

These are kept to ensure backward compatibility and to support existing deployment pipelines.

### Migration Strategy

New development should follow the monorepo structure:

1. **New Go services**: Add to `apps/backend/go/` and update `go.work`
2. **New Python services**: Add to `apps/backend/python/src/`
3. **Frontend features**: Develop in `apps/frontend/web/`

### Deprecation Timeline

Legacy structure will be fully deprecated in a future major version. Migration plan:

1. Update all references to use monorepo paths
2. Migrate existing services incrementally
3. Update deployment configurations
4. Remove legacy directories after migration complete

## CI/CD Changes

- New GitHub Actions workflows target specific app directories
- Docker Compose updated to reference monorepo structure
- Pre-commit hooks configured for multi-language support

## Documentation Updates

- New ADRs document architectural decisions
- Development guide updated for monorepo workflows
- README reflects new structure
