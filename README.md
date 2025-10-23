# Security, Compliance, and Auditing Framework

A comprehensive framework for enterprise-grade security, compliance, and auditing capabilities.

## Overview

This framework provides:

- **Centralized Auditing**: Track all security-relevant events across services
- **Logging & Monitoring**: Structured logging with ELK/EFK stack integration and Prometheus/Grafana monitoring
- **KYC/AML Compliance**: Know Your Customer and Anti-Money Laundering compliance placeholders
- **Permission Management**: Role-Based Access Control (RBAC) system
- **Encryption**: At-rest and in-transit encryption with key rotation
- **Secrets Management**: Automated secrets rotation and secure storage
- **Compliance Documentation**: SOC2-ready narratives and security policies
- **Vulnerability Scanning**: Automated dependency and container scanning
- **Alerting**: Real-time security and compliance alerts

## Architecture

```
.
├── config/                 # Configuration files
│   ├── logging/           # Logging configurations
│   ├── monitoring/        # Monitoring and alerting configs
│   └── security/          # Security configurations
├── docs/                   # Documentation
│   ├── compliance/        # Compliance narratives and policies
│   └── operations/        # Operational runbooks
├── services/              # Core services
│   ├── auditing/         # Audit logging service
│   ├── logging/          # Centralized logging service
│   ├── monitoring/       # Monitoring service
│   ├── kyc_aml/          # KYC/AML compliance service
│   ├── permissions/      # RBAC and permissions service
│   ├── security/         # Encryption and secrets management
│   ├── vulnerability/    # Vulnerability scanning
│   └── ws_realtime/      # WebSocket real-time distribution service
├── infrastructure/        # Infrastructure as code
│   └── terraform/        # Terraform configurations
├── scripts/              # Utility scripts
└── tests/                # Test suites

```

## Quick Start

### Prerequisites

- Python 3.9+
- Docker and Docker Compose
- Terraform (for infrastructure deployment)
- kubectl (for Kubernetes deployments)

### Installation

```bash
# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start services with Docker Compose
docker-compose up -d
```

### Configuration

1. **Logging**: Configure log levels and outputs in `config/logging/`
2. **Monitoring**: Set up Prometheus and Grafana in `config/monitoring/`
3. **Security**: Configure encryption keys and secrets in `config/security/`
4. **Compliance**: Review and customize policies in `docs/compliance/`

## Services

### Audit Service

Tracks all security-relevant events with immutable audit logs.

```python
from services.auditing import AuditLogger

audit = AuditLogger()
audit.log_event(
    event_type="user.login",
    user_id="user123",
    resource="api.example.com",
    action="login",
    result="success"
)
```

### KYC/AML Service

Placeholder integration for customer verification and compliance.

```python
from services.kyc_aml import KYCService

kyc = KYCService()
result = kyc.verify_customer(customer_id, documents)
```

### Permission Service

Role-based access control with fine-grained permissions.

```python
from services.permissions import RBACManager

rbac = RBACManager()
if rbac.check_permission(user_id, resource, action):
    # Authorized
    pass
```

### WebSocket Real-Time Distribution Service

The `services/ws_realtime` service fans out live Kafka topics (lines, order book,
and analytics streams) to authenticated WebSocket clients. It supports channel
subscriptions, automatic backpressure handling, and JWT-based authentication.
Valid channels are restricted to the configured Kafka topics (defaults: `lines`,
`order_book`, and `analytics`).

```javascript
import jwt from 'jsonwebtoken';

const token = jwt.sign({ sub: 'user-123', exp: Math.floor(Date.now() / 1000) + 900 }, 'dev-secret');
const socket = new WebSocket(`ws://localhost:8080/ws?token=${token}`);

socket.onopen = () => {
  socket.send(JSON.stringify({ type: 'subscribe', channels: ['lines', 'order_book'] }));
};

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('[realtime]', message.channel, message.payload);
};
```

Use `scripts/ws_realtime/generate_token.py` to mint short-lived test tokens:

```bash
python scripts/ws_realtime/generate_token.py dev-secret user-123
```

Operational guidance is documented in `docs/operations/ws-realtime-runbook.md`.

## Compliance

This framework is designed to support:

- SOC 2 Type II
- GDPR
- PCI DSS
- HIPAA
- ISO 27001

Compliance narratives and control mappings are available in `docs/compliance/`.

## Security Features

### Encryption

- **At Rest**: AES-256 encryption for stored data
- **In Transit**: TLS 1.3 for all network communications
- **Key Management**: Automated key rotation with AWS KMS/HashiCorp Vault integration

### Secrets Management

- Automated rotation schedules
- Secure storage with encryption
- Access auditing
- Integration with Vault, AWS Secrets Manager, Azure Key Vault

### Vulnerability Scanning

- Dependency scanning (Snyk, Dependabot)
- Container image scanning (Trivy, Clair)
- SAST/DAST integration
- Automated remediation workflows

## Monitoring and Alerting

- **Metrics**: Prometheus for metrics collection
- **Visualization**: Grafana dashboards for security metrics
- **Logging**: ELK/EFK stack for log aggregation
- **Alerting**: PagerDuty, Slack, and email integration
- **Tracing**: Jaeger/Zipkin for distributed tracing

## Deployment

### Docker Compose (Development)

```bash
docker-compose up -d
```

### Kubernetes (Production)

```bash
kubectl apply -f infrastructure/kubernetes/
# Deploy only the WebSocket gateway
kubectl apply -f infrastructure/kubernetes/ws-realtime/
```

### Terraform (Cloud Infrastructure)

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

## Testing

```bash
# Run all tests
pytest tests/

# Run security tests
pytest tests/security/

# Run compliance tests
pytest tests/compliance/

# Run WebSocket load tests (requires k6)
WS_TOKEN=$(python scripts/ws_realtime/generate_token.py dev-secret load-tester)
k6 run tests/load/ws_realtime_k6.js --env WS_TOKEN=$WS_TOKEN --env WS_URL=ws://localhost:8080/ws
```

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and development process.

## License

Copyright (c) 2024. All rights reserved.
