# Monitoring and Alerting Guide

## Monitoring Stack

- **Prometheus**: Metrics collection and alerting rules
- **Grafana**: Visualization dashboards
- **Alertmanager**: Alert routing and notification
- **Elasticsearch/Kibana**: Log aggregation and search
- **Fluentd**: Log forwarding to Elasticsearch

## Setup

1. Start core services:
   ```bash
   docker-compose up -d elasticsearch kibana prometheus alertmanager grafana
   ```

2. Import Grafana dashboards:
   - Security Overview
   - Compliance Summary
   - Infrastructure Health

3. Verify Prometheus targets: `http://localhost:9090/targets`

4. Configure Alertmanager receivers in `config/monitoring/alertmanager.yml`.

## Key Metrics

| Metric | Description | Threshold |
|--------|-------------|-----------|
| `failed_login_attempts_total` | Failed login attempts | >10/min critical |
| `unauthorized_access_attempts_total` | Unauthorized access attempts | >5/min critical |
| `high_severity_vulnerabilities_total` | High-severity vulnerabilities | >0 warning |
| `audit_log_ingestion_delay_seconds` | Audit log ingestion lag | >30s high |
| `secrets_rotation_overdue_total` | Secrets overdue for rotation | >0 high |
| `kyc_pending_reviews_total` | Pending KYC reviews | >100 warning |

## Alert Channels

- **Slack**: `#security-alerts`, `#security-monitoring`
- **Email**: security@example.com
- **PagerDuty**: Critical alerts for on-call team

## Alert Triage Process

1. **Acknowledge** alert in Alertmanager or PagerDuty.
2. **Investigate** using relevant dashboards and logs.
3. **Mitigate** by following runbooks or incident response procedures.
4. **Resolve** and update alert notes with findings.
5. **Review** for tuning opportunities to reduce false positives.

## Creating Custom Alerts

1. Edit `config/monitoring/security_rules.yml` or `compliance_rules.yml`.
2. Add new rule with expression, labels, annotations.
3. Reload Prometheus configuration or restart container.
4. Test alert by triggering condition in staging environment.

## Dashboards

- **Security / Overview**: Authentication, RBAC, encryption, secrets metrics.
- **Compliance / KYC & AML**: Backlog, pending reviews, alert status.
- **Vulnerability Management**: Findings by severity, MTTR, SLA status.
- **Audit / Health**: Log ingestion, integrity verification, storage status.

## Incident Workflow

1. Alert fires (Slack/PagerDuty/Email).
2. On-call acknowledges and begins investigation.
3. Update incident ticket with timeline and actions.
4. Coordinate with relevant teams (DevOps, Compliance, Legal).
5. Document root cause and remediation steps.

## Maintenance

- Review alerts quarterly for relevance and false positives.
- Update contact details in Alertmanager configuration.
- Archive historical alerts for compliance evidence.
