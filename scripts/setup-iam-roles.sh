#!/usr/bin/env bash
set -euo pipefail

: "${CLUSTER_NAME?Must set CLUSTER_NAME environment variable}"
: "${AWS_REGION?Must set AWS_REGION environment variable}"
: "${AWS_ACCOUNT_ID?Must set AWS_ACCOUNT_ID environment variable}"

OIDC_PROVIDER=$(aws eks describe-cluster \
  --name "${CLUSTER_NAME}" \
  --region "${AWS_REGION}" \
  --query "cluster.identity.oidc.issuer" \
  --output text)

if [[ -z "${OIDC_PROVIDER}" ]]; then
  echo "Failed to detect OIDC provider for cluster ${CLUSTER_NAME}" >&2
  exit 1
fi

echo "Ensuring IAM OIDC provider is associated with the cluster..."
eksctl utils associate-iam-oidc-provider \
  --cluster "${CLUSTER_NAME}" \
  --region "${AWS_REGION}" \
  --approve

TMP_DIR=$(mktemp -d)
trap 'rm -rf "${TMP_DIR}"' EXIT

create_policy() {
  local name=$1
  local file=$2

  if aws iam get-policy --policy-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${name}" >/dev/null 2>&1; then
    echo "IAM policy ${name} already exists. Skipping create."
    return
  fi

  echo "Creating IAM policy ${name}..."
  aws iam create-policy \
    --policy-name "${name}" \
    --policy-document "file://${file}" >/dev/null
}

create_service_account() {
  local namespace=$1
  local sa_name=$2
  local role_name=$3
  local policy_name=$4

  if kubectl get sa "${sa_name}" -n "${namespace}" >/dev/null 2>&1; then
    echo "Service account ${namespace}/${sa_name} already exists. Skipping create."
  fi

  echo "Ensuring service account ${namespace}/${sa_name} with IAM role ${role_name}..."
  eksctl create iamserviceaccount \
    --cluster "${CLUSTER_NAME}" \
    --region "${AWS_REGION}" \
    --namespace "${namespace}" \
    --name "${sa_name}" \
    --role-name "${role_name}" \
    --attach-policy-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${policy_name}" \
    --override-existing-serviceaccounts \
    --approve
}

# IAM policy documents
cat <<'EOF' >"${TMP_DIR}/load-balancer-controller-policy.json"
{ "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["iam:CreateServiceLinkedRole"], "Resource": "*", "Condition": {"StringEquals": {"iam:AWSServiceName": "elasticloadbalancing.amazonaws.com"}} },
    { "Effect": "Allow", "Action": ["ec2:DescribeAccountAttributes","ec2:DescribeAddresses","ec2:DescribeAvailabilityZones","ec2:DescribeInternetGateways","ec2:DescribeVpcs","ec2:DescribeVpcPeeringConnections","ec2:DescribeSubnets","ec2:DescribeSecurityGroups","ec2:DescribeInstances","ec2:DescribeNetworkInterfaces","ec2:DescribeTags","ec2:GetCoipPoolUsage","ec2:DescribeCoipPools","elasticloadbalancing:DescribeLoadBalancers","elasticloadbalancing:DescribeLoadBalancerAttributes","elasticloadbalancing:DescribeListeners","elasticloadbalancing:DescribeListenerCertificates","elasticloadbalancing:DescribeSSLPolicies","elasticloadbalancing:DescribeRules","elasticloadbalancing:DescribeTargetGroups","elasticloadbalancing:DescribeTargetGroupAttributes","elasticloadbalancing:DescribeTargetHealth","elasticloadbalancing:DescribeTags"], "Resource": "*" },
    { "Effect": "Allow", "Action": ["cognito-idp:DescribeUserPoolClient","acm:ListCertificates","acm:DescribeCertificate","iam:ListServerCertificates","iam:GetServerCertificate","waf-regional:GetWebACL","waf-regional:GetWebACLForResource","waf-regional:AssociateWebACL","waf-regional:DisassociateWebACL","wafv2:GetWebACL","wafv2:GetWebACLForResource","wafv2:AssociateWebACL","wafv2:DisassociateWebACL","shield:GetSubscriptionState","shield:DescribeProtection","shield:CreateProtection","shield:DeleteProtection"], "Resource": "*" },
    { "Effect": "Allow", "Action": ["ec2:AuthorizeSecurityGroupIngress","ec2:RevokeSecurityGroupIngress","ec2:CreateSecurityGroup"], "Resource": "*" },
    { "Effect": "Allow", "Action": ["ec2:CreateTags"], "Resource": "arn:aws:ec2:*:*:security-group/*", "Condition": { "StringEquals": {"ec2:CreateAction": "CreateSecurityGroup"}, "Null": {"aws:RequestTag/elbv2.k8s.aws/cluster": "false"} } },
    { "Effect": "Allow", "Action": ["ec2:CreateTags","ec2:DeleteTags"], "Resource": "arn:aws:ec2:*:*:security-group/*", "Condition": { "Null": {"aws:RequestTag/elbv2.k8s.aws/cluster": "true","aws:ResourceTag/elbv2.k8s.aws/cluster": "false"} } },
    { "Effect": "Allow", "Action": ["ec2:AuthorizeSecurityGroupIngress","ec2:RevokeSecurityGroupIngress","ec2:DeleteSecurityGroup"], "Resource": "*", "Condition": { "Null": {"aws:ResourceTag/elbv2.k8s.aws/cluster": "false"} } },
    { "Effect": "Allow", "Action": ["elasticloadbalancing:CreateLoadBalancer","elasticloadbalancing:CreateTargetGroup"], "Resource": "*", "Condition": { "Null": {"aws:RequestTag/elbv2.k8s.aws/cluster": "false"} } },
    { "Effect": "Allow", "Action": ["elasticloadbalancing:CreateListener","elasticloadbalancing:DeleteListener","elasticloadbalancing:CreateRule","elasticloadbalancing:DeleteRule"], "Resource": "*" },
    { "Effect": "Allow", "Action": ["elasticloadbalancing:AddListenerCertificates","elasticloadbalancing:RemoveListenerCertificates","elasticloadbalancing:ModifyListener"], "Resource": "*" },
    { "Effect": "Allow", "Action": ["elasticloadbalancing:AddTags","elasticloadbalancing:RemoveTags"], "Resource": ["arn:aws:elasticloadbalancing:*:*:targetgroup/*/*","arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*","arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*"], "Condition": { "Null": {"aws:RequestTag/elbv2.k8s.aws/cluster": "true","aws:ResourceTag/elbv2.k8s.aws/cluster": "false"} } },
    { "Effect": "Allow", "Action": ["elasticloadbalancing:AddTags","elasticloadbalancing:RemoveTags"], "Resource": ["arn:aws:elasticloadbalancing:*:*:listener/net/*/*/*","arn:aws:elasticloadbalancing:*:*:listener/app/*/*/*","arn:aws:elasticloadbalancing:*:*:listener-rule/net/*/*/*","arn:aws:elasticloadbalancing:*:*:listener-rule/app/*/*/*"] },
    { "Effect": "Allow", "Action": ["elasticloadbalancing:ModifyLoadBalancerAttributes","elasticloadbalancing:SetIpAddressType","elasticloadbalancing:SetSecurityGroups","elasticloadbalancing:SetSubnets","elasticloadbalancing:DeleteLoadBalancer","elasticloadbalancing:ModifyTargetGroup","elasticloadbalancing:ModifyTargetGroupAttributes","elasticloadbalancing:DeleteTargetGroup"], "Resource": "*", "Condition": { "Null": {"aws:ResourceTag/elbv2.k8s.aws/cluster": "false"} } },
    { "Effect": "Allow", "Action": ["elasticloadbalancing:RegisterTargets","elasticloadbalancing:DeregisterTargets"], "Resource": "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*" }
  ]
}
EOF

cat <<'EOF' >"${TMP_DIR}/external-dns-policy.json"
{ "Version": "2012-10-17", "Statement": [
  { "Effect": "Allow", "Action": ["route53:ChangeResourceRecordSets"], "Resource": ["arn:aws:route53:::hostedzone/*"] },
  { "Effect": "Allow", "Action": ["route53:ListHostedZones","route53:ListResourceRecordSets"], "Resource": ["*"] }
] }
EOF

cat <<'EOF' >"${TMP_DIR}/fluent-bit-policy.json"
{ "Version": "2012-10-17", "Statement": [
  { "Effect": "Allow", "Action": ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents","logs:DescribeLogGroups","logs:DescribeLogStreams"], "Resource": "*" }
] }
EOF

cat <<'EOF' >"${TMP_DIR}/secrets-store-csi-policy.json"
{ "Version": "2012-10-17", "Statement": [
  { "Effect": "Allow", "Action": ["secretsmanager:GetSecretValue","secretsmanager:DescribeSecret"], "Resource": "arn:aws:secretsmanager:*:*:secret:*" },
  { "Effect": "Allow", "Action": ["ssm:GetParameter","ssm:GetParameters"], "Resource": "arn:aws:ssm:*:*:parameter/*" }
] }
EOF

cat <<'EOF' >"${TMP_DIR}/cert-manager-policy.json"
{ "Version": "2012-10-17", "Statement": [
  { "Effect": "Allow", "Action": "route53:GetChange", "Resource": "arn:aws:route53:::change/*" },
  { "Effect": "Allow", "Action": ["route53:ChangeResourceRecordSets","route53:ListResourceRecordSets"], "Resource": "arn:aws:route53:::hostedzone/*" },
  { "Effect": "Allow", "Action": "route53:ListHostedZonesByName", "Resource": "*" }
] }
EOF

# Create policies and service accounts
create_policy "AWSLoadBalancerControllerIAMPolicy" "${TMP_DIR}/load-balancer-controller-policy.json"
create_policy "ExternalDNSIAMPolicy" "${TMP_DIR}/external-dns-policy.json"
create_policy "FluentBitIAMPolicy" "${TMP_DIR}/fluent-bit-policy.json"
create_policy "SecretsStoreCSIDriverIAMPolicy" "${TMP_DIR}/secrets-store-csi-policy.json"
create_policy "CertManagerIAMPolicy" "${TMP_DIR}/cert-manager-policy.json"

create_service_account "ingress-system" "aws-load-balancer-controller" "AWSLoadBalancerControllerRole" "AWSLoadBalancerControllerIAMPolicy"
create_service_account "external-dns" "external-dns" "ExternalDNSRole" "ExternalDNSIAMPolicy"
create_service_account "logging" "fluent-bit" "FluentBitRole" "FluentBitIAMPolicy"
create_service_account "secrets-management" "secrets-store-csi-driver" "SecretsStoreProviderRole" "SecretsStoreCSIDriverIAMPolicy"
create_service_account "cert-manager" "cert-manager" "CertManagerRole" "CertManagerIAMPolicy"

echo "All IAM roles and service accounts have been configured."
