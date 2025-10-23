# Deployment Checklist

Use this checklist to ensure a successful Kubernetes platform deployment.

## Pre-Deployment

### AWS Prerequisites
- [ ] EKS cluster is created and running
- [ ] Worker nodes are provisioned and healthy
- [ ] OIDC provider is associated with the cluster
- [ ] VPC has appropriate tags for ALB/NLB discovery
- [ ] Route53 hosted zone exists for your domain
- [ ] AWS CLI is configured with correct credentials
- [ ] Account has sufficient quotas for ALBs, NLBs, and EBS volumes

### Local Tools
- [ ] kubectl installed and configured (`kubectl version`)
- [ ] Helm 3 installed (`helm version`)
- [ ] AWS CLI installed (`aws --version`)
- [ ] eksctl installed (`eksctl version`)
- [ ] kubeseal installed (`kubeseal --version`)
- [ ] envsubst installed (comes with gettext package)

### Access Verification
- [ ] kubectl can access cluster (`kubectl get nodes`)
- [ ] Appropriate AWS permissions for IAM role creation
- [ ] Can create/modify Route53 records
- [ ] Can create/modify Secrets Manager secrets

## Environment Configuration

### Required Environment Variables
- [ ] `CLUSTER_NAME` - Name of your EKS cluster
- [ ] `AWS_REGION` - AWS region (e.g., us-east-1)
- [ ] `AWS_ACCOUNT_ID` - Your AWS account ID
- [ ] `VPC_ID` - VPC ID where EKS cluster is running
- [ ] `PUBLIC_HOSTED_ZONE` - Route53 hosted zone domain
- [ ] `CERT_MANAGER_EMAIL` - Email for Let's Encrypt notifications
- [ ] `GRAFANA_ADMIN_PASSWORD` - Grafana admin password
- [ ] `ENVIRONMENT` - Environment name (production/staging)

### Generate .env File
```bash
cd infrastructure/kubernetes
cp .env.example .env
# Edit .env with your values
source .env
```

## IAM Setup

- [ ] Run IAM setup script: `../../scripts/setup-iam-roles.sh`
- [ ] Verify IAM policies were created
- [ ] Verify IAM roles were created
- [ ] Verify service accounts were created with annotations
- [ ] Export role ARNs as environment variables

## Deployment Steps

### Core Platform
- [ ] Deploy namespaces: `make deploy-namespaces`
- [ ] Verify namespaces created: `kubectl get namespaces`
- [ ] Deploy RBAC: `make deploy-rbac`
- [ ] Verify cluster roles: `kubectl get clusterroles | grep platform`

### Ingress
- [ ] Deploy AWS Load Balancer Controller: `make deploy-ingress`
- [ ] Wait for controller to be ready
- [ ] Verify pods running: `kubectl get pods -n ingress-system`
- [ ] Check controller logs for errors

### Certificate Management
- [ ] Deploy cert-manager: `make deploy-cert-manager`
- [ ] Wait for cert-manager to be ready
- [ ] Verify pods running: `kubectl get pods -n cert-manager`
- [ ] Verify ClusterIssuers: `kubectl get clusterissuers`

### DNS Management
- [ ] Deploy external-dns: `make deploy-external-dns`
- [ ] Verify pod running: `kubectl get pods -n external-dns`
- [ ] Check logs for Route53 access

### Secrets Management
- [ ] Deploy secrets components: `make deploy-secrets`
- [ ] Verify CSI driver: `kubectl get daemonset -n secrets-management`
- [ ] Verify Sealed Secrets controller: `kubectl get pods -n secrets-management`
- [ ] Fetch Sealed Secrets public key
- [ ] Save public key securely

### Observability
- [ ] Create additional scrape configs secret
- [ ] Deploy observability stack: `make deploy-observability`
- [ ] Verify Prometheus: `kubectl get pods -n monitoring`
- [ ] Verify Grafana: `kubectl get pods -n monitoring`
- [ ] Verify Fluent Bit: `kubectl get pods -n logging`

## Post-Deployment Verification

### Overall Health Check
- [ ] Run: `make verify`
- [ ] All pods in Running state
- [ ] No CrashLoopBackOff pods
- [ ] No ImagePullBackOff errors

### Component-Specific Checks

#### AWS Load Balancer Controller
- [ ] Controller logs show no errors
- [ ] Controller can list EC2 instances
- [ ] Controller can access ELB API

#### cert-manager
- [ ] ClusterIssuers are Ready
- [ ] Can create test certificate
- [ ] Test certificate issues successfully

#### external-dns
- [ ] Controller logs show Route53 access
- [ ] No permission errors in logs
- [ ] Can list hosted zones

#### Secrets Store CSI Driver
- [ ] DaemonSet running on all nodes
- [ ] Can mount test secret
- [ ] Test pod can read secret

#### Sealed Secrets
- [ ] Controller is running
- [ ] Public key fetched successfully
- [ ] Can seal test secret
- [ ] Sealed secret decrypts correctly

#### Prometheus
- [ ] Prometheus UI accessible via port-forward
- [ ] Targets are being scraped
- [ ] No scrape errors
- [ ] Metrics are being collected

#### Grafana
- [ ] Grafana UI accessible via port-forward
- [ ] Can login with admin password
- [ ] Prometheus datasource configured
- [ ] Dashboards loaded

#### Fluent Bit
- [ ] DaemonSet running on all nodes
- [ ] Logs appearing in CloudWatch
- [ ] No buffer overflow errors

## Testing

### Create Test Application
- [ ] Deploy example app: `kubectl apply -f examples/complete-app-example.yaml`
- [ ] Wait for pods to be ready
- [ ] Verify ALB created
- [ ] Verify DNS record created
- [ ] Verify TLS certificate issued
- [ ] Access application via HTTPS
- [ ] Check logs in CloudWatch
- [ ] Check metrics in Prometheus

### Test Secrets Management
- [ ] Create test secret in AWS Secrets Manager
- [ ] Create SecretProviderClass
- [ ] Mount secret in test pod
- [ ] Verify secret accessible
- [ ] Create and seal test secret
- [ ] Apply sealed secret
- [ ] Verify unsealing works

## Monitoring Setup

### Prometheus
- [ ] Review default scrape configs
- [ ] Add custom ServiceMonitors if needed
- [ ] Configure alert rules
- [ ] Test alerting to Alertmanager

### Grafana
- [ ] Import additional dashboards
- [ ] Configure additional datasources if needed
- [ ] Set up user accounts
- [ ] Configure SMTP for alerts

### CloudWatch
- [ ] Verify log groups created
- [ ] Set retention policies
- [ ] Create CloudWatch dashboards
- [ ] Set up CloudWatch alarms

## Security Review

- [ ] Review IAM policies for least privilege
- [ ] Verify IRSA roles are being used
- [ ] Check network policies are in place
- [ ] Review RBAC permissions
- [ ] Ensure no secrets in plain text
- [ ] Verify TLS is enforced
- [ ] Review security groups
- [ ] Enable pod security policies/standards

## Documentation

- [ ] Document custom configurations
- [ ] Update runbooks with cluster-specific info
- [ ] Document any troubleshooting steps taken
- [ ] Create operational procedures
- [ ] Document escalation paths
- [ ] Create disaster recovery plan

## Clean Up (If Needed)

If deployment fails and you need to start over:
- [ ] Run: `make clean`
- [ ] Delete IAM roles: Review and delete manually
- [ ] Delete ALBs: May need manual cleanup
- [ ] Delete Route53 records: May need manual cleanup
- [ ] Review CloudWatch log groups

## Success Criteria

Platform is considered successfully deployed when:
- [ ] All pods are Running
- [ ] All controllers can access AWS APIs
- [ ] Test application is accessible via HTTPS with valid certificate
- [ ] DNS records are automatically created
- [ ] Logs are flowing to CloudWatch
- [ ] Metrics are being collected by Prometheus
- [ ] Grafana dashboards show data
- [ ] Secrets can be mounted from AWS Secrets Manager
- [ ] Sealed secrets can be decrypted
- [ ] No error messages in any logs

## Troubleshooting Reference

If issues occur, refer to:
- `README.md` - Comprehensive documentation
- `IAM_SETUP.md` - IAM configuration details
- `QUICKSTART.md` - Quick deployment guide
- `ARCHITECTURE.md` - Architecture overview
- Controller logs in respective namespaces
- AWS CloudTrail for API call audit

## Support

For help with deployment:
1. Check logs: `kubectl logs -n <namespace> <pod>`
2. Check events: `kubectl get events -n <namespace>`
3. Review documentation in this directory
4. Contact platform team
