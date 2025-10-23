# Kubernetes Platform Bootstrap Guide

This guide explains how to bootstrap the shared services platform described in the ticket using the new Kubernetes manifests and Helm charts.

## Overview

The platform includes:

| Component | Description | Namespace |
|-----------|-------------|-----------|
| Namespaces | Logical isolation for platform components and workloads | Multiple |
| RBAC | Platform roles (admin, developer, viewer, monitoring) | Cluster-wide |
| AWS Load Balancer Controller | Manages Application/Network Load Balancers | `ingress-system` |
| cert-manager | Automated certificate management | `cert-manager` |
| External DNS | Route53 automation for ingress records | `external-dns` |
| AWS Secrets Manager CSI Driver | Mount secrets and sync to Kubernetes | `secrets-management` |
| Sealed Secrets | Encrypt secrets for GitOps workflows | `secrets-management` |
| Prometheus / Grafana | Metrics collection and visualization | `monitoring` |
| Fluent Bit | Log forwarding to CloudWatch Logs | `logging` |

Deployment automation is handled via the `helmfile` located in `infrastructure/kubernetes/helmfile.yaml`.

## Prerequisites

- AWS CLI, kubectl, Helm, eksctl installed locally
- EKS cluster with worker nodes and [IRSA](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)
- Route53 hosted zone for the desired domain
- IAM user/role with rights to create policies, roles, and service accounts

Export the environment variables required by the Helm values files:

```bash
export CLUSTER_NAME="my-eks-cluster"
export AWS_REGION="us-east-1"
export AWS_ACCOUNT_ID="123456789012"
export VPC_ID="vpc-abc123"
export PUBLIC_HOSTED_ZONE="example.com"
export CERT_MANAGER_EMAIL="platform@example.com"
export GRAFANA_ADMIN_PASSWORD="ChangeMe123!"
export ENVIRONMENT="production"

export AWS_LOAD_BALANCER_CONTROLLER_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/AWSLoadBalancerControllerRole"
export EXTERNAL_DNS_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/ExternalDNSRole"
export FLUENTBIT_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/FluentBitRole"
export SECRETS_STORE_PROVIDER_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/SecretsStoreProviderRole"
export SEALED_SECRETS_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/SealedSecretsRole"
```

## Step-by-Step Bootstrap

### 1. Configure IAM Roles

Run the helper script to create IAM policies, roles, and Kubernetes service accounts:

```bash
./scripts/setup-iam-roles.sh
```

Review [infrastructure/kubernetes/IAM_SETUP.md](../../infrastructure/kubernetes/IAM_SETUP.md) for full policy definitions and manual instructions if customization is required.

### 2. Install Helmfile

Install [helmfile](https://helmfile.readthedocs.io/en/latest/) locally.

```bash
brew install helmfile # macOS
# or
wget -O /usr/local/bin/helmfile https://github.com/helmfile/helmfile/releases/download/v0.156.0/helmfile_linux_amd64
chmod +x /usr/local/bin/helmfile
```

### 3. Bootstrap Namespaces & Core RBAC

```bash
cd infrastructure/kubernetes
helmfile apply --skip-diff-on-install --include-needs platform-namespaces platform-rbac
```

This ensures namespaces exist before installing other services.

### 4. Deploy Shared Services

Deploy the full stack:

```bash
helmfile sync
```

Alternatively, apply individual releases in stages:

```bash
helmfile apply --suppress secrets csi-secrets-store sealed-secrets
helmfile apply aws-load-balancer-controller cert-manager external-dns
helmfile apply kube-prometheus-stack fluent-bit
```

`helmfile` automatically performs `envsubst` on value files that contain `${VAR}` placeholders; ensure those environment variables are exported.

### 5. Configure cert-manager Issuers

Apply the pre-configured issuers:

```bash
envsubst < cert-manager/cluster-issuers.yaml | kubectl apply -f -
```

### 6. Configure SecretProviderClasses

Review the examples under `infrastructure/kubernetes/secrets-management/secret-provider-class-example.yaml`. Apply them after customizing ARN references:

```bash
envsubst < infrastructure/kubernetes/secrets-management/secret-provider-class-example.yaml | kubectl apply -f -
```

### 7. Configure Fluent Bit

A ConfigMap for Fluent Bit is provided. Apply before installing the chart if customizing log routing:

```bash
envsubst < infrastructure/kubernetes/observability/fluentbit/fluentbit-config.yaml | kubectl apply -f -
```

The helm chart references this ConfigMap by name (`fluent-bit-config`).

### 8. Create Additional Scrape Configs

The kube-prometheus-stack values expect a secret named `additional-scrape-configs`. Create it from the provided file:

```bash
kubectl create secret generic additional-scrape-configs \
  --from-file=prometheus-additional.yaml=infrastructure/kubernetes/observability/prometheus-grafana/custom-scrape-configs.yaml \
  -n monitoring
```

## Post-Deployment

### Verify Component Health

```bash
kubectl get pods -n ingress-system
kubectl get pods -n cert-manager
kubectl get pods -n external-dns
kubectl get pods -n secrets-management
kubectl get pods -n monitoring
kubectl get pods -n logging
```

Inspect logs and metrics as described in [infrastructure/kubernetes/README.md](../../infrastructure/kubernetes/README.md).

### Access Grafana & Prometheus

```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80
kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090
```

### Encrypt Secrets with Sealed Secrets

```bash
kubectl create secret generic db-password \
  --from-literal=password='super-secret' \
  --dry-run=client -o yaml > db-password.yaml

kubeseal --format yaml --cert sealed-secrets-public-cert.pem < db-password.yaml > db-password-sealed.yaml
```

Apply the sealed secret to the target namespace.

## Maintenance

- Run `helmfile repos` to update Helm repositories
- Use `helmfile diff` to preview changes
- Monitor AWS IAM policies for least privilege
- Rotate credentials and TLS certificates regularly

## Troubleshooting

- Use `helmfile status` to check release state
- Examine controller logs (`kubectl logs -n ingress-system deployment/aws-load-balancer-controller`)
- Ensure service accounts contain correct `eks.amazonaws.com/role-arn` annotations
- Re-run `helmfile apply` after updating values or environment variables

## Additional Resources

- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [cert-manager](https://cert-manager.io/docs/)
- [External DNS](https://github.com/kubernetes-sigs/external-dns)
- [Secrets Store CSI Driver](https://github.com/aws/secrets-store-csi-driver-provider-aws)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [kube-prometheus-stack](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack)
- [Fluent Bit Helm Chart](https://github.com/fluent/helm-charts)
