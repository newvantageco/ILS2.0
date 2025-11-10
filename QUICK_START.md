# ILS 2.0 - Quick Start Guide

## 🚀 Starting the Platform

```bash
cd /Users/saban/Downloads/IntegratedLensSystem
npm run dev
```

This starts:
- Backend API on port 3000
- Python Analytics on port 8000
- Frontend (proxied through port 3000)

---

## 🌐 Access URLs

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **API** | http://localhost:3000/api |
| **Health Check** | http://localhost:3000/health |
| **Python Analytics** | http://localhost:8000 |
| **WebSocket** | ws://localhost:3000/ws |

---

## 🔑 Login Credentials

- **Email**: saban@newvantageco.com
- **Password**: Check `.env` file → `MASTER_USER_PASSWORD`
- **Admin Key**: Check `.env` file → `ADMIN_ACCESS_KEY`

---

## ✅ Health Checks

```bash
# Backend health
curl http://localhost:3000/health | jq .

# Python service health
curl http://localhost:8000/health | jq .

# Redis connection
redis-cli ping
```

Expected responses:
```json
// Backend
{"status":"ok","timestamp":"...","environment":"development"}

// Python
{"status":"healthy","service":"python-analytics","version":"1.0.0"}

// Redis
PONG
```

---

## 📊 System Status

### Current Status: ✅ OPERATIONAL

All services running:
- ✅ Backend API (Express/TypeScript)
- ✅ Python Analytics (FastAPI)
- ✅ Frontend (React/Vite)
- ✅ PostgreSQL Database (Neon)
- ✅ Redis Cache & Queues
- ✅ Background Workers
- ✅ WebSocket Server
- ✅ AI Services (OpenAI, Anthropic, Ollama)

---

## 🛠️ Troubleshooting

### Server won't start?
```bash
# Kill any processes using the ports
lsof -ti:3000 -ti:8000 | xargs kill -9

# Restart Redis
brew services restart redis

# Restart server
npm run dev
```

### Redis connection issues?
```bash
# Check if Redis is running
brew services list | grep redis

# Start Redis if not running
brew services start redis

# Test connection
redis-cli ping
```

### Database connection issues?
```bash
# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Test connection (from Node.js)
npm run test:db  # If you have this script
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (credentials, API keys) |
| `server/index.ts` | Backend entry point |
| `start-dev.mjs` | Development server orchestrator |
| `server/routes.ts` | API route registration |
| `shared/schema.ts` | Database schema definitions |
| `PLATFORM_STATUS.md` | Current system status |
| `FIXES_APPLIED.md` | Recent fixes documentation |
| `ACTUAL_PLATFORM_FEATURES.md` | Feature reality check |

---

## 🔍 Useful Commands

### Development
```bash
# Start server
npm run dev

# Build frontend
npm run build

# Run linter
npm run lint

# Type check
npm run type-check
```

### Database
```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Run migrations (if you have them)
npm run migrate
```

### Redis
```bash
# Open Redis CLI
redis-cli

# Check Redis status
redis-cli info server

# Monitor Redis commands
redis-cli monitor
```

### Process Management
```bash
# Check what's using port 3000
lsof -ti:3000

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# View all node processes
ps aux | grep node
```

---

## 🧪 Testing API Endpoints

### Without Authentication (Public)
```bash
# Health check
curl http://localhost:3000/health

# Public routes (if any)
curl http://localhost:3000/api/public/...
```

### With Authentication
```bash
# Login first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"saban@newvantageco.com","password":"YOUR_PASSWORD"}'

# Use returned session cookie in subsequent requests
curl http://localhost:3000/api/companies \
  -H "Cookie: connect.sid=SESSION_ID"
```

---

## 📈 Monitoring

### View Logs
```bash
# Server logs (live)
npm run dev

# Redis logs
tail -f /usr/local/var/log/redis.log

# System logs (macOS)
log stream --predicate 'processImagePath contains "node"'
```

### Check Services
```bash
# Node processes
ps aux | grep "node start-dev"

# Redis status
brew services list | grep redis

# Ports in use
lsof -i :3000,5000,8000
```

---

## 🎯 Quick Tests

Run the test suite:
```bash
bash /tmp/test_ils_api.sh
```

Or manual tests:
```bash
# Backend
curl http://localhost:3000/health | jq .

# Python
curl http://localhost:8000/health | jq .

# API (should require auth)
curl http://localhost:3000/api/companies | jq .

# Frontend
curl -I http://localhost:3000

# Redis
redis-cli ping
```

---

## 🚨 Known Issues

### Port 5000 Conflict
**Issue**: AirTunes/AirPlay uses port 5000  
**Impact**: None - frontend accessible via Vite proxy on port 3000  
**Solution**: Use http://localhost:3000 instead of :5000

### Startup Warnings
**Issue**: Redis warnings during early startup  
**Impact**: None - services connect successfully after initialization  
**Action**: Ignore warnings if services show as connected later

---

## 📚 Documentation

- **Platform Status**: `PLATFORM_STATUS.md`
- **Recent Fixes**: `FIXES_APPLIED.md`
- **Feature List**: `ACTUAL_PLATFORM_FEATURES.md`
- **Architecture**: `AI_SYSTEM_ARCHITECTURE.md`
- **Quick Reference**: `API_QUICK_REFERENCE.md` (if exists)

---

## 🔐 Security Notes

- Never commit `.env` file
- Rotate API keys regularly
- Master user has full platform access
- Admin key grants super-admin privileges
- All API routes protected except `/health`

---

## 💡 Pro Tips

1. **Use the health endpoint** to verify services before testing
2. **Check Redis first** if workers aren't processing jobs
3. **Database connection pool** is limited to 20 - watch for exhaustion
4. **Background workers** process async jobs - check logs for errors
5. **AI providers** fail over: Ollama → OpenAI → Anthropic
6. **WebSocket** requires upgrade header for connection
7. **Multi-tenant** - always include company context in requests

---

## 🆘 Get Help

1. Check `PLATFORM_STATUS.md` for current status
2. Review `FIXES_APPLIED.md` for recent changes
3. Examine server logs for errors
4. Test health endpoints
5. Verify Redis connection
6. Check database connectivity

---

**Last Updated**: November 6, 2025  
**Platform Version**: 2.0.0  
**Status**: ✅ OPERATIONAL
