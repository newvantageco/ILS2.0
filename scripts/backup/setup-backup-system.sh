#!/bin/bash

# ILS 2.0 Backup System Setup Script
# Automated setup and configuration of the backup system

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
LOG_FILE="${BACKUP_DIR}/setup_$(date +"%Y%m%d_%H%M%S").log"

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "${LOG_FILE}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "${LOG_FILE}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "${LOG_FILE}"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "${LOG_FILE}"
}

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        warning "Running as root. This may cause permission issues with application files."
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    local missing_deps=()
    
    # Required dependencies
    for cmd in pg_dump psql tar gzip redis-cli aws; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        error "Missing dependencies: ${missing_deps[*]}"
        echo
        echo "Please install the missing dependencies:"
        
        for dep in "${missing_deps[@]}"; do
            case "$dep" in
                "pg_dump"|"psql")
                    echo "  - PostgreSQL client: sudo apt-get install postgresql-client"
                    ;;
                "redis-cli")
                    echo "  - Redis client: sudo apt-get install redis-tools"
                    ;;
                "aws")
                    echo "  - AWS CLI: pip install awscli"
                    ;;
                "tar"|"gzip")
                    echo "  - Basic utilities: sudo apt-get install tar gzip"
                    ;;
            esac
        done
        
        echo
        echo "After installing dependencies, run this script again."
        exit 1
    fi
    
    success "All dependencies found"
}

# Create backup directory structure
create_directories() {
    log "Creating backup directory structure..."
    
    local dirs=(
        "${BACKUP_DIR}"
        "${BACKUP_DIR}/database"
        "${BACKUP_DIR}/files"
        "${BACKUP_DIR}/redis"
        "${BACKUP_DIR}/logs"
        "${BACKUP_DIR}/config"
        "${BACKUP_DIR}/temp"
    )
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log "Created directory: $dir"
        fi
    done
    
    # Set appropriate permissions
    chmod 755 "$BACKUP_DIR"
    chmod 700 "${BACKUP_DIR}/config"
    
    success "Backup directories created"
}

# Generate environment configuration
generate_env_config() {
    log "Generating environment configuration..."
    
    local env_file=".env.backup"
    
    if [ -f "$env_file" ]; then
        warning "Environment file already exists: $env_file"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Skipping environment file generation"
            return
        fi
    fi
    
    cat > "$env_file" << 'EOF'
# ILS 2.0 Backup System Configuration
# Copy this to your main .env file and customize as needed

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ils2
DB_USER=postgres
DB_PASSWORD=your-database-password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Backup Storage Configuration
BACKUP_LOCAL_PATH=./backups
BACKUP_S3_BUCKET=ils2-backups
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_GLACIER_VAULT=ils2-archives

# Notification Configuration
SLACK_BACKUP_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
BACKUP_NOTIFICATION_EMAIL=admin@yourcompany.com

# Backup Retention Policies (in days)
DATABASE_RETENTION_DAYS=30
FILES_RETENTION_DAYS=90
REDIS_RETENTION_DAYS=7

# Backup Settings
BACKUP_ENABLED=true
BACKUP_SCHEDULE=daily
BACKUP_TIME=02:00
VERIFY_BACKUPS=true
CLEANUP_OLD_BACKUPS=true

# Source Paths for Files Backup
BACKUP_SOURCE_PATHS="./uploads ./public ./logs"

# Redis Configuration
REDIS_DATA_DIR=/var/lib/redis

# Restore Settings
RESTORE_TARGET_DIR=./

# Email Notifications (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EOF
    
    success "Environment configuration generated: $env_file"
    log "Please review and customize the configuration before proceeding"
}

# Test database connection
test_database_connection() {
    log "Testing database connection..."
    
    if [ -z "${DB_HOST:-}" ] || [ -z "${DB_PASSWORD:-}" ]; then
        warning "Database configuration not found. Please set DB_HOST and DB_PASSWORD environment variables."
        return
    fi
    
    if PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-ils2}" -c "SELECT 1;" &>/dev/null; then
        success "Database connection successful"
    else
        error "Database connection failed"
        log "Please check your database configuration:"
        log "  DB_HOST: ${DB_HOST:-not set}"
        log "  DB_PORT: ${DB_PORT:-5432}"
        log "  DB_NAME: ${DB_NAME:-ils2}"
        log "  DB_USER: ${DB_USER:-postgres}"
        log "  DB_PASSWORD: [hidden]"
    fi
}

# Test Redis connection
test_redis_connection() {
    log "Testing Redis connection..."
    
    if [ -z "${REDIS_HOST:-}" ]; then
        warning "Redis configuration not found. Please set REDIS_HOST environment variable."
        return
    fi
    
    local redis_auth=""
    if [ -n "${REDIS_PASSWORD:-}" ]; then
        redis_auth="-a ${REDIS_PASSWORD}"
    fi
    
    if redis-cli -h "${REDIS_HOST}" -p "${REDIS_PORT:-6379}" $redis_auth ping &>/dev/null; then
        success "Redis connection successful"
    else
        error "Redis connection failed"
        log "Please check your Redis configuration:"
        log "  REDIS_HOST: ${REDIS_HOST:-not set}"
        log "  REDIS_PORT: ${REDIS_PORT:-6379}"
        log "  REDIS_PASSWORD: [hidden]"
    fi
}

# Test AWS S3 connection
test_s3_connection() {
    log "Testing AWS S3 connection..."
    
    if [ -z "${BACKUP_S3_BUCKET:-}" ] || [ -z "${AWS_ACCESS_KEY_ID:-}" ]; then
        warning "AWS S3 configuration not found. S3 backup will be disabled."
        return
    fi
    
    if aws s3 ls "s3://${BACKUP_S3_BUCKET}" &>/dev/null; then
        success "AWS S3 connection successful"
    else
        error "AWS S3 connection failed"
        log "Please check your AWS configuration:"
        log "  BACKUP_S3_BUCKET: ${BACKUP_S3_BUCKET:-not set}"
        log "  AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:0:8}..."
        log "  AWS_REGION: ${AWS_REGION:-us-east-1}"
    fi
}

# Setup cron jobs
setup_cron_jobs() {
    log "Setting up cron jobs..."
    
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local backup_script="$script_dir/automated-backup.sh"
    local test_script="$script_dir/test-backup-system.sh"
    
    # Create temporary cron file
    local cron_file="/tmp/ils2_backup_cron"
    
    cat > "$cron_file" << EOF
# ILS 2.0 Backup System Cron Jobs
# Daily backup at 2:00 AM
0 2 * * * $backup_script >> ${BACKUP_DIR}/logs/cron.log 2>&1

# Weekly backup verification on Sundays at 3:00 AM
0 3 * * 0 $test_script >> ${BACKUP_DIR}/logs/verification.log 2>&1

# Monthly cleanup on the 1st at 4:00 AM
0 4 1 * * find ${BACKUP_DIR} -name "*.log" -mtime +30 -delete >> ${BACKUP_DIR}/logs/cleanup.log 2>&1
EOF
    
    # Install cron jobs
    if crontab "$cron_file" 2>/dev/null; then
        success "Cron jobs installed"
        log "Installed cron jobs:"
        cat "$cron_file"
    else
        error "Failed to install cron jobs"
        log "Please add the following to your crontab manually:"
        cat "$cron_file"
    fi
    
    rm -f "$cron_file"
}

# Create systemd service (optional)
create_systemd_service() {
    log "Creating systemd service..."
    
    if [ "$EUID" -ne 0 ]; then
        warning "Not running as root. Skipping systemd service creation."
        return
    fi
    
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local service_file="/etc/systemd/system/ils2-backup.service"
    
    cat > "$service_file" << EOF
[Unit]
Description=ILS 2.0 Backup Service
After=network.target postgresql.service redis.service

[Service]
Type=oneshot
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$script_dir/automated-backup.sh
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable ils2-backup.service
    
    success "Systemd service created: ils2-backup"
    log "To run backup manually: sudo systemctl start ils2-backup"
    log "To view logs: sudo journalctl -u ils2-backup"
}

# Run initial backup test
run_initial_test() {
    log "Running initial backup test..."
    
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local test_script="$script_dir/test-backup-system.sh"
    
    if [ -f "$test_script" ]; then
        log "Executing backup system test..."
        if "$test_script" &>/dev/null; then
            success "Initial backup test passed"
        else
            warning "Initial backup test failed"
            log "Check the test output for details"
            log "You can run the test manually: $test_script"
        fi
    else
        warning "Test script not found: $test_script"
    fi
}

# Generate setup summary
generate_summary() {
    log "Generating setup summary..."
    
    local summary_file="${BACKUP_DIR}/setup_summary.txt"
    
    cat > "$summary_file" << EOF
ILS 2.0 Backup System Setup Summary
===================================

Setup Date: $(date)
Backup Directory: $BACKUP_DIR
Script Directory: $(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

Configuration:
- Environment File: .env.backup
- Cron Jobs: Installed
- Systemd Service: $([ "$EUID" -eq 0 ] && echo "Installed" || echo "Skipped (not root)")

Components:
- Database Backups: Enabled
- Files Backups: Enabled
- Redis Backups: Enabled

Storage:
- Local Storage: $BACKUP_DIR
- S3 Storage: ${BACKUP_S3_BUCKET:-Not configured}
- Glacier Storage: ${AWS_GLACIER_VAULT:-Not configured}

Next Steps:
1. Review and customize .env.backup configuration
2. Copy configuration to your main .env file
3. Test backup system: ./scripts/backup/test-backup-system.sh
4. Monitor first automated backup
5. Configure notifications (Slack/email)

Important Files:
- Backup Script: ./scripts/backup/automated-backup.sh
- Restore Script: ./scripts/backup/restore-backup.sh
- Test Script: ./scripts/backup/test-backup-system.sh
- Setup Log: $LOG_FILE
- Cron Log: ${BACKUP_DIR}/logs/cron.log

Documentation:
- Full Guide: ./BACKUP_SYSTEM_GUIDE.md
- API Documentation: /api/backup/documentation

Support:
- Issues: Check logs in ${BACKUP_DIR}/logs/
- Monitoring: Check backup metrics in admin dashboard
EOF
    
    success "Setup summary generated: $summary_file"
    cat "$summary_file"
}

# Main setup function
main() {
    echo
    echo "🛡️  ILS 2.0 Backup System Setup"
    echo "================================="
    echo
    
    log "Starting backup system setup..."
    
    # Run setup steps
    check_root
    check_dependencies
    create_directories
    generate_env_config
    test_database_connection
    test_redis_connection
    test_s3_connection
    setup_cron_jobs
    create_systemd_service
    run_initial_test
    generate_summary
    
    echo
    success "Backup system setup completed! 🎉"
    echo
    echo "📋 Next Steps:"
    echo "1. Review and customize the generated .env.backup file"
    echo "2. Copy the configuration to your main .env file"
    echo "3. Test the backup system: ./scripts/backup/test-backup-system.sh"
    echo "4. Monitor your first automated backup at 2:00 AM"
    echo "5. Configure Slack/email notifications"
    echo
    echo "📚 Documentation: ./BACKUP_SYSTEM_GUIDE.md"
    echo "📊 Monitoring: Check backup metrics in admin dashboard"
    echo "📝 Logs: ${BACKUP_DIR}/logs/"
    echo
}

# Handle script interruption
trap 'error "Setup interrupted"; exit 1' INT TERM

# Run main function
main "$@"
