# Quick Start Guide

This guide helps you bootstrap the Kubernetes platform with shared services in ~30 minutes.

## Prerequisites Checklist

- [ ] EKS cluster running with worker nodes
- [ ] kubectl configured to access the cluster
- [ ] Helm 3 installed
- [ ] AWS CLI configured with appropriate credentials
- [ ] eksctl installed
- [ ] Route53 hosted zone created
- [ ] VPC ID for your EKS cluster

## 5-Minute Bootstrap

### 1. Set Environment Variables

```bash
export CLUSTER_NAME="my-eks-cluster"
export AWS_REGION="us-east-1"
export AWS_ACCOUNT_ID="123456789012"
export VPC_ID="vpc-abc123"
export PUBLIC_HOSTED_ZONE="example.com"
export CERT_MANAGER_EMAIL="platform@example.com"
export GRAFANA_ADMIN_PASSWORD="MySecurePassword123!"
export ENVIRONMENT="production"
```

### 2. Run IAM Setup

```bash
cd infrastructure/kubernetes
../../scripts/setup-iam-roles.sh
```

This creates:
- IAM policies for each service
- IAM roles with IRSA (IAM Roles for Service Accounts)
- Kubernetes service accounts with role annotations

### 3. Update Environment with Role ARNs

After IAM setup completes, export the role ARNs:

```bash
export AWS_LOAD_BALANCER_CONTROLLER_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/AWSLoadBalancerControllerRole"
export EXTERNAL_DNS_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/ExternalDNSRole"
export FLUENTBIT_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/FluentBitRole"
export SECRETS_STORE_PROVIDER_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/SecretsStoreProviderRole"
```

### 4. Deploy Platform

```bash
make deploy-all
```

This command:
1. Validates environment variables
2. Deploys namespaces (ingress-system, cert-manager, external-dns, secrets-management, monitoring, logging, application, staging, production)
3. Deploys RBAC (cluster roles, role bindings, service accounts)
4. Installs AWS Load Balancer Controller
5. Installs cert-manager with Let's Encrypt issuers
6. Installs external-dns for Route53 automation
7. Installs Secrets Store CSI Driver + AWS provider
8. Installs Sealed Secrets controller
9. Installs Prometheus, Grafana, and Fluent Bit

### 5. Verify Deployment

```bash
make verify
```

Check that all pods are running:

```bash
kubectl get pods -n ingress-system
kubectl get pods -n cert-manager
kubectl get pods -n external-dns
kubectl get pods -n secrets-management
kubectl get pods -n monitoring
kubectl get pods -n logging
```

## Access Services

### Grafana

```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80
```

Open http://localhost:3000
- Username: `admin`
- Password: `$GRAFANA_ADMIN_PASSWORD`

### Prometheus

```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090
```

Open http://localhost:9090

## What Got Deployed?

| Component | Purpose | Namespace |
|-----------|---------|-----------|
| **Namespaces** | Logical isolation | Multiple |
| **AWS Load Balancer Controller** | Manages ALB/NLB for Ingress | ingress-system |
| **cert-manager** | Automated TLS certificates (Let's Encrypt) | cert-manager |
| **external-dns** | Automatic Route53 DNS records | external-dns |
| **Secrets Store CSI Driver** | Mount AWS Secrets Manager secrets | secrets-management |
| **Sealed Secrets** | Encrypt secrets for GitOps | secrets-management |
| **Prometheus** | Metrics collection | monitoring |
| **Grafana** | Metrics visualization | monitoring |
| **Fluent Bit** | Log forwarding to CloudWatch | logging |
| **RBAC** | Platform roles and permissions | Cluster-wide |

## Next Steps

### 1. Create Your First Application

```bash
kubectl create deployment nginx --image=nginx -n application
kubectl expose deployment nginx --port=80 -n application
```

### 2. Create an Ingress with TLS

```bash
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx-ingress
  namespace: application
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    cert-manager.io/cluster-issuer: letsencrypt-prod
    external-dns.alpha.kubernetes.io/hostname: app.${PUBLIC_HOSTED_ZONE}
spec:
  tls:
    - hosts:
        - app.${PUBLIC_HOSTED_ZONE}
      secretName: app-tls
  rules:
    - host: app.${PUBLIC_HOSTED_ZONE}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: nginx
                port:
                  number: 80
EOF
```

Wait ~2-3 minutes for:
- ALB to provision
- DNS record to be created in Route53
- TLS certificate to be issued by Let's Encrypt

### 3. Mount Secrets from AWS Secrets Manager

First, create a secret in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name my-app-secret \
  --secret-string '{"username":"admin","password":"secret123"}' \
  --region ${AWS_REGION}
```

Create a SecretProviderClass:

```bash
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
```

Use it in a Pod:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: my-app
  namespace: application
spec:
  serviceAccountName: default
  containers:
    - name: app
      image: nginx
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

### 4. Use Sealed Secrets for GitOps

Fetch the public key:

```bash
kubeseal --fetch-cert \
  --controller-name=sealed-secrets \
  --controller-namespace=secrets-management \
  > sealed-secrets-public-cert.pem
```

Create and seal a secret:

```bash
kubectl create secret generic db-password \
  --from-literal=password='super-secret' \
  --namespace=application \
  --dry-run=client -o yaml > db-password.yaml

kubeseal --format yaml --cert=sealed-secrets-public-cert.pem \
  < db-password.yaml > db-password-sealed.yaml

# Safe to commit to Git!
git add db-password-sealed.yaml
```

## Troubleshooting

### Pods Not Starting

Check events:
```bash
kubectl get events -n <namespace> --sort-by='.lastTimestamp'
```

Check pod logs:
```bash
kubectl logs -n <namespace> <pod-name>
```

### Load Balancer Not Creating

Check controller logs:
```bash
kubectl logs -n ingress-system deployment/aws-load-balancer-controller
```

Verify IAM role:
```bash
kubectl describe sa aws-load-balancer-controller -n ingress-system
```

### Certificates Not Issuing

Check certificate status:
```bash
kubectl describe certificate <cert-name> -n <namespace>
```

Check cert-manager logs:
```bash
kubectl logs -n cert-manager deployment/cert-manager
```

### DNS Records Not Creating

Check external-dns logs:
```bash
kubectl logs -n external-dns deployment/external-dns
```

## Clean Up

To remove all platform components:

```bash
make clean
```

**Warning**: This will delete all deployed services and configurations.

## Getting Help

- Review [README.md](./README.md) for comprehensive documentation
- Check [IAM_SETUP.md](./IAM_SETUP.md) for IAM configuration details
- See [docs/operations/kubernetes-platform-bootstrap.md](../../docs/operations/kubernetes-platform-bootstrap.md) for operational procedures

## Support

For issues or questions about the platform:
1. Check the troubleshooting section
2. Review component-specific documentation
3. Check logs for error messages
4. Contact the platform team
