#!/bin/bash

# Archival Tables Migration Runner
# Runs the database migration to create archival tables

set -e

echo "========================================="
echo "ILS 2.0 - Archival Tables Migration"
echo "========================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set DATABASE_URL to your PostgreSQL connection string:"
    echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
    echo ""
    exit 1
fi

echo "✅ DATABASE_URL is configured"
echo ""

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATION_FILE="$PROJECT_ROOT/db/migrations/001_create_archival_tables.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ ERROR: Migration file not found at:"
    echo "  $MIGRATION_FILE"
    exit 1
fi

echo "📄 Found migration file:"
echo "  $MIGRATION_FILE"
echo ""

# Confirm before running
read -p "Run migration? This will create 6 new tables in your database. (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo "🚀 Running migration..."
echo ""

# Run the migration
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ Migration completed successfully!"
    echo "========================================="
    echo ""
    echo "The following tables were created:"
    echo "  • archived_records"
    echo "  • report_archives"
    echo "  • data_export_logs"
    echo "  • historical_snapshots"
    echo "  • audit_trail"
    echo "  • data_retention_policies"
    echo ""
    echo "Sample retention policies were also added for:"
    echo "  • orders (7 year retention)"
    echo "  • invoices (7 year retention)"
    echo ""
    echo "Next steps:"
    echo "  1. Test archival endpoints: curl http://localhost:5000/api/archival/records"
    echo "  2. Start using soft deletes instead of hard deletes"
    echo "  3. Archive generated reports for reuse"
    echo "  4. View complete audit trails"
    echo ""
else
    echo ""
    echo "========================================="
    echo "❌ Migration failed!"
    echo "========================================="
    echo ""
    echo "Please check the error message above and fix any issues."
    echo ""
    exit 1
fi
