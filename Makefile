.PHONY: help install test lint format clean
.PHONY: install-go install-python install-frontend
.PHONY: test-go test-python test-frontend
.PHONY: lint-go lint-python lint-frontend
.PHONY: build-go build-python build-frontend

help:
	@echo "Monorepo Makefile - Available Targets"
	@echo ""
	@echo "Installation:"
	@echo "  install              - Install all dependencies (Go, Python, Frontend)"
	@echo "  install-go           - Install Go dependencies"
	@echo "  install-python       - Install Python dependencies (Poetry)"
	@echo "  install-frontend     - Install frontend dependencies (npm)"
	@echo ""
	@echo "Testing:"
	@echo "  test                 - Run all tests"
	@echo "  test-go              - Run Go tests"
	@echo "  test-python          - Run Python tests"
	@echo "  test-frontend        - Run frontend tests (placeholder)"
	@echo ""
	@echo "Linting:"
	@echo "  lint                 - Run all linters"
	@echo "  lint-go              - Run Go linters"
	@echo "  lint-python          - Run Python linters (black, ruff, mypy)"
	@echo "  lint-frontend        - Run frontend linters (ESLint)"
	@echo ""
	@echo "Build:"
	@echo "  build-go             - Build Go services"
	@echo "  build-python         - Verify Python can be packaged"
	@echo "  build-frontend       - Build frontend production bundle"
	@echo ""
	@echo "Utilities:"
	@echo "  clean                - Remove build artifacts and caches"
	@echo "  pre-commit-install   - Install pre-commit hooks"

# Installation targets
install: install-go install-python install-frontend

install-go:
	@echo "Installing Go dependencies..."
	cd apps/backend/go/auditlog-service && go mod download

install-python:
	@echo "Installing Python dependencies..."
	cd apps/backend/python && poetry install

install-frontend:
	@echo "Installing frontend dependencies..."
	cd apps/frontend/web && npm install

# Test targets
test: test-go test-python

test-go:
	@echo "Running Go tests..."
	cd apps/backend/go/auditlog-service && go test -v -race ./...

test-python:
	@echo "Running Python tests..."
	cd apps/backend/python && poetry run pytest

test-frontend:
	@echo "Frontend tests not yet implemented"

# Lint targets
lint: lint-go lint-python lint-frontend

lint-go:
	@echo "Linting Go code..."
	cd apps/backend/go/auditlog-service && go vet ./...
	cd apps/backend/go && gofmt -l .

lint-python:
	@echo "Linting Python code..."
	cd apps/backend/python && poetry run black --check .
	cd apps/backend/python && poetry run ruff check .
	cd apps/backend/python && poetry run mypy src

lint-frontend:
	@echo "Linting frontend code..."
	cd apps/frontend/web && npm run lint

# Format targets
format:
	@echo "Formatting code..."
	cd apps/backend/go && gofmt -w -s .
	cd apps/backend/python && poetry run black .
	cd apps/backend/python && poetry run ruff check --fix .

# Build targets
build-go:
	@echo "Building Go services..."
	cd apps/backend/go/auditlog-service && go build -o bin/auditlog-service cmd/server/main.go

build-python:
	@echo "Verifying Python build..."
	cd apps/backend/python && poetry build

build-frontend:
	@echo "Building frontend..."
	cd apps/frontend/web && npm run build

# Utility targets
clean:
	@echo "Cleaning build artifacts..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .coverage htmlcov
	rm -rf apps/backend/go/auditlog-service/bin
	rm -rf apps/backend/python/dist
	rm -rf apps/frontend/web/dist
	rm -rf apps/frontend/web/node_modules/.vite

pre-commit-install:
	@echo "Installing pre-commit hooks..."
	pre-commit install
