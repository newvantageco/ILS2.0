# AI Service Deployment Guide

## 🎯 Overview

This guide covers deploying the new consolidated AI service to Railway. The new architecture:

- **Lightweight dependencies** - 80% smaller than old version
- **Production-ready** - OpenAI/Anthropic integration, no local models
- **RAG-powered** - pgvector for semantic search
- **Ophthalmic-specialized** - Domain expertise built-in
- **Self-learning** - Improves over time from conversations

## 📋 Prerequisites

### Required Services
- **PostgreSQL 15+** with pgvector extension (Railway provides)
- **OpenAI API** key (required)
- **Anthropic API** key (optional, for fallback)

### Environment Variables

Set these in Railway dashboard before deployment:

```bash
# Required
DATABASE_URL=<auto-provided-by-railway>
JWT_SECRET=<same-as-main-backend>
OPENAI_API_KEY=sk-...

# Optional but recommended
ANTHROPIC_API_KEY=sk-ant-...
NODE_ENV=production
LOG_LEVEL=INFO
PRIMARY_LLM_PROVIDER=openai
FALLBACK_LLM_PROVIDER=anthropic

# RAG Configuration (optional, has defaults)
RAG_TOP_K=5
RAG_SIMILARITY_THRESHOLD=0.7

# Features (optional, defaults to true)
ENABLE_LEARNING=true
ENABLE_FEEDBACK=true
ENABLE_ANALYTICS=true
```

## 🚀 Deployment Steps

### 1. Prepare Database

Ensure PostgreSQL has pgvector extension:

```sql
-- Connect to your Railway PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 2. Configure Railway Service

1. **Open Railway Dashboard**
2. **Navigate to AI Service** (or create new service)
3. **Set Environment Variables** (see above)
4. **Configure Build Settings:**
   - Root Directory: `/ai-service`
   - Build Command: (uses Dockerfile automatically)
   - Start Command: (defined in Dockerfile)

### 3. Deploy

**Option A: Automatic (via Git push)**
```bash
git add .
git commit -m "feat: deploy new AI service"
git push origin <your-branch>
```

Railway will automatically detect changes and deploy.

**Option B: Manual (Railway CLI)**
```bash
railway up --service ai-service
```

### 4. Verify Deployment

Check health:
```bash
curl https://your-ai-service.railway.app/health
```

Expected response:
```json
{
  "service": "ILS 2.0 AI Service",
  "version": "2.0.0",
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-28T10:30:00Z"
}
```

### 5. Seed Knowledge Base

After successful deployment, seed the ophthalmic knowledge:

**Option A: Via Railway Shell**
```bash
railway run --service ai-service python seed_knowledge.py
```

**Option B: Via SSH (if enabled)**
```bash
ssh into Railway container
python seed_knowledge.py --company-id <company-id>
```

**Option C: Via API (after deployment)**

Create a script to call `/api/v1/knowledge/add` endpoint multiple times.

### 6. Update Main Backend

Ensure main backend points to new AI service:

```bash
# In main backend Railway service
AI_SERVICE_URL=https://ils-ai-service.railway.internal:8080
# Or use the public URL if needed
```

### 7. Test Integration

```bash
# From main backend
curl -X POST https://your-backend.railway.app/api/master-ai/chat \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "What are progressive lenses?", "topic": "ophthalmic"}'
```

## 🔧 Configuration

### Resource Allocation

Recommended Railway resources:

- **Memory**: 2GB minimum, 4GB recommended
- **CPU**: 2 vCPU recommended
- **Replicas**: 1 (scale to 2+ for production load)

### Health Checks

Railway automatically uses:
- **Path**: `/health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Start Period**: 40 seconds

### Internal Networking

Use Railway's internal networking for backend communication:
```
http://ils-ai-service.railway.internal:8080
```

## 📊 Monitoring

### Logs

View logs in Railway dashboard or via CLI:
```bash
railway logs --service ai-service
```

Look for:
- `✅ Database initialized successfully`
- `External AI initialized with providers: openai, anthropic`
- Successful health checks
- Request/response logs

### Metrics

Monitor in Railway dashboard:
- CPU usage
- Memory usage
- Response times
- Error rates
- Request volume

### Alerts

Set up alerts for:
- Service restarts
- High error rates (>5%)
- High response times (>5s)
- Memory issues (>90%)

## 🐛 Troubleshooting

### Service Won't Start

1. **Check environment variables**
   ```bash
   railway variables --service ai-service
   ```

2. **Verify DATABASE_URL**
   - Should include `?sslmode=require`
   - Test connection from local

3. **Check build logs**
   - Look for dependency installation errors
   - Verify Python version (3.11)

4. **Verify JWT_SECRET**
   - Must match main backend
   - Check for trailing spaces

### Database Connection Fails

1. **Check pgvector extension**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```

2. **Verify connection string format**
   - Service auto-converts `postgresql://` to `postgresql+asyncpg://`

3. **Check network connectivity**
   - Ensure AI service and database in same Railway project

### OpenAI API Errors

1. **Verify API key**
   ```bash
   railway variables --service ai-service | grep OPENAI
   ```

2. **Check billing/quota**
   - Login to OpenAI dashboard
   - Verify active payment method
   - Check usage limits

3. **Test API key locally**
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

### High Response Times

1. **Check LLM provider status**
   - OpenAI status: status.openai.com
   - Anthropic status: status.anthropic.com

2. **Verify database performance**
   - Check Railway database metrics
   - Consider upgrading plan

3. **Enable caching** (future enhancement)
   - Add Redis for frequently asked questions

4. **Scale horizontally**
   - Increase replicas in Railway

### Memory Issues

1. **Monitor sentence-transformers usage**
   - Loads embeddings model into memory
   - Consider reducing workers if memory constrained

2. **Optimize database queries**
   - Check slow query logs
   - Add indexes if needed

3. **Increase memory allocation**
   - Upgrade Railway plan

## 🔄 Rolling Back

If deployment fails:

1. **Via Railway Dashboard**
   - Go to Deployments
   - Click on previous successful deployment
   - Click "Redeploy"

2. **Via Git**
   ```bash
   git revert <commit-hash>
   git push origin <branch>
   ```

3. **Via Railway CLI**
   ```bash
   railway rollback --service ai-service
   ```

## 🔒 Security Checklist

- [ ] JWT_SECRET set and matches main backend
- [ ] Environment variables not exposed in logs
- [ ] Database uses SSL (sslmode=require)
- [ ] OpenAI/Anthropic API keys secured
- [ ] CORS origins properly configured
- [ ] Rate limiting enabled (if needed)
- [ ] Health endpoint not exposing sensitive info
- [ ] Admin endpoints disabled in production

## 📈 Performance Optimization

### Database
- Ensure pgvector indexes exist on embedding columns
- Regular VACUUM ANALYZE on knowledge tables
- Monitor connection pool usage

### Caching (Future)
- Add Redis for frequent queries
- Cache embeddings for common questions
- Cache LLM responses for identical queries

### LLM Optimization
- Use GPT-4-turbo for cost/speed balance
- Implement token counting and limits
- Consider GPT-3.5-turbo for simple queries

## 🆕 Updating

To update the service:

1. **Make changes locally**
2. **Test locally** (see README.md)
3. **Commit and push**
4. **Railway auto-deploys**
5. **Verify health checks pass**
6. **Monitor logs for errors**
7. **Test functionality**

## 📞 Support

If issues persist:

1. Check Railway status: status.railway.app
2. Review service logs thoroughly
3. Test components individually
4. Check external service status (OpenAI, etc.)
5. Contact platform team with:
   - Error messages
   - Deployment logs
   - Environment configuration (sanitized)
   - Steps to reproduce

## ✅ Post-Deployment Checklist

- [ ] Service deployed successfully
- [ ] Health checks passing
- [ ] Database connected
- [ ] OpenAI API working
- [ ] Anthropic API working (if configured)
- [ ] Knowledge base seeded
- [ ] Main backend updated with new URL
- [ ] Integration tests passing
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Documentation updated
- [ ] Team notified

## 🎉 Success Indicators

Your deployment is successful when:

- ✅ Health endpoint returns status: "healthy"
- ✅ Database shows "connected"
- ✅ LLM services (OpenAI/Anthropic) show as available
- ✅ Chat endpoint returns relevant responses
- ✅ Learning progress shows knowledge base entries
- ✅ Response times < 5 seconds average
- ✅ Error rate < 1%
- ✅ No service restarts
- ✅ Integration with main backend working

Congratulations! Your AI service is live! 🚀
