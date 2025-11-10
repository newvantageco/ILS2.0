# Operational Runbooks

Operational procedures for common tasks and incident response.

## Table of Contents

1. [Deployment Procedures](#deployment-procedures)
2. [Rollback Procedures](#rollback-procedures)
3. [Incident Response](#incident-response)
4. [Database Operations](#database-operations)
5. [Performance Issues](#performance-issues)
6. [Security Incidents](#security-incidents)
7. [Scaling Operations](#scaling-operations)

---

## Deployment Procedures

### Standard Deployment (via GitHub Actions)

**Trigger**: Push to `main` branch or create a tag

**Steps**:
1. Code is pushed to `main` branch
2. GitHub Actions runs tests automatically
3. Docker image is built and pushed
4. Security scanning is performed
5. Deployment to staging (automatic)
6. Smoke tests run on staging
7. If tag created (e.g., `v1.2.3`), deploys to production
8. Post-deployment verification runs

**Manual Trigger**:
```bash
# Trigger deployment via GitHub CLI
gh workflow run deploy-production.yml --ref main -f environment=production
```

**Verification**:
```bash
# Run deployment verification
./scripts/production-readiness/verify-deployment.sh production https://ils.example.com
```

### Emergency Hotfix Deployment

**When**: Critical bug in production that needs immediate fix

**Steps**:
1. Create hotfix branch from production tag:
   ```bash
   git checkout -b hotfix/critical-issue v1.2.3
   ```

2. Make minimal fix (keep changes small!)

3. Test locally:
   ```bash
   npm run test
   npm run build
   ```

4. Commit and push:
   ```bash
   git add .
   git commit -m "fix: critical issue description"
   git push origin hotfix/critical-issue
   ```

5. Create tag:
   ```bash
   git tag v1.2.4
   git push origin v1.2.4
   ```

6. Monitor deployment in GitHub Actions

7. Verify fix:
   ```bash
   ./scripts/production-readiness/verify-deployment.sh production
   ```

8. Merge hotfix back to main:
   ```bash
   git checkout main
   git merge hotfix/critical-issue
   git push origin main
   ```

---

## Rollback Procedures

### Kubernetes Rollback

**Symptoms**: Deployment causing errors, performance degradation, or user issues

**Steps**:

1. **Immediate Rollback** (restores previous deployment):
   ```bash
   kubectl rollout undo deployment/ils-app -n ils-production
   ```

2. **Verify rollout status**:
   ```bash
   kubectl rollout status deployment/ils-app -n ils-production
   ```

3. **Check pods are healthy**:
   ```bash
   kubectl get pods -n ils-production
   kubectl logs -f deployment/ils-app -n ils-production
   ```

4. **Run verification**:
   ```bash
   ./scripts/production-readiness/verify-deployment.sh production
   ```

5. **Monitor for 15 minutes**:
   - Check error rates in Sentry
   - Monitor response times in Grafana
   - Watch logs for errors

6. **Rollback to specific revision** (if needed):
   ```bash
   # View history
   kubectl rollout history deployment/ils-app -n ils-production

   # Rollback to specific revision
   kubectl rollout undo deployment/ils-app --to-revision=5 -n ils-production
   ```

### Database Migration Rollback

**Symptoms**: Database errors after deployment

**Steps**:

1. **Stop application** (prevent further DB operations):
   ```bash
   kubectl scale deployment ils-app --replicas=0 -n ils-production
   ```

2. **Restore database from backup**:
   ```bash
   # Download latest backup
   aws s3 cp s3://ils-backups/production/latest.sql.gz ./backup.sql.gz

   # Restore
   ./scripts/backup/restore-database.sh
   ```

3. **Verify database**:
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
   ```

4. **Restart application with previous version**:
   ```bash
   kubectl rollout undo deployment/ils-app -n ils-production
   kubectl scale deployment ils-app --replicas=3 -n ils-production
   ```

5. **Verify**:
   ```bash
   ./scripts/production-readiness/verify-deployment.sh production
   ```

---

## Incident Response

### High Error Rate Alert

**Alert**: Error rate > 5% for 5+ minutes

**Triage**:

1. **Check Sentry** for recent errors:
   - Go to Sentry dashboard
   - Look for spike in errors
   - Identify common error message

2. **Check Grafana** for metrics:
   - Open ILS Overview dashboard
   - Look at error rate graph
   - Check if specific endpoint is failing

3. **Check logs**:
   ```bash
   kubectl logs -f -l app=ils-app -n ils-production --tail=100 | grep ERROR
   ```

**Resolution**:

1. **If caused by recent deployment**:
   - Follow [Rollback Procedures](#rollback-procedures)

2. **If database issue**:
   - Check database connections:
     ```bash
     kubectl exec postgres-0 -n ils-production -- psql -U ils_user -c "SELECT count(*) FROM pg_stat_activity;"
     ```
   - Scale database if needed
   - Check for slow queries

3. **If external service**:
   - Check status pages for third-party services
   - Implement circuit breaker if needed
   - Return cached data

4. **Document incident**:
   - Create incident report
   - Document timeline
   - List action items

### Performance Degradation

**Alert**: P95 response time > 1000ms for 10+ minutes

**Triage**:

1. **Check current load**:
   ```bash
   kubectl top pods -n ils-production
   ```

2. **Check HPA status**:
   ```bash
   kubectl get hpa -n ils-production
   ```

3. **Check database performance**:
   ```bash
   kubectl exec postgres-0 -n ils-production -- psql -U ils_user -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
   ```

**Resolution**:

1. **If CPU/Memory high**:
   - HPA should auto-scale
   - Manually scale if needed:
     ```bash
     kubectl scale deployment ils-app --replicas=10 -n ils-production
     ```

2. **If database slow**:
   - Check slow query log
   - Add indexes if needed
   - Scale database vertically

3. **If cache issue**:
   - Check Redis:
     ```bash
     kubectl exec deployment/redis -n ils-production -- redis-cli INFO stats
     ```
   - Restart Redis if needed

### Service Unavailable

**Alert**: Health check failing

**Triage**:

1. **Check pods**:
   ```bash
   kubectl get pods -n ils-production
   ```

2. **Check recent events**:
   ```bash
   kubectl get events -n ils-production --sort-by='.lastTimestamp'
   ```

3. **Check logs**:
   ```bash
   kubectl logs -f deployment/ils-app -n ils-production --tail=50
   ```

**Resolution**:

1. **If pods not starting**:
   - Check image pull errors
   - Check resource limits
   - Check configuration

2. **If database connection failing**:
   - Check database status
   - Verify credentials
   - Check network policies

3. **If out of resources**:
   - Scale nodes
   - Increase resource limits

---

## Database Operations

### Manual Backup

```bash
# Create backup
./scripts/backup/backup-database.sh

# Verify backup
ls -lh /var/backups/postgresql/

# Upload to S3 (if not automatic)
aws s3 cp backup.sql.gz s3://ils-backups/production/manual-$(date +%Y%m%d).sql.gz
```

### Manual Restore

```bash
# Interactive restore (recommended)
./scripts/backup/restore-database.sh

# Direct restore
gunzip < backup.sql.gz | psql $DATABASE_URL
```

### Run Migrations

```bash
# In production (via kubectl)
kubectl exec deployment/ils-app -n ils-production -- npm run db:migrate

# Verify
kubectl exec deployment/ils-app -n ils-production -- npm run check
```

### Database Maintenance

```bash
# Connect to database
kubectl exec -it postgres-0 -n ils-production -- psql -U ils_user -d ils_db

# Vacuum
VACUUM ANALYZE;

# Reindex
REINDEX DATABASE ils_db;

# Check table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::text))
FROM pg_tables
WHERE schemaname='public'
ORDER BY pg_total_relation_size(tablename::text) DESC;
```

---

## Performance Issues

### Slow API Responses

**Investigation**:

1. Check APM (Sentry Performance):
   - Identify slow transactions
   - Look for N+1 queries
   - Check external API calls

2. Check database:
   ```bash
   # Slow queries
   kubectl exec postgres-0 -n ils-production -- psql -U ils_user -c "
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;"
   ```

3. Check caching:
   ```bash
   # Redis hit rate
   kubectl exec deployment/redis -n ils-production -- redis-cli INFO stats | grep hit_rate
   ```

**Resolution**:

1. **Add database indexes**
2. **Implement caching** for frequently accessed data
3. **Optimize queries** (reduce JOINs, add LIMIT)
4. **Scale horizontally** if load is high

### High Database Load

**Symptoms**: Slow queries, connection pool exhaustion

**Steps**:

1. **Identify expensive queries**:
   ```sql
   SELECT * FROM pg_stat_activity WHERE state = 'active' ORDER BY query_start;
   ```

2. **Kill long-running queries** (if needed):
   ```sql
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = <pid>;
   ```

3. **Scale database**:
   - Increase connection pool size
   - Scale to larger instance
   - Add read replicas

---

## Security Incidents

### Suspected Breach

**Immediate Actions**:

1. **Alert security team**
2. **Preserve evidence** (don't delete logs)
3. **Assess scope**:
   - Check access logs
   - Review recent logins
   - Check for data exfiltration

**Investigation**:

1. **Review audit logs**:
   ```bash
   kubectl logs deployment/ils-app -n ils-production | grep audit=true
   ```

2. **Check Sentry** for unusual errors

3. **Review database** for unauthorized changes

**Containment**:

1. **Rotate secrets**:
   ```bash
   kubectl create secret generic ils-secrets \
     --from-literal=SESSION_SECRET='new-secret' \
     --dry-run=client -o yaml | kubectl apply -f -
   ```

2. **Force logout** all users (rotate session secret)

3. **Block malicious IPs** (if identified)

### DDoS Attack

**Symptoms**: Extremely high request rate, service degradation

**Steps**:

1. **Enable rate limiting** (if not already):
   - Check NGINX Ingress rate limits
   - Adjust as needed

2. **Block source IPs**:
   ```yaml
   # Update Ingress annotations
   nginx.ingress.kubernetes.io/limit-rps: "10"
   ```

3. **Scale up** to handle load:
   ```bash
   kubectl scale deployment ils-app --replicas=20 -n ils-production
   ```

4. **Contact hosting provider** for DDoS protection

---

## Scaling Operations

### Horizontal Pod Autoscaling

**Check HPA status**:
```bash
kubectl get hpa -n ils-production
kubectl describe hpa ils-app-hpa -n ils-production
```

**Adjust HPA**:
```bash
# Edit HPA
kubectl edit hpa ils-app-hpa -n ils-production

# Or update via file
kubectl apply -f kubernetes/hpa.yaml
```

### Manual Scaling

**Scale up**:
```bash
kubectl scale deployment ils-app --replicas=10 -n ils-production
```

**Scale down**:
```bash
kubectl scale deployment ils-app --replicas=3 -n ils-production
```

### Database Scaling

**Vertical scaling** (requires downtime):
1. Take backup
2. Stop application
3. Resize database instance
4. Start application
5. Verify

**Read replicas** (for read-heavy workloads):
1. Create read replica
2. Update application to use replica for reads
3. Monitor replication lag

---

## Contact Information

- **On-Call Engineer**: See PagerDuty rotation
- **DevOps Team**: devops@ils.com
- **Platform Team**: platform@ils.com
- **Security Team**: security@ils.com

## Escalation Path

1. On-Call Engineer (primary)
2. Team Lead (if no response in 15 min)
3. Engineering Manager (critical incidents)
4. CTO (major outages)
