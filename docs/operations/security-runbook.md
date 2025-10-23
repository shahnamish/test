# Security Operations Runbook

## Overview

This runbook provides step-by-step operational procedures for common security tasks.

## Daily Operations

### 1. Check Security Dashboard

**Location**: Grafana → Security / Overview

**Procedure**:
1. Log into Grafana (http://localhost:3000, admin/admin).
2. Navigate to Security / Overview dashboard.
3. Review key metrics:
   - Failed login attempts
   - Unauthorized access attempts
   - High severity vulnerabilities
   - Secrets rotation status
   - Audit log health

**Escalate if**:
- Critical or high severity alerts are firing
- Audit log write failures exceed 0
- Secrets rotation overdue count is increasing

### 2. Review Audit Logs

**Procedure**:
```bash
# Query recent authentication events
cd /home/engine/project
python3 -c "
from services.auditing import AuditLogger
audit = AuditLogger()
events = audit.query_events(event_type='user.login')
for event in events[-10:]:
    print(event.to_dict())
"
```

### 3. Check KYC/AML Backlog

**Procedure**:
```bash
# Check pending reviews
python3 -c "
from services.kyc_aml import KYCService, AMLService
kyc = KYCService()
aml = AMLService()
print(f'Pending KYC reviews: {kyc.get_pending_reviews_count()}')
print(f'Pending AML alerts: {len(aml.pending_alerts())}')
"
```

## Weekly Operations

### 1. Run Vulnerability Scan

**Procedure**:
```bash
cd /home/engine/project
./scripts/run_vulnerability_scan.sh
```

**Review**:
- Check `reports/bandit.json` for code vulnerabilities
- Check `reports/trivy.json` for dependency vulnerabilities
- Create tickets for high/critical findings

### 2. Rotate Secrets

**Procedure**:
```bash
cd /home/engine/project
python3 scripts/secrets_rotation_job.py
```

**Verify**:
- Check logs for successful rotation
- Update dependent services with new secrets
- Verify no service disruptions

### 3. Access Review

**Procedure**:
```bash
# Export RBAC matrix for review
python3 -c "
from services.permissions import RBACManager
import json
rbac = RBACManager()
matrix = rbac.export_matrix()
with open('reports/rbac_matrix.json', 'w') as f:
    json.dump(matrix, f, indent=2)
"
```

**Review**:
- Validate user access against org chart
- Revoke access for offboarded employees
- Approve or deny access change requests

## Monthly Operations

### 1. Certificate Expiry Check

**Procedure**:
```bash
# Check certificate expiry dates
openssl x509 -in /path/to/cert.pem -noout -enddate
```

**Action**: Renew certificates with less than 30 days remaining.

### 2. Compliance Reporting

**Generate reports**:
- SOC 2 control testing evidence
- GDPR data processing records
- Incident response metrics

**Location**: `docs/compliance/reports/`

### 3. Policy Review

**Review and update**:
- `docs/compliance/security-policies.md`
- `docs/compliance/incident-response-plan.md`
- Update version numbers and approval dates

## Incident Response

### Security Incident Detected

**Procedure**:
1. Classify severity (P0-P3) per Incident Response Plan.
2. Create incident ticket in Jira/ServiceNow.
3. Notify Incident Commander.
4. Follow `docs/compliance/incident-response-plan.md` playbooks.
5. Preserve evidence:
   ```bash
   # Export audit logs for incident timeframe
   python3 -c "
   from datetime import datetime
   from services.auditing import AuditLogger
   audit = AuditLogger()
   events = audit.query_events(
       start_time=datetime(2024, 1, 1, 10, 0, 0),
       end_time=datetime(2024, 1, 1, 12, 0, 0),
   )
   import json
   with open('incident_evidence.json', 'w') as f:
       json.dump([e.to_dict() for e in events], f, indent=2)
   "
   ```

### Alert Fatigue / False Positives

**Tuning Alerts**:
1. Review alert history in Grafana.
2. Adjust thresholds in:
   - `config/monitoring/security_rules.yml`
   - `config/monitoring/compliance_rules.yml`
3. Restart Prometheus to reload config.

## Troubleshooting

### Audit Logs Not Ingesting

**Diagnosis**:
1. Check Fluentd status: `docker ps | grep fluentd`
2. Check Elasticsearch status: `curl http://localhost:9200/_cluster/health`
3. Review Fluentd logs: `docker logs fluentd`

**Resolution**:
- Restart Fluentd: `docker-compose restart fluentd`
- Check disk space on Elasticsearch volume

### Metrics Not Appearing in Grafana

**Diagnosis**:
1. Check Prometheus targets: `http://localhost:9090/targets`
2. Verify service is exposing metrics at `/metrics` endpoint
3. Check Prometheus logs: `docker logs prometheus`

**Resolution**:
- Update `config/monitoring/prometheus.yml` with correct targets
- Restart Prometheus: `docker-compose restart prometheus`

## Emergency Procedures

### Rotate All Secrets (Security Breach)

```bash
cd /home/engine/project
python3 scripts/secrets_rotation_job.py --force-rotate-all
```

### Revoke User Access (Terminated Employee)

```bash
python3 -c "
from services.permissions import RBACManager
rbac = RBACManager()
rbac.revoke_role('user_id', 'role_name')
"
```

### Enable Enhanced Monitoring

Set `LOG_LEVEL=DEBUG` in `.env` and restart services:
```bash
docker-compose down
docker-compose up -d
```

## Contacts

- **Security Team**: security@example.com
- **On-Call**: PagerDuty rotation
- **CISO**: ciso@example.com
