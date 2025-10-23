# Kubernetes Platform Bootstrap

This directory contains Helm charts and Kubernetes manifests for bootstrapping a production-grade Kubernetes platform with shared services on AWS EKS.

## Architecture Overview

The platform includes the following components:

### Core Infrastructure
- **Namespaces**: Logical separation for platform components and applications
- **RBAC**: Role-Based Access Control with predefined roles (admin, developer, viewer)
- **Service Accounts**: Dedicated accounts for each platform service

### Ingress & Networking
- **AWS Load Balancer Controller**: Manages AWS ALB/NLB for Kubernetes Ingress
- **cert-manager**: Automated TLS certificate management with Let's Encrypt
- **external-dns**: Automatic DNS record management in Route53

### Secrets Management
- **AWS Secrets Manager CSI Driver**: Mount secrets from AWS Secrets Manager as volumes
- **Sealed Secrets**: Encrypt secrets for safe storage in Git repositories

### Observability
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Metrics visualization and dashboards
- **Fluent Bit**: Log forwarding to CloudWatch Logs

## Prerequisites

### Required Tools
```bash
# kubectl
kubectl version --client

# Helm 3
helm version

# AWS CLI
aws --version

# eksctl (for EKS cluster management)
eksctl version

# kubeseal (for sealed secrets)
kubeseal --version
```

### AWS Resources
- EKS Cluster with IRSA (IAM Roles for Service Accounts) enabled
- VPC with public and private subnets
- Route53 hosted zone
- IAM roles for:
  - AWS Load Balancer Controller
  - External DNS
  - Fluent Bit
  - Secrets Store CSI Driver
  - Sealed Secrets Controller

### Environment Variables
Create a `.env` file or export these variables:

```bash
export CLUSTER_NAME="my-eks-cluster"
export AWS_REGION="us-east-1"
export AWS_ACCOUNT_ID="123456789012"
export VPC_ID="vpc-xxxxxxxxx"
export PUBLIC_HOSTED_ZONE="example.com"
export CERT_MANAGER_EMAIL="admin@example.com"
export GRAFANA_ADMIN_PASSWORD="changeme"
export ENVIRONMENT="production"

# IAM Role ARNs
export AWS_LOAD_BALANCER_CONTROLLER_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/AWSLoadBalancerControllerRole"
export EXTERNAL_DNS_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/ExternalDNSRole"
export FLUENTBIT_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/FluentBitRole"
export SECRETS_STORE_PROVIDER_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/SecretsStoreProviderRole"
export SEALED_SECRETS_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/SealedSecretsRole"
```

## Deployment Steps

### 1. Create IAM Roles with IRSA

Create the IAM roles with appropriate trust relationships and policies:

```bash
# Run the IAM setup script
./scripts/setup-iam-roles.sh
```

See [IAM_SETUP.md](./IAM_SETUP.md) for detailed IAM policy configurations.

### 2. Deploy Namespaces

```bash
# Using kubectl
kubectl apply -f namespaces/namespaces.yaml

# Or using Helm chart
helm upgrade --install platform-namespaces ./charts/namespaces \
  --create-namespace \
  --namespace kube-system
```

### 3. Deploy RBAC

```bash
# Using kubectl
kubectl apply -f rbac/cluster-roles.yaml

# Or using Helm chart
helm upgrade --install platform-rbac ./charts/rbac \
  --namespace kube-system
```

### 4. Deploy AWS Load Balancer Controller

```bash
# Add the EKS chart repository
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Install the AWS Load Balancer Controller
envsubst < ingress/aws-load-balancer-controller-values.yaml.gotmpl | \
  helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
    --namespace ingress-system \
    --values -
```

### 5. Deploy cert-manager

```bash
# Add the cert-manager repository
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Install cert-manager
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --values cert-manager/values.yaml

# Wait for cert-manager to be ready
kubectl wait --for=condition=available --timeout=300s \
  deployment/cert-manager -n cert-manager

# Create ClusterIssuers
envsubst < cert-manager/cluster-issuers.yaml | kubectl apply -f -
```

### 6. Deploy external-dns

```bash
# Add the external-dns repository
helm repo add external-dns https://kubernetes-sigs.github.io/external-dns/
helm repo update

# Install external-dns
envsubst < external-dns/values.yaml.gotmpl | \
  helm upgrade --install external-dns external-dns/external-dns \
    --namespace external-dns \
    --values -
```

### 7. Deploy AWS Secrets Manager CSI Driver

```bash
# Add the secrets-store-csi-driver repository
helm repo add secrets-store-csi-driver https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts
helm repo update

# Install the CSI driver
helm upgrade --install csi-secrets-store secrets-store-csi-driver/secrets-store-csi-driver \
  --namespace secrets-management \
  --values secrets-management/secrets-store-csi-values.yaml

# Install the AWS provider
kubectl apply -f https://raw.githubusercontent.com/aws/secrets-store-csi-driver-provider-aws/main/deployment/aws-provider-installer.yaml
```

### 8. Deploy Sealed Secrets

```bash
# Add the sealed-secrets repository
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm repo update

# Install sealed-secrets
envsubst < sealed-secrets/values.yaml.gotmpl | \
  helm upgrade --install sealed-secrets sealed-secrets/sealed-secrets \
    --namespace secrets-management \
    --values -

# Wait for the controller to be ready
kubectl wait --for=condition=available --timeout=300s \
  deployment/sealed-secrets -n secrets-management

# Fetch the public key for encrypting secrets
kubeseal --fetch-cert \
  --controller-name=sealed-secrets \
  --controller-namespace=secrets-management \
  > sealed-secrets-public-cert.pem
```

### 9. Deploy Prometheus & Grafana Stack

```bash
# Add the prometheus-community repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Create additional scrape configs secret
kubectl create secret generic additional-scrape-configs \
  --from-file=observability/prometheus-grafana/custom-scrape-configs.yaml \
  --namespace monitoring \
  --dry-run=client -o yaml | kubectl apply -f -

# Install kube-prometheus-stack
envsubst < observability/prometheus-grafana/values.yaml.gotmpl | \
  helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
    --namespace monitoring \
    --values -
```

### 10. Deploy Fluent Bit

```bash
# Add the fluent repository
helm repo add fluent https://fluent.github.io/helm-charts
helm repo update

# Apply Fluent Bit configuration
envsubst < observability/fluentbit/fluentbit-config.yaml | kubectl apply -f -

# Install Fluent Bit
envsubst < observability/fluentbit/values.yaml.gotmpl | \
  helm upgrade --install fluent-bit fluent/fluent-bit \
    --namespace logging \
    --values -
```

## Post-Deployment Verification

### 1. Check All Pods are Running

```bash
# Check platform components
kubectl get pods -n ingress-system
kubectl get pods -n cert-manager
kubectl get pods -n external-dns
kubectl get pods -n secrets-management
kubectl get pods -n monitoring
kubectl get pods -n logging
```

### 2. Verify AWS Load Balancer Controller

```bash
kubectl logs -n ingress-system deployment/aws-load-balancer-controller
```

### 3. Verify cert-manager

```bash
kubectl get clusterissuers
kubectl describe clusterissuer letsencrypt-prod
```

### 4. Verify Prometheus

```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090
# Access http://localhost:9090
```

### 5. Verify Grafana

```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80
# Access http://localhost:3000
# Username: admin
# Password: $GRAFANA_ADMIN_PASSWORD
```

### 6. Verify Fluent Bit

```bash
kubectl logs -n logging daemonset/fluent-bit -f
```

## Usage Examples

### Creating a Sealed Secret

```bash
# Create a regular Kubernetes secret
echo -n "my-secret-value" | kubectl create secret generic my-secret \
  --dry-run=client \
  --from-file=password=/dev/stdin \
  -o yaml > my-secret.yaml

# Seal the secret
kubeseal --format=yaml --cert=sealed-secrets-public-cert.pem \
  < my-secret.yaml > my-sealed-secret.yaml

# Apply the sealed secret (safe to commit to Git)
kubectl apply -f my-sealed-secret.yaml
```

### Using AWS Secrets Manager with CSI Driver

```bash
# Create a SecretProviderClass
cat <<EOF | kubectl apply -f -
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: my-app-secrets
  namespace: application
spec:
  provider: aws
  parameters:
    objects: |
      - objectName: "my-app-secret"
        objectType: "secretsmanager"
  secretObjects:
    - secretName: my-app-secret
      type: Opaque
      data:
        - objectName: "my-app-secret"
          key: credentials
EOF

# Use in a Pod
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: my-app
  namespace: application
spec:
  serviceAccountName: my-app
  containers:
    - name: app
      image: my-app:latest
      volumeMounts:
        - name: secrets
          mountPath: "/mnt/secrets"
          readOnly: true
  volumes:
    - name: secrets
      csi:
        driver: secrets-store.csi.k8s.io
        readOnly: true
        volumeAttributes:
          secretProviderClass: "my-app-secrets"
EOF
```

### Creating an Ingress with TLS

```bash
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  namespace: application
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    cert-manager.io/cluster-issuer: letsencrypt-prod
    external-dns.alpha.kubernetes.io/hostname: myapp.example.com
spec:
  tls:
    - hosts:
        - myapp.example.com
      secretName: myapp-tls
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app-service
                port:
                  number: 80
EOF
```

## Monitoring and Troubleshooting

### View Platform Metrics

Prometheus metrics are available at: `http://prometheus.monitoring.svc.cluster.local:9090`

Key metrics to monitor:
- `up{job="kubernetes-apiservers"}` - API server availability
- `node_cpu_seconds_total` - Node CPU usage
- `node_memory_MemAvailable_bytes` - Node memory availability
- `kube_pod_status_phase` - Pod status
- `container_cpu_usage_seconds_total` - Container CPU usage

### View Logs in CloudWatch

```bash
aws logs tail /aws/eks/${CLUSTER_NAME}/application --follow
```

### Common Issues

#### Load Balancer Controller Issues
```bash
# Check controller logs
kubectl logs -n ingress-system deployment/aws-load-balancer-controller

# Verify IAM role permissions
aws iam get-role --role-name AWSLoadBalancerControllerRole
```

#### cert-manager Issues
```bash
# Check certificate status
kubectl get certificate -A
kubectl describe certificate <certificate-name> -n <namespace>

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager
```

#### Secrets CSI Driver Issues
```bash
# Check provider logs
kubectl logs -n secrets-management daemonset/csi-secrets-store-secrets-store-csi-driver

# Verify SecretProviderClass
kubectl describe secretproviderclass <name> -n <namespace>
```

## Maintenance

### Updating Components

```bash
# Update Helm repositories
helm repo update

# Upgrade AWS Load Balancer Controller
helm upgrade aws-load-balancer-controller eks/aws-load-balancer-controller \
  --namespace ingress-system \
  --reuse-values

# Upgrade cert-manager
helm upgrade cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --reuse-values

# Upgrade Prometheus stack
helm upgrade kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --reuse-values
```

### Backup and Disaster Recovery

#### Backup Prometheus Data
```bash
# Create a snapshot
kubectl exec -n monitoring prometheus-kube-prometheus-stack-prometheus-0 -- \
  curl -XPOST http://localhost:9090/api/v1/admin/tsdb/snapshot

# Copy snapshot to S3
kubectl cp monitoring/prometheus-kube-prometheus-stack-prometheus-0:/prometheus/snapshots/<snapshot-id> /tmp/prometheus-snapshot
aws s3 cp /tmp/prometheus-snapshot s3://my-backup-bucket/prometheus/ --recursive
```

#### Backup Sealed Secrets Keys
```bash
# Backup the encryption keys
kubectl get secret -n secrets-management sealed-secrets-key -o yaml > sealed-secrets-backup.yaml

# Store securely (e.g., AWS Secrets Manager)
aws secretsmanager create-secret \
  --name sealed-secrets-encryption-key \
  --secret-string file://sealed-secrets-backup.yaml
```

## Security Considerations

1. **IAM Roles**: Ensure IAM roles follow the principle of least privilege
2. **Network Policies**: Implement network policies to restrict pod-to-pod communication
3. **Pod Security**: Use Pod Security Standards (PSS) to enforce security policies
4. **Secrets Rotation**: Regularly rotate secrets and certificates
5. **RBAC**: Regularly audit RBAC permissions and remove unnecessary access
6. **Image Scanning**: Scan container images for vulnerabilities
7. **Audit Logs**: Enable and monitor EKS audit logs

## References

- [AWS Load Balancer Controller Documentation](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [cert-manager Documentation](https://cert-manager.io/docs/)
- [external-dns Documentation](https://github.com/kubernetes-sigs/external-dns)
- [AWS Secrets Manager CSI Driver](https://github.com/aws/secrets-store-csi-driver-provider-aws)
- [Sealed Secrets Documentation](https://github.com/bitnami-labs/sealed-secrets)
- [Prometheus Operator Documentation](https://prometheus-operator.dev/)
- [Fluent Bit Documentation](https://docs.fluentbit.io/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review component-specific logs
3. Consult the official documentation for each component
4. Contact the platform team
