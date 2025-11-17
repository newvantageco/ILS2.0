# ILS 2.0 Automated Backup System Guide

## 🛡️ Overview

The ILS 2.0 platform includes a comprehensive automated backup system designed to protect critical data and ensure business continuity. This system provides enterprise-grade backup capabilities with multiple storage destinations, automated scheduling, and disaster recovery features.

## 📋 Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [Backup Components](#backup-components)
5. [Storage Options](#storage-options)
6. [Scheduling & Automation](#scheduling--automation)
7. [Restore Procedures](#restore-procedures)
8. [Monitoring & Alerting](#monitoring--alerting)
9. [Security](#security)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)
12. [Best Practices](#best-practices)

---

## ✨ Features

### 🔄 Automated Backups
- **Daily scheduled backups** at 2:00 AM UTC
- **Manual backup triggers** via API or web interface
- **Incremental backup options** for large datasets
- **Backup verification** with checksum integrity checks

### 💾 Multi-Component Support
- **PostgreSQL database** with custom format dumps
- **Application files** (uploads, public assets, logs)
- **Redis data** for session and cache storage
- **Configuration files** and environment settings

### 🌐 Multiple Storage Destinations
- **Local storage** with configurable retention policies
- **AWS S3** with server-side encryption
- **AWS Glacier** for long-term archival
- **Multi-region replication** support

### 🔒 Security & Compliance
- **AES-256 encryption** for data at rest
- **SSL/TLS encryption** for data in transit
- **Access controls** with role-based permissions
- **Audit logging** for all backup operations

### 📊 Monitoring & Analytics
- **Real-time backup metrics** and dashboards
- **Success/failure notifications** via Slack/email
- **Storage usage tracking** and capacity planning
- **Performance monitoring** and optimization

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Backup API    │    │  Backup Service  │    │  Storage Layer  │
│                 │    │                  │    │                 │
│ • Manual Triggers│───▶│ • PostgreSQL     │───▶│ • Local Files   │
│ • Status Monitor │    │ • Files Backup   │    │ • AWS S3        │
│ • Restore UI     │    │ • Redis Backup   │    │ • AWS Glacier   │
│ • Configuration  │    │ • Verification   │    │ • Encryption     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Interface │    │  Scheduler       │    │  Notifications  │
│                 │    │                  │    │                 │
│ • Dashboard     │    │ • Cron Jobs      │    │ • Slack Webhook │
│ • History View  │    │ • Interval Mgmt  │    │ • Email Alerts  │
│ • Restore Tools │    │ • Retry Logic    │    │ • Status Updates│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ils2
DB_USER=postgres
DB_PASSWORD=your-secure-password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Backup Storage Configuration
BACKUP_LOCAL_PATH=./backups
BACKUP_S3_BUCKET=ils2-backups
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_GLACIER_VAULT=ils2-archives

# Notification Configuration
SLACK_BACKUP_WEBHOOK=https://hooks.slack.com/services/...
BACKUP_NOTIFICATION_EMAIL=admin@yourcompany.com

# Backup Retention Policies
DATABASE_RETENTION_DAYS=30
FILES_RETENTION_DAYS=90
REDIS_RETENTION_DAYS=7

# Backup Settings
BACKUP_ENABLED=true
BACKUP_SCHEDULE=daily
BACKUP_TIME=02:00
VERIFY_BACKUPS=true
CLEANUP_OLD_BACKUPS=true
```

### Backup Configuration File

Create `config/backup.json`:

```json
{
  "database": {
    "enabled": true,
    "host": "${DB_HOST}",
    "port": "${DB_PORT}",
    "database": "${DB_NAME}",
    "username": "${DB_USER}",
    "password": "${DB_PASSWORD}",
    "retentionDays": 30,
    "compression": "gzip",
    "format": "custom"
  },
  "files": {
    "enabled": true,
    "sourcePaths": [
      "./uploads",
      "./public",
      "./logs",
      "./config"
    ],
    "excludePatterns": [
      "*.tmp",
      "*.log.old",
      "node_modules/**"
    ],
    "retentionDays": 90,
    "compression": "gzip"
  },
  "redis": {
    "enabled": true,
    "host": "${REDIS_HOST}",
    "port": "${REDIS_PORT}",
    "password": "${REDIS_PASSWORD}",
    "retentionDays": 7,
    "compression": "gzip"
  },
  "storage": {
    "localPath": "${BACKUP_LOCAL_PATH}",
    "s3Bucket": "${BACKUP_S3_BUCKET}",
    "s3Region": "${AWS_REGION}",
    "glacierVault": "${AWS_GLACIER_VAULT}",
    "encryption": "AES256"
  },
  "notifications": {
    "slackWebhook": "${SLACK_BACKUP_WEBHOOK}",
    "email": "${BACKUP_NOTIFICATION_EMAIL}",
    "onSuccess": true,
    "onFailure": true,
    "onWarning": true
  },
  "scheduling": {
    "enabled": true,
    "frequency": "daily",
    "time": "02:00",
    "timezone": "UTC",
    "retryAttempts": 3,
    "retryDelay": 300
  }
}
```

---

## 📦 Backup Components

### 1. Database Backups

**What's backed up:**
- All PostgreSQL tables and data
- Indexes, constraints, and sequences
- Stored procedures and functions
- User-defined types and extensions

**Backup format:**
- Custom PostgreSQL format (`--format=custom`)
- Compressed with gzip
- Includes `--clean` and `--no-owner` options
- Compatible with `pg_restore`

**Example backup file:**
```
./backups/database/backup_20231215_020000_abc123.sql.gz
```

### 2. Files Backups

**What's backed up:**
- User uploads and prescription images
- Public assets and static files
- Application logs and error files
- Configuration files and certificates

**Backup format:**
- Tar archive with gzip compression
- Preserves file permissions and timestamps
- Excludes temporary and cache files
- Incremental backup support

**Example backup file:**
```
./backups/files/backup_20231215_020000_abc123.tar.gz
```

### 3. Redis Backups

**What's backed up:**
- Session data and user tokens
- Cache data and temporary storage
- Rate limiting information
- Background job queues

**Backup format:**
- Redis RDB snapshot format
- Compressed with gzip
- Point-in-time consistency
- Fast restore capability

**Example backup file:**
```
./backups/redis/backup_20231215_020000_abc123.rdb.gz
```

---

## 🗄️ Storage Options

### Local Storage

**Configuration:**
```bash
BACKUP_LOCAL_PATH=/var/backups/ils2
```

**Advantages:**
- Fast backup and restore speeds
- No additional costs
- Full control over data
- Simple setup and maintenance

**Use Cases:**
- Development and testing environments
- Small deployments with limited data
- Quick recovery scenarios

### AWS S3 Storage

**Configuration:**
```bash
BACKUP_S3_BUCKET=ils2-backups
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

**Features:**
- Server-side encryption (AES-256)
- Versioning and lifecycle policies
- Cross-region replication
- Cost-effective storage classes

**Storage Classes:**
- **Standard:** Frequent access
- **Standard-IA:** Infrequent access
- **Glacier:** Long-term archival
- **Deep Archive:** Rare access

### AWS Glacier Storage

**Configuration:**
```bash
AWS_GLACIER_VAULT=ils2-archives
```

**Features:**
- Extremely low-cost storage
- Data durability (99.999999999%)
- Compliance and archival
- Retrieval options (Expedited/Standard/Bulk)

**Use Cases:**
- Long-term compliance requirements
- Historical data preservation
- Disaster recovery archives

---

## ⏰ Scheduling & Automation

### Cron Job Configuration

Add to crontab (`crontab -e`):

```bash
# Daily backup at 2:00 AM
0 2 * * * /path/to/ils2/scripts/backup/automated-backup.sh

# Weekly verification on Sundays at 3:00 AM
0 3 * * 0 /path/to/ils2/scripts/backup/test-backup-system.sh

# Monthly cleanup on the 1st at 4:00 AM
0 4 1 * * /path/to/ils2/scripts/backup/cleanup-old-backups.sh
```

### Node.js Scheduler

Built-in scheduler in BackupService:

```typescript
// Schedule daily backups
backupService.scheduleAutomatedBackups();

// Custom scheduling
const schedule = require('node-schedule');
schedule.scheduleJob('0 2 * * *', async () => {
  await backupService.performFullBackup();
});
```

### Kubernetes CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: ils2-backup
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: ils2:latest
            command: ["/scripts/backup/automated-backup.sh"]
            env:
            - name: BACKUP_ENABLED
              value: "true"
          restartPolicy: OnFailure
```

---

## 🔄 Restore Procedures

### Manual Restore via Script

```bash
# List available backups
./scripts/backup/restore-backup.sh list

# Restore database
./scripts/backup/restore-backup.sh database backup_20231215_020000.sql.gz

# Restore files
./scripts/backup/restore-backup.sh files backup_20231215_020000.tar.gz

# Restore Redis
./scripts/backup/restore-backup.sh redis backup_20231215_020000.rdb.gz

# Full system restore
./scripts/backup/restore-backup.sh full backup_20231215_020000
```

### API-Based Restore

```bash
# Trigger database restore
curl -X POST https://your-ils2-app.com/api/backup/restore \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "backupFile": "/backups/database/backup_20231215_020000.sql.gz",
    "component": "database"
  }'

# Monitor restore status
curl https://your-ils2-app.com/api/backup/history \
  -H "Authorization: Bearer your-token"
```

### Disaster Recovery Steps

1. **Assess the situation**
   ```bash
   # Check system status
   ./scripts/backup/test-backup-system.sh
   ```

2. **Prepare restore environment**
   ```bash
   # Stop application services
   sudo systemctl stop ils2
   
   # Clear existing data (if necessary)
   sudo -u postgres dropdb ils2
   sudo -u postgres createdb ils2
   ```

3. **Perform restore**
   ```bash
   # Restore from latest backup
   ./scripts/backup/restore-backup.sh full backup_latest
   ```

4. **Verify and restart**
   ```bash
   # Verify data integrity
   ./scripts/backup/test-backup-system.sh
   
   # Restart services
   sudo systemctl start ils2
   ```

---

## 📊 Monitoring & Alerting

### Metrics Dashboard

Key metrics to monitor:

- **Backup Success Rate**: Percentage of successful backups
- **Backup Duration**: Time taken for each backup component
- **Storage Usage**: Local and cloud storage consumption
- **Restore Performance**: Time taken for restore operations
- **Error Rate**: Frequency of backup failures

### Slack Integration

Configure Slack webhook for notifications:

```bash
# Set webhook URL
export SLACK_BACKUP_WEBHOOK=https://hooks.slack.com/services/...

# Test notification
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🧪 Backup system test notification"}' \
  $SLACK_BACKUP_WEBHOOK
```

### Email Notifications

Configure SMTP for email alerts:

```bash
# Email settings
BACKUP_NOTIFICATION_EMAIL=admin@yourcompany.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Prometheus Metrics

Built-in metrics for monitoring:

```typescript
// Custom metrics
const backupDuration = new prometheus.Histogram({
  name: 'backup_duration_seconds',
  help: 'Duration of backup operations',
  labelNames: ['component', 'status']
});

const backupSize = new prometheus.Gauge({
  name: 'backup_size_bytes',
  help: 'Size of backup files',
  labelNames: ['component', 'storage']
});
```

---

## 🔒 Security

### Encryption

**Data at Rest:**
- AES-256 encryption for S3 storage
- Optional GPG encryption for local files
- Encrypted Redis snapshots

**Data in Transit:**
- SSL/TLS for all API communications
- SSH for remote file transfers
- Encrypted database connections

### Access Control

**Role-Based Permissions:**
```typescript
// Only admins can trigger backups
requireRole(['admin', 'platform_admin'])

// Read-only access for monitoring
requireRole(['admin', 'monitoring'])
```

**API Authentication:**
```bash
# JWT token required
curl -H "Authorization: Bearer your-jwt-token" \
  https://your-app.com/api/backup/full
```

### Audit Logging

All backup operations are logged:

```typescript
logger.info({
  action: 'backup_started',
  userId: req.user?.id,
  backupId: 'backup_20231215_020000',
  components: ['database', 'files', 'redis']
});
```

---

## 🧪 Testing

### Automated Testing

Run comprehensive backup tests:

```bash
# Execute full test suite
./scripts/backup/test-backup-system.sh

# Test specific components
./scripts/backup/test-backup-system.sh database
./scripts/backup/test-backup-system.sh files
./scripts/backup/test-backup-system.sh redis
```

### Test Coverage

The test suite covers:
- ✅ Backup creation and integrity
- ✅ File restoration and verification
- ✅ Database restore and data validation
- ✅ Redis backup and recovery
- ✅ S3 integration and connectivity
- ✅ Retention policy enforcement
- ✅ Notification system functionality
- ✅ Error handling and recovery

### Manual Testing

Test backup manually:

```bash
# Create test backup
./scripts/backup/automated-backup.sh

# Verify backup integrity
./scripts/backup/restore-backup.sh verify backup_file.sql.gz

# Test restore process
./scripts/backup/restore-backup.sh database backup_file.sql.gz
```

---

## 🔧 Troubleshooting

### Common Issues

#### Backup Fails with Permission Error

**Problem:** Backup script can't write to backup directory

**Solution:**
```bash
# Check directory permissions
ls -la ./backups/

# Fix permissions
sudo chown -R $USER:$USER ./backups/
chmod 755 ./backups/
```

#### Database Backup Fails

**Problem:** PostgreSQL connection refused

**Solution:**
```bash
# Check database status
sudo systemctl status postgresql

# Verify connection
psql -h localhost -U postgres -d ils2 -c "SELECT 1;"

# Check credentials
echo $DB_PASSWORD
```

#### S3 Upload Fails

**Problem:** AWS credentials invalid or permissions missing

**Solution:**
```bash
# Test AWS credentials
aws s3 ls

# Check bucket permissions
aws s3 ls s3://your-backup-bucket

# Verify IAM permissions
aws iam get-user
```

#### Redis Backup Fails

**Problem:** Redis server not responding

**Solution:**
```bash
# Check Redis status
redis-cli ping

# Verify configuration
redis-cli config get save
redis-cli config get dir
```

### Debug Mode

Enable debug logging:

```bash
# Set debug level
export LOG_LEVEL=debug

# Run backup with verbose output
./scripts/backup/automated-backup.sh -v
```

### Log Analysis

Check backup logs:

```bash
# View recent backup logs
tail -f ./backups/logs/backup_*.log

# Search for errors
grep -i error ./backups/logs/backup_*.log

# Monitor backup performance
grep -i duration ./backups/logs/backup_*.log
```

---

## 📈 Best Practices

### 1. Backup Strategy

**3-2-1 Rule:**
- **3** copies of your data
- **2** different storage types
- **1** off-site backup

**Implementation:**
- Primary database (live)
- Local backup copy (fast recovery)
- Cloud backup copy (disaster recovery)

### 2. Retention Policies

**Recommended retention:**
- **Daily backups:** 30 days
- **Weekly backups:** 12 weeks
- **Monthly backups:** 12 months
- **Yearly backups:** 7 years

**Configuration:**
```json
{
  "retention": {
    "daily": 30,
    "weekly": 12,
    "monthly": 12,
    "yearly": 7
  }
}
```

### 3. Testing Schedule

**Regular testing:**
- **Weekly:** Automated backup verification
- **Monthly:** Restore testing on staging
- **Quarterly:** Full disaster recovery drill
- **Annually:** Complete system validation

### 4. Monitoring

**Key alerts:**
- Backup failure notifications
- Storage capacity warnings (80% threshold)
- Restore performance degradation
- Security access anomalies

### 5. Documentation

**Maintain records:**
- Backup procedures and runbooks
- Restore test results
- Configuration changes
- Incident reports and lessons learned

---

## 🚀 Quick Start

### 1. Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/ils2.git
cd ils2

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Create backup directory
mkdir -p ./backups/{database,files,redis,logs}
```

### 2. Test Backup System

```bash
# Make scripts executable
chmod +x scripts/backup/*.sh

# Run comprehensive tests
./scripts/backup/test-backup-system.sh
```

### 3. Configure Automation

```bash
# Add cron job
crontab -e
# Add: 0 2 * * * /path/to/ils2/scripts/backup/automated-backup.sh

# Enable notifications
export SLACK_BACKUP_WEBHOOK=https://hooks.slack.com/services/...
```

### 4. Monitor First Backup

```bash
# Trigger manual backup
./scripts/backup/automated-backup.sh

# Check results
./scripts/backup/restore-backup.sh list

# Verify integrity
./scripts/backup/test-backup-system.sh
```

---

## 📞 Support

### Emergency Contacts

- **Primary Support:** support@yourcompany.com
- **On-Call Engineer:** +1-555-0123
- **Slack Channel:** #ils2-backups

### Documentation

- **API Reference:** `/api/backup/documentation`
- **Troubleshooting Guide:** `/docs/troubleshooting.md`
- **Configuration Guide:** `/docs/configuration.md`

### Training Resources

- **Backup Administration Course:** Internal training portal
- **Disaster Recovery Workshop:** Quarterly sessions
- **Video Tutorials:** Company YouTube channel

---

## 📄 License

This backup system is part of the ILS 2.0 platform and is subject to the same license terms and conditions.

---

**Last Updated:** December 15, 2023
**Version:** 2.0.0
**Maintainer:** ILS 2.0 Development Team
