#!/bin/bash

# ILS 2.0 Automated Backup Script
# This script performs comprehensive system backups including:
# - PostgreSQL database
# - Application files
# - Redis data
# - Uploads to S3 and local storage

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_ID="backup_${TIMESTAMP}"
LOG_FILE="${BACKUP_DIR}/logs/backup_${TIMESTAMP}.log"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}/logs"
mkdir -p "${BACKUP_DIR}/database"
mkdir -p "${BACKUP_DIR}/files"
mkdir -p "${BACKUP_DIR}/redis"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    # Send notification
    if [ -n "${SLACK_BACKUP_WEBHOOK:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 ILS 2.0 Backup Failed: $1\"}" \
            "${SLACK_BACKUP_WEBHOOK}"
    fi
    exit 1
}

# Success notification
notify_success() {
    local total_size=$1
    local backup_count=$2
    log "SUCCESS: Backup completed successfully"
    
    if [ -n "${SLACK_BACKUP_WEBHOOK:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"✅ ILS 2.0 Backup Completed\\nSize: $(numfmt --to=iec $total_size)\\nFiles: $backup_count\"}" \
            "${SLACK_BACKUP_WEBHOOK}"
    fi
}

# Database backup function
backup_database() {
    log "Starting database backup..."
    
    local db_file="${BACKUP_DIR}/database/${BACKUP_ID}.sql.gz"
    local db_host="${DB_HOST:-localhost}"
    local db_port="${DB_PORT:-5432}"
    local db_name="${DB_NAME:-ils2}"
    local db_user="${DB_USER:-postgres}"
    
    # Create database backup
    if ! PGPASSWORD="${DB_PASSWORD}" pg_dump \
        -h "$db_host" \
        -p "$db_port" \
        -U "$db_user" \
        -d "$db_name" \
        --verbose \
        --clean \
        --no-owner \
        --no-privileges \
        --format=custom | gzip > "$db_file"; then
        error_exit "Database backup failed"
    fi
    
    local db_size=$(stat -f%z "$db_file" 2>/dev/null || stat -c%s "$db_file")
    log "Database backup completed: $(numfmt --to=iec $db_size)"
    
    # Upload to S3 if configured
    if [ -n "${BACKUP_S3_BUCKET:-}" ] && [ -n "${AWS_ACCESS_KEY_ID:-}" ]; then
        log "Uploading database backup to S3..."
        if ! aws s3 cp "$db_file" "s3://${BACKUP_S3_BUCKET}/database/${BACKUP_ID}.sql.gz" \
            --storage-class STANDARD_IA \
            --server-side-encryption AES256; then
            log "WARNING: S3 upload failed for database"
        else
            log "Database backup uploaded to S3"
        fi
    fi
    
    echo "$db_size"
}

# Files backup function
backup_files() {
    log "Starting files backup..."
    
    local files_file="${BACKUP_DIR}/files/${BACKUP_ID}.tar.gz"
    local source_paths="${BACKUP_SOURCE_PATHS:-./uploads ./public ./logs}"
    
    # Create files backup
    if ! tar -czf "$files_file" $source_paths 2>/dev/null; then
        error_exit "Files backup failed"
    fi
    
    local files_size=$(stat -f%z "$files_file" 2>/dev/null || stat -c%s "$files_file")
    log "Files backup completed: $(numfmt --to=iec $files_size)"
    
    # Upload to S3 if configured
    if [ -n "${BACKUP_S3_BUCKET:-}" ] && [ -n "${AWS_ACCESS_KEY_ID:-}" ]; then
        log "Uploading files backup to S3..."
        if ! aws s3 cp "$files_file" "s3://${BACKUP_S3_BUCKET}/files/${BACKUP_ID}.tar.gz" \
            --storage-class STANDARD_IA \
            --server-side-encryption AES256; then
            log "WARNING: S3 upload failed for files"
        else
            log "Files backup uploaded to S3"
        fi
    fi
    
    echo "$files_size"
}

# Redis backup function
backup_redis() {
    log "Starting Redis backup..."
    
    local redis_file="${BACKUP_DIR}/redis/${BACKUP_ID}.rdb.gz"
    local redis_host="${REDIS_HOST:-localhost}"
    local redis_port="${REDIS_PORT:-6379}"
    local redis_auth=""
    
    if [ -n "${REDIS_PASSWORD:-}" ]; then
        redis_auth="-a ${REDIS_PASSWORD}"
    fi
    
    # Create Redis backup
    local temp_file="/tmp/redis_backup_${BACKUP_ID}.rdb"
    if ! redis-cli -h "$redis_host" -p "$redis_port" $redis_auth --rdb "$temp_file"; then
        error_exit "Redis backup failed"
    fi
    
    # Compress the backup
    if ! gzip "$temp_file"; then
        error_exit "Redis backup compression failed"
    fi
    
    mv "${temp_file}.gz" "$redis_file"
    
    local redis_size=$(stat -f%z "$redis_file" 2>/dev/null || stat -c%s "$redis_file")
    log "Redis backup completed: $(numfmt --to=iec $redis_size)"
    
    # Upload to S3 if configured
    if [ -n "${BACKUP_S3_BUCKET:-}" ] && [ -n "${AWS_ACCESS_KEY_ID:-}" ]; then
        log "Uploading Redis backup to S3..."
        if ! aws s3 cp "$redis_file" "s3://${BACKUP_S3_BUCKET}/redis/${BACKUP_ID}.rdb.gz" \
            --storage-class STANDARD_IA \
            --server-side-encryption AES256; then
            log "WARNING: S3 upload failed for Redis"
        else
            log "Redis backup uploaded to S3"
        fi
    fi
    
    echo "$redis_size"
}

# Cleanup old backups function
cleanup_old_backups() {
    log "Starting cleanup of old backups..."
    
    # Database retention (30 days)
    find "${BACKUP_DIR}/database" -name "*.sql.gz" -mtime +30 -delete 2>/dev/null || true
    
    # Files retention (90 days)
    find "${BACKUP_DIR}/files" -name "*.tar.gz" -mtime +90 -delete 2>/dev/null || true
    
    # Redis retention (7 days)
    find "${BACKUP_DIR}/redis" -name "*.rdb.gz" -mtime +7 -delete 2>/dev/null || true
    
    # Logs retention (30 days)
    find "${BACKUP_DIR}/logs" -name "*.log" -mtime +30 -delete 2>/dev/null || true
    
    # Cleanup S3 if configured
    if [ -n "${BACKUP_S3_BUCKET:-}" ] && [ -n "${AWS_ACCESS_KEY_ID:-}" ]; then
        log "Cleaning up old S3 backups..."
        
        # Database cleanup
        aws s3 ls "s3://${BACKUP_S3_BUCKET}/database/" | \
            while read -r line; do
                createDate=$(echo "$line" | awk '{print $1" "$2}')
                createDate=$(date -d "$createDate" +%s)
                olderThan=$(date -d "30 days ago" +%s)
                if [[ $createDate -lt $olderThan ]]; then
                    fileName=$(echo "$line" | awk '{print $4}')
                    if [[ $fileName != "" ]]; then
                        aws s3 rm "s3://${BACKUP_S3_BUCKET}/database/$fileName" || true
                    fi
                fi
            done
        
        # Files cleanup
        aws s3 ls "s3://${BACKUP_S3_BUCKET}/files/" | \
            while read -r line; do
                createDate=$(echo "$line" | awk '{print $1" "$2}')
                createDate=$(date -d "$createDate" +%s)
                olderThan=$(date -d "90 days ago" +%s)
                if [[ $createDate -lt $olderThan ]]; then
                    fileName=$(echo "$line" | awk '{print $4}')
                    if [[ $fileName != "" ]]; then
                        aws s3 rm "s3://${BACKUP_S3_BUCKET}/files/$fileName" || true
                    fi
                fi
            done
        
        # Redis cleanup
        aws s3 ls "s3://${BACKUP_S3_BUCKET}/redis/" | \
            while read -r line; do
                createDate=$(echo "$line" | awk '{print $1" "$2}')
                createDate=$(date -d "$createDate" +%s)
                olderThan=$(date -d "7 days ago" +%s)
                if [[ $createDate -lt $olderThan ]]; then
                    fileName=$(echo "$line" | awk '{print $4}')
                    if [[ $fileName != "" ]]; then
                        aws s3 rm "s3://${BACKUP_S3_BUCKET}/redis/$fileName" || true
                    fi
                fi
            done
    fi
    
    log "Cleanup completed"
}

# Verify backup integrity function
verify_backups() {
    log "Verifying backup integrity..."
    
    local verification_failed=false
    
    # Verify database backup
    if [ -f "${BACKUP_DIR}/database/${BACKUP_ID}.sql.gz" ]; then
        if ! gzip -t "${BACKUP_DIR}/database/${BACKUP_ID}.sql.gz" 2>/dev/null; then
            log "ERROR: Database backup verification failed"
            verification_failed=true
        else
            log "Database backup verification passed"
        fi
    fi
    
    # Verify files backup
    if [ -f "${BACKUP_DIR}/files/${BACKUP_ID}.tar.gz" ]; then
        if ! tar -tzf "${BACKUP_DIR}/files/${BACKUP_ID}.tar.gz" >/dev/null 2>&1; then
            log "ERROR: Files backup verification failed"
            verification_failed=true
        else
            log "Files backup verification passed"
        fi
    fi
    
    # Verify Redis backup
    if [ -f "${BACKUP_DIR}/redis/${BACKUP_ID}.rdb.gz" ]; then
        if ! gzip -t "${BACKUP_DIR}/redis/${BACKUP_ID}.rdb.gz" 2>/dev/null; then
            log "ERROR: Redis backup verification failed"
            verification_failed=true
        else
            log "Redis backup verification passed"
        fi
    fi
    
    if [ "$verification_failed" = true ]; then
        error_exit "Backup verification failed"
    fi
    
    log "All backups verified successfully"
}

# Main backup function
main() {
    log "Starting ILS 2.0 automated backup: ${BACKUP_ID}"
    
    local total_size=0
    local backup_count=0
    
    # Database backup
    if [ "${BACKUP_DATABASE:-true}" = "true" ]; then
        local db_size=$(backup_database)
        total_size=$((total_size + db_size))
        backup_count=$((backup_count + 1))
    fi
    
    # Files backup
    if [ "${BACKUP_FILES:-true}" = "true" ]; then
        local files_size=$(backup_files)
        total_size=$((total_size + files_size))
        backup_count=$((backup_count + 1))
    fi
    
    # Redis backup
    if [ "${BACKUP_REDIS:-true}" = "true" ]; then
        local redis_size=$(backup_redis)
        total_size=$((total_size + redis_size))
        backup_count=$((backup_count + 1))
    fi
    
    # Verify backups
    if [ "${VERIFY_BACKUPS:-true}" = "true" ]; then
        verify_backups
    fi
    
    # Cleanup old backups
    if [ "${CLEANUP_OLD_BACKUPS:-true}" = "true" ]; then
        cleanup_old_backups
    fi
    
    # Generate backup summary
    local summary_file="${BACKUP_DIR}/logs/backup_summary_${TIMESTAMP}.json"
    cat > "$summary_file" << EOF
{
    "backup_id": "${BACKUP_ID}",
    "timestamp": "$(date -Iseconds)",
    "total_size": $total_size,
    "backup_count": $backup_count,
    "components": {
        "database": ${BACKUP_DATABASE:-true},
        "files": ${BACKUP_FILES:-true},
        "redis": ${BACKUP_REDIS:-true}
    },
    "storage": {
        "local": true,
        "s3": ${BACKUP_S3_BUCKET:+true}
    },
    "status": "success"
}
EOF
    
    log "Backup completed successfully: $(numfmt --to=iec $total_size), $backup_count components"
    notify_success $total_size $backup_count
    
    # Cleanup log file older than 30 days
    find "${BACKUP_DIR}/logs" -name "backup_*.log" -mtime +30 -delete 2>/dev/null || true
}

# Check if running as root (for file permissions)
if [ "$EUID" -eq 0 ]; then
    log "WARNING: Running as root, this may cause permission issues"
fi

# Check dependencies
for cmd in pg_dump tar gzip redis-cli aws; do
    if ! command -v "$cmd" &> /dev/null; then
        log "WARNING: $cmd not found, backup may fail"
    fi
done

# Run main function
main "$@"
