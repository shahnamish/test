.PHONY: help install-tools validate-env deploy-namespaces deploy-rbac deploy-iam deploy-ingress deploy-cert-manager deploy-external-dns deploy-secrets deploy-observability deploy-all verify clean

.DEFAULT_GOAL := help

help:
    @echo "Kubernetes Platform Bootstrap Makefile"
    @echo ""
    @echo "Available targets:"
    @echo "  install-tools       - Install required CLI tools (kubectl, helm, eksctl, kubeseal)"
    @echo "  validate-env        - Validate required environment variables are set"
    @echo "  deploy-iam          - Create IAM roles and service accounts"
    @echo "  deploy-namespaces   - Deploy platform namespaces"
    @echo "  deploy-rbac         - Deploy RBAC configurations"
    @echo "  deploy-ingress      - Deploy AWS Load Balancer Controller"
    @echo "  deploy-cert-manager - Deploy cert-manager and ClusterIssuers"
    @echo "  deploy-external-dns - Deploy external-dns"
    @echo "  deploy-secrets      - Deploy Secrets Store CSI Driver and Sealed Secrets"
    @echo "  deploy-observability - Deploy Prometheus, Grafana, and Fluent Bit"
    @echo "  deploy-all          - Deploy entire platform stack"
    @echo "  verify              - Verify all components are running"
    @echo "  clean               - Remove all platform components"

REQUIRED_VARS := CLUSTER_NAME AWS_REGION AWS_ACCOUNT_ID VPC_ID PUBLIC_HOSTED_ZONE CERT_MANAGER_EMAIL GRAFANA_ADMIN_PASSWORD ENVIRONMENT
REQUIRED_ROLE_ARNS := AWS_LOAD_BALANCER_CONTROLLER_ROLE_ARN EXTERNAL_DNS_ROLE_ARN FLUENTBIT_ROLE_ARN SECRETS_STORE_PROVIDER_ROLE_ARN

validate-env:
    @echo "Validating environment variables..."
    @$(foreach var,$(REQUIRED_VARS),\
        $(if $(value $(var)),,$(error $(var) is not set)))
    @$(foreach var,$(REQUIRED_ROLE_ARNS),\
        $(if $(value $(var)),,$(error $(var) is not set)))
    @echo "✓ All required environment variables are set"

install-tools:
    @echo "Checking for required tools..."
    @command -v kubectl >/dev/null 2>&1 || { echo "kubectl not found. Please install: https://kubernetes.io/docs/tasks/tools/"; exit 1; }
    @command -v helm >/dev/null 2>&1 || { echo "helm not found. Please install: https://helm.sh/docs/intro/install/"; exit 1; }
    @command -v aws >/dev/null 2>&1 || { echo "aws cli not found. Please install: https://aws.amazon.com/cli/"; exit 1; }
    @command -v eksctl >/dev/null 2>&1 || { echo "eksctl not found. Please install: https://eksctl.io/introduction/#installation"; exit 1; }
    @command -v kubeseal >/dev/null 2>&1 || { echo "kubeseal not found. Please install: https://github.com/bitnami-labs/sealed-secrets#installation"; exit 1; }
    @command -v helmfile >/dev/null 2>&1 || { echo "helmfile not found. Please install: https://helmfile.readthedocs.io/en/latest/#installation"; exit 1; }
    @echo "✓ All required tools are installed"

deploy-iam: validate-env
    @echo "Creating IAM roles and service accounts..."
    ../../scripts/setup-iam-roles.sh
    @echo "✓ IAM roles created"

deploy-namespaces: validate-env
    @echo "Deploying namespaces..."
    helm upgrade --install platform-namespaces ./charts/namespaces --namespace kube-system
    @echo "✓ Namespaces deployed"

deploy-rbac: validate-env deploy-namespaces
    @echo "Deploying RBAC configurations..."
    helm upgrade --install platform-rbac ./charts/rbac --namespace kube-system
    @echo "✓ RBAC deployed"

deploy-ingress: validate-env deploy-namespaces deploy-iam
    @echo "Deploying AWS Load Balancer Controller..."
    helm repo add eks https://aws.github.io/eks-charts || true
    helm repo update
    envsubst < ingress/aws-load-balancer-controller-values.yaml.gotmpl | \
        helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
            --namespace ingress-system \
            --values -
    @echo "Waiting for AWS Load Balancer Controller to be ready..."
    kubectl wait --for=condition=available --timeout=300s \
        deployment/aws-load-balancer-controller -n ingress-system
    @echo "✓ AWS Load Balancer Controller deployed"

deploy-cert-manager: validate-env deploy-namespaces
    @echo "Deploying cert-manager..."
    helm repo add jetstack https://charts.jetstack.io || true
    helm repo update
    helm upgrade --install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --values cert-manager/values.yaml
    @echo "Waiting for cert-manager to be ready..."
    kubectl wait --for=condition=available --timeout=300s \
        deployment/cert-manager -n cert-manager
    @echo "Creating ClusterIssuers..."
    envsubst < cert-manager/cluster-issuers.yaml | kubectl apply -f -
    @echo "✓ cert-manager deployed"

deploy-external-dns: validate-env deploy-namespaces deploy-iam
    @echo "Deploying external-dns..."
    helm repo add external-dns https://kubernetes-sigs.github.io/external-dns/ || true
    helm repo update
    envsubst < external-dns/values.yaml.gotmpl | \
        helm upgrade --install external-dns external-dns/external-dns \
            --namespace external-dns \
            --values -
    @echo "✓ external-dns deployed"

deploy-secrets: validate-env deploy-namespaces deploy-iam
    @echo "Deploying Secrets Store CSI Driver..."
    helm repo add secrets-store-csi-driver https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts || true
    helm repo update
    helm upgrade --install csi-secrets-store secrets-store-csi-driver/secrets-store-csi-driver \
        --namespace secrets-management \
        --values secrets-management/secrets-store-csi-values.yaml
    @echo "Installing AWS Secrets Store Provider..."
    kubectl apply -f https://raw.githubusercontent.com/aws/secrets-store-csi-driver-provider-aws/main/deployment/aws-provider-installer.yaml
    @echo "Deploying Sealed Secrets..."
    helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets || true
    helm repo update
    envsubst < sealed-secrets/values.yaml.gotmpl | \
        helm upgrade --install sealed-secrets sealed-secrets/sealed-secrets \
            --namespace secrets-management \
            --values -
    @echo "Waiting for Sealed Secrets controller to be ready..."
    kubectl wait --for=condition=available --timeout=300s \
        deployment/sealed-secrets -n secrets-management || true
    @echo "Fetching Sealed Secrets public certificate..."
    kubeseal --fetch-cert \
        --controller-name=sealed-secrets \
        --controller-namespace=secrets-management \
        > sealed-secrets-public-cert.pem || echo "Warning: Could not fetch cert yet"
    @echo "✓ Secrets management deployed"

deploy-observability: validate-env deploy-namespaces deploy-iam
    @echo "Deploying observability stack..."
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts || true
    helm repo add fluent https://fluent.github.io/helm-charts || true
    helm repo update
    @echo "Creating additional scrape configs secret..."
    kubectl create secret generic additional-scrape-configs \
        --from-file=observability/prometheus-grafana/custom-scrape-configs.yaml \
        --namespace monitoring \
        --dry-run=client -o yaml | kubectl apply -f -
    @echo "Deploying Prometheus & Grafana..."
    envsubst < observability/prometheus-grafana/values.yaml.gotmpl | \
        helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
            --namespace monitoring \
            --values -
    @echo "Deploying Fluent Bit..."
    envsubst < observability/fluentbit/fluentbit-config.yaml | kubectl apply -f -
    envsubst < observability/fluentbit/values.yaml.gotmpl | \
        helm upgrade --install fluent-bit fluent/fluent-bit \
            --namespace logging \
            --values -
    @echo "✓ Observability stack deployed"

deploy-all: install-tools validate-env deploy-iam deploy-namespaces deploy-rbac deploy-ingress deploy-cert-manager deploy-external-dns deploy-secrets deploy-observability
    @echo "✓ Complete platform deployed successfully!"

verify:
    @echo "Verifying platform components..."
    @echo ""
    @echo "Namespaces:"
    @kubectl get namespaces | grep -E "(ingress-system|cert-manager|external-dns|secrets-management|monitoring|logging|staging|production|application)"
    @echo ""
    @echo "Ingress System:"
    @kubectl get pods -n ingress-system
    @echo ""
    @echo "cert-manager:"
    @kubectl get pods -n cert-manager
    @echo ""
    @echo "external-dns:"
    @kubectl get pods -n external-dns
    @echo ""
    @echo "Secrets Management:"
    @kubectl get pods -n secrets-management
    @echo ""
    @echo "Monitoring:"
    @kubectl get pods -n monitoring
    @echo ""
    @echo "Logging:"
    @kubectl get pods -n logging
    @echo ""
    @echo "ClusterIssuers:"
    @kubectl get clusterissuers

clean:
    @echo "WARNING: This will remove all platform components!"
    @read -p "Are you sure? [y/N] " -n 1 -r; \
    echo; \
    if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
        helm uninstall fluent-bit -n logging || true; \
        helm uninstall kube-prometheus-stack -n monitoring || true; \
        helm uninstall sealed-secrets -n secrets-management || true; \
        helm uninstall csi-secrets-store -n secrets-management || true; \
        helm uninstall external-dns -n external-dns || true; \
        helm uninstall cert-manager -n cert-manager || true; \
        helm uninstall aws-load-balancer-controller -n ingress-system || true; \
        helm uninstall platform-rbac -n kube-system || true; \
        kubectl delete -f namespaces/namespaces.yaml || true; \
        echo "✓ Platform components removed"; \
    fi
