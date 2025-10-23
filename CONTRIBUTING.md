# Contributing Guide

Thank you for your interest in contributing to the Security, Compliance, and Auditing Platform!

## Code of Conduct

- Be respectful and professional in all interactions.
- Security findings should be reported privately to security@example.com.
- Do not commit secrets or sensitive data to the repository.

## Getting Started

1. Fork the repository.
2. Clone your fork: `git clone https://github.com/yourusername/security-compliance-framework.git`
3. Install dependencies using the Makefile:
   ```bash
   make install
   ```
4. Create a feature branch: `git checkout -b feat/my-feature`
5. Install pre-commit hooks: `make pre-commit-install`

## Repository Layout

```
apps/
├── backend/
│   ├── go/          # Go microservices
│   └── python/      # Python microservices (Poetry)
└── frontend/
    └── web/         # React + TypeScript frontend
```

### Toolchains

- **Go**: 1.21+
- **Python**: 3.11+ with Poetry
- **Node.js**: 20+

## Development Guidelines

### Go Services

- Run `go fmt ./...` or use `make format`
- Run `go vet ./...`
- Add tests with `go test ./...`

### Python Services

- Activate Poetry environment: `poetry shell`
- Run formatters and linters:
  ```bash
  poetry run black .
  poetry run ruff check .
  poetry run mypy src
  ```
- Run tests: `poetry run pytest`

### Frontend (React)

- Install dependencies: `npm install`
- Run development server: `npm run dev`
- Run linting: `npm run lint`
- Run type checks: `npm run type-check`

## Testing

- Run all tests: `make test`
- Run Go tests: `make test-go`
- Run Python tests: `make test-python`
- Frontend linting / type checks: `npm run lint && npm run type-check`

## Documentation

- Update `README.md` for major changes
- Add new Architecture Decision Records in `docs/adr/`
- Update `docs/WORKFLOWS.md` for process changes
- Service-specific docs belong in each service directory

## Commit Guidelines

- Follow [Conventional Commits](https://www.conventionalcommits.org/) when possible
- Write clear, descriptive commit messages
- Reference issue or ticket numbers when available

## Pull Requests

Before opening a PR:

1. Run `make lint`
2. Run `make test`
3. Ensure pre-commit hooks pass: `pre-commit run --all-files`
4. Update documentation as needed

PR checklist:

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] CI passes

## Security Vulnerability Disclosure

If you discover a security vulnerability:

1. **Do not** open a public issue.
2. Email security@example.com with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)
3. Allow 90 days for remediation before public disclosure.

## Questions?

Reach out via:

- GitHub Issues (for non-security topics)
- Slack: #security-framework (internal)
- Email: maintainers@example.com

## License

By contributing, you agree that your contributions will be licensed under the same terms as the project.
