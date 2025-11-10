# Infrastructure & DevOps Guide

This document provides comprehensive guidance on deploying, managing, and maintaining the ILS 2.0 platform infrastructure.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Deployment Options](#deployment-options)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [CI/CD Pipelines](#cicd-pipelines)
7. [Database Management](#database-management)
8. [Monitoring & Observability](#monitoring--observability)
9. [Security](#security)
10. [Troubleshooting](#troubleshooting)

## Overview

ILS 2.0 uses a modern containerized infrastructure with:
- **Docker** for containerization
- **Kubernetes** for orchestration
- **PostgreSQL** for database
- **Redis** for caching and sessions
- **GitHub Actions** for CI/CD
- **AWS S3** for backups (optional)

### Infrastructure Components

```
┌─────────────────────────────────────────────────┐
│                  Load Balancer                   │
│              (NGINX Ingress / ALB)               │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼───────┐
│   ILS App Pod  │   │  ILS App Pod   │
│   (Node.js)    │   │   (Node.js)    │
└───────┬────────┘   └────────┬───────┘
        │                     │
        └──────────┬──────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼───────┐
│   PostgreSQL   │   │     Redis      │
│  (StatefulSet) │   │   (Deployment) │
└────────────────┘   └────────────────┘
```

## Architecture

### Production Architecture

- **Application Layer**: 3+ replicas with auto-scaling (HPA)
- **Database Layer**: PostgreSQL StatefulSet with persistent storage
- **Cache Layer**: Redis for sessions and caching
- **Storage**: Persistent volumes for uploads and logs
- **Ingress**: NGINX Ingress Controller with TLS

### High Availability Setup

- Multi-zone deployment
- Auto-scaling based on CPU/memory
- Rolling updates with zero downtime
- Health checks and readiness probes
- Automatic failover

## Deployment Options

### 1. Docker Compose (Development/Staging)

**Best for**: Local development, small deployments

```bash
# Production mode
docker-compose up -d

# Development mode with hot reload
docker-compose -f docker-compose.dev.yml up
```

**Pros**:
- Easy setup
- Fast iteration
- Local development

**Cons**:
- No auto-scaling
- Single host deployment
- Limited high availability

### 2. Kubernetes (Production)

**Best for**: Production deployments, high availability

```bash
cd kubernetes
kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml
kubectl apply -f configmap.yaml
kubectl apply -f .
```

**Pros**:
- Auto-scaling
- High availability
- Self-healing
- Rolling updates

**Cons**:
- More complex setup
- Higher resource requirements

### 3. Cloud Platforms

#### AWS ECS/Fargate

```bash
# Deploy with AWS CDK or Terraform
```

#### Google Cloud Run

```bash
gcloud run deploy ils-app \
  --image gcr.io/PROJECT/ils-app:latest \
  --region us-central1
```

#### Azure Container Apps

```bash
az containerapp create \
  --name ils-app \
  --resource-group ils-rg \
  --image REGISTRY/ils-app:latest
```

## Docker Deployment

### Building the Image

```bash
# Build production image
docker build -t ils-app:latest .

# Build development image
docker build -f Dockerfile.dev -t ils-app:dev .

# Multi-platform build
docker buildx build --platform linux/amd64,linux/arm64 -t ils-app:latest .
```

### Running Locally

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Access shell
docker-compose exec app sh

# Stop services
docker-compose down
```

### Environment Variables

Create a `.env` file:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@postgres:5432/ils_db
REDIS_URL=redis://:password@redis:6379
SESSION_SECRET=your-secret-here
ALLOWED_ORIGINS=https://example.com
```

### Docker Compose Services

| Service | Port | Description |
|---------|------|-------------|
| app | 5000 | Main application |
| postgres | 5432 | PostgreSQL database |
| redis | 6379 | Redis cache |
| adminer | 8080 | Database UI |
| redis-commander | 8081 | Redis UI |

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- NGINX Ingress Controller
- cert-manager for TLS
- Storage provisioner

### Quick Start

```bash
# 1. Create namespace
kubectl apply -f kubernetes/namespace.yaml

# 2. Create secrets (IMPORTANT: Update first!)
kubectl create secret generic ils-secrets \
  --from-literal=POSTGRES_PASSWORD='YOUR_PASSWORD' \
  --from-literal=DATABASE_URL='postgresql://...' \
  --namespace=ils-production

# 3. Create ConfigMap
kubectl apply -f kubernetes/configmap.yaml

# 4. Deploy PostgreSQL
kubectl apply -f kubernetes/postgres-statefulset.yaml

# 5. Deploy Redis
kubectl apply -f kubernetes/redis-deployment.yaml

# 6. Deploy Application
kubectl apply -f kubernetes/app-deployment.yaml

# 7. Create Ingress
kubectl apply -f kubernetes/ingress.yaml

# 8. Enable Auto-scaling
kubectl apply -f kubernetes/hpa.yaml
```

### Verifying Deployment

```bash
# Check all resources
kubectl get all -n ils-production

# Check pod status
kubectl get pods -n ils-production

# View logs
kubectl logs -f deployment/ils-app -n ils-production

# Check health
kubectl exec deployment/ils-app -n ils-production -- \
  curl http://localhost:5000/api/health
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment ils-app --replicas=5 -n ils-production

# Check HPA status
kubectl get hpa -n ils-production

# Describe HPA
kubectl describe hpa ils-app-hpa -n ils-production
```

### Updates and Rollbacks

```bash
# Update image
kubectl set image deployment/ils-app \
  ils-app=registry/ils-app:v2.0 \
  -n ils-production

# Check rollout status
kubectl rollout status deployment/ils-app -n ils-production

# Rollout history
kubectl rollout history deployment/ils-app -n ils-production

# Rollback to previous version
kubectl rollout undo deployment/ils-app -n ils-production

# Rollback to specific revision
kubectl rollout undo deployment/ils-app --to-revision=3 -n ils-production
```

## CI/CD Pipelines

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `test.yml` | Push, PR | Run tests |
| `pr-checks.yml` | PR | Code quality checks |
| `docker-build.yml` | PR, Push | Build Docker images |
| `security.yml` | Schedule | Security scanning |
| `deploy-production.yml` | Tag | Production deployment |
| `database-backup.yml` | Schedule | Automated backups |
| `performance-monitoring.yml` | Schedule | Performance tests |

### Deployment Flow

```
┌─────────────┐
│  Git Push   │
│  to main    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Run       │
│   Tests     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Build     │
│   Docker    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Security   │
│    Scan     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Deploy to  │
│   Staging   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Smoke     │
│   Tests     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Deploy to  │
│ Production  │
│ (on tag)    │
└─────────────┘
```

### Required Secrets

Configure these secrets in GitHub repository settings:

```yaml
# Kubernetes
KUBE_CONFIG_PRODUCTION: base64-encoded kubeconfig
KUBE_CONFIG_STAGING: base64-encoded kubeconfig

# AWS (for backups)
AWS_ACCESS_KEY_ID: your-key-id
AWS_SECRET_ACCESS_KEY: your-secret
AWS_REGION: us-east-1
S3_BACKUP_BUCKET: your-backup-bucket

# Notifications
SLACK_WEBHOOK: your-slack-webhook-url

# Container Registry
GITHUB_TOKEN: (automatically provided)
```

### Manual Deployment Trigger

```bash
# Trigger deployment via GitHub CLI
gh workflow run deploy-production.yml \
  --ref main \
  -f environment=production
```

## Database Management

### Backups

#### Automated Backups (GitHub Actions)

- **Frequency**: Every 6 hours
- **Retention**: 7 days (GitHub), 30 days (S3)
- **Location**: GitHub Artifacts + S3

#### Manual Backup

```bash
# Using backup script
./scripts/backup/backup-database.sh

# Direct pg_dump
pg_dump -h localhost -U ils_user ils_db | gzip > backup.sql.gz

# Kubernetes
kubectl exec -n ils-production postgres-0 -- \
  pg_dump -U ils_user ils_db | gzip > backup.sql.gz
```

### Restore

```bash
# Using restore script (interactive)
./scripts/backup/restore-database.sh

# Direct restore
gunzip < backup.sql.gz | psql -h localhost -U ils_user -d ils_db

# Kubernetes
gunzip < backup.sql.gz | kubectl exec -i -n ils-production postgres-0 -- \
  psql -U ils_user -d ils_db
```

### Migrations

```bash
# Run migrations
npm run db:migrate

# Kubernetes
kubectl exec -n ils-production deployment/ils-app -- npm run db:migrate
```

### Database Monitoring

```bash
# Connection count
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Database size
psql -c "SELECT pg_size_pretty(pg_database_size('ils_db'));"

# Table sizes
psql -c "SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::text))
FROM pg_tables WHERE schemaname='public' ORDER BY pg_total_relation_size(tablename::text) DESC;"
```

## Monitoring & Observability

### Application Metrics

Access performance metrics at:
- `/api/monitoring/metrics` - Application metrics
- `/api/monitoring/health` - Health status
- `/api/monitoring/recent` - Recent requests

### Kubernetes Monitoring

```bash
# Pod metrics
kubectl top pods -n ils-production

# Node metrics
kubectl top nodes

# Events
kubectl get events -n ils-production --sort-by='.lastTimestamp'

# Resource usage
kubectl describe node <node-name>
```

### Logging

```bash
# Application logs
kubectl logs -f deployment/ils-app -n ils-production

# All pods
kubectl logs -f -l app=ils-app -n ils-production

# Previous container (if crashed)
kubectl logs deployment/ils-app --previous -n ils-production

# Specific time range
kubectl logs deployment/ils-app --since=1h -n ils-production
```

### Health Checks

```bash
# Application health
curl https://ils.example.com/api/health

# Database health
kubectl exec -n ils-production postgres-0 -- pg_isready

# Redis health
kubectl exec -n ils-production deployment/redis -- redis-cli ping
```

## Security

### TLS/SSL Certificates

Using cert-manager:

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### Security Scanning

Automated security scans run:
- On every PR (code scanning)
- Daily (dependency scanning)
- On Docker build (Trivy vulnerability scan)

### Secret Management

```bash
# Create secrets from files
kubectl create secret generic ils-secrets \
  --from-file=database-url=./secrets/db-url.txt \
  --namespace=ils-production

# Update secret
kubectl create secret generic ils-secrets \
  --from-literal=SESSION_SECRET='new-secret' \
  --namespace=ils-production \
  --dry-run=client -o yaml | kubectl apply -f -

# View secrets (base64 encoded)
kubectl get secret ils-secrets -n ils-production -o yaml

# Decode secret
kubectl get secret ils-secrets -n ils-production \
  -o jsonpath='{.data.SESSION_SECRET}' | base64 -d
```

### Network Policies

Implement network policies to restrict traffic:

```yaml
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
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
```

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n ils-production

# Check events
kubectl get events -n ils-production --sort-by='.lastTimestamp'

# Check logs
kubectl logs <pod-name> -n ils-production
```

**Common causes**:
- Image pull errors
- Insufficient resources
- Configuration errors
- Failed health checks

#### 2. Database Connection Issues

```bash
# Test database connectivity from app pod
kubectl exec -it deployment/ils-app -n ils-production -- \
  nc -zv postgres-service 5432

# Check PostgreSQL logs
kubectl logs postgres-0 -n ils-production

# Verify credentials
kubectl get secret ils-secrets -n ils-production -o yaml
```

#### 3. Performance Issues

```bash
# Check resource usage
kubectl top pods -n ils-production

# Check HPA
kubectl get hpa -n ils-production

# View application metrics
curl https://ils.example.com/api/monitoring/metrics
```

#### 4. Ingress Not Working

```bash
# Check ingress
kubectl describe ingress ils-ingress -n ils-production

# Check ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# Test internal service
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  wget -O- http://ils-app-service.ils-production.svc.cluster.local:5000/api/health
```

### Debug Commands

```bash
# Interactive shell in pod
kubectl exec -it deployment/ils-app -n ils-production -- sh

# Run commands in pod
kubectl exec deployment/ils-app -n ils-production -- npm run db:migrate

# Port forward for local access
kubectl port-forward deployment/ils-app 5000:5000 -n ils-production

# Copy files from pod
kubectl cp ils-production/ils-app-xxx:/app/logs/error.log ./error.log

# Restart deployment
kubectl rollout restart deployment/ils-app -n ils-production
```

### Performance Optimization

1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **Redis Caching**: Use Redis for frequently accessed data
3. **Connection Pooling**: Configure appropriate pool sizes
4. **Resource Limits**: Set appropriate CPU/memory limits
5. **CDN**: Use CDN for static assets
6. **Query Optimization**: Monitor and optimize slow queries

## Best Practices

### Deployment

- ✅ Always test in staging first
- ✅ Create backup before production deployment
- ✅ Use rolling updates for zero downtime
- ✅ Monitor metrics after deployment
- ✅ Have rollback plan ready

### Security

- ✅ Use secrets for sensitive data
- ✅ Enable RBAC in Kubernetes
- ✅ Implement network policies
- ✅ Regular security scans
- ✅ Keep dependencies updated

### Monitoring

- ✅ Set up alerts for critical metrics
- ✅ Monitor error rates
- ✅ Track response times
- ✅ Monitor resource usage
- ✅ Regular backup testing

### Backup Strategy

- ✅ Automated daily backups
- ✅ Multiple backup locations
- ✅ Test restore procedures
- ✅ Encrypt backups
- ✅ Document recovery procedures

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [cert-manager Documentation](https://cert-manager.io/docs/)

## Support

For infrastructure issues:
- DevOps Team: devops@ils.com
- Platform Team: platform@ils.com
- On-call: See PagerDuty rotation
