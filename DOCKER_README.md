# 🐳 ILS 2.0 - Docker Testing Guide

Complete guide for testing and running ILS 2.0 in Docker containers.

---

## 📚 Quick Navigation

- **[5-Minute Quick Start](#-5-minute-quick-start)** - Get running immediately
- **[Understanding the Setup](#-understanding-the-setup)** - Architecture overview
- **[Detailed Testing Guide](#-detailed-testing-guide)** - Comprehensive instructions
- **[Troubleshooting](#-troubleshooting)** - Common issues and fixes
- **[Advanced Topics](#-advanced-topics)** - Power user features

---

## ⚡ 5-Minute Quick Start

### Prerequisites
```bash
# Verify Docker is installed and running
docker --version
docker ps
```

### Production Stack (Full Application)

```bash
# 1. Navigate to project
cd /Users/saban/Documents/GitHub/ILS2.0

# 2. Start all services
docker-compose up -d

# 3. Wait for services to start
sleep 45

# 4. Verify everything is running
docker-compose ps

# 5. Test the application
curl http://localhost:5000/api/health

# 6. Open in browser
open http://localhost:5000
```

**That's it!** Your application is now running in Docker.

### Development Stack (With Hot Reload)

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Wait for services
sleep 45

# Access frontend (with hot reload)
open http://localhost:5173

# Or backend API
curl http://localhost:5001/api/health
```

---

## 📊 Understanding the Setup

### Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│         Docker Compose Network                   │
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────────┐  ┌──────────────┐             │
│  │  PostgreSQL  │  │    Redis     │             │
│  │   Port 5432  │  │  Port 6379   │             │
│  │  (Database)  │  │  (Cache)     │             │
│  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                      │
│         └────────┬────────┘                      │
│                  │                               │
│         ┌────────▼────────┐                      │
│         │   ILS App       │                      │
│         │   Port 5000     │                      │
│         │   (Node.js)     │                      │
│         └────────┬────────┘                      │
│                  │                               │
│    ┌────────────┼────────────┐                   │
│    │            │            │                   │
│    ▼            ▼            ▼                   │
│  Adminer    Redis-Cli    Your Browser           │
│  8080       8081         5000                    │
│                                                   │
└─────────────────────────────────────────────────┘
```

### Services Overview

| Service | Purpose | Port | Health |
|---------|---------|------|--------|
| **PostgreSQL** | Main database | 5432 | Health check every 10s |
| **Redis** | Cache & sessions | 6379 | Health check every 10s |
| **ILS App** | Node.js backend | 5000 | Health check every 30s |
| **Adminer** | Database UI | 8080 | Always up |
| **Redis Commander** | Redis UI | 8081 | Always up |

### Data Persistence

```
Docker Volumes:
├── ils-postgres-data    → PostgreSQL data (persists across restarts)
├── ils-redis-data       → Redis data (persists across restarts)
└── ./uploads            → Application uploads (mounted from host)
```

---

## 🧪 Detailed Testing Guide

### Step 1: Initialize Environment

```bash
# Copy Docker environment file
cp .env.docker .env

# Or use existing environment
# The docker-compose.yml already has DATABASE_URL, REDIS_URL configured
```

### Step 2: Start Services

```bash
# Production stack
docker-compose up -d

# Watch startup progress
docker-compose logs -f

# Wait for health checks to pass
# You should see: "(healthy)" for each service
```

### Step 3: Verify Services

```bash
# Check all containers are running
docker-compose ps
# All should show "Up"

# Test each service individually
echo "Testing Database..."
docker-compose exec postgres pg_isready -U ils_user -d ils_db

echo "Testing Redis..."
docker-compose exec redis redis-cli -a ils_redis_password ping

echo "Testing App..."
curl http://localhost:5000/api/health
```

### Step 4: Access Management Interfaces

#### Database Management (Adminer)
1. Open: `http://localhost:8080`
2. Login:
   - System: `PostgreSQL`
   - Server: `postgres`
   - Username: `ils_user`
   - Password: `ils_password`
   - Database: `ils_db`
3. Explore:
   - Browse tables
   - Run queries
   - View data

#### Redis Management
1. Open: `http://localhost:8081`
2. Explore:
   - View Redis databases
   - See cached data
   - Monitor memory usage

#### Application
1. Open: `http://localhost:5000`
2. Test basic functionality
3. Create test data (if auth available)

### Step 5: View Logs

```bash
# All logs (last 20 lines)
docker-compose logs --tail=20

# Follow logs in real-time
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres

# Filter for errors
docker-compose logs | grep ERROR
```

### Step 6: Execute Commands in Containers

```bash
# Connect to app container
docker-compose exec app sh
# Now you can run commands inside the container

# Connect to database
docker-compose exec postgres psql -U ils_user -d ils_db
# SQL prompt opens

# Connect to Redis
docker-compose exec redis redis-cli
# Redis CLI opens
```

### Step 7: Database Operations

```bash
# List all tables
docker-compose exec postgres psql -U ils_user -d ils_db -c "\dt"

# Count records in a table
docker-compose exec postgres psql -U ils_user -d ils_db -c "SELECT COUNT(*) FROM users;"

# Backup database
docker-compose exec postgres pg_dump -U ils_user ils_db > backup_$(date +%Y%m%d).sql

# Restore database
docker-compose exec -T postgres psql -U ils_user ils_db < backup_20251114.sql

# Check database size
docker-compose exec postgres psql -U ils_user -d ils_db -c "\l"
```

### Step 8: Performance Monitoring

```bash
# Real-time resource usage
docker stats

# Monitor specific container
docker stats ils-app

# Check container disk usage
docker exec ils-app du -sh /*

# View container memory
docker inspect ils-app | grep Memory
```

---

## 🐛 Troubleshooting

### Problem: Containers Won't Start

**Symptom:** `docker-compose ps` shows "Exited" status

**Solution:**
```bash
# 1. Check logs for error
docker-compose logs

# 2. If ports in use
lsof -i :5000
kill -9 <PID>

# 3. Rebuild everything
docker-compose down -v
docker-compose up -d --build
```

### Problem: Database Connection Refused

**Symptom:** App can't connect to database

**Solution:**
```bash
# 1. Verify database is running
docker-compose ps postgres
# Should show "Up (healthy)"

# 2. Test database directly
docker-compose exec postgres pg_isready -U ils_user -d ils_db

# 3. Check environment variables in app
docker-compose exec app env | grep DATABASE_URL

# 4. Test connection from app
docker-compose exec app psql $DATABASE_URL -c "SELECT 1"
```

### Problem: Redis Connection Failed

**Symptom:** Redis errors in app logs

**Solution:**
```bash
# 1. Check Redis is running
docker-compose ps redis

# 2. Test Redis connection
docker-compose exec redis redis-cli ping

# 3. Test with password (production)
docker-compose exec redis redis-cli -a ils_redis_password ping

# 4. Check Redis memory
docker-compose exec redis redis-cli INFO memory
```

### Problem: Port Already in Use

**Symptom:** `bind: address already in use`

**Solution:**
```bash
# Find what's using the port
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
# Change "5000:5000" to "5001:5000"
docker-compose up -d
```

### Problem: Out of Disk Space

**Symptom:** Docker errors about disk space

**Solution:**
```bash
# Remove unused containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Remove unused volumes
docker volume prune -a -f

# View storage usage
docker system df
```

### Problem: Containers Very Slow

**Symptom:** High CPU/Memory usage, slow responses

**Solution:**
```bash
# Check resource usage
docker stats

# Restart containers
docker-compose restart

# Reduce container resources (edit docker-compose.yml)
# Add under 'app' service:
# resources:
#   limits:
#     cpus: '2'
#     memory: 2G

# Rebuild with fresh start
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Problem: Data Not Persisting

**Symptom:** Data lost after restart

**Solution:**
```bash
# Ensure volumes are not using -v flag with down
docker-compose down  # Keep volumes

# Check volumes
docker volume ls | grep ils

# Verify volume mounts
docker inspect ils-app | grep Mounts -A 20
```

---

## 🔄 Development Workflow

### Using Development Stack

```bash
# Start with hot reload
docker-compose -f docker-compose.dev.yml up -d

# Frontend auto-reloads at http://localhost:5173
# Backend auto-restarts at http://localhost:5001

# View logs with timestamps
docker-compose -f docker-compose.dev.yml logs -f --timestamps

# Stop when done
docker-compose -f docker-compose.dev.yml down
```

### Development Features

- **Frontend Hot Reload**: Vite auto-reloads on code changes
- **Backend Auto-Restart**: Node auto-restarts on file changes
- **MailHog**: Email testing at `http://localhost:8025`
- **Database UI**: Adminer at `http://localhost:8082`
- **Volume Mounts**: All code synced to containers

### Development Ports

```
Port 5173  - React frontend (Vite dev server)
Port 5001  - Node.js backend API
Port 5433  - PostgreSQL (different from production 5432)
Port 6380  - Redis (different from production 6379)
Port 8082  - Adminer UI
Port 8025  - MailHog UI
Port 8083  - Redis Commander
```

---

## 🚀 Production Deployment Checks

### Pre-Deployment Verification

```bash
# 1. Build production image
docker-compose build app

# 2. Start production stack
docker-compose up -d

# 3. Wait for health checks
sleep 45
docker-compose ps

# 4. Run health endpoint test
curl http://localhost:5000/api/health

# 5. Check database migrations
docker-compose exec app npm run db:push

# 6. View production logs
docker-compose logs -f app

# 7. Monitor resources
docker stats ils-app
```

### Security Checklist

```bash
# ✓ Ensure non-root user in Dockerfile
docker-compose exec app whoami
# Should return: nodejs (not root)

# ✓ Check environment variables
docker-compose exec app env | grep -E "NODE_ENV|PASSWORD" | grep -v "^_"
# Should NOT show passwords in output

# ✓ Verify file permissions
docker-compose exec app ls -la /app
# Should have nodejs ownership

# ✓ Check network isolation
docker network ls
docker network inspect ils-network
```

---

## 🧹 Maintenance & Cleanup

### Stop Services (Keep Data)

```bash
# Stop all containers
docker-compose stop

# Containers still exist, volumes kept
# Can restart with: docker-compose start
```

### Stop Services (Remove Everything)

```bash
# Stop and remove containers and networks
docker-compose down

# Also remove volumes (deletes all data!)
docker-compose down -v
```

### Deep Cleanup

```bash
# Remove everything
docker-compose down -v

# Remove all ILS images
docker rmi ils-app

# Prune system
docker system prune -a -f

# Verify cleanup
docker ps -a | grep ils      # Should be empty
docker images | grep ils     # Should be empty
docker volume ls | grep ils  # Should be empty
```

### Backup & Restore

```bash
# Backup database
docker-compose exec postgres pg_dump -U ils_user ils_db > db_backup.sql

# Backup entire volume
docker run --rm -v ils-postgres-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore database
docker-compose exec -T postgres psql -U ils_user ils_db < db_backup.sql

# Restore volume
docker run --rm -v ils-postgres-data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/postgres_backup.tar.gz -C /data
```

---

## 📈 Performance Tuning

### Optimize Database

```bash
# Run ANALYZE
docker-compose exec postgres psql -U ils_user -d ils_db -c "ANALYZE;"

# View slow queries
docker-compose exec postgres psql -U ils_user -d ils_db -c \
  "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Check index usage
docker-compose exec postgres psql -U ils_user -d ils_db -c \
  "SELECT schemaname, tablename, indexname FROM pg_indexes;"
```

### Optimize Redis

```bash
# Check memory usage
docker-compose exec redis redis-cli INFO memory

# Monitor operations
docker-compose exec redis redis-cli MONITOR

# Check key statistics
docker-compose exec redis redis-cli --stat

# Clean up expired keys
docker-compose exec redis redis-cli FLUSHDB
```

### Optimize Container Resources

Edit `docker-compose.yml`:
```yaml
app:
  resources:
    limits:
      cpus: '2'        # Max 2 CPUs
      memory: 1G       # Max 1GB RAM
    reservations:
      cpus: '1'        # Reserve 1 CPU
      memory: 512M     # Reserve 512MB
```

---

## 🤖 Automated Testing

### Using Test Script

```bash
# Make executable (one-time)
chmod +x test-docker.sh

# Interactive menu
./test-docker.sh

# Or direct commands
./test-docker.sh production
./test-docker.sh development
./test-docker.sh status
./test-docker.sh logs production
./test-docker.sh stop
./test-docker.sh clean
```

---

## 📞 Support

### Getting Help

1. **Check logs**: `docker-compose logs`
2. **Check status**: `docker-compose ps`
3. **Read troubleshooting**: See [Troubleshooting](#-troubleshooting) section
4. **Review this guide**: Full documentation above

### Useful Commands Summary

```bash
# Most useful commands
docker-compose up -d              # Start
docker-compose down               # Stop
docker-compose ps                 # Status
docker-compose logs -f            # Logs
docker-compose exec app sh        # Shell
docker-compose exec postgres ...  # Database
docker stats                      # Monitoring
```

---

## 📚 Additional Resources

- **Quick Reference**: See `DOCKER_QUICK_REF.md`
- **Comprehensive Guide**: See `DOCKER_TESTING_GUIDE.md`
- **Dockerfile**: Read `Dockerfile` (production) or `Dockerfile.dev` (development)
- **Docker Docs**: https://docs.docker.com
- **Docker Compose Docs**: https://docs.docker.com/compose

---

## ✅ Verification Checklist

- [ ] Docker installed and running
- [ ] Cloned ILS 2.0 repository
- [ ] Navigated to project root
- [ ] Started with `docker-compose up -d`
- [ ] Waited 45 seconds for startup
- [ ] Verified with `docker-compose ps`
- [ ] Tested health endpoint with `curl`
- [ ] Accessed application at `http://localhost:5000`
- [ ] Accessed database UI at `http://localhost:8080`
- [ ] Checked logs with `docker-compose logs`

---

## 🎉 You're Ready!

Your ILS 2.0 platform is now running in Docker!

**Next Steps:**
1. Explore the application
2. Access management interfaces
3. Test with real data
4. Review logs for any issues
5. Proceed to development or deployment

**Happy testing! 🚀**
