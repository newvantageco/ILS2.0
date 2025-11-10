#!/bin/bash

################################################################################
# PostgreSQL Backup Script for ILS 2.0
#
# This script creates automated backups of the PostgreSQL database with:
# - Timestamp-based naming
# - Compression
# - Retention policy
# - S3 upload support (optional)
# - Error handling and logging
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgresql}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
S3_BUCKET="${S3_BUCKET:-}"
S3_PATH="${S3_PATH:-backups/postgresql}"

# Database configuration (from environment or defaults)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ils_db}"
DB_USER="${DB_USER:-ils_user}"
PGPASSWORD="${PGPASSWORD:-}"

# Timestamp for backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="ils_db_${TIMESTAMP}.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

# Logging
LOG_FILE="${BACKUP_DIR}/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

################################################################################
# Functions
################################################################################

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if required commands are available
check_dependencies() {
    local deps=("pg_dump" "gzip")

    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            error "$dep is not installed. Please install it first."
        fi
    done

    # Check for AWS CLI if S3 upload is enabled
    if [ -n "$S3_BUCKET" ]; then
        if ! command -v aws &> /dev/null; then
            warning "AWS CLI is not installed. S3 upload will be skipped."
            S3_BUCKET=""
        fi
    fi
}

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Perform database backup
backup_database() {
    log "Starting backup of database: $DB_NAME"

    # Export password for pg_dump
    export PGPASSWORD

    # Perform backup
    if pg_dump -h "$DB_HOST" \
               -p "$DB_PORT" \
               -U "$DB_USER" \
               -d "$DB_NAME" \
               --format=plain \
               --no-owner \
               --no-acl \
               --verbose \
               > "${BACKUP_DIR}/${BACKUP_FILE}" 2>> "$LOG_FILE"; then
        success "Database dump created: ${BACKUP_FILE}"
    else
        error "Database backup failed"
    fi

    # Compress backup
    log "Compressing backup..."
    if gzip -9 "${BACKUP_DIR}/${BACKUP_FILE}"; then
        success "Backup compressed: ${BACKUP_FILE_GZ}"
    else
        error "Compression failed"
    fi

    # Get backup size
    local backup_size=$(du -h "${BACKUP_DIR}/${BACKUP_FILE_GZ}" | cut -f1)
    log "Backup size: ${backup_size}"
}

# Upload to S3
upload_to_s3() {
    if [ -z "$S3_BUCKET" ]; then
        return
    fi

    log "Uploading backup to S3: s3://${S3_BUCKET}/${S3_PATH}/"

    if aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE_GZ}" \
                 "s3://${S3_BUCKET}/${S3_PATH}/${BACKUP_FILE_GZ}" \
                 --storage-class STANDARD_IA; then
        success "Backup uploaded to S3"
    else
        warning "S3 upload failed, but local backup is available"
    fi
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up backups older than ${RETENTION_DAYS} days..."

    local deleted=0
    while IFS= read -r -d '' file; do
        rm -f "$file"
        deleted=$((deleted + 1))
        log "Deleted old backup: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "ils_db_*.sql.gz" -type f -mtime +$RETENTION_DAYS -print0)

    if [ $deleted -eq 0 ]; then
        log "No old backups to delete"
    else
        success "Deleted ${deleted} old backup(s)"
    fi
}

# Cleanup S3 old backups
cleanup_s3_backups() {
    if [ -z "$S3_BUCKET" ]; then
        return
    fi

    log "Cleaning up S3 backups older than ${RETENTION_DAYS} days..."

    local cutoff_date=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)

    aws s3 ls "s3://${S3_BUCKET}/${S3_PATH}/" | while read -r line; do
        local file_date=$(echo "$line" | awk '{print $1}')
        local file_name=$(echo "$line" | awk '{print $4}')

        if [[ "$file_date" < "$cutoff_date" ]]; then
            log "Deleting old S3 backup: ${file_name}"
            aws s3 rm "s3://${S3_BUCKET}/${S3_PATH}/${file_name}"
        fi
    done || warning "S3 cleanup failed"
}

# Verify backup
verify_backup() {
    log "Verifying backup integrity..."

    if gzip -t "${BACKUP_DIR}/${BACKUP_FILE_GZ}"; then
        success "Backup verification passed"
    else
        error "Backup verification failed - file may be corrupted"
    fi
}

# Send notification (implement your notification method)
send_notification() {
    local status=$1
    local message=$2

    # Implement notification (email, Slack, etc.)
    # Example: curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
    #          -H 'Content-Type: application/json' \
    #          -d "{\"text\":\"Database Backup ${status}: ${message}\"}"

    log "Notification: ${status} - ${message}"
}

################################################################################
# Main execution
################################################################################

main() {
    log "=========================================="
    log "Starting PostgreSQL backup process"
    log "=========================================="

    # Check dependencies
    check_dependencies

    # Create backup directory
    create_backup_dir

    # Perform backup
    backup_database

    # Verify backup
    verify_backup

    # Upload to S3 (if configured)
    upload_to_s3

    # Cleanup old backups
    cleanup_old_backups
    cleanup_s3_backups

    # Send success notification
    send_notification "SUCCESS" "Backup completed: ${BACKUP_FILE_GZ}"

    log "=========================================="
    log "Backup process completed successfully"
    log "=========================================="
}

# Error handling
trap 'error "Backup script failed at line $LINENO"' ERR

# Run main function
main "$@"
