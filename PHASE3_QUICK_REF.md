# Phase 3 Quick Reference

## 🚀 Quick Start

### Storage Service
```typescript
// Upload file
import { storageService } from './services/StorageService';
const file = await storageService.upload(buffer, {
  companyId, category: 'products', filename: 'image.jpg'
});

// Delete file
await storageService.delete(fileKey);

// Get signed URL
const url = await storageService.getSignedUrl(fileKey, 3600);
```

### Job Queues
```typescript
// Send email (async)
import { sendEmailJob } from './services/QueueService';
await sendEmailJob(companyId, 'user@example.com', 'Subject', 'template', data);

// Generate report (async)
import { generateReportJob } from './services/QueueService';
await generateReportJob(companyId, 'sales', '2024-01-01', '2024-12-31', 'pdf');

// Check job status
import { queueService } from './services/QueueService';
const status = await queueService.getJobStatus('email', jobId);
```

### Query Optimization
```typescript
// Optimized read with caching
import { optimizedRead } from '../db/queryOptimizer';
const data = await optimizedRead(companyId, 'cache-key', () => dbQuery(), { cacheTTL: 300 });

// Get statistics
import { queryOptimizer } from '../db/queryOptimizer';
const stats = queryOptimizer.getStatistics(companyId);

// Get index recommendations
const recommendations = await queryOptimizer.analyzeIndexes();
```

### Circuit Breakers
```typescript
// Wrap async operation
import { circuitBreaker } from './middleware/circuitBreaker';
const result = await circuitBreaker.execute('api-name', () => apiCall(), {
  failureThreshold: 5, timeout: 60000, fallbackResponse: {}
});

// Use as middleware
import { databaseCircuitBreaker } from './middleware/circuitBreaker';
router.get('/data', databaseCircuitBreaker, handler);
```

### Feature Flags
```typescript
// Check if enabled
import { featureFlagsService } from './services/FeatureFlagsService';
const enabled = await featureFlagsService.isEnabled('feature-key', companyId);

// Protect route
import { featureGate } from './services/FeatureFlagsService';
router.get('/api/feature', featureGate('feature-key'), handler);

// Gradual rollout
featureFlagsService.setRollout('feature-key', 50); // 50% of companies
```

---

## 📝 Environment Variables

```env
# Storage
STORAGE_PROVIDER=local|s3|cloudflare-r2
AWS_S3_BUCKET=bucket-name
AWS_REGION=us-east-1
CDN_BASE_URL=https://cdn.yourdomain.com

# Job Queues
REDIS_HOST=localhost
REDIS_PORT=6379
ENABLE_JOB_QUEUES=true

# File Uploads
UPLOAD_DIR=./uploads
```

---

## 🔧 CLI Commands

```bash
# Storage Migration
npm run migrate-storage              # Migrate local → cloud
npm run migrate-storage:dry-run      # Test without uploading
npm run migrate-storage:verify       # Verify migration

# Optional Packages
npm install @aws-sdk/client-s3       # AWS S3 support
npm install bullmq ioredis           # Job queues
npm install @bull-board/express      # Queue dashboard
```

---

## 📊 API Endpoints

### Storage
- `GET /api/storage/health` - Storage health status
- `GET /api/storage/stats` - Company storage statistics
- `POST /api/files/upload` - Upload files
- `DELETE /api/files/:key` - Delete file
- `GET /api/files/:key/download` - Get signed URL

### Job Queues
- `GET /admin/queues` - Bull Board dashboard
- `GET /api/queues/stats` - All queue statistics
- `GET /api/queues/:type/stats` - Specific queue stats
- `POST /api/queues/:type/pause` - Pause queue
- `POST /api/queues/:type/resume` - Resume queue

### Query Optimizer
- `GET /api/query-optimizer/metrics` - Query metrics
- `GET /api/query-optimizer/statistics` - Performance stats
- `POST /api/query-optimizer/explain` - Analyze query
- `GET /api/query-optimizer/indexes` - Index recommendations

### Graceful Degradation
- `GET /api/degradation/circuits` - Circuit breaker stats
- `POST /api/degradation/circuits/:name/reset` - Reset circuit
- `GET /api/degradation/features` - All feature flags
- `POST /api/degradation/features/:key/enable` - Enable feature
- `POST /api/degradation/features/:key/rollout` - Set rollout %

---

## 💡 Best Practices

### Storage
- Use Cloudflare R2 for production (10x cheaper than S3)
- Enable CDN for product images
- Set appropriate file size limits per category
- Migrate to cloud before reaching 1,000 companies

### Job Queues
- Use queues for operations > 2 seconds
- Set appropriate retry limits (3 attempts default)
- Monitor queue depths daily
- Use Bull Board for visual monitoring

### Query Optimization
- Use `optimizedRead()` for all SELECT queries
- Set cache TTL based on data freshness needs
- Review slow query logs weekly
- Apply index recommendations monthly

### Circuit Breakers
- Use for all external API calls
- Set failure threshold = 5 for most services
- Set timeout = 60s for external APIs
- Always provide fallback responses

### Feature Flags
- Use gradual rollout for new features (10% → 50% → 100%)
- Keep flags in code for 1-2 sprints after 100% rollout
- Use allow lists for beta testing
- Monitor feature usage via analytics

---

## ⚡ Performance Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Query Response | < 100ms | > 500ms |
| Cache Hit Rate | > 60% | < 40% |
| Queue Depth | < 100 jobs | > 1000 jobs |
| Circuit Breaker | All closed | Any open > 5 min |
| Storage Latency | < 200ms | > 1000ms |

---

## 🚨 Troubleshooting

### Storage not working
```bash
# Check health
curl http://localhost:5000/api/storage/health

# Verify credentials in .env
# Check S3 bucket permissions
```

### Queues not processing
```bash
# Check Redis
redis-cli ping

# Check queue stats
curl http://localhost:5000/api/queues/stats

# View Bull Board
http://localhost:5000/admin/queues
```

### Slow queries
```bash
# Get slow queries
curl http://localhost:5000/api/query-optimizer/metrics?slowOnly=true

# Get recommendations
curl http://localhost:5000/api/query-optimizer/indexes
```

### Circuit breaker open
```bash
# Check circuits
curl http://localhost:5000/api/degradation/circuits

# Reset if needed
curl -X POST http://localhost:5000/api/degradation/circuits/database/reset
```

---

## 📈 Scaling Guide

### < 100 companies
- Local storage OK
- Single Redis instance
- No CDN needed
- Basic monitoring

### 100-1,000 companies
- Migrate to S3/R2
- Managed Redis (3GB)
- Enable CDN
- Set up alerting

### 1,000-10,000 companies
- S3/R2 with CDN mandatory
- Redis cluster (8GB)
- Read replicas for database
- Advanced monitoring

### 10,000+ companies
- Multi-region storage
- Separate Redis per queue type
- Database sharding
- Geographic load balancing

---

## 📚 Documentation

- **Full Guide**: `PHASE3_IMPLEMENTATION_COMPLETE.md`
- **Storage Config**: `.env.storage.example`
- **Queue Config**: `.env.queues.example`
- **Migration Script**: `scripts/migrate-storage.ts`

---

**Questions?** Check the full documentation or API health endpoints for diagnostics.
