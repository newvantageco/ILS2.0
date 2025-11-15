# ILS 2.0 - Docker Deployment Guide
**Complete guide for deploying ILS 2.0 with Docker**

---

## 📋 **Table of Contents**
1. [Prerequisites](#prerequisites)
2. [Quick Start (Development)](#quick-start-development)
3. [Production Deployment](#production-deployment)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Health Checks & Monitoring](#health-checks--monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)

---

## Prerequisites

### Required Software
- **Docker**: 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: 2.0+ (included with Docker Desktop)
- **Git**: For cloning the repository

### System Requirements
- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 10GB free space for Docker images and volumes

---

## Quick Start (Development)

### 1. Clone the Repository
```bash
git clone https://github.com/newvantageco/ILS2.0.git
cd ILS2.0
```

### 2. Start All Services
```bash
# Start PostgreSQL, Redis, and the application
docker-compose up -d

# View logs
docker-compose logs -f app
```

### 3. Initialize Database
```bash
# Run database migrations
docker-compose exec app npm run db:push

# (Optional) Seed with test data
docker-compose exec app npm run db:seed
```

### 4. Access the Application
- **Application**: http://localhost:5000
- **Adminer (DB UI)**: http://localhost:8080
- **Redis Commander**: http://localhost:8081

### 5. Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v
```

---

## Production Deployment

### Option 1: Docker Compose (Recommended for VPS/Self-Hosted)

#### Step 1: Prepare Environment
```bash
# Create production environment file
cp .env.example .env.production

# Edit with production values
nano .env.production
```

**Required Production Variables:**
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@postgres:5432/ils_db
REDIS_URL=redis://:strong_password@redis:6379
SESSION_SECRET=$(openssl rand -base64 32)
ADMIN_SETUP_KEY=$(openssl rand -base64 24)

# External services
RESEND_API_KEY=re_your_resend_key
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key

# AI Services (optional)
OPENAI_API_KEY=sk-your_openai_key
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
```

#### Step 2: Create Production Compose File
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: ils_db
      POSTGRES_USER: ils_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ils_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s

  app:
    image: ils-app:latest
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    env_file:
      - .env.production
    ports:
      - "80:5000"  # Map to port 80
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
```

#### Step 3: Build and Deploy
```bash
# Build the production image
docker build -t ils-app:latest .

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Initialize database
docker-compose -f docker-compose.prod.yml exec app npm run db:push

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### Step 4: Setup Nginx Reverse Proxy (Optional)
```nginx
# /etc/nginx/sites-available/ils
server {
    listen 80;
    server_name app.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable site and reload Nginx
sudo ln -s /etc/nginx/sites-available/ils /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL with Certbot
sudo certbot --nginx -d app.yourdomain.com
```

---

### Option 2: Standalone Docker (No Compose)

```bash
# Create network
docker network create ils-network

# Run PostgreSQL
docker run -d \
  --name ils-postgres \
  --network ils-network \
  -e POSTGRES_DB=ils_db \
  -e POSTGRES_USER=ils_user \
  -e POSTGRES_PASSWORD=strong_password \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine

# Run Redis
docker run -d \
  --name ils-redis \
  --network ils-network \
  -v redis_data:/data \
  redis:7-alpine redis-server --requirepass strong_redis_password

# Build and run app
docker build -t ils-app .

docker run -d \
  --name ils-app \
  --network ils-network \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://ils_user:strong_password@ils-postgres:5432/ils_db \
  -e REDIS_URL=redis://:strong_redis_password@ils-redis:6379 \
  -e SESSION_SECRET=$(openssl rand -base64 32) \
  -v $(pwd)/uploads:/app/uploads \
  ils-app
```

---

### Option 3: Railway Deployment

Railway automatically detects the Dockerfile and builds/deploys.

#### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

#### Step 2: Initialize Project
```bash
railway init
railway link
```

#### Step 3: Add Services
```bash
# Add PostgreSQL
railway add --database postgres

# Add Redis
railway add --database redis
```

#### Step 4: Set Environment Variables
```bash
railway variables set SESSION_SECRET=$(openssl rand -base64 32)
railway variables set ADMIN_SETUP_KEY=$(openssl rand -base64 24)
railway variables set RESEND_API_KEY=re_your_key
railway variables set STRIPE_SECRET_KEY=sk_live_your_key
```

#### Step 5: Deploy
```bash
railway up
```

---

## Environment Variables

### Core Variables (Required)
| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Session encryption key | Use `openssl rand -base64 32` |
| `ADMIN_SETUP_KEY` | Admin registration key | Use `openssl rand -base64 24` |

### Optional Services
| Variable | Description | Required |
|----------|-------------|----------|
| `REDIS_URL` | Redis connection string | Optional (graceful fallback) |
| `RESEND_API_KEY` | Email service | For transactional emails |
| `STRIPE_SECRET_KEY` | Payment processing | For subscriptions |
| `OPENAI_API_KEY` | AI features | For GPT integration |
| `ANTHROPIC_API_KEY` | AI features | For Claude integration |

### Master User Setup (Optional)
Pre-create an admin user on first startup:
```bash
MASTER_USER_EMAIL=admin@company.com
MASTER_USER_PASSWORD=SecurePassword123!  # Min 12 characters
MASTER_USER_FIRST_NAME=Admin
MASTER_USER_LAST_NAME=User
MASTER_USER_ORGANIZATION=Platform Control
```

---

## Database Setup

### Initial Migration
```bash
# With Docker Compose
docker-compose exec app npm run db:push

# With standalone Docker
docker exec ils-app npm run db:push
```

### Backup Database
```bash
# Backup
docker exec ils-postgres pg_dump -U ils_user ils_db > backup.sql

# Restore
docker exec -i ils-postgres psql -U ils_user ils_db < backup.sql
```

### Connect to Database
```bash
# Using psql
docker exec -it ils-postgres psql -U ils_user -d ils_db

# Using Adminer (if running)
# Open http://localhost:8080
# Server: postgres
# Username: ils_user
# Password: ils_password
# Database: ils_db
```

---

## Health Checks & Monitoring

### Health Endpoint
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-15T12:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "redis": "connected"
}
```

### Container Health
```bash
# Check all containers
docker-compose ps

# View container health
docker inspect --format='{{.State.Health.Status}}' ils-app

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' ils-app
```

### Logs
```bash
# Follow all logs
docker-compose logs -f

# App logs only
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app

# Since specific time
docker-compose logs --since 2025-11-15T12:00:00 app
```

### Metrics
Prometheus metrics available at: `http://localhost:5000/api/metrics`

---

## Troubleshooting

### App Won't Start

**1. Check logs:**
```bash
docker-compose logs app
```

**2. Common issues:**
- ❌ **"Cannot connect to database"** → Check DATABASE_URL and postgres health
- ❌ **"Redis connection failed"** → Redis is optional, check REDIS_URL
- ❌ **"Port 5000 already in use"** → Stop other services or change port

**3. Verify database connection:**
```bash
docker-compose exec app node -e "const db = require('./server/db.js'); db.query('SELECT 1').then(() => console.log('DB OK'))"
```

### Database Issues

**Reset database:**
```bash
docker-compose down -v  # ⚠️ Deletes all data
docker-compose up -d
docker-compose exec app npm run db:push
```

**Check database logs:**
```bash
docker-compose logs postgres
```

### Performance Issues

**Check resource usage:**
```bash
docker stats
```

**Increase memory limit:**
```yaml
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
```

### Port Conflicts

**Change port mapping:**
```yaml
# docker-compose.yml
services:
  app:
    ports:
      - "8000:5000"  # External:Internal
```

---

## Security Best Practices

### 1. Use Strong Secrets
```bash
# Generate secure random secrets
openssl rand -base64 32  # For SESSION_SECRET
openssl rand -base64 24  # For ADMIN_SETUP_KEY
openssl rand -hex 32     # For JWT_SECRET
```

### 2. Never Commit Secrets
```bash
# Add to .gitignore
echo ".env*" >> .gitignore
echo "!.env.example" >> .gitignore
```

### 3. Run as Non-Root User
The Dockerfile already creates a `nodejs` user (UID 1001).

### 4. Keep Images Updated
```bash
# Update base images
docker-compose pull

# Rebuild with latest
docker-compose build --no-cache

# Restart services
docker-compose up -d
```

### 5. Limit Network Exposure
```yaml
# Only expose necessary ports
services:
  postgres:
    ports: []  # Don't expose to host
  app:
    ports:
      - "127.0.0.1:5000:5000"  # Only localhost
```

### 6. Use Docker Secrets (Swarm Mode)
```yaml
secrets:
  db_password:
    external: true
  session_secret:
    external: true

services:
  app:
    secrets:
      - db_password
      - session_secret
```

---

## Production Checklist

Before deploying to production:

### Environment
- [ ] `NODE_ENV=production` set
- [ ] Strong `SESSION_SECRET` generated
- [ ] Secure `ADMIN_SETUP_KEY` generated
- [ ] Production database URL configured
- [ ] Redis configured (optional but recommended)

### Services
- [ ] Stripe live keys configured (not test keys)
- [ ] Email service configured (Resend)
- [ ] AI API keys set (if using AI features)
- [ ] CDN configured for static assets (optional)

### Security
- [ ] All secrets in `.env` (not hardcoded)
- [ ] `.env` files NOT committed to git
- [ ] HTTPS/SSL configured
- [ ] CORS origins properly set
- [ ] Rate limiting enabled

### Database
- [ ] Database migrations run (`npm run db:push`)
- [ ] Backup strategy implemented
- [ ] Connection pooling configured

### Monitoring
- [ ] Health check endpoint working
- [ ] Logs being captured
- [ ] Metrics endpoint accessible (if monitoring)
- [ ] Error tracking setup (Sentry, optional)

### Performance
- [ ] Build optimized for production
- [ ] Resource limits set
- [ ] CDN for static assets (optional)
- [ ] Database indexes created

---

## Quick Commands Reference

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart a service
docker-compose restart app

# View logs
docker-compose logs -f app

# Execute commands in container
docker-compose exec app npm run db:push

# Rebuild after code changes
docker-compose build app
docker-compose up -d app

# Check health
curl http://localhost:5000/api/health

# Backup database
docker exec ils-postgres pg_dump -U ils_user ils_db > backup.sql

# Scale app (if using multiple instances)
docker-compose up -d --scale app=3
```

---

## Support & Resources

- **Documentation**: See [README.md](README.md)
- **Issues**: [GitHub Issues](https://github.com/newvantageco/ILS2.0/issues)
- **Docker Docs**: https://docs.docker.com
- **Railway Docs**: https://docs.railway.app

---

**Last Updated**: November 15, 2025
**Version**: 2.0
**Status**: ✅ Production Ready
