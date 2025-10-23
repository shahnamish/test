# Secrets Rotation Policy

## Objective

Maintain the confidentiality and integrity of secrets (API keys, credentials, certificates) through automated and auditable rotation processes.

## Scope

- Application secrets stored in Vault, AWS Secrets Manager, Azure Key Vault, or GCP Secret Manager
- Database credentials (PostgreSQL, MySQL, MongoDB)
- Encryption keys (KMS, Vault transit, HSM)
- API keys for third-party services (KYC, AML, payment processors)
- TLS/SSL certificates

## Rotation Frequency

| Secret Type                | Rotation Interval | Notes                                          |
|----------------------------|-------------------|------------------------------------------------|
| Database credentials       | 30 days           | Use dynamic credentials where possible         |
| Application API keys       | 60 days           | Shorten interval for critical integrations     |
| TLS/SSL certificates       | 90 days           | Automate with ACME (Let's Encrypt)             |
| Encryption keys (data)     | 90 days           | Enable automatic re-encryption                 |
| Encryption keys (master)   | 180 days          | Keys stored in HSM or KMS                      |
| Admin/privileged passwords | 30 days           | Enforce MFA and password managers              |

## Rotation Workflow

1. **Inventory**: Maintain an up-to-date inventory of all secrets.
2. **Automation**: Use `scripts/secrets_rotation_job.py` for orchestrated rotation.
3. **Validation**: Validate new secrets before withdrawing old ones.
4. **Rollback**: Maintain last known good secret for emergency fallback.
5. **Auditing**: Log all rotation events via `AuditLogger`.

## Tooling

- HashiCorp Vault dynamic secrets
- AWS Secrets Manager rotation Lambdas
- Azure Key Vault rotation policies
- GCP Secret Manager auto-rotation

## Compliance Mapping

| Framework | Control                                         |
|-----------|-------------------------------------------------|
| SOC 2     | CC6.2, CC6.6, CC7.2                              |
| ISO 27001 | A.9.2.4, A.10.1.2                               |
| PCI DSS   | 3.6, 8.2                                        |
| HIPAA     | 164.312(a)(2)(iv), 164.308(a)(3)(ii)(B)         |

## Reporting

- Weekly rotation status reports emailed to security leadership
- Dashboard in Grafana: `Security / Secrets Rotation`
- Alerts configured in `config/monitoring/compliance_rules.yml`
