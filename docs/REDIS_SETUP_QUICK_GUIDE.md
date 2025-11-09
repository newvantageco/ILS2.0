# Redis Setup Quick Guide

## Install Redis (macOS)

### Option 1: Homebrew (Recommended)
```bash
# Install Redis
brew install redis

# Start Redis as a service (runs in background)
brew services start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### Option 2: Manual Start
```bash
# Start Redis manually (runs in foreground)
redis-server

# In another terminal, test connection:
redis-cli ping
```

## Verify Queue System Works

### 1. Start Redis
```bash
brew services start redis
```

### 2. Start Your Server
```bash
npm run dev
```

You should see:
```
✅ Redis connected - Background job workers will start
📋 Background job workers active:
   - Email worker: Processing order confirmations, notifications
   - PDF worker: Generating invoices, receipts, lab tickets
   - Notification worker: In-app notifications
   - AI worker: Daily briefings, demand forecasts, insights
```

### 3. Test Queue Monitoring Endpoints
```bash
# Get queue statistics (requires admin login)
curl http://localhost:3000/api/queue/stats \
  -H "Cookie: session=YOUR_SESSION"

# Get queue health
curl http://localhost:3000/api/queue/health \
  -H "Cookie: session=YOUR_SESSION"
```

## Test Without Redis (Fallback Mode)

### 1. Stop Redis
```bash
brew services stop redis
```

### 2. Start Your Server
```bash
npm run dev
```

You should see:
```
⚠️  Redis not available - Will use immediate execution fallback
```

The app will still work, but operations will execute synchronously instead of being queued.

## Configure for Production

### Set Environment Variables
```bash
# Add to .env file
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your_password  # Optional
```

### Configure Redis Persistence
Edit `/opt/homebrew/etc/redis.conf` (or `/usr/local/etc/redis.conf`):

```conf
# Enable RDB persistence
save 900 1
save 300 10
save 60 10000

# Or enable AOF persistence (more durable)
appendonly yes
appendfsync everysec

# Set max memory
maxmemory 1gb
maxmemory-policy allkeys-lru

# Security (recommended)
requirepass your_strong_password_here
```

Restart Redis after changes:
```bash
brew services restart redis
```

## Troubleshooting

### Redis Won't Start
```bash
# Check if Redis is already running
ps aux | grep redis

# Check Redis logs
tail -f /opt/homebrew/var/log/redis.log
```

### Connection Refused
```bash
# Verify Redis is listening
lsof -i :6379

# Test connection
redis-cli ping
```

### Clear All Jobs (Development)
```bash
redis-cli FLUSHALL
```

## Useful Redis Commands

```bash
# Check memory usage
redis-cli INFO memory

# Monitor commands in real-time
redis-cli MONITOR

# View all keys
redis-cli KEYS "*"

# Check queue status
redis-cli KEYS "bull:*"
```

## Next Steps

Once Redis is running:
1. ✅ Workers will start automatically
2. ✅ Queue helpers will use Redis
3. ✅ Monitoring endpoints will work
4. 📝 Optionally migrate existing routes to use queue helpers

See `QUEUE_INTEGRATION_EXAMPLES.md` for migration examples.
