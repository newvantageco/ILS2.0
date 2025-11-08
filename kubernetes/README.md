# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the ILS 2.0 application.

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- NGINX Ingress Controller
- cert-manager (for TLS certificates)
- Storage provisioner

## Deployment Steps

### 1. Create Namespace

```bash
kubectl apply -f namespace.yaml
```

### 2. Create Secrets

**IMPORTANT:** Update secrets before deploying!

```bash
# Option 1: Create from command line
kubectl create secret generic ils-secrets \
  --from-literal=POSTGRES_USER='your_user' \
  --from-literal=POSTGRES_PASSWORD='your_secure_password' \
  --from-literal=DATABASE_URL='postgresql://user:pass@postgres-service:5432/ils_db' \
  --from-literal=REDIS_PASSWORD='your_redis_password' \
  --from-literal=REDIS_URL='redis://:password@redis-service:6379' \
  --from-literal=SESSION_SECRET='your_session_secret_min_32_chars' \
  --namespace=ils-production

# Option 2: Update secrets.yaml and apply
kubectl apply -f secrets.yaml
```

### 3. Create ConfigMap

```bash
kubectl apply -f configmap.yaml
```

### 4. Deploy Database (PostgreSQL)

```bash
kubectl apply -f postgres-statefulset.yaml
```

Wait for PostgreSQL to be ready:
```bash
kubectl wait --for=condition=ready pod -l app=postgres -n ils-production --timeout=300s
```

### 5. Deploy Redis

```bash
kubectl apply -f redis-deployment.yaml
```

Wait for Redis to be ready:
```bash
kubectl wait --for=condition=ready pod -l app=redis -n ils-production --timeout=120s
```

### 6. Deploy Application

Build and push your Docker image:
```bash
docker build -t your-registry/ils-app:latest .
docker push your-registry/ils-app:latest
```

Update `app-deployment.yaml` with your image name, then deploy:
```bash
kubectl apply -f app-deployment.yaml
```

### 7. Create Ingress

Update `ingress.yaml` with your domain, then:
```bash
kubectl apply -f ingress.yaml
```

### 8. Enable Auto-scaling

```bash
kubectl apply -f hpa.yaml
```

## Verify Deployment

```bash
# Check all pods
kubectl get pods -n ils-production

# Check services
kubectl get svc -n ils-production

# Check ingress
kubectl get ingress -n ils-production

# View logs
kubectl logs -f deployment/ils-app -n ils-production

# Check HPA status
kubectl get hpa -n ils-production
```

## Accessing the Application

Once deployed, access your application at:
- https://ils.example.com (update with your domain)

## Database Migration

Run migrations after first deployment:

```bash
kubectl exec -it deployment/ils-app -n ils-production -- npm run db:migrate
```

## Scaling

### Manual Scaling

```bash
kubectl scale deployment ils-app --replicas=5 -n ils-production
```

### Auto-scaling

The HPA automatically scales between 3-10 replicas based on CPU/memory usage.

## Backup and Restore

### PostgreSQL Backup

```bash
kubectl exec -it postgres-0 -n ils-production -- pg_dump -U ils_user ils_db > backup.sql
```

### PostgreSQL Restore

```bash
cat backup.sql | kubectl exec -i postgres-0 -n ils-production -- psql -U ils_user -d ils_db
```

## Monitoring

```bash
# Watch pod status
kubectl get pods -n ils-production -w

# View resource usage
kubectl top pods -n ils-production
kubectl top nodes

# Describe pod for troubleshooting
kubectl describe pod <pod-name> -n ils-production
```

## Updating the Application

### Rolling Update

```bash
# Update image
kubectl set image deployment/ils-app ils-app=your-registry/ils-app:v2 -n ils-production

# Check rollout status
kubectl rollout status deployment/ils-app -n ils-production

# View rollout history
kubectl rollout history deployment/ils-app -n ils-production
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/ils-app -n ils-production

# Rollback to specific revision
kubectl rollout undo deployment/ils-app --to-revision=2 -n ils-production
```

## Troubleshooting

### Pod not starting

```bash
kubectl describe pod <pod-name> -n ils-production
kubectl logs <pod-name> -n ils-production
```

### Database connection issues

```bash
# Test database connectivity
kubectl exec -it deployment/ils-app -n ils-production -- nc -zv postgres-service 5432
```

### View events

```bash
kubectl get events -n ils-production --sort-by='.lastTimestamp'
```

## Cleanup

**WARNING:** This will delete all resources!

```bash
kubectl delete namespace ils-production
```

## Production Checklist

- [ ] Update all secrets in `secrets.yaml`
- [ ] Configure your domain in `ingress.yaml`
- [ ] Update storage class names for your cloud provider
- [ ] Set up cert-manager for TLS certificates
- [ ] Configure backup strategy for PostgreSQL
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure log aggregation (ELK/Loki)
- [ ] Set resource limits appropriate for your workload
- [ ] Test disaster recovery procedures
- [ ] Document runbook for common operations
