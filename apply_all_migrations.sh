#!/bin/bash

echo "🔧 Applying All Database Migrations..."
echo "======================================"
echo ""

# Database connection info
DB_USER="ils_user"
DB_NAME="ils_db_dev"

# List of migration files with functions (in order)
MIGRATIONS=(
    "migrations/add_multi_tenant_architecture.sql"
    "migrations/001_dynamic_rbac_schema.sql"
    "migrations/add_enhanced_permissions.sql"
    "migrations/002_fix_prescription_data_types.sql"
    "migrations/add_customer_number.sql"
    "migrations/comprehensive-patient-enhancement.sql"
    "migrations/add_pos_analytics_multitenant.sql"
    "migrations/enhanced_test_rooms_and_remote_access.sql"
)

APPLIED=0
FAILED=0
SKIPPED=0

for migration in "${MIGRATIONS[@]}"; do
    echo "📄 Applying: $migration"
    
    if [ ! -f "$migration" ]; then
        echo "   ⚠️  File not found - SKIPPED"
        ((SKIPPED++))
        continue
    fi
    
    # Apply migration
    if docker-compose -f docker-compose.dev.yml exec -T postgres psql -U $DB_USER -d $DB_NAME < "$migration" 2>&1 | grep -q "ERROR"; then
        echo "   ❌ FAILED"
        ((FAILED++))
    else
        echo "   ✅ SUCCESS"
        ((APPLIED++))
    fi
    echo ""
done

echo "======================================"
echo "📊 Migration Summary:"
echo "   ✅ Applied: $APPLIED"
echo "   ❌ Failed:  $FAILED"
echo "   ⚠️  Skipped: $SKIPPED"
echo ""

# Verify functions were created
echo "🔍 Verifying Database Functions..."
docker-compose -f docker-compose.dev.yml exec postgres psql -U $DB_USER -d $DB_NAME -c "
SELECT 
    routine_name,
    '✅' as status
FROM information_schema.routines 
WHERE routine_type = 'FUNCTION' 
  AND routine_schema = 'public' 
ORDER BY routine_name;
"

echo ""
echo "✨ Migration process complete!"
