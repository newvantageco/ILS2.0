# AI Service Deployment Issue & Fix

**Date:** November 30, 2025, 10:40 PM UTC  
**Status:** 🔴 **AI SERVICE NOT DEPLOYED**

---

## Problem

The Python FastAPI ai-service has **NEVER been deployed** to Railway:

### Evidence
- Railway logs show "ils-api" (Node.js) instead of Python service
- Build logs show Docker/Node.js build, not Nixpacks/Python
- No uvicorn or FastAPI startup logs
- `railway.json` in ai-service directory is ignored

### Impact
- AI features relying on Python service are broken
- OCR functionality unavailable  
- RAG (Retrieval Augmented Generation) not working
- Ophthalmic AI models not accessible

---

## Root Cause

Railway CLI from `/ai-service` directory is **linked to the wrong service**. It's deploying the main Node.js app instead of the Python service.

**Current setup:**
```
/ILS2.0/                  → Railway Service: "ILS2.0" (Node.js)
/ILS2.0/ai-service/       → Should be: "ai-service" (Python)
                          → Actually is: Still linked to "ILS2.0" ❌
```

---

## Solution

### Option 1: Create Separate Railway Service (Recommended)

**Steps via Railway Dashboard:**

1. **Create New Service**
   - Go to Railway dashboard → ILS.2.0 project
   - Click "New Service"
   - Select "GitHub Repo"
   - Choose: `newvantageco/ILS2.0`
   - **Root Directory:** `ai-service`
   - Service Name: `ai-service`

2. **Configure Build**
   - Builder: **Nixpacks**
   - Build Command: (auto-detected from `nixpacks.toml`)
   - Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT --workers 1`

3. **Set Environment Variables**
   ```
   DATABASE_URL=<same as main service>
   OPENAI_API_KEY=<from main service>
   JWT_SECRET=<same as main service>
   ENVIRONMENT=production
   PRIMARY_LLM_PROVIDER=openai
   ```

4. **Configure Health Check**
   - Path: `/health`
   - Timeout: 120 seconds

5. **Deploy**
   - Click "Deploy"
   - Monitor build logs for Python/Nixpacks build

---

### Option 2: Fix via CLI (Alternative)

If you want to use CLI, you need to properly link the ai-service directory:

```bash
cd /path/to/ILS2.0/ai-service

# Unlink current (wrong) service
rm -rf .railway

# Link to ai-service specifically
railway service

# When prompted, select: "ai-service"

# Deploy
railway up
```

---

## Verification Steps

After deployment, verify:

### 1. Check Service is Running
```bash
cd ai-service
railway status
# Should show: Service: ai-service (not ILS2.0)
```

### 2. Check Build Logs
```bash
railway logs --build --lines 50
```

**Should see:**
```
Nixpacks detected: Python
Installing Python dependencies...
uvicorn
fastapi
psycopg2-binary
```

**Should NOT see:**
```
Docker build
Node.js
npm install
```

### 3. Check Runtime Logs
```bash
railway logs --lines 50
```

**Should see:**
```
Starting ILS 2.0 AI Service...
Environment: production
Primary LLM Provider: openai
Database configured: True
OpenAI configured: True
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 4. Test Health Endpoint
```bash
# Get the ai-service URL from Railway dashboard
curl https://ai-service-production-xxxx.up.railway.app/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "ILS AI Service",
  "version": "1.0.0"
}
```

---

## Required Environment Variables

The ai-service needs these variables set in Railway:

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key
- `JWT_SECRET` - JWT signing secret (same as main service)

### Optional
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `OLLAMA_BASE_URL` - Local AI model URL
- `USE_LOCAL_AI` - Enable local models (true/false)

### Auto-set by Railway
- `PORT` - Railway assigns this automatically
- `RAILWAY_ENVIRONMENT` - Set to "production"

---

## Why This Happened

The root project (`/ILS2.0`) has:
- `Dockerfile` (for Node.js build)
- `railway.toml` (root config)

The ai-service directory has:
- `railway.json` (service-specific config)
- `nixpacks.toml` (Nixpacks config)

**Railway CLI prioritizes root configs**, so deploying from `/ai-service` was still building the root Dockerfile.

**Solution:** Each service needs its own Railway service entry with proper root directory configuration.

---

## Current Architecture

```
Railway Project: ILS.2.0
├─ Service: ILS2.0 (Node.js/Express) ✅ DEPLOYED
│  ├─ Root: /
│  ├─ Builder: Dockerfile
│  └─ Port: 3000
│
├─ Service: ai-service (Python/FastAPI) ❌ NOT DEPLOYED
│  ├─ Root: /ai-service
│  ├─ Builder: Nixpacks
│  └─ Port: 8000 (assigned by Railway)
│
├─ Service: Postgres ✅ RUNNING
├─ Service: Redis ✅ RUNNING
└─ Service: python-service ⚠️ STATUS UNKNOWN
```

---

## Next Steps

1. **Create ai-service in Railway Dashboard** (5 minutes)
2. **Set environment variables** (2 minutes)
3. **Deploy and verify** (5 minutes)
4. **Test AI endpoints** (5 minutes)

Total Time: ~20 minutes

---

## Alternative: Consolidate Services

If you don't need separate ai-service, you could:
1. **Move Python code into main Node.js service**
2. **Use child processes to run Python from Node.js**
3. **Simplify to single deployment**

But this loses:
- Independent scaling
- Language-specific optimizations
- Service isolation

**Recommendation:** Keep them separate as designed.

---

**Status:** Waiting for Railway dashboard configuration  
**Blocker:** ai-service not created in Railway  
**Next Action:** Create service in Railway dashboard with root directory: `ai-service`
