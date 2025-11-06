#!/bin/bash

# =====================================================
# Dispenser Role Setup Script
# Run this to set up the enhanced Dispenser role system
# =====================================================

set -e  # Exit on error

echo "🚀 Setting up Enhanced Dispenser Role System..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo "   Please set it to your PostgreSQL connection string"
  echo "   Example: export DATABASE_URL='postgresql://user:pass@localhost:5432/dbname'"
  exit 1
fi

echo "✅ Database URL found"
echo ""

# Step 1: Add Dispenser Permissions
echo "📦 Step 1/4: Adding Dispenser permissions to database..."
psql "$DATABASE_URL" -f migrations/add_dispenser_permissions.sql

if [ $? -eq 0 ]; then
  echo "   ✅ Permissions added successfully"
else
  echo "   ❌ Failed to add permissions"
  exit 1
fi
echo ""

# Step 2: Re-seed default roles (will update Dispenser role)
echo "🏭 Step 2/4: Creating/Updating default roles..."
node -e "
  const { createDefaultRoles } = require('./server/services/DefaultRolesService.ts');
  const { db } = require('./server/db');
  const { sql } = require('drizzle-orm');
  
  (async () => {
    try {
      // Get all companies
      const companies = await db.execute(sql\`SELECT id FROM companies\`);
      
      for (const company of companies.rows) {
        console.log(\`Creating roles for company: \${company.id}\`);
        await createDefaultRoles(company.id);
      }
      
      console.log('✅ Default roles created/updated for all companies');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  })();
"

if [ $? -eq 0 ]; then
  echo "   ✅ Roles created/updated successfully"
else
  echo "   ❌ Failed to create roles"
  exit 1
fi
echo ""

# Step 3: Verify permissions
echo "🔍 Step 3/4: Verifying Dispenser permissions..."
DISPENSER_PERMS=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) 
  FROM dynamic_role_permissions drp
  JOIN dynamic_roles dr ON dr.id = drp.role_id
  WHERE dr.name = 'Dispenser'
  LIMIT 1
")

if [ "$DISPENSER_PERMS" -gt 0 ]; then
  echo "   ✅ Dispenser role has $DISPENSER_PERMS permissions"
else
  echo "   ⚠️  Warning: Dispenser role might not have been created properly"
fi
echo ""

# Step 4: Show summary
echo "📊 Step 4/4: System Summary"
echo "─────────────────────────────────────────────"

# Count total permissions
TOTAL_PERMS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM permissions WHERE category = 'Point of Sale (POS)'")
echo "   POS Permissions: $TOTAL_PERMS"

# Count companies with Dispenser role
COMPANIES_WITH_ROLE=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(DISTINCT company_id) FROM dynamic_roles WHERE name = 'Dispenser'")
echo "   Companies with Dispenser role: $COMPANIES_WITH_ROLE"

# Count users with Dispenser role
DISPENSERS=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) 
  FROM user_dynamic_roles udr
  JOIN dynamic_roles dr ON dr.id = udr.role_id
  WHERE dr.name = 'Dispenser'
")
echo "   Current Dispensers: $DISPENSERS"

echo "─────────────────────────────────────────────"
echo ""

echo "🎉 Setup Complete!"
echo ""
echo "📚 Next Steps:"
echo "   1. Assign Dispenser role to users:"
echo "      POST /api/roles/users/:userId/assign"
echo "      { \"roleIds\": [\"<dispenser-role-id>\"] }"
echo ""
echo "   2. Test role cloning:"
echo "      POST /api/roles/:roleId/clone"
echo "      { \"newName\": \"Trainee Dispenser\" }"
echo ""
echo "   3. View full documentation:"
echo "      cat DISPENSER_ROLE_IMPLEMENTATION.md"
echo ""
echo "✨ Your Dispenser role system is ready to use!"
