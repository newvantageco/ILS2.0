# Database Backup and Restore Scripts

## Overview

This directory contains scripts for backing up and restoring the PostgreSQL database for ILS 2.0.

## Features

- ✅ Automated timestamped backups
- ✅ Compression (gzip)
- ✅ Retention policy
- ✅ S3 upload support (optional)
- ✅ Backup verification
- ✅ Safety pre-restore backups
- ✅ Interactive restore with backup selection
- ✅ Error handling and logging

## Prerequisites

- PostgreSQL client tools (`pg_dump`, `psql`)
- `gzip` for compression
- AWS CLI (optional, for S3 backups)

## Backup Script

### Usage

```bash
# Basic backup
./backup-database.sh

# With environment variables
BACKUP_DIR=/custom/backup/path \
RETENTION_DAYS=14 \
DB_HOST=localhost \
DB_NAME=ils_db \
DB_USER=ils_user \
PGPASSWORD=your_password \
./backup-database.sh

# With S3 upload
S3_BUCKET=my-backup-bucket \
S3_PATH=backups/ils \
./backup-database.sh
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKUP_DIR` | `/var/backups/postgresql` | Backup storage directory |
| `RETENTION_DAYS` | `7` | Days to keep backups |
| `DB_HOST` | `localhost` | Database host |
| `DB_PORT` | `5432` | Database port |
| `DB_NAME` | `ils_db` | Database name |
| `DB_USER` | `ils_user` | Database user |
| `PGPASSWORD` | - | Database password |
| `S3_BUCKET` | - | S3 bucket name (optional) |
| `S3_PATH` | `backups/postgresql` | S3 path prefix |

### Automated Backups with Cron

Daily backup at 2 AM:
```bash
0 2 * * * /path/to/backup-database.sh >> /var/log/db-backup.log 2>&1
```

Hourly backups:
```bash
0 * * * * /path/to/backup-database.sh >> /var/log/db-backup.log 2>&1
```

### Kubernetes CronJob

Create a CronJob for automated backups:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: ils-production
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: postgres:16-alpine
              command:
                - /bin/sh
                - -c
                - |
                  pg_dump -h postgres-service -U ils_user -d ils_db | \
                  gzip > /backup/ils_db_$(date +%Y%m%d_%H%M%S).sql.gz
              env:
                - name: PGPASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: ils-secrets
                      key: POSTGRES_PASSWORD
              volumeMounts:
                - name: backup-storage
                  mountPath: /backup
          restartPolicy: OnFailure
          volumes:
            - name: backup-storage
              persistentVolumeClaim:
                claimName: backup-pvc
```

## Restore Script

### Usage

```bash
# Interactive restore
./restore-database.sh

# With environment variables
DB_HOST=localhost \
DB_NAME=ils_db \
DB_USER=ils_user \
PGPASSWORD=your_password \
BACKUP_DIR=/path/to/backups \
./restore-database.sh
```

### Restore Process

1. Lists available backups (local and S3)
2. Allows interactive selection
3. Verifies backup integrity
4. Creates a safety backup of current database
5. Drops and recreates database
6. Restores from selected backup
7. Verifies restore success

### Safety Features

- **Confirmation prompts**: Multiple confirmations required
- **Pre-restore backup**: Automatic backup before restore
- **Integrity verification**: Checks backup file before and after restore
- **Connection termination**: Safely closes existing connections

## Docker/Docker Compose Backups

### Using Docker

```bash
# Backup
docker exec ils-postgres pg_dump -U ils_user ils_db | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore
gunzip < backup_20241108.sql.gz | docker exec -i ils-postgres psql -U ils_user -d ils_db
```

### Using Docker Compose

```bash
# Backup
docker-compose exec -T postgres pg_dump -U ils_user ils_db | gzip > backup.sql.gz

# Restore
gunzip < backup.sql.gz | docker-compose exec -T postgres psql -U ils_user -d ils_db
```

## S3 Backup Configuration

### AWS CLI Setup

```bash
# Configure AWS credentials
aws configure

# Test S3 access
aws s3 ls s3://your-backup-bucket/
```

### IAM Policy

Required IAM permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::your-backup-bucket",
        "arn:aws:s3:::your-backup-bucket/*"
      ]
    }
  ]
}
```

## Backup Strategy Recommendations

### Development
- **Frequency**: Daily
- **Retention**: 7 days
- **Storage**: Local filesystem

### Staging
- **Frequency**: Twice daily
- **Retention**: 14 days
- **Storage**: Local + S3

### Production
- **Frequency**: Every 6 hours
- **Retention**: 30 days (local), 90 days (S3)
- **Storage**: Local + S3 with versioning
- **Additional**: Point-in-time recovery enabled

## Monitoring

### Check Backup Success

```bash
# View backup log
tail -f /var/backups/postgresql/backup.log

# List recent backups
ls -lht /var/backups/postgresql/*.sql.gz | head -10

# Check backup size
du -sh /var/backups/postgresql/
```

### Alerts

Set up alerts for:
- Backup failures
- Backup size anomalies
- Missing backups
- S3 upload failures

## Troubleshooting

### Permission Issues

```bash
# Fix backup directory permissions
sudo chown -R postgres:postgres /var/backups/postgresql
sudo chmod 750 /var/backups/postgresql
```

### Connection Refused

```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Test connection
psql -h localhost -U ils_user -d ils_db -c "\l"
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean old backups manually
find /var/backups/postgresql -name "*.sql.gz" -mtime +30 -delete
```

## Best Practices

1. **Test Restores Regularly**: Verify backups work by testing restores
2. **Monitor Backup Size**: Track backup growth over time
3. **Encrypt Backups**: Use encryption for sensitive data
4. **Multiple Storage Locations**: Store backups in different locations
5. **Document Procedures**: Keep restore procedures documented
6. **Automate Verification**: Automatically verify backup integrity
7. **Retention Policy**: Balance storage costs with recovery needs

## Security Considerations

- Store database passwords securely (use environment variables or secrets management)
- Encrypt backups at rest and in transit
- Restrict access to backup files
- Use IAM roles instead of AWS access keys when possible
- Audit backup access logs
- Implement backup file integrity checks

## Recovery Time Objectives (RTO)

| Database Size | Estimated Restore Time |
|--------------|----------------------|
| < 1 GB | 2-5 minutes |
| 1-10 GB | 5-15 minutes |
| 10-50 GB | 15-45 minutes |
| > 50 GB | 1+ hours |

*Times vary based on hardware and network speed*
