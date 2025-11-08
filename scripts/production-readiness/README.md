# Production Readiness Scripts

Comprehensive tooling for production launch verification and ongoing operations.

## Overview

This directory contains scripts and tools to verify production readiness, test deployments, and ensure the system is ready for production traffic.

## Scripts

### 1. Production Readiness Checklist

**File**: `checklist.ts`

Automated verification of production readiness criteria.

**Usage**:
```bash
# Run against local server
npx tsx scripts/production-readiness/checklist.ts

# Run against staging
npx tsx scripts/production-readiness/checklist.ts https://staging.ils.example.com

# Run against production
APP_URL=https://ils.example.com npx tsx scripts/production-readiness/checklist.ts
```

**Checks**:
- Environment variables
- Dependencies and security vulnerabilities
- Database connectivity
- Security configuration
- Monitoring setup
- Backup systems
- Documentation
- Infrastructure configuration
- Performance

### 2. Smoke Tests

**File**: `smoke-tests.sh`

Quick validation tests to run after deployment.

**Usage**:
```bash
# Test local
./scripts/production-readiness/smoke-tests.sh

# Test staging
./scripts/production-readiness/smoke-tests.sh https://staging.ils.example.com

# Test production
./scripts/production-readiness/smoke-tests.sh https://ils.example.com
```

**Tests**:
- Health check endpoints
- API endpoints
- Static assets
- Error handling
- Security headers
- CORS configuration
- Database connectivity
- Performance
- Monitoring

### 3. Load Tests

**File**: `load-test.js`

k6-based load testing to verify performance under load.

**Prerequisites**:
```bash
# Install k6
# macOS
brew install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Usage**:
```bash
# Run against local
k6 run scripts/production-readiness/load-test.js

# Run against staging
BASE_URL=https://staging.ils.example.com k6 run scripts/production-readiness/load-test.js

# Custom load profile
k6 run --vus 100 --duration 5m scripts/production-readiness/load-test.js
```

**Load Profile**:
- Ramp up: 50 users over 2min
- Sustained: 50 users for 5min
- Stress: 100 users for 5min
- Spike: 200 users for 3min
- Ramp down: to 0 over 2min

**SLOs**:
- Error rate < 1%
- P95 latency < 500ms
- P99 latency < 1000ms

### 4. Deployment Verification

**File**: `verify-deployment.sh`

Comprehensive post-deployment verification.

**Usage**:
```bash
# Verify staging deployment
./scripts/production-readiness/verify-deployment.sh staging

# Verify production deployment
./scripts/production-readiness/verify-deployment.sh production https://ils.example.com

# Custom environment
./scripts/production-readiness/verify-deployment.sh custom https://custom.ils.example.com
```

**Verifications**:
- Service availability (waits for deployment to be ready)
- Health check status
- Dependency health (database, Redis)
- Deployed version
- Critical endpoints
- Performance (response time)
- Monitoring setup
- Security configuration
- Error logs

**Exit Codes**:
- `0`: Deployment verified successfully
- `1`: Deployment verification failed

## Integration with CI/CD

### GitHub Actions

Add to your workflow:

```yaml
- name: Run Production Readiness Checks
  run: npx tsx scripts/production-readiness/checklist.ts ${{ secrets.STAGING_URL }}

- name: Run Smoke Tests
  run: ./scripts/production-readiness/smoke-tests.sh ${{ secrets.STAGING_URL }}

- name: Verify Deployment
  run: ./scripts/production-readiness/verify-deployment.sh staging ${{ secrets.STAGING_URL }}
```

### Pre-Deployment

Run before deploying:

```bash
# Full pre-deployment check
npm run production:check
```

Add to `package.json`:
```json
{
  "scripts": {
    "production:check": "npx tsx scripts/production-readiness/checklist.ts",
    "production:smoke": "./scripts/production-readiness/smoke-tests.sh",
    "production:load": "k6 run scripts/production-readiness/load-test.js",
    "production:verify": "./scripts/production-readiness/verify-deployment.sh production"
  }
}
```

### Post-Deployment

Run after deploying:

```bash
# Verify deployment
./scripts/production-readiness/verify-deployment.sh production https://ils.example.com

# Run smoke tests
./scripts/production-readiness/smoke-tests.sh https://ils.example.com
```

## Scheduled Checks

### Daily Production Health Check

Add to crontab:
```bash
# Run daily at 6 AM
0 6 * * * /path/to/scripts/production-readiness/smoke-tests.sh https://ils.example.com >> /var/log/health-check.log 2>&1
```

### Weekly Load Test

```bash
# Run weekly on Sunday at 2 AM
0 2 * * 0 k6 run /path/to/scripts/production-readiness/load-test.js >> /var/log/load-test.log 2>&1
```

## Monitoring Integration

### Alerting

Create alerts based on script failures:

```bash
#!/bin/bash
# health-check-alert.sh

if ! ./scripts/production-readiness/smoke-tests.sh https://ils.example.com; then
    # Send alert
    curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
        -H 'Content-Type: application/json' \
        -d '{"text":"❌ Production health check failed!"}'
fi
```

### Metrics

Export metrics to Prometheus:

```bash
# Create metrics file
cat > /var/lib/node_exporter/textfile_collector/health_check.prom <<EOF
# HELP ils_health_check_success Health check success (1 = pass, 0 = fail)
# TYPE ils_health_check_success gauge
ils_health_check_success{environment="production"} 1
EOF
```

## Troubleshooting

### Checklist Fails

**Issue**: `checklist.ts` reports failures

**Solution**:
1. Review specific failures in output
2. Fix required issues (marked [REQUIRED])
3. Address warnings for production readiness
4. Re-run checklist

### Smoke Tests Fail

**Issue**: Smoke tests don't pass

**Solution**:
1. Check which specific test failed
2. Verify service is running and accessible
3. Check logs for errors
4. Verify configuration (environment variables, secrets)

### Load Tests Fail

**Issue**: Performance thresholds not met

**Solution**:
1. Check which metric failed (error rate, latency)
2. Review application logs during load test
3. Check database performance
4. Review resource utilization (CPU, memory)
5. Consider scaling (horizontal or vertical)

### Deployment Verification Fails

**Issue**: Post-deployment verification fails

**Solution**:
1. Check deployment status:
   ```bash
   kubectl get pods -n ils-production
   ```
2. Review pod logs:
   ```bash
   kubectl logs -f deployment/ils-app -n ils-production
   ```
3. Check for rollout issues:
   ```bash
   kubectl rollout status deployment/ils-app -n ils-production
   ```
4. Rollback if necessary (see runbooks)

## Best Practices

1. **Always run checklist** before production deployment
2. **Run smoke tests** after every deployment
3. **Schedule regular load tests** to baseline performance
4. **Automate verification** in CI/CD pipeline
5. **Monitor test results** over time for trends
6. **Update scripts** as application evolves
7. **Document failures** and resolutions

## See Also

- [Production Cutover Plan](../../docs/PRODUCTION_CUTOVER_PLAN.md)
- [Runbooks](../../docs/RUNBOOKS.md)
- [Infrastructure Guide](../../docs/INFRASTRUCTURE.md)
- [Observability Guide](../../docs/OBSERVABILITY.md)
