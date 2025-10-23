.PHONY: help install test lint format security-scan clean up down

help:
	@echo "Available targets:"
	@echo "  install         - Install dependencies"
	@echo "  test            - Run tests"
	@echo "  lint            - Run linting checks"
	@echo "  format          - Format code with black"
	@echo "  security-scan   - Run security vulnerability scans"
	@echo "  up              - Start Docker services"
	@echo "  down            - Stop Docker services"
	@echo "  clean           - Clean temporary files"

install:
	pip install -r requirements.txt

test:
	pytest tests/ -v --cov=services

lint:
	flake8 services tests scripts
	mypy services

format:
	black services tests scripts

security-scan:
	./scripts/run_vulnerability_scan.sh
	python -m bandit -r services

up:
	docker-compose up -d

down:
	docker-compose down

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .coverage htmlcov reports/*.json
