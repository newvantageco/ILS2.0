#!/bin/bash

# Database Migration Runner Script
# This script runs the enhanced_test_rooms_and_remote_access.sql migration

set -e  # Exit on error

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    echo "Please set it to your PostgreSQL connection string, e.g.:"
    echo "export DATABASE_URL='postgres://username:password@hostname:port/database'"
    exit 1
fi

# Migration file path
MIGRATION_FILE="migrations/enhanced_test_rooms_and_remote_access.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "Running database migration: $MIGRATION_FILE"
echo "Database: $DATABASE_URL"
echo ""

# Run the migration using psql
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

echo ""
echo "Migration completed successfully!"
echo ""
echo "Next steps:"
echo "1. Verify the migration by checking the database tables"
echo "2. Run 'npm run db:push' to sync Drizzle schema"
echo "3. Test the application to ensure everything works correctly"
