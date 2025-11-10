#!/bin/bash

################################################################################
# PostgreSQL Restore Script for ILS 2.0
#
# This script restores PostgreSQL database from backup with:
# - Interactive backup selection
# - S3 download support
# - Safety checks
# - Pre-restore validation
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgresql}"
S3_BUCKET="${S3_BUCKET:-}"
S3_PATH="${S3_PATH:-backups/postgresql}"

# Database configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ils_db}"
DB_USER="${DB_USER:-ils_user}"
PGPASSWORD="${PGPASSWORD:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

################################################################################
# Functions
################################################################################

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# List available backups
list_local_backups() {
    echo ""
    log "Available local backups:"
    echo "----------------------------------------"

    local backups=($(ls -t "$BACKUP_DIR"/ils_db_*.sql.gz 2>/dev/null || true))

    if [ ${#backups[@]} -eq 0 ]; then
        warning "No local backups found in $BACKUP_DIR"
        return 1
    fi

    local i=1
    for backup in "${backups[@]}"; do
        local size=$(du -h "$backup" | cut -f1)
        local date=$(stat -c %y "$backup" | cut -d' ' -f1,2 | cut -d'.' -f1)
        echo "  [$i] $(basename "$backup") (${size}, created: ${date})"
        i=$((i + 1))
    done

    echo "----------------------------------------"
}

# Download backup from S3
download_from_s3() {
    if [ -z "$S3_BUCKET" ]; then
        return
    fi

    log "Listing S3 backups..."

    if ! command -v aws &> /dev/null; then
        warning "AWS CLI not installed, skipping S3 backups"
        return
    fi

    local s3_backups=$(aws s3 ls "s3://${S3_BUCKET}/${S3_PATH}/" | awk '{print $4}' | grep "ils_db_.*\.sql\.gz" || true)

    if [ -z "$s3_backups" ]; then
        warning "No S3 backups found"
        return
    fi

    echo ""
    log "Available S3 backups:"
    echo "----------------------------------------"
    echo "$s3_backups" | nl
    echo "----------------------------------------"

    read -p "Enter number to download (or 0 to skip): " choice

    if [ "$choice" -eq 0 ]; then
        return
    fi

    local selected=$(echo "$s3_backups" | sed -n "${choice}p")

    if [ -z "$selected" ]; then
        error "Invalid selection"
    fi

    log "Downloading: $selected"
    aws s3 cp "s3://${S3_BUCKET}/${S3_PATH}/${selected}" "${BACKUP_DIR}/${selected}"
    success "Downloaded: $selected"
}

# Select backup interactively
select_backup() {
    list_local_backups || download_from_s3

    local backups=($(ls -t "$BACKUP_DIR"/ils_db_*.sql.gz 2>/dev/null))

    if [ ${#backups[@]} -eq 0 ]; then
        error "No backups available to restore"
    fi

    echo ""
    read -p "Enter backup number to restore: " choice

    if [ "$choice" -lt 1 ] || [ "$choice" -gt ${#backups[@]} ]; then
        error "Invalid selection"
    fi

    SELECTED_BACKUP="${backups[$((choice - 1))]}"
    log "Selected: $(basename "$SELECTED_BACKUP")"
}

# Verify backup integrity
verify_backup() {
    local backup_file=$1

    log "Verifying backup integrity..."

    if gzip -t "$backup_file"; then
        success "Backup file is valid"
    else
        error "Backup file is corrupted"
    fi
}

# Create pre-restore backup
create_pre_restore_backup() {
    warning "Creating safety backup before restore..."

    export PGPASSWORD

    local safety_backup="${BACKUP_DIR}/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql"

    if pg_dump -h "$DB_HOST" \
               -p "$DB_PORT" \
               -U "$DB_USER" \
               -d "$DB_NAME" \
               > "$safety_backup" 2>/dev/null; then
        gzip -9 "$safety_backup"
        success "Safety backup created: $(basename "${safety_backup}.gz")"
    else
        warning "Could not create safety backup (database may be empty)"
    fi
}

# Restore database
restore_database() {
    local backup_file=$1

    log "Restoring database from: $(basename "$backup_file")"

    export PGPASSWORD

    # Drop existing connections (PostgreSQL 9.2+)
    log "Terminating existing connections..."
    psql -h "$DB_HOST" \
         -p "$DB_PORT" \
         -U "$DB_USER" \
         -d postgres \
         -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB_NAME' AND pid <> pg_backend_pid();" \
         2>/dev/null || true

    # Drop and recreate database
    log "Recreating database..."
    psql -h "$DB_HOST" \
         -p "$DB_PORT" \
         -U "$DB_USER" \
         -d postgres \
         -c "DROP DATABASE IF EXISTS $DB_NAME;" || error "Failed to drop database"

    psql -h "$DB_HOST" \
         -p "$DB_PORT" \
         -U "$DB_USER" \
         -d postgres \
         -c "CREATE DATABASE $DB_NAME;" || error "Failed to create database"

    # Restore from backup
    log "Restoring data..."
    if gunzip -c "$backup_file" | psql -h "$DB_HOST" \
                                        -p "$DB_PORT" \
                                        -U "$DB_USER" \
                                        -d "$DB_NAME" \
                                        2>/dev/null; then
        success "Database restored successfully"
    else
        error "Database restore failed"
    fi
}

# Verify restore
verify_restore() {
    log "Verifying restore..."

    export PGPASSWORD

    # Check if database exists and has tables
    local table_count=$(psql -h "$DB_HOST" \
                             -p "$DB_PORT" \
                             -U "$DB_USER" \
                             -d "$DB_NAME" \
                             -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" \
                             2>/dev/null | xargs)

    if [ "$table_count" -gt 0 ]; then
        success "Restore verified: $table_count tables found"
    else
        error "Restore verification failed: no tables found"
    fi
}

################################################################################
# Main execution
################################################################################

main() {
    echo ""
    echo "=========================================="
    echo "  PostgreSQL Database Restore Tool"
    echo "=========================================="
    echo ""

    warning "This will REPLACE your current database!"
    read -p "Are you sure you want to continue? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled"
        exit 0
    fi

    # Select backup
    select_backup

    # Verify backup
    verify_backup "$SELECTED_BACKUP"

    # Create safety backup
    create_pre_restore_backup

    # Final confirmation
    echo ""
    warning "About to restore: $(basename "$SELECTED_BACKUP")"
    read -p "Type 'RESTORE' to proceed: " final_confirm

    if [ "$final_confirm" != "RESTORE" ]; then
        error "Restore cancelled"
    fi

    # Restore database
    restore_database "$SELECTED_BACKUP"

    # Verify restore
    verify_restore

    echo ""
    echo "=========================================="
    success "Restore completed successfully!"
    echo "=========================================="
    echo ""
}

# Run main function
main "$@"
