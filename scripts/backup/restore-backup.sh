#!/bin/bash

# ILS 2.0 Backup Restore Script
# This script restores system components from backup files

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
LOG_FILE="${BACKUP_DIR}/logs/restore_$(date +"%Y%m%d_%H%M%S").log"

# Ensure log directory exists
mkdir -p "${BACKUP_DIR}/logs"

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
            --data "{\"text\":\"🚨 ILS 2.0 Restore Failed: $1\"}" \
            "${SLACK_BACKUP_WEBHOOK}"
    fi
    exit 1
}

# Success notification
notify_success() {
    local component=$1
    log "SUCCESS: $component restore completed"
    
    if [ -n "${SLACK_BACKUP_WEBHOOK:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"✅ ILS 2.0 $component Restore Completed Successfully\"}" \
            "${SLACK_BACKUP_WEBHOOK}"
    fi
}

# Download backup from S3
download_from_s3() {
    local s3_path=$1
    local local_path=$2
    
    log "Downloading backup from S3: $s3_path"
    
    if ! aws s3 cp "$s3_path" "$local_path"; then
        error_exit "Failed to download backup from S3: $s3_path"
    fi
    
    log "Download completed: $local_path"
}

# List available backups
list_backups() {
    local component=${1:-"all"}
    
    log "Listing available backups for component: $component"
    
    case "$component" in
        "database")
            echo "=== Database Backups ==="
            ls -la "${BACKUP_DIR}/database/"*.sql.gz 2>/dev/null || echo "No local database backups found"
            if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
                echo "=== S3 Database Backups ==="
                aws s3 ls "s3://${BACKUP_S3_BUCKET}/database/" 2>/dev/null || echo "No S3 database backups found"
            fi
            ;;
        "files")
            echo "=== Files Backups ==="
            ls -la "${BACKUP_DIR}/files/"*.tar.gz 2>/dev/null || echo "No local files backups found"
            if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
                echo "=== S3 Files Backups ==="
                aws s3 ls "s3://${BACKUP_S3_BUCKET}/files/" 2>/dev/null || echo "No S3 files backups found"
            fi
            ;;
        "redis")
            echo "=== Redis Backups ==="
            ls -la "${BACKUP_DIR}/redis/"*.rdb.gz 2>/dev/null || echo "No local Redis backups found"
            if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
                echo "=== S3 Redis Backups ==="
                aws s3 ls "s3://${BACKUP_S3_BUCKET}/redis/" 2>/dev/null || echo "No S3 Redis backups found"
            fi
            ;;
        "all"|*)
            list_backups "database"
            echo ""
            list_backups "files"
            echo ""
            list_backups "redis"
            ;;
    esac
}

# Verify backup integrity
verify_backup() {
    local backup_file=$1
    local component=$2
    
    log "Verifying $component backup integrity: $backup_file"
    
    case "$component" in
        "database")
            if ! gzip -t "$backup_file" 2>/dev/null; then
                error_exit "Database backup file is corrupted: $backup_file"
            fi
            ;;
        "files")
            if ! tar -tzf "$backup_file" >/dev/null 2>&1; then
                error_exit "Files backup file is corrupted: $backup_file"
            fi
            ;;
        "redis")
            if ! gzip -t "$backup_file" 2>/dev/null; then
                error_exit "Redis backup file is corrupted: $backup_file"
            fi
            ;;
    esac
    
    log "Backup verification passed"
}

# Restore database
restore_database() {
    local backup_file=$1
    
    log "Starting database restore from: $backup_file"
    
    # Verify backup
    verify_backup "$backup_file" "database"
    
    local db_host="${DB_HOST:-localhost}"
    local db_port="${DB_PORT:-5432}"
    local db_name="${DB_NAME:-ils2}"
    local db_user="${DB_USER:-postgres}"
    
    # Create restore command
    local restore_cmd="gunzip -c '$backup_file' | PGPASSWORD='${DB_PASSWORD}' psql -h '$db_host' -p '$db_port' -U '$db_user' -d '$db_name'"
    
    log "Executing database restore..."
    
    # Perform restore
    if ! eval "$restore_cmd"; then
        error_exit "Database restore failed"
    fi
    
    log "Database restore completed successfully"
    notify_success "Database"
}

# Restore files
restore_files() {
    local backup_file=$1
    local target_dir="${RESTORE_TARGET_DIR:-./}"
    
    log "Starting files restore from: $backup_file to: $target_dir"
    
    # Verify backup
    verify_backup "$backup_file" "files"
    
    # Create target directory if it doesn't exist
    mkdir -p "$target_dir"
    
    # Extract files
    if ! tar -xzf "$backup_file" -C "$target_dir"; then
        error_exit "Files restore failed"
    fi
    
    log "Files restore completed successfully"
    notify_success "Files"
}

# Restore Redis
restore_redis() {
    local backup_file=$1
    
    log "Starting Redis restore from: $backup_file"
    
    # Verify backup
    verify_backup "$backup_file" "redis"
    
    local redis_host="${REDIS_HOST:-localhost}"
    local redis_port="${REDIS_PORT:-6379}"
    local redis_auth=""
    
    if [ -n "${REDIS_PASSWORD:-}" ]; then
        redis_auth="-a ${REDIS_PASSWORD}"
    fi
    
    # Stop Redis server (if running locally)
    if command -v redis-server &> /dev/null; then
        log "Stopping Redis server..."
        redis-cli -h "$redis_host" -p "$redis_port" $redis_auth SHUTDOWN NOSAVE || true
        sleep 2
    fi
    
    # Extract Redis backup
    local temp_rdb="/tmp/redis_restore_$(date +%s).rdb"
    gunzip -c "$backup_file" > "$temp_rdb"
    
    # Move to Redis data directory
    local redis_data_dir="${REDIS_DATA_DIR:-/var/lib/redis}"
    if [ -d "$redis_data_dir" ]; then
        sudo cp "$temp_rdb" "$redis_data_dir/dump.rdb" || error_exit "Failed to copy Redis data file"
        sudo chown redis:redis "$redis_data_dir/dump.rdb" || log "WARNING: Could not set Redis file ownership"
    else
        log "WARNING: Redis data directory not found, you may need to manually copy $temp_rdb to your Redis data directory"
    fi
    
    # Start Redis server
    if command -v redis-server &> /dev/null; then
        log "Starting Redis server..."
        sudo systemctl start redis || sudo service redis start || redis-server --daemonize yes || log "WARNING: Could not start Redis server automatically"
    fi
    
    # Cleanup
    rm -f "$temp_rdb"
    
    log "Redis restore completed successfully"
    notify_success "Redis"
}

# Full system restore
restore_full() {
    local backup_id=$1
    
    log "Starting full system restore from backup: $backup_id"
    
    local db_backup="${BACKUP_DIR}/database/${backup_id}.sql.gz"
    local files_backup="${BACKUP_DIR}/files/${backup_id}.tar.gz"
    local redis_backup="${BACKUP_DIR}/redis/${backup_id}.rdb.gz"
    
    # Check if backups exist locally, if not try S3
    if [ ! -f "$db_backup" ] && [ -n "${BACKUP_S3_BUCKET:-}" ]; then
        log "Database backup not found locally, downloading from S3..."
        download_from_s3 "s3://${BACKUP_S3_BUCKET}/database/${backup_id}.sql.gz" "$db_backup"
    fi
    
    if [ ! -f "$files_backup" ] && [ -n "${BACKUP_S3_BUCKET:-}" ]; then
        log "Files backup not found locally, downloading from S3..."
        download_from_s3 "s3://${BACKUP_S3_BUCKET}/files/${backup_id}.tar.gz" "$files_backup"
    fi
    
    if [ ! -f "$redis_backup" ] && [ -n "${BACKUP_S3_BUCKET:-}" ]; then
        log "Redis backup not found locally, downloading from S3..."
        download_from_s3 "s3://${BACKUP_S3_BUCKET}/redis/${backup_id}.rdb.gz" "$redis_backup"
    fi
    
    # Verify all backups exist
    if [ ! -f "$db_backup" ]; then
        error_exit "Database backup not found: $db_backup"
    fi
    
    if [ ! -f "$files_backup" ]; then
        error_exit "Files backup not found: $files_backup"
    fi
    
    if [ ! -f "$redis_backup" ]; then
        error_exit "Redis backup not found: $redis_backup"
    fi
    
    # Restore components in order
    log "Restoring system components..."
    
    # 1. Restore files first (application files)
    restore_files "$files_backup"
    
    # 2. Restore Redis (session data)
    restore_redis "$redis_backup"
    
    # 3. Restore database last (core data)
    restore_database "$db_backup"
    
    log "Full system restore completed successfully"
    
    if [ -n "${SLACK_BACKUP_WEBHOOK:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🎉 ILS 2.0 Full System Restore Completed Successfully\\nBackup ID: $backup_id\"}" \
            "${SLACK_BACKUP_WEBHOOK}"
    fi
}

# Show usage
show_usage() {
    cat << EOF
ILS 2.0 Backup Restore Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    list [component]           List available backups
    database <backup_file>     Restore database from backup
    files <backup_file>        Restore files from backup
    redis <backup_file>        Restore Redis from backup
    full <backup_id>           Restore full system from backup ID

Components:
    database                    PostgreSQL database backups
    files                       Application files backups
    redis                       Redis data backups
    all                         All components (default for list)

Examples:
    $0 list                     List all available backups
    $0 list database            List database backups only
    $0 database backup_20231215_020000.sql.gz
    $0 files backup_20231215_020000.tar.gz
    $0 redis backup_20231215_020000.rdb.gz
    $0 full backup_20231215_020000

Environment Variables:
    BACKUP_DIR                  Backup directory (default: ./backups)
    DB_HOST                     Database host (default: localhost)
    DB_PORT                     Database port (default: 5432)
    DB_NAME                     Database name (default: ils2)
    DB_USER                     Database user (default: postgres)
    DB_PASSWORD                 Database password
    REDIS_HOST                  Redis host (default: localhost)
    REDIS_PORT                  Redis port (default: 6379)
    REDIS_PASSWORD              Redis password
    REDIS_DATA_DIR              Redis data directory (default: /var/lib/redis)
    RESTORE_TARGET_DIR          Target directory for files restore (default: ./)
    BACKUP_S3_BUCKET            S3 bucket name
    AWS_ACCESS_KEY_ID           AWS access key
    AWS_SECRET_ACCESS_KEY       AWS secret key
    SLACK_BACKUP_WEBHOOK        Slack webhook for notifications

Notes:
    - Backup files can be local paths or S3 URLs
    - Full restore requires all three component backups
    - Always verify backup integrity before restore
    - Database restore will DROP and recreate all data
    - Files restore will overwrite existing files
    - Redis restore requires server restart

EOF
}

# Main script logic
main() {
    case "${1:-}" in
        "list")
            list_backups "${2:-all}"
            ;;
        "database")
            if [ -z "${2:-}" ]; then
                echo "ERROR: Database backup file required"
                show_usage
                exit 1
            fi
            restore_database "$2"
            ;;
        "files")
            if [ -z "${2:-}" ]; then
                echo "ERROR: Files backup file required"
                show_usage
                exit 1
            fi
            restore_files "$2"
            ;;
        "redis")
            if [ -z "${2:-}" ]; then
                echo "ERROR: Redis backup file required"
                show_usage
                exit 1
            fi
            restore_redis "$2"
            ;;
        "full")
            if [ -z "${2:-}" ]; then
                echo "ERROR: Backup ID required"
                show_usage
                exit 1
            fi
            restore_full "$2"
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            echo "ERROR: Unknown command: ${1:-}"
            show_usage
            exit 1
            ;;
    esac
}

# Check dependencies
for cmd in gunzip tar psql redis-cli aws; do
    if ! command -v "$cmd" &> /dev/null; then
        log "WARNING: $cmd not found, restore may fail"
    fi
done

# Run main function
main "$@"
