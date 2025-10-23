# Python Backend Services

This directory hosts Python microservices that implement the compliance and audit capabilities of the platform. All services are structured as isolated packages managed through Poetry.

## Services

- `audit_service`: FastAPI-based service that exposes audit event ingestion APIs.

## Development

```bash
cd apps/backend/python
poetry install
poetry run uvicorn audit_service.main:app --reload
```

## Testing

```bash
poetry run pytest
```

## Code Quality

```bash
poetry run black .
poetry run ruff check .
poetry run mypy src
```
