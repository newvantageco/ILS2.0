#!/bin/bash

DB_CONNECTION="postgres://neon:npg@localhost:5432/ils_db"

echo "=== Checking for Schema Mismatches ==="
echo ""

# Check for common schema issues
echo "1. Checking audit_logs table..."
psql "$DB_CONNECTION" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='audit_logs' ORDER BY ordinal_position;" | grep -v "^$" | tr -d ' '
echo ""

echo "2. Checking prescriptions table for record_retention_date..."
RESULT=$(psql "$DB_CONNECTION" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='prescriptions' AND column_name='record_retention_date';" | tr -d ' ')
if [ -z "$RESULT" ]; then
    echo "   ⚠️  MISSING: record_retention_date column in prescriptions"
else
    echo "   ✓ record_retention_date exists"
fi
echo ""

echo "3. Checking user_custom_permissions..."
psql "$DB_CONNECTION" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='user_custom_permissions' ORDER BY ordinal_position;" | grep -v "^$" | tr -d ' '
echo ""

echo "4. Testing a simple query..."
psql "$DB_CONNECTION" -c "SELECT COUNT(*) as user_count FROM users;"
echo ""

echo "5. Check recent server errors..."
if [ -f "server.log" ]; then
    echo "Recent errors from server.log:"
    grep -i "error\|failed\|exception" server.log | tail -10
else
    echo "No server.log file found"
fi
