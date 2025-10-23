# IAM Setup for Kubernetes Platform Services

This document describes the required IAM roles and policies for the platform services.

## Prerequisites

- EKS cluster with OIDC provider enabled
- AWS CLI configured with appropriate permissions
- `eksctl` or ability to create IAM roles

## OIDC Provider Setup

If your cluster doesn't have an OIDC provider, create one:

```bash
eksctl utils associate-iam-oidc-provider \
  --region=${AWS_REGION} \
  --cluster=${CLUSTER_NAME} \
  --approve
```

Get the OIDC provider URL:

```bash
export OIDC_PROVIDER=$(aws eks describe-cluster \
  --name ${CLUSTER_NAME} \
  --region ${AWS_REGION} \
  --query "cluster.identity.oidc.issuer" \
  --output text | sed -e "s/^https:\/\///")
```

## 1. AWS Load Balancer Controller IAM Role

### Policy Document

Create a policy file `load-balancer-controller-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateServiceLinkedRole"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "iam:AWSServiceName": "elasticloadbalancing.amazonaws.com"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeAccountAttributes",
        "ec2:DescribeAddresses",
        "ec2:DescribeAvailabilityZones",
        "ec2:DescribeInternetGateways",
        "ec2:DescribeVpcs",
        "ec2:DescribeVpcPeeringConnections",
        "ec2:DescribeSubnets",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeInstances",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DescribeTags",
        "ec2:GetCoipPoolUsage",
        "ec2:DescribeCoipPools",
        "elasticloadbalancing:DescribeLoadBalancers",
        "elasticloadbalancing:DescribeLoadBalancerAttributes",
        "elasticloadbalancing:DescribeListeners",
        "elasticloadbalancing:DescribeListenerCertificates",
        "elasticloadbalancing:DescribeSSLPolicies",
        "elasticloadbalancing:DescribeRules",
        "elasticloadbalancing:DescribeTargetGroups",
        "elasticloadbalancing:DescribeTargetGroupAttributes",
        "elasticloadbalancing:DescribeTargetHealth",
        "elasticloadbalancing:DescribeTags"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:DescribeUserPoolClient",
        "acm:ListCertificates",
        "acm:DescribeCertificate",
        "iam:ListServerCertificates",
        "iam:GetServerCertificate",
        "waf-regional:GetWebACL",
        "waf-regional:GetWebACLForResource",
        "waf-regional:AssociateWebACL",
        "waf-regional:DisassociateWebACL",
        "wafv2:GetWebACL",
        "wafv2:GetWebACLForResource",
        "wafv2:AssociateWebACL",
        "wafv2:DisassociateWebACL",
        "shield:GetSubscriptionState",
        "shield:DescribeProtection",
        "shield:CreateProtection",
        "shield:DeleteProtection"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:RevokeSecurityGroupIngress",
        "ec2:CreateSecurityGroup"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateTags"
      ],
      "Resource": "arn:aws:ec2:*:*:security-group/*",
      "Condition": {
        "StringEquals": {
          "ec2:CreateAction": "CreateSecurityGroup"
        },
        "Null": {
          "aws:RequestTag/elbv2.k8s.aws/cluster": "false"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateTags",
        "ec2:DeleteTags"
      ],
      "Resource": "arn:aws:ec2:*:*:security-group/*",
      "Condition": {
        "Null": {
          "aws:RequestTag/elbv2.k8s.aws/cluster": "true",
          "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:RevokeSecurityGroupIngress",
        "ec2:DeleteSecurityGroup"
      ],
      "Resource": "*",
      "Condition": {
        "Null": {
          "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:CreateLoadBalancer",
        "elasticloadbalancing:CreateTargetGroup"
      ],
      "Resource": "*",
      "Condition": {
        "Null": {
          "aws:RequestTag/elbv2.k8s.aws/cluster": "false"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:CreateListener",
        "elasticloadbalancing:DeleteListener",
        "elasticloadbalancing:CreateRule",
        "elasticloadbalancing:DeleteRule"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:AddListenerCertificates",
        "elasticloadbalancing:RemoveListenerCertificates",
        "elasticloadbalancing:ModifyListener"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:AddTags",
        "elasticloadbalancing:RemoveTags"
      ],
      "Resource": [
        "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*",
        "arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*",
        "arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*"
      ],
      "Condition": {
        "Null": {
          "aws:RequestTag/elbv2.k8s.aws/cluster": "true",
          "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:AddTags",
        "elasticloadbalancing:RemoveTags"
      ],
      "Resource": [
        "arn:aws:elasticloadbalancing:*:*:listener/net/*/*/*",
        "arn:aws:elasticloadbalancing:*:*:listener/app/*/*/*",
        "arn:aws:elasticloadbalancing:*:*:listener-rule/net/*/*/*",
        "arn:aws:elasticloadbalancing:*:*:listener-rule/app/*/*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:ModifyLoadBalancerAttributes",
        "elasticloadbalancing:SetIpAddressType",
        "elasticloadbalancing:SetSecurityGroups",
        "elasticloadbalancing:SetSubnets",
        "elasticloadbalancing:DeleteLoadBalancer",
        "elasticloadbalancing:ModifyTargetGroup",
        "elasticloadbalancing:ModifyTargetGroupAttributes",
        "elasticloadbalancing:DeleteTargetGroup"
      ],
      "Resource": "*",
      "Condition": {
        "Null": {
          "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:RegisterTargets",
        "elasticloadbalancing:DeregisterTargets"
      ],
      "Resource": "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:SetWebAcl",
        "elasticloadbalancing:ModifyRule",
        "elasticloadbalancing:AddListenerCertificates",
        "elasticloadbalancing:RemoveListenerCertificates",
        "elasticloadbalancing:ModifyListener"
      ],
      "Resource": "*"
    }
  ]
}
```

### Create IAM Role

```bash
aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://load-balancer-controller-policy.json

eksctl create iamserviceaccount \
  --cluster=${CLUSTER_NAME} \
  --namespace=ingress-system \
  --name=aws-load-balancer-controller \
  --role-name AWSLoadBalancerControllerRole \
  --attach-policy-arn=arn:aws:iam::${AWS_ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve
```

## 2. External DNS IAM Role

### Policy Document

Create `external-dns-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "route53:ChangeResourceRecordSets"
      ],
      "Resource": [
        "arn:aws:route53:::hostedzone/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "route53:ListHostedZones",
        "route53:ListResourceRecordSets"
      ],
      "Resource": [
        "*"
      ]
    }
  ]
}
```

### Create IAM Role

```bash
aws iam create-policy \
  --policy-name ExternalDNSIAMPolicy \
  --policy-document file://external-dns-policy.json

eksctl create iamserviceaccount \
  --cluster=${CLUSTER_NAME} \
  --namespace=external-dns \
  --name=external-dns \
  --role-name ExternalDNSRole \
  --attach-policy-arn=arn:aws:iam::${AWS_ACCOUNT_ID}:policy/ExternalDNSIAMPolicy \
  --approve
```

## 3. Fluent Bit IAM Role

### Policy Document

Create `fluent-bit-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ],
      "Resource": "*"
    }
  ]
}
```

### Create IAM Role

```bash
aws iam create-policy \
  --policy-name FluentBitIAMPolicy \
  --policy-document file://fluent-bit-policy.json

eksctl create iamserviceaccount \
  --cluster=${CLUSTER_NAME} \
  --namespace=logging \
  --name=fluent-bit \
  --role-name FluentBitRole \
  --attach-policy-arn=arn:aws:iam::${AWS_ACCOUNT_ID}:policy/FluentBitIAMPolicy \
  --approve
```

## 4. Secrets Store CSI Driver IAM Role

### Policy Document

Create `secrets-store-csi-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:${AWS_ACCOUNT_ID}:secret:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": "arn:aws:ssm:*:${AWS_ACCOUNT_ID}:parameter/*"
    }
  ]
}
```

### Create IAM Role

```bash
aws iam create-policy \
  --policy-name SecretsStoreCSIDriverIAMPolicy \
  --policy-document file://secrets-store-csi-policy.json

eksctl create iamserviceaccount \
  --cluster=${CLUSTER_NAME} \
  --namespace=secrets-management \
  --name=secrets-store-csi-driver \
  --role-name SecretsStoreProviderRole \
  --attach-policy-arn=arn:aws:iam::${AWS_ACCOUNT_ID}:policy/SecretsStoreCSIDriverIAMPolicy \
  --approve
```

## 5. Cert Manager IAM Role (Optional)

If using Route53 for DNS01 challenges:

### Policy Document

Create `cert-manager-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "route53:GetChange",
      "Resource": "arn:aws:route53:::change/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "route53:ChangeResourceRecordSets",
        "route53:ListResourceRecordSets"
      ],
      "Resource": "arn:aws:route53:::hostedzone/*"
    },
    {
      "Effect": "Allow",
      "Action": "route53:ListHostedZonesByName",
      "Resource": "*"
    }
  ]
}
```

### Create IAM Role

```bash
aws iam create-policy \
  --policy-name CertManagerIAMPolicy \
  --policy-document file://cert-manager-policy.json

eksctl create iamserviceaccount \
  --cluster=${CLUSTER_NAME} \
  --namespace=cert-manager \
  --name=cert-manager \
  --role-name CertManagerRole \
  --attach-policy-arn=arn:aws:iam::${AWS_ACCOUNT_ID}:policy/CertManagerIAMPolicy \
  --approve
```

## Verification

Verify the IAM roles were created:

```bash
aws iam list-roles | grep -E "(AWSLoadBalancerControllerRole|ExternalDNSRole|FluentBitRole|SecretsStoreProviderRole|CertManagerRole)"
```

Verify service accounts have correct annotations:

```bash
kubectl get sa -n ingress-system aws-load-balancer-controller -o yaml
kubectl get sa -n external-dns external-dns -o yaml
kubectl get sa -n logging fluent-bit -o yaml
kubectl get sa -n secrets-management secrets-store-csi-driver -o yaml
kubectl get sa -n cert-manager cert-manager -o yaml
```

The annotations should include:
```yaml
annotations:
  eks.amazonaws.com/role-arn: arn:aws:iam::<account-id>:role/<role-name>
```

## Troubleshooting

### Check OIDC Provider

```bash
aws eks describe-cluster \
  --name ${CLUSTER_NAME} \
  --region ${AWS_REGION} \
  --query "cluster.identity.oidc.issuer" \
  --output text
```

### Verify Trust Relationship

```bash
aws iam get-role --role-name AWSLoadBalancerControllerRole --query Role.AssumeRolePolicyDocument
```

The trust policy should reference your cluster's OIDC provider and the appropriate service account.

### Test Permissions

Deploy a test pod with the service account and check if it can assume the role:

```bash
kubectl run test-pod \
  --image=amazon/aws-cli \
  --serviceaccount=aws-load-balancer-controller \
  -n ingress-system \
  --command -- sleep 3600

kubectl exec -it test-pod -n ingress-system -- aws sts get-caller-identity
```

## Best Practices

1. **Least Privilege**: Grant only the minimum permissions required
2. **Regular Audits**: Periodically review and audit IAM roles and policies
3. **Resource Restrictions**: Where possible, restrict policies to specific resources
4. **Condition Keys**: Use condition keys to further restrict access
5. **Rotation**: Implement a process for rotating service account tokens
6. **Monitoring**: Enable CloudTrail logging to monitor IAM role usage
7. **Separate Environments**: Use different IAM roles for different environments (dev, staging, prod)
