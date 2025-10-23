# Kubernetes Platform Architecture

## Overview

This document describes the architecture of the Kubernetes platform shared services layer.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Internet / Users                                │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ HTTPS/TLS
                             │
┌────────────────────────────▼────────────────────────────────────────────┐
│                      Route53 (DNS)                                       │
│                  Managed by external-dns                                 │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────────┐
│                  AWS Application Load Balancer                           │
│            Created by AWS Load Balancer Controller                       │
│               Configured via Ingress Resources                           │
│          TLS Certificates from cert-manager/Let's Encrypt                │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │
        ┌────────────────────┴─────────────────────┐
        │                                           │
        │         Kubernetes Cluster (EKS)         │
        │                                           │
        │  ┌─────────────────────────────────────┐ │
        │  │   Namespace: ingress-system         │ │
        │  │   - AWS Load Balancer Controller    │ │
        │  │   - IRSA Role: ALB permissions      │ │
        │  └─────────────────────────────────────┘ │
        │                                           │
        │  ┌─────────────────────────────────────┐ │
        │  │   Namespace: cert-manager           │ │
        │  │   - cert-manager Controller         │ │
        │  │   - ClusterIssuers                  │ │
        │  │     * letsencrypt-prod              │ │
        │  │     * letsencrypt-staging           │ │
        │  │     * selfsigned                    │ │
        │  └─────────────────────────────────────┘ │
        │                                           │
        │  ┌─────────────────────────────────────┐ │
        │  │   Namespace: external-dns           │ │
        │  │   - external-dns Controller         │ │
        │  │   - IRSA Role: Route53 permissions  │ │
        │  └─────────────────────────────────────┘ │
        │                                           │
        │  ┌─────────────────────────────────────┐ │
        │  │   Namespace: secrets-management     │ │
        │  │   - Secrets Store CSI Driver        │ │
        │  │   - AWS Provider (DaemonSet)        │ │
        │  │   - Sealed Secrets Controller       │ │
        │  │   - IRSA Role: Secrets Manager      │ │
        │  └─────────────────────────────────────┘ │
        │                                           │
        │  ┌─────────────────────────────────────┐ │
        │  │   Namespace: monitoring             │ │
        │  │   - Prometheus Operator             │ │
        │  │   - Prometheus Server               │ │
        │  │   - Grafana                         │ │
        │  │   - Alertmanager                    │ │
        │  │   - kube-state-metrics              │ │
        │  │   - node-exporter (DaemonSet)       │ │
        │  └─────────────────────────────────────┘ │
        │                                           │
        │  ┌─────────────────────────────────────┐ │
        │  │   Namespace: logging                │ │
        │  │   - Fluent Bit (DaemonSet)          │ │
        │  │   - IRSA Role: CloudWatch Logs      │ │
        │  └─────────────────────────────────────┘ │
        │                                           │
        │  ┌─────────────────────────────────────┐ │
        │  │   Application Namespaces            │ │
        │  │   - staging                         │ │
        │  │   - production                      │ │
        │  │   - application                     │ │
        │  └─────────────────────────────────────┘ │
        │                                           │
        └───────────────────┬───────────────────────┘
                            │
                            │ IRSA
                            │ (IAM Roles for Service Accounts)
                            │
┌───────────────────────────▼────────────────────────────────────────────┐
│                           AWS Services                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   Route53    │  │  Secrets     │  │  CloudWatch │  │    IAM     │ │
│  │   (DNS)      │  │  Manager     │  │    Logs     │  │  (Roles)   │ │
│  └──────────────┘  └──────────────┘  └─────────────┘  └────────────┘ │
│  ┌──────────────┐  ┌──────────────┐                                   │
│  │     ALB      │  │     ACM      │                                   │
│  │     NLB      │  │  (Optional)  │                                   │
│  └──────────────┘  └──────────────┘                                   │
└────────────────────────────────────────────────────────────────────────┘
```

## Component Details

### Ingress Layer

#### AWS Load Balancer Controller
- **Purpose**: Manages AWS Application Load Balancers (ALB) and Network Load Balancers (NLB) for Kubernetes Ingress resources
- **Namespace**: `ingress-system`
- **Dependencies**: IAM role with ALB/NLB/EC2 permissions
- **Features**:
  - Automatic ALB creation and configuration
  - Target group management
  - Security group management
  - WAF integration support
  - Shield integration support

### Certificate Management

#### cert-manager
- **Purpose**: Automates TLS certificate issuance and renewal
- **Namespace**: `cert-manager`
- **Features**:
  - Let's Encrypt integration (ACME protocol)
  - HTTP01 and DNS01 challenge support
  - Certificate auto-renewal
  - Multiple issuer support (staging, production, self-signed)

### DNS Management

#### external-dns
- **Purpose**: Automatically creates/updates Route53 DNS records based on Ingress/Service resources
- **Namespace**: `external-dns`
- **Dependencies**: IAM role with Route53 permissions
- **Features**:
  - Automatic DNS record creation
  - TXT record ownership tracking
  - Multi-zone support
  - Sync mode for cleanup

### Secrets Management

#### AWS Secrets Manager CSI Driver
- **Purpose**: Mount secrets from AWS Secrets Manager as volumes in pods
- **Namespace**: `secrets-management`
- **Dependencies**: IAM role with Secrets Manager permissions
- **Features**:
  - Direct mounting of secrets as files
  - Automatic sync to Kubernetes secrets
  - Secret rotation support
  - SSM Parameter Store support

#### Sealed Secrets
- **Purpose**: Encrypt secrets for safe storage in Git repositories
- **Namespace**: `secrets-management`
- **Features**:
  - Public key encryption
  - Safe for GitOps workflows
  - Automatic decryption in-cluster
  - Namespace/cluster-wide scoping

### Observability

#### Prometheus
- **Purpose**: Metrics collection, storage, and alerting
- **Namespace**: `monitoring`
- **Features**:
  - Metrics scraping from pods/services
  - ServiceMonitor and PodMonitor CRDs
  - Alert rules and recording rules
  - Remote write support
  - 15-day retention

#### Grafana
- **Purpose**: Metrics visualization and dashboards
- **Namespace**: `monitoring`
- **Features**:
  - Pre-configured Prometheus datasource
  - Dashboard provisioning
  - User management
  - Alerting integration
  - Plugin support

#### Fluent Bit
- **Purpose**: Log collection and forwarding
- **Namespace**: `logging`
- **Dependencies**: IAM role with CloudWatch Logs permissions
- **Features**:
  - DaemonSet deployment (one per node)
  - Kubernetes metadata enrichment
  - CloudWatch Logs integration
  - Multi-line log parsing
  - Resource limits

### RBAC (Role-Based Access Control)

#### Platform Roles
- **platform-admin**: Full cluster access (cluster-admin equivalent)
- **platform-developer**: Can create/manage resources in app namespaces
- **platform-viewer**: Read-only access to resources
- **monitoring-reader**: Read-only access for monitoring tools

#### Service Accounts
Each platform component has a dedicated service account with:
- Minimal required permissions
- IRSA annotations for AWS access
- Namespace isolation

## Security Architecture

### Network Security
- Network policies restrict pod-to-pod communication
- ALB security groups control ingress traffic
- Node security groups control egress traffic

### Authentication & Authorization
- IRSA (IAM Roles for Service Accounts) for AWS API access
- Kubernetes RBAC for in-cluster permissions
- Service account token projection

### Secrets Management
- Secrets encrypted at rest in etcd
- AWS Secrets Manager for sensitive data
- Sealed Secrets for GitOps workflows
- No plain-text secrets in Git

### TLS/Encryption
- TLS certificates from Let's Encrypt
- In-transit encryption (HTTPS)
- mTLS support available via service mesh

## Data Flow Examples

### Incoming HTTP Request
1. User sends HTTPS request to `app.example.com`
2. DNS resolves to ALB (managed by external-dns)
3. ALB terminates TLS (cert from cert-manager)
4. ALB forwards to pod via target group
5. Pod processes request and responds

### Metrics Collection
1. Prometheus scrapes `/metrics` endpoint on pods
2. Metrics stored in Prometheus TSDB
3. Grafana queries Prometheus for visualization
4. Alerts sent to Alertmanager if thresholds exceeded

### Log Collection
1. Application writes logs to stdout/stderr
2. Fluent Bit (DaemonSet) reads from container logs
3. Fluent Bit enriches with Kubernetes metadata
4. Fluent Bit forwards to CloudWatch Logs
5. Logs stored in CloudWatch for analysis

### Secret Access
1. Pod mounts CSI volume with SecretProviderClass
2. CSI driver uses pod's service account (IRSA)
3. Driver fetches secret from AWS Secrets Manager
4. Secret mounted as file in pod
5. Optional sync to Kubernetes secret

## High Availability

### Replication
- AWS Load Balancer Controller: 2 replicas
- cert-manager: 2 replicas (controller, webhook, cainjector)
- external-dns: 1 replica (leader election)
- Prometheus: 2 replicas
- Fluent Bit: DaemonSet (HA by nature)

### Pod Disruption Budgets
- Configured for critical components
- Prevents simultaneous pod evictions
- Ensures minimum availability during updates

### Affinity/Anti-Affinity
- Pod anti-affinity spreads replicas across nodes
- Prevents single point of failure

## Scalability

### Horizontal Scaling
- HPA (Horizontal Pod Autoscaler) can be configured for apps
- Cluster Autoscaler can add/remove nodes
- Multiple load balancers supported

### Vertical Scaling
- Resource requests and limits configured
- VPA (Vertical Pod Autoscaler) can adjust resources

### Storage
- Prometheus uses persistent volumes (200Gi)
- Grafana uses persistent volumes (20Gi)
- Storage class: gp3 (AWS EBS)

## Monitoring & Alerting

### Key Metrics
- Pod CPU/memory usage
- Node resource utilization
- API server latency
- Controller errors
- Certificate expiration

### Alerts
- Component health checks
- Resource exhaustion
- Certificate expiration warnings
- Failed deployments
- Security events

## Disaster Recovery

### Backup Strategy
- Prometheus snapshots to S3
- Grafana dashboard backups
- Sealed Secrets encryption key backup
- etcd backups (EKS managed)

### Recovery Procedures
- Documented in operations runbooks
- Tested recovery processes
- Infrastructure as Code for rebuild

## Cost Optimization

- Right-sized resource requests/limits
- Node autoscaling based on demand
- Spot instances for non-critical workloads
- Log retention policies in CloudWatch
- Prometheus retention configuration

## Compliance

- All components support audit logging
- Network policies enforce segmentation
- RBAC enforces least privilege
- Secrets never in plain text
- TLS encryption enforced
