# Integrated Lens System - Kubernetes Deployment Guide

## Quick Start

### 1. Prerequisites

```bash
# Install required tools
brew install terraform aws-cli kubectl helm

# Configure AWS credentials
aws configure

# Verify AWS access
aws sts get-caller-identity
```

### 2. Initialize Terraform

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Create backend configuration (backend.tfvars)
cat > backend.tfvars <<EOF
bucket         = "ils-terraform-state-$(date +%s)"
key            = "eks/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "terraform-locks"
EOF

# Apply backend configuration
terraform init -backend-config=backend.tfvars
```

### 3. Plan Infrastructure

```bash
# Create environment-specific variables file
cat > terraform.tfvars <<EOF
aws_region      = "us-east-1"
environment     = "production"
project_name    = "ils"
cluster_version = "1.28"
node_instance_types = ["t3.medium", "t3.large"]
min_nodes       = 2
max_nodes       = 10
db_instance_class = "db.t3.small"
redis_node_type = "cache.t3.micro"
enable_monitoring = true
EOF

# Plan deployment
terraform plan -out=tfplan
```

### 4. Deploy Infrastructure

```bash
# Apply Terraform configuration
terraform apply tfplan

# Save outputs
terraform output -json > outputs.json

# Configure kubectl
aws eks update-kubeconfig \
  --region us-east-1 \
  --name ils-eks-production
```

### 5. Deploy Application

```bash
# Create namespace
kubectl create namespace ils-production

# Create secrets for database and Redis
kubectl create secret generic db-credentials \
  -n ils-production \
  --from-literal=connection-string="postgresql://postgres:PASSWORD@ENDPOINT:5432/ilsdb"

# Deploy using Helm chart
helm install ils-app ./helm-chart \
  -n ils-production \
  -f helm-values-prod.yaml
```

## Environment Variables

### Database Configuration

```yaml
DATABASE_URL: postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/ilsdb
DATABASE_POOL_SIZE: "20"
DATABASE_IDLE_TIMEOUT: "30000"
DATABASE_SSL_MODE: "require"
```

### Redis Configuration

```yaml
REDIS_URL: redis://:AUTH_TOKEN@REDIS_ENDPOINT:6379/0
REDIS_TLS: "true"
REDIS_FAMILY: "6"
```

### Application Configuration

```yaml
NODE_ENV: "production"
LOG_LEVEL: "info"
PORT: "5000"
CORS_ORIGINS: "https://api.lens-system.com"
```

### Authentication

```yaml
AUTH_PROVIDER: "cognito"  # or "auth0" or "local"
AUTH_ISSUER: "https://cognito-idp.us-east-1.amazonaws.com/POOL_ID"
AUTH_AUDIENCE: "CLIENT_ID"
```

## Monitoring Setup

### CloudWatch Dashboards

```bash
# View EKS cluster logs
aws logs tail /aws/eks/ils-production --follow

# View RDS performance
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBClusterIdentifier,Value=ils-db-production \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 300 \
  --statistics Average
```

### Application Performance Monitoring

```bash
# Deploy X-Ray daemon to EKS
helm repo add aws https://aws.github.io/eks-charts
helm install xray-daemon aws/xray-daemon -n ils-production

# Enable X-Ray in application
export _X_AMZN_TRACE_ID="enabled"
```

## Scaling

### Manual Scaling

```bash
# Scale EKS nodes
terraform apply -var="max_nodes=15"

# Scale Kubernetes replicas
kubectl scale deployment ils-app --replicas=5 -n ils-production
```

### Auto-Scaling Setup

```bash
# Deploy Cluster Autoscaler
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm install cluster-autoscaler autoscaler/cluster-autoscaler \
  --set autoDiscovery.clusterName=ils-eks-production \
  -n kube-system

# Deploy metrics-server for HPA
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Apply HPA configuration
kubectl apply -f - <<EOF
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ils-app-hpa
  namespace: ils-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ils-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
EOF
```

## Backup and Disaster Recovery

### Database Backups

```bash
# Automated daily backups configured in Terraform
# Backup retention: 30 days (production), 7 days (dev)
# Manual backup
aws rds create-db-cluster-snapshot \
  --db-cluster-identifier ils-db-production \
  --db-cluster-snapshot-identifier ils-db-backup-$(date +%Y%m%d)
```

### Restore from Backup

```bash
# Restore from snapshot
terraform apply -var="restore_from_snapshot=true" \
  -var="snapshot_identifier=ils-db-backup-20240101"
```

## Security Best Practices

### Pod Security

```bash
# Enable pod security standards
kubectl label namespace ils-production \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/warn=restricted
```

### Network Policies

```bash
# Apply network policy to restrict traffic
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ils-app-policy
  namespace: ils-production
spec:
  podSelector:
    matchLabels:
      app: ils-app
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ils-production
    ports:
    - protocol: TCP
      port: 5000
  egress:
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 6379
EOF
```

### RBAC Configuration

```bash
# Create service account for ILS application
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ils-app
  namespace: ils-production

---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ils-app-role
  namespace: ils-production
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ils-app-binding
  namespace: ils-production
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: ils-app-role
subjects:
- kind: ServiceAccount
  name: ils-app
  namespace: ils-production
EOF
```

## Troubleshooting

### Check Cluster Status

```bash
# Verify cluster health
kubectl cluster-info
kubectl get nodes
kubectl get pods -A

# Check EKS cluster events
kubectl get events -A --sort-by='.lastTimestamp'
```

### Debug Pods

```bash
# Check pod logs
kubectl logs -f deployment/ils-app -n ils-production

# Exec into pod
kubectl exec -it deployment/ils-app -n ils-production -- /bin/sh

# Describe pod for issues
kubectl describe pod POD_NAME -n ils-production
```

### Database Connectivity

```bash
# Test RDS connection from pod
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- \
  psql -h RDS_ENDPOINT -U postgres -d ilsdb -c "SELECT 1"

# Check security group rules
aws ec2 describe-security-groups --group-ids sg-xxxxx --region us-east-1
```

### Redis Connectivity

```bash
# Test Redis connection
kubectl run -it --rm debug --image=redis:7 --restart=Never -- \
  redis-cli -h REDIS_ENDPOINT -a AUTH_TOKEN ping
```

## Cost Optimization

### Reserved Capacity

```bash
# Purchase reserved instances for production
aws ec2 describe-reserved-instances-offerings \
  --filters "Name=instance-type,Values=t3.medium,t3.large" \
  --region us-east-1
```

### Spot Instances

```bash
# Use spot instances for non-critical workloads
terraform apply -var="use_spot_instances=true" \
  -var="spot_instance_types=[t3.medium,t3.large,t2.medium]"
```

### Resource Limits

```bash
# Apply resource quotas
kubectl apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ils-quota
  namespace: ils-production
spec:
  hard:
    requests.cpu: "100"
    requests.memory: "200Gi"
    limits.cpu: "200"
    limits.memory: "400Gi"
    pods: "100"
  scopeSelector:
    matchExpressions:
    - operator: In
      scopeName: PriorityClass
      values: ["default"]
EOF
```

## Maintenance

### Upgrade Kubernetes Version

```bash
# Plan upgrade
terraform plan -var="cluster_version=1.29"

# Apply upgrade (triggers rolling update)
terraform apply -var="cluster_version=1.29"

# Verify upgrade
kubectl version --short
```

### Update Node AMI

```bash
# Terraform will handle AMI updates automatically
# Or manually update node group
aws eks update-nodegroup-version \
  --cluster-name ils-eks-production \
  --nodegroup-name ils-nodegroup
```

### Certificate Renewal

```bash
# ACM handles certificate renewal automatically
# View certificate details
aws acm describe-certificate \
  --certificate-arn $(terraform output -raw acm_certificate_arn)
```

## Disaster Recovery Procedures

### Cluster Rebuild

```bash
# Backup current state
terraform state pull > backup.tfstate

# Destroy and recreate
terraform destroy
terraform apply

# Restore application state from DynamoDB
kubectl exec -it deployment/ils-app -n ils-production -- \
  /bin/sh -c "node scripts/restore-from-dynamodb.js"
```

### Database Recovery

```bash
# List available snapshots
aws rds describe-db-cluster-snapshots \
  --db-cluster-identifier ils-db-production

# Restore from snapshot
aws rds restore-db-cluster-from-snapshot \
  --db-cluster-identifier ils-db-restored \
  --snapshot-identifier SNAPSHOT_ID \
  --engine aurora-postgresql
```

## Cleanup

```bash
# Remove application
helm uninstall ils-app -n ils-production
kubectl delete namespace ils-production

# Destroy infrastructure
terraform destroy

# Remove Terraform state
aws s3 rm s3://ils-terraform-state-TIMESTAMP --recursive
aws dynamodb delete-table --table-name terraform-locks --region us-east-1
```
