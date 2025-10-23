# Integration Tests

This directory contains integration tests that verify service interactions.

## Running Integration Tests

These tests use Docker Compose to spin up services.

```bash
docker-compose up -d
pytest tests/
docker-compose down
```

## Test Organization

- `test_*.py` - Integration test files
- Legacy tests from the original Python services remain for compatibility
