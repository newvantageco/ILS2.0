# 📊 ILS 2.0 - Monitoring & Logging Setup Guide

## **OVERVIEW**

Configure comprehensive monitoring and logging for real-time insights into your ILS 2.0 platform's health, performance, and operational metrics. Built-in monitoring provides immediate visibility with optional external service integration.

---

## **🎯 MONITORING ARCHITECTURE**

### **Multi-Layer Monitoring Stack**
```
Application Layer
├── Health Checks (HTTP endpoints)
├── Performance Metrics (Response times, throughput)
├── Error Tracking (Error rates, exceptions)
└── Business Metrics (User activity, API usage)

Infrastructure Layer
├── System Resources (CPU, memory, disk)
├── Database Monitoring (PostgreSQL stats)
├── Cache Monitoring (Redis performance)
└── Network Monitoring (Latency, connectivity)

Service Layer
├── AI Service Monitoring (GPT-4, Claude 3)
├── Shopify Integration (Webhooks, sync status)
├── File Storage (S3 operations)
└── Background Jobs (Queue processing)
```

---

## **🚀 QUICK SETUP**

### **Built-in Monitoring (Railway Included)**
1. **Configure Variables**: Add monitoring environment variables
2. **Test Endpoints**: Verify health checks and metrics
3. **View Dashboard**: Access admin monitoring panels
4. **Set Alerts**: Configure threshold-based alerts

### **External Monitoring (Optional)**
1. **Choose Service**: Grafana Cloud, Sentry, Datadog
2. **Install SDK**: Add monitoring client libraries
3. **Configure Integration**: Set up API keys and endpoints
4. **Create Dashboards**: Build custom monitoring views

---

## **🔧 ENVIRONMENT CONFIGURATION**

### **Required Environment Variables**
```bash
# Core Monitoring
METRICS_ENABLED=true
LOG_LEVEL=info
APM_ENABLED=true
HEALTH_CHECK_ENABLED=true

# Performance Thresholds
SLOW_QUERY_THRESHOLD=1000    # ms
MEMORY_THRESHOLD=0.8         # 80% memory usage
CPU_THRESHOLD=0.8            # 80% CPU usage
DISK_THRESHOLD=0.9           # 90% disk usage

# Error Tracking
ERROR_TRACKING_ENABLED=true
ERROR_NOTIFICATION_LEVEL=error
MAX_ERROR_RATE=0.05          # 5% error rate threshold

# Business Metrics
BUSINESS_METRICS_ENABLED=true
USER_ACTIVITY_TRACKING=true
API_USAGE_TRACKING=true

# Logging Configuration
LOG_FORMAT=json
LOG_TIMESTAMP=true
LOG_REQUEST_ID=true
LOG_TENANT_ID=true

# Health Check Configuration
HEALTH_CHECK_INTERVAL=30000  # 30 seconds
HEALTH_CHECK_TIMEOUT=5000    # 5 seconds
```

---

## **📊 MONITORING ENDPOINTS**

### **Health & Status**
```bash
# Basic health check
GET /health
Response: {"status":"healthy","timestamp":"2024-01-01T12:00:00Z"}

# Detailed health check
GET /api/health
Response: {
  "status": "healthy",
  "services": {
    "database": "connected",
    "redis": "connected",
    "ai_service": "operational",
    "storage": "available"
  },
  "metrics": {
    "uptime": 86400,
    "memory": 0.65,
    "cpu": 0.45
  }
}

# Service verification
GET /api/verification/status
Response: {
  "overall": "healthy",
  "services": {
    "core": "operational",
    "ai_ml": "operational",
    "shopify": "connected",
    "database": "healthy",
    "redis": "healthy"
  },
  "performance": {
    "response_time": 150,
    "error_rate": 0.01
  }
}
```

### **Performance Metrics**
```bash
# Application metrics
GET /api/metrics
Response: {
  "http_requests_total": 10000,
  "http_request_duration_seconds": 0.15,
  "memory_usage_bytes": 134217728,
  "cpu_usage_percent": 45.2,
  "active_connections": 25
}

# Database monitoring
GET /api/monitoring/database
Response: {
  "connections": {
    "active": 15,
    "idle": 10,
    "max": 100
  },
  "queries": {
    "slow_queries": 2,
    "avg_duration": 45,
    "total_queries": 5000
  },
  "size": {
    "database": "2.5GB",
    "tables": 95,
    "indexes": 120
  }
}

# Redis monitoring
GET /api/monitoring/redis
Response: {
  "memory": {
    "used": "128MB",
    "peak": "145MB",
    "max": "256MB"
  },
  "performance": {
    "hit_rate": 0.85,
    "operations_per_second": 1250,
    "connected_clients": 8
  },
  "keys": {
    "total": 10000,
    "expires": 2500,
    "evicted": 12
  }
}
```

---

## **📈 DASHBOARD CONFIGURATION**

### **Admin Dashboard Features**
```typescript
// Service Status Dashboard
interface ServiceStatus {
  services: {
    core: ServiceHealth;
    database: ServiceHealth;
    redis: ServiceHealth;
    ai_service: ServiceHealth;
    storage: ServiceHealth;
  };
  performance: {
    response_time: number;
    error_rate: number;
    throughput: number;
  };
  alerts: Alert[];
}

// Business Metrics Dashboard
interface BusinessMetrics {
  users: {
    active_today: number;
    new_signups: number;
    total_users: number;
  };
  api_usage: {
    requests_today: number;
    ai_queries: number;
    file_uploads: number;
  };
  prescriptions: {
    processed_today: number;
    ocr_success_rate: number;
    ai_analysis_count: number;
  };
}
```

### **Dashboard Access**
```bash
# Main admin dashboard
https://your-app.railway.app/admin/service-status

# Platform admin system health
https://your-app.railway.app/platform-admin/system-health

# Business analytics
https://your-app.railway.app/admin/analytics

# AI service monitoring
https://your-app.railway.app/admin/ai-models
```

---

## **🔍 LOGGING CONFIGURATION**

### **Structured Logging Format**
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "category": "api",
  "message": "Request processed successfully",
  "context": {
    "requestId": "req_abc123",
    "tenantId": "company_456",
    "userId": "user_789",
    "method": "GET",
    "url": "/api/patients",
    "statusCode": 200,
    "duration": 150,
    "userAgent": "Mozilla/5.0...",
    "ip": "192.168.1.100"
  }
}
```

### **Log Categories**
```javascript
// Authentication logs
logger.info("User login successful", {
  category: "auth",
  tenantId: "company_123",
  userId: "user_456",
  method: "email",
  ip: "192.168.1.100"
});

// API request logs
logger.info("API request processed", {
  category: "api",
  method: "POST",
  url: "/api/prescriptions",
  statusCode: 201,
  duration: 250,
  tenantId: "company_123"
});

// Database query logs
logger.debug("Database query executed", {
  category: "database",
  query: "SELECT * FROM patients WHERE tenant_id = ?",
  duration: 45,
  rowCount: 25
});

// AI service logs
logger.info("AI query processed", {
  category: "ai",
  model: "gpt-4",
  tokens: 150,
  cost: 0.009,
  duration: 1200,
  tenantId: "company_123"
});
```

---

## **🚨 ALERTING CONFIGURATION**

### **Alert Rules**
```yaml
# Critical alerts (immediate notification)
critical_alerts:
  - name: "Service Downtime"
    condition: "health_check_status != 'healthy'"
    duration: "5m"
    channels: ["slack", "email", "sms"]
    
  - name: "High Error Rate"
    condition: "error_rate > 0.10"
    duration: "2m"
    channels: ["slack", "email"]
    
  - name: "Memory Exhaustion"
    condition: "memory_usage > 0.90"
    duration: "1m"
    channels: ["slack", "email", "sms"]

# Warning alerts (hourly notification)
warning_alerts:
  - name: "Elevated Error Rate"
    condition: "error_rate > 0.05"
    duration: "10m"
    channels: ["slack"]
    
  - name: "Slow Response Times"
    condition: "avg_response_time > 2000ms"
    duration: "15m"
    channels: ["slack"]
    
  - name: "High Memory Usage"
    condition: "memory_usage > 0.80"
    duration: "30m"
    channels: ["email"]

# Info alerts (daily digest)
info_alerts:
  - name: "Performance Summary"
    condition: "daily_performance_report"
    schedule: "0 9 * * *"
    channels: ["email"]
```

### **Alert Integration**
```javascript
// Slack webhook integration
const slackWebhook = process.env.SLACK_WEBHOOK_URL;

async function sendAlert(alert) {
  const message = {
    text: `🚨 ${alert.severity.toUpperCase()}: ${alert.title}`,
    attachments: [{
      color: alert.severity === 'critical' ? 'danger' : 'warning',
      fields: [
        { title: "Service", value: alert.service, short: true },
        { title: "Threshold", value: alert.threshold, short: true },
        { title: "Current Value", value: alert.currentValue, short: true },
        { title: "Duration", value: alert.duration, short: true }
      ],
      actions: [{
        type: "button",
        text: "View Dashboard",
        url: `${process.env.APP_URL}/admin/service-status`
      }]
    }]
  };
  
  await fetch(slackWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });
}
```

---

## **🧪 TESTING & VALIDATION**

### **Health Check Testing**
```bash
# Test basic health
curl -w "\nResponse Time: %{time_total}s\n" \
  https://your-app.railway.app/health

# Test detailed health
curl https://your-app.railway.app/api/health | jq

# Test service verification
curl https://your-app.railway.app/api/verification/status | jq

# Load test health endpoint
for i in {1..50}; do
  curl -s https://your-app.railway.app/health > /dev/null &
done
wait
```

### **Metrics Testing**
```bash
# Test metrics collection
curl https://your-app.railway.app/api/metrics | jq

# Test database monitoring
curl https://your-app.railway.app/api/monitoring/database | jq

# Test Redis monitoring
curl https://your-app.railway.app/api/monitoring/redis | jq

# Performance test
time curl -X POST https://your-app.railway.app/api/test/performance \
  -H "Content-Type: application/json" \
  -d '{"duration": 60, "load": 10}'
```

### **Logging Testing**
```bash
# Generate test logs
curl -X POST https://your-app.railway.app/api/test/logging \
  -H "Content-Type: application/json" \
  -d '{"events": 100, "levels": ["info", "warn", "error"]}'

# Test error logging
curl -X POST https://your-app.railway.app/api/test/error \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "severity": "error"}'

# View logs in Railway
railway logs --follow
```

---

## **🔗 EXTERNAL MONITORING INTEGRATION**

### **Grafana Cloud Setup**
```bash
# 1. Create Grafana Cloud account
# 2. Create new stack
# 3. Get API keys and endpoints
# 4. Configure environment variables

GRAFANA_CLOUD_URL=https://your-stack.grafana.net
GRAFANA_API_KEY=glc_your_api_key
GRAFANA_METRICS_ENDPOINT=/api/prom/push
```

### **Sentry Error Tracking**
```bash
# 1. Create Sentry project
# 2. Install Sentry SDK
# 3. Configure DSN and options

SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_SAMPLE_RATE=0.1
```

### **Datadog APM**
```bash
# 1. Create Datadog account
# 2. Install Datadog agent
# 3. Configure API keys

DATADOG_API_KEY=your-api-key
DATADOG_APP_KEY=your-app-key
DATADOG_SITE=datadoghq.com
```

---

## **📊 RAILWAY BUILT-IN MONITORING**

### **Railway Metrics Dashboard**
- **Application Metrics**: Response times, error rates, throughput
- **Resource Usage**: CPU, memory, disk, network
- **Deployment Metrics**: Build times, deployment frequency
- **Log Streaming**: Real-time log viewing and filtering
- **Health Checks**: Service status and uptime

### **Accessing Railway Monitoring**
```bash
# Railway dashboard
https://railway.app/project/your-project

# Metrics tab
Service → Metrics

# Logs tab
Service → Logs

# Settings for alerts
Service → Settings → Alerts
```

---

## **🎯 SUCCESS CRITERIA**

Your monitoring setup is successful when:

✅ **Health Checks**: All endpoints return 200 OK  
✅ **Metrics Collection**: Performance data being gathered  
✅ **Dashboard Access**: Admin panels display real-time data  
✅ **Logging**: Structured logs generated and searchable  
✅ **Alerting**: Threshold-based notifications working  
✅ **Performance**: Monitoring doesn't impact app performance  
✅ **Coverage**: All critical services monitored  

---

## **🚀 NEXT STEPS**

1. **Configure Variables**: Add monitoring environment variables to Railway
2. **Test Endpoints**: Run `./scripts/test-monitoring.sh`
3. **Access Dashboards**: Visit admin monitoring panels
4. **Set Alert Thresholds**: Configure appropriate alert levels
5. **Monitor Performance**: Track metrics and optimize as needed
6. **Optional Integration**: Add external monitoring services

---

## **📞 SUPPORT**

- **Railway Monitoring**: [docs.railway.app/monitoring](https://docs.railway.app/monitoring)
- **Grafana Cloud**: [grafana.com/products/cloud](https://grafana.com/products/cloud)
- **Sentry**: [sentry.io](https://sentry.io)
- **Datadog**: [datadoghq.com](https://datadoghq.com)
- **ILS Documentation**: `./docs/`

---

**📊 Your comprehensive monitoring system provides real-time visibility into platform health and performance!**
