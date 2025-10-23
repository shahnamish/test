# Contributing to Security, Compliance, and Auditing Framework

Thank you for your interest in contributing to this project!

## Code of Conduct

- Be respectful and professional in all interactions.
- Security findings should be reported privately to security@example.com.
- Do not commit secrets or sensitive data to the repository.

## Getting Started

1. Fork the repository.
2. Clone your fork: `git clone https://github.com/yourusername/security-compliance-framework.git`
3. Install dependencies: `pip install -r requirements.txt`
4. Create a feature branch: `git checkout -b feature/your-feature`

## Development Guidelines

### Code Style

- Follow PEP 8 for Python code.
- Use type hints where applicable.
- Run `black` for formatting: `black services tests scripts`
- Run `flake8` for linting: `flake8 services tests`

### Security Best Practices

- Never hardcode credentials or API keys.
- Use environment variables via `.env` files.
- All sensitive operations must be audited via `AuditLogger`.
- Encryption must use industry-standard algorithms (AES-256, TLS 1.3).

### Testing

- Write tests for all new features: `pytest tests/`
- Aim for >80% code coverage: `pytest --cov=services tests/`
- Include both unit and integration tests where applicable.

### Committing Changes

- Write clear, concise commit messages.
- Reference issue numbers: `Fix #123: Resolve audit log ingestion bug`
- Sign commits with GPG key (optional but encouraged).

### Pull Requests

1. Ensure all tests pass.
2. Update documentation if API or configuration changes.
3. Add a detailed description of changes.
4. Request review from maintainers.

## Security Vulnerability Disclosure

If you discover a security vulnerability:

1. **Do not** open a public issue.
2. Email security@example.com with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)
3. Allow 90 days for remediation before public disclosure.

## Documentation

- Update `README.md` for major feature additions.
- Add or update compliance narratives in `docs/compliance/`.
- Maintain operational runbooks in `docs/operations/`.

## Questions?

Reach out via:

- GitHub Issues (for non-security topics)
- Slack: #security-framework (internal)
- Email: maintainers@example.com

## License

By contributing, you agree that your contributions will be licensed under the same terms as the project.
