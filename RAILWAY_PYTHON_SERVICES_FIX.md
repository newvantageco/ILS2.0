# Railway Python Services Deployment Fix

## Issues Identified

### 1. AI Service (ai-service/)
**Problem:** Heavy ML dependencies causing build timeouts or memory issues on Railway

**Dependencies causing issues:**
- `sentence-transformers>=3.0.0` - Downloads large transformer models (~500MB)
- `torch` (dependency of sentence-transformers) - Very heavy (~1GB)
- Railway free tier: 512MB RAM, 1GB disk limit
- Railway Pro tier: 8GB RAM recommended for ML workloads

### 2. Python Service (python-service/)
**Problem:** May fail if trying to connect to database before it's ready

**Dependencies:**
- `scikit-learn>=1.5.0` - Moderate size (~80MB)
- `scipy>=1.14.0` - Moderate size (~50MB)

---

## Solutions

### Option 1: Use External AI APIs Only (Recommended for Railway)

Modify `ai-service/requirements.txt` to remove heavy local ML dependencies:

```txt
# ILS 2.0 - Production AI Service Dependencies (Railway Optimized)
# LIGHTWEIGHT - No local ML models, API-based only

# Core Web Framework
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
python-multipart>=0.0.12
pydantic>=2.9.0
pydantic-settings>=2.5.0

# AI/ML - External APIs ONLY (No Heavy Models)
openai>=1.50.0
anthropic>=0.39.0
# REMOVED: sentence-transformers (too heavy for Railway)
# REMOVED: torch (too heavy for Railway)

# Database & Vector Store
sqlalchemy>=2.0.35
psycopg2-binary>=2.9.9
pgvector>=0.3.5
asyncpg>=0.29.0

# Security & Authentication
python-jose[cryptography]>=3.3.0
PyJWT>=2.8.0
passlib[bcrypt]>=1.7.4
cryptography>=43.0.0

# HTTP & Utilities
httpx>=0.27.0
aiohttp>=3.10.0
requests>=2.32.0
python-dotenv>=1.0.1

# Data Processing (lightweight)
pandas>=2.2.0
numpy>=1.26.0,<2.0.0

# Monitoring & Logging
loguru>=0.7.2
prometheus-client>=0.21.0
```

### Option 2: Increase Railway Plan (If you need local ML)

**Railway Pro Plan Required:**
- 8GB RAM minimum
- Hobby plan: $5/month (512MB RAM) - NOT enough
- Pro plan: $20/month (8GB RAM) - Sufficient

**Enable Railway Pro Features:**
1. Go to Railway dashboard → Project Settings
2. Increase memory limit to 4GB-8GB
3. Increase build timeout to 30 minutes

---

## Environment Variables Required

### AI Service
Add these to Railway dashboard for `ai-service`:

```bash
# Required
OPENAI_API_KEY=sk-proj-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
DATABASE_URL=postgresql://... (from Railway Postgres)

# Optional
PORT=8080 (Railway auto-provides)
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### Python Service
Add these to Railway dashboard for `python-service`:

```bash
# Required
DATABASE_URL=postgresql://... (from Railway Postgres)

# Optional
PORT=8000 (Railway auto-provides)
```

---

## Quick Fix: Remove Heavy Dependencies

**For AI Service - Immediate Fix:**

1. Create `ai-service/requirements-railway.txt`:

```txt
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
python-multipart>=0.0.12
pydantic>=2.9.0
pydantic-settings>=2.5.0
openai>=1.50.0
anthropic>=0.39.0
sqlalchemy>=2.0.35
psycopg2-binary>=2.9.9
pgvector>=0.3.5
asyncpg>=0.29.0
python-jose[cryptography]>=3.3.0
PyJWT>=2.8.0
passlib[bcrypt]>=1.7.4
httpx>=0.27.0
aiohttp>=3.10.0
requests>=2.32.0
python-dotenv>=1.0.1
pandas>=2.2.0
numpy>=1.26.0,<2.0.0
loguru>=0.7.2
prometheus-client>=0.21.0
```

2. Update `ai-service/Dockerfile`:

```dockerfile
# Copy Railway-specific requirements
COPY requirements-railway.txt requirements.txt
```

3. Update `ai-service/app.py` to handle missing sentence-transformers:

```python
# At the top of app.py
try:
    from sentence_transformers import SentenceTransformer
    EMBEDDINGS_AVAILABLE = True
except ImportError:
    EMBEDDINGS_AVAILABLE = False
    print("⚠️  sentence-transformers not available - using OpenAI embeddings only")
```

---

## Railway Build Configuration

### AI Service (`ai-service/railway.json`)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1",
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
}
```

**Note:** `healthcheckTimeout: 300` (5 minutes) for ML model loading

### Python Service (`python-service/railway.json`)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1",
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 120
  }
}
```

---

## Common Railway Errors & Fixes

### Error: "Build exceeded memory limit"
**Fix:** Remove `sentence-transformers` from requirements.txt

### Error: "Build timeout exceeded"
**Fix:** Use lighter dependencies or increase timeout in Railway settings

### Error: "Application failed to respond to health check"
**Fix:**
1. Increase `healthcheckTimeout` to 300 seconds
2. Ensure `/health` endpoint exists in app.py/main.py
3. Check DATABASE_URL is set correctly

### Error: "ModuleNotFoundError: No module named 'sentence_transformers'"
**Fix:** Update code to handle missing module gracefully (see code example above)

---

## Recommended Deployment Order

1. **Deploy Postgres** (Railway Postgres plugin)
2. **Deploy Python Service** (lighter, faster build)
3. **Deploy AI Service** (with railway-specific requirements)
4. **Deploy Main App** (Node.js server)

---

## Testing Locally

```bash
# Test AI service
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements-railway.txt
uvicorn app:app --port 8080

# Test Python service
cd python-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000
```

---

## Railway Dashboard Settings

### For AI Service:
- **Memory:** 4GB (Pro plan) or 512MB with lightweight requirements
- **Build Timeout:** 20 minutes (if using ML models)
- **Start Timeout:** 5 minutes
- **Environment Variables:** OPENAI_API_KEY, ANTHROPIC_API_KEY, DATABASE_URL

### For Python Service:
- **Memory:** 1GB
- **Build Timeout:** 10 minutes
- **Start Timeout:** 2 minutes
- **Environment Variables:** DATABASE_URL

---

## Next Steps

1. **Immediate:** Create `requirements-railway.txt` with lightweight dependencies
2. **Update:** Modify Dockerfiles to use Railway requirements
3. **Configure:** Add environment variables in Railway dashboard
4. **Deploy:** Redeploy services
5. **Monitor:** Check Railway logs for successful deployment

**Estimated build time:** 3-5 minutes per service
**Estimated memory usage:**
- AI Service: 200-400MB (API-based) or 2-4GB (with local ML)
- Python Service: 150-300MB
