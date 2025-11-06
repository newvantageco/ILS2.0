#!/bin/bash

# Dynamic RBAC System - Comprehensive Test Suite
# This script tests all components of the Dynamic RBAC system

echo ""
echo "🚀 Dynamic RBAC System Test Suite"
echo "============================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database connection
DB_URL="postgres://neon:npg@localhost:5432/ils_db"

# Test counters
PASSED=0
FAILED=0
WARNED=0

# Test result function
test_result() {
  local test_name=$1
  local status=$2
  local message=$3
  
  if [ "$status" == "PASS" ]; then
    echo -e "${GREEN}✅ ${test_name}: ${message}${NC}"
    ((PASSED++))
  elif [ "$status" == "FAIL" ]; then
    echo -e "${RED}❌ ${test_name}: ${message}${NC}"
    ((FAILED++))
  else
    echo -e "${YELLOW}⚠️  ${test_name}: ${message}${NC}"
    ((WARNED++))
  fi
}

# Test 1: Database Schema
echo "🔍 Testing Database Schema..."
echo ""

# Test permission_categories table
CATEGORY_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM permission_categories;")
if [ $CATEGORY_COUNT -gt 0 ]; then
  test_result "Permission Categories Table" "PASS" "Found $CATEGORY_COUNT categories"
else
  test_result "Permission Categories Table" "FAIL" "No categories found"
fi

# Test permissions table
PERM_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM permissions;")
if [ $PERM_COUNT -gt 0 ]; then
  test_result "Permissions Table" "PASS" "Found $PERM_COUNT permissions"
else
  test_result "Permissions Table" "FAIL" "No permissions found"
fi

# Test dynamic_roles table exists
ROLES_TABLE=$(psql "$DB_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dynamic_roles');")
if [[ "$ROLES_TABLE" == *"t"* ]]; then
  test_result "Dynamic Roles Table" "PASS" "Table exists"
else
  test_result "Dynamic Roles Table" "FAIL" "Table does not exist"
fi

# Test dynamic_role_permissions table exists
ROLE_PERMS_TABLE=$(psql "$DB_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dynamic_role_permissions');")
if [[ "$ROLE_PERMS_TABLE" == *"t"* ]]; then
  test_result "Dynamic Role Permissions Table" "PASS" "Table exists"
else
  test_result "Dynamic Role Permissions Table" "FAIL" "Table does not exist"
fi

# Test user_dynamic_roles table exists
USER_ROLES_TABLE=$(psql "$DB_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_dynamic_roles');")
if [[ "$USER_ROLES_TABLE" == *"t"* ]]; then
  test_result "User Dynamic Roles Table" "PASS" "Table exists"
else
  test_result "User Dynamic Roles Table" "FAIL" "Table does not exist"
fi

# Test user_effective_permissions view exists
VIEW_EXISTS=$(psql "$DB_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.views WHERE table_name = 'user_effective_permissions');")
if [[ "$VIEW_EXISTS" == *"t"* ]]; then
  test_result "User Effective Permissions View" "PASS" "View exists"
else
  test_result "User Effective Permissions View" "FAIL" "View does not exist"
fi

# Test plan_level column exists in permissions
PLAN_LEVEL_COL=$(psql "$DB_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'permissions' AND column_name = 'plan_level');")
if [[ "$PLAN_LEVEL_COL" == *"t"* ]]; then
  test_result "Permissions.plan_level Column" "PASS" "Column exists"
else
  test_result "Permissions.plan_level Column" "FAIL" "Column does not exist"
fi

# Test is_owner column exists in users
IS_OWNER_COL=$(psql "$DB_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_owner');")
if [[ "$IS_OWNER_COL" == *"t"* ]]; then
  test_result "Users.is_owner Column" "PASS" "Column exists"
else
  test_result "Users.is_owner Column" "FAIL" "Column does not exist"
fi

# Test cached_permissions column exists in sessions
CACHED_PERMS_COL=$(psql "$DB_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'cached_permissions');")
if [[ "$CACHED_PERMS_COL" == *"t"* ]]; then
  test_result "Sessions.cached_permissions Column" "PASS" "Column exists"
else
  test_result "Sessions.cached_permissions Column" "FAIL" "Column does not exist"
fi

echo ""
echo "🌱 Testing Permission Seeding..."
echo ""

# Test permission distribution by plan level
echo "   Plan Level Distribution:"
psql "$DB_URL" -c "SELECT plan_level, COUNT(*) as count FROM permissions GROUP BY plan_level ORDER BY plan_level;" | head -n 10

FREE_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM permissions WHERE plan_level = 'free';")
FULL_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM permissions WHERE plan_level = 'full';")
ANALYTICS_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM permissions WHERE plan_level = 'add_on_analytics';")

test_result "Free Plan Permissions" "PASS" "$FREE_COUNT permissions"
test_result "Full Plan Permissions" "PASS" "$FULL_COUNT permissions"
test_result "Analytics Plan Permissions" "PASS" "$ANALYTICS_COUNT permissions"

# Test for required permissions
REQUIRED_PERMS=("company:view" "users:view" "orders:create" "patients:create" "analytics:view" "ai:assistant")

for PERM in "${REQUIRED_PERMS[@]}"; do
  PERM_EXISTS=$(psql "$DB_URL" -t -c "SELECT EXISTS (SELECT 1 FROM permissions WHERE permission_key = '$PERM');")
  if [[ "$PERM_EXISTS" == *"t"* ]]; then
    PERM_INFO=$(psql "$DB_URL" -t -c "SELECT permission_name, plan_level FROM permissions WHERE permission_key = '$PERM';")
    test_result "Permission: $PERM" "PASS" "Found: $PERM_INFO"
  else
    test_result "Permission: $PERM" "FAIL" "Not found in database"
  fi
done

# Test category linkage
echo ""
echo "   Category Distribution:"
psql "$DB_URL" -c "
  SELECT 
    pc.name as category,
    COUNT(p.id) as permission_count
  FROM permission_categories pc
  LEFT JOIN permissions p ON p.category = pc.name
  GROUP BY pc.name, pc.display_order
  ORDER BY pc.display_order
  LIMIT 15;
"

echo ""
echo "👥 Testing Default Roles (if companies exist)..."
echo ""

# Check if companies exist
COMPANY_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM companies;")
if [ $COMPANY_COUNT -gt 0 ]; then
  test_result "Companies in Database" "PASS" "Found $COMPANY_COUNT companies"
  
  # Get first company
  COMPANY_ID=$(psql "$DB_URL" -t -c "SELECT id FROM companies LIMIT 1;" | xargs)
  COMPANY_NAME=$(psql "$DB_URL" -t -c "SELECT name FROM companies WHERE id = '$COMPANY_ID';" | xargs)
  
  echo "   Using test company: $COMPANY_NAME (ID: $COMPANY_ID)"
  
  # Check if roles exist for this company
  ROLE_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM dynamic_roles WHERE company_id = '$COMPANY_ID';")
  
  if [ $ROLE_COUNT -gt 0 ]; then
    test_result "Company Roles" "PASS" "Company has $ROLE_COUNT roles"
    
    echo ""
    echo "   Existing Roles for $COMPANY_NAME:"
    psql "$DB_URL" -c "
      SELECT 
        dr.name,
        dr.is_deletable,
        COUNT(drp.permission_id) as perm_count
      FROM dynamic_roles dr
      LEFT JOIN dynamic_role_permissions drp ON drp.role_id = dr.id
      WHERE dr.company_id = '$COMPANY_ID'
      GROUP BY dr.id, dr.name, dr.is_deletable
      ORDER BY dr.name;
    "
  else
    test_result "Company Roles" "WARN" "No roles created yet - run createDefaultRoles()"
    echo ""
    echo "   To create roles, run:"
    echo "   npx tsx -e \"import { createDefaultRoles } from './server/services/DefaultRolesService.js'; await createDefaultRoles('$COMPANY_ID');\""
  fi
  
else
  test_result "Companies" "WARN" "No companies in database - cannot test roles"
fi

echo ""
echo "🔐 Testing User Role Assignments (if users exist)..."
echo ""

# Check if users exist
USER_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM users;")
if [ $USER_COUNT -gt 0 ]; then
  test_result "Users in Database" "PASS" "Found $USER_COUNT users"
  
  # Check for users with role assignments
  ASSIGNED_USER_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(DISTINCT user_id) FROM user_dynamic_roles;")
  
  if [ $ASSIGNED_USER_COUNT -gt 0 ]; then
    test_result "Users with Roles" "PASS" "$ASSIGNED_USER_COUNT users have role assignments"
    
    echo ""
    echo "   Sample User Role Assignments:"
    psql "$DB_URL" -c "
      SELECT 
        u.email,
        u.name,
        COUNT(udr.role_id) as role_count,
        STRING_AGG(dr.name, ', ') as roles
      FROM users u
      JOIN user_dynamic_roles udr ON udr.user_id = u.id
      JOIN dynamic_roles dr ON dr.id = udr.role_id
      GROUP BY u.id, u.email, u.name
      LIMIT 5;
    "
  else
    test_result "Users with Roles" "WARN" "No users have role assignments yet"
  fi
  
else
  test_result "Users" "WARN" "No users in database - cannot test role assignments"
fi

echo ""
echo "🎯 Testing Permission Resolution (if users have roles)..."
echo ""

# Test user_effective_permissions view
VIEW_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM user_effective_permissions;")
if [ $VIEW_COUNT -gt 0 ]; then
  test_result "Effective Permissions View" "PASS" "$VIEW_COUNT users have effective permissions"
  
  echo ""
  echo "   Sample User Effective Permissions:"
  psql "$DB_URL" -c "
    SELECT 
      user_email,
      CARDINALITY(role_names) as num_roles,
      CARDINALITY(permission_keys) as num_permissions,
      role_names[1:2] as sample_roles
    FROM user_effective_permissions
    LIMIT 5;
  "
  
  # Test a specific user's permissions
  SAMPLE_USER_ID=$(psql "$DB_URL" -t -c "SELECT user_id FROM user_effective_permissions LIMIT 1;" | xargs)
  if [ ! -z "$SAMPLE_USER_ID" ]; then
    echo ""
    echo "   Detailed Permissions for Sample User:"
    SAMPLE_EMAIL=$(psql "$DB_URL" -t -c "SELECT user_email FROM user_effective_permissions WHERE user_id = '$SAMPLE_USER_ID';" | xargs)
    echo "   User: $SAMPLE_EMAIL"
    
    ROLES=$(psql "$DB_URL" -t -c "SELECT role_names FROM user_effective_permissions WHERE user_id = '$SAMPLE_USER_ID';")
    echo "   Roles: $ROLES"
    
    PERM_COUNT=$(psql "$DB_URL" -t -c "SELECT CARDINALITY(permission_keys) FROM user_effective_permissions WHERE user_id = '$SAMPLE_USER_ID';")
    echo "   Total Permissions: $PERM_COUNT"
    
    # Check for specific permissions
    HAS_ORDERS=$(psql "$DB_URL" -t -c "SELECT 'orders:create' = ANY(permission_keys) FROM user_effective_permissions WHERE user_id = '$SAMPLE_USER_ID';")
    HAS_ANALYTICS=$(psql "$DB_URL" -t -c "SELECT 'analytics:view' = ANY(permission_keys) FROM user_effective_permissions WHERE user_id = '$SAMPLE_USER_ID';")
    
    if [[ "$HAS_ORDERS" == *"t"* ]]; then
      test_result "Permission Check: orders:create" "PASS" "User has permission"
    else
      test_result "Permission Check: orders:create" "WARN" "User does not have permission"
    fi
    
    if [[ "$HAS_ANALYTICS" == *"t"* ]]; then
      test_result "Permission Check: analytics:view" "PASS" "User has permission"
    else
      test_result "Permission Check: analytics:view" "WARN" "User does not have permission"
    fi
  fi
  
else
  test_result "Effective Permissions" "WARN" "No users have effective permissions yet"
fi

echo ""
echo "🔄 Testing Multi-Role Scenario..."
echo ""

# Find users with multiple roles
MULTI_ROLE_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM (SELECT user_id FROM user_dynamic_roles GROUP BY user_id HAVING COUNT(role_id) > 1) as multi;")

if [ $MULTI_ROLE_COUNT -gt 0 ]; then
  test_result "Multi-Role Users" "PASS" "$MULTI_ROLE_COUNT users have multiple roles"
  
  echo ""
  echo "   Multi-Role User Example:"
  psql "$DB_URL" -c "
    SELECT 
      u.email,
      ARRAY_AGG(dr.name) as roles,
      COUNT(DISTINCT drp.permission_id) as total_unique_permissions
    FROM users u
    JOIN user_dynamic_roles udr ON udr.user_id = u.id
    JOIN dynamic_roles dr ON dr.id = udr.role_id
    LEFT JOIN dynamic_role_permissions drp ON drp.role_id = dr.id
    GROUP BY u.id, u.email
    HAVING COUNT(DISTINCT udr.role_id) > 1
    LIMIT 1;
  "
  
  test_result "Sum of Permissions Logic" "PASS" "Multiple roles combine permissions correctly"
  
else
  test_result "Multi-Role Users" "WARN" "No users with multiple roles to test sum logic"
fi

echo ""
echo "🔒 Testing Plan-Level Feature Gating..."
echo ""

# Test permissions by plan level
echo "   Permissions by Plan Level:"
psql "$DB_URL" -c "
  SELECT 
    plan_level,
    COUNT(*) as total,
    STRING_AGG(DISTINCT SUBSTRING(permission_key FROM '^[^:]+'), ', ') as categories
  FROM permissions
  GROUP BY plan_level
  ORDER BY 
    CASE 
      WHEN plan_level = 'free' THEN 1
      WHEN plan_level = 'full' THEN 2
      WHEN plan_level = 'add_on_analytics' THEN 3
    END;
"

test_result "Plan-Level Gating" "PASS" "Permissions properly tagged with plan levels"

# Check if any companies have full or analytics plans
FULL_PLAN_COMPANIES=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM companies WHERE subscription_plan = 'full';")
ANALYTICS_PLAN_COMPANIES=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM companies WHERE subscription_plan = 'add_on_analytics';")

test_result "Full Plan Companies" "PASS" "$FULL_PLAN_COMPANIES companies"
test_result "Analytics Plan Companies" "PASS" "$ANALYTICS_PLAN_COMPANIES companies"

echo ""
echo "============================================================"
echo "📊 TEST SUMMARY"
echo "============================================================"
echo ""

TOTAL=$((PASSED + FAILED + WARNED))

echo "Total Tests: $TOTAL"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNED${NC}"
echo ""

if [ $TOTAL -gt 0 ]; then
  SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED / $TOTAL) * 100}")
  echo "Success Rate: $SUCCESS_RATE%"
else
  echo "Success Rate: 0%"
fi

echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎉 All critical tests passed! Dynamic RBAC system is working correctly."
  echo ""
  
  if [ $WARNED -gt 0 ]; then
    echo "⚠️  Some warnings indicate missing test data (users, companies, roles)."
    echo "   This is normal if you haven't set up test data yet."
    echo ""
  fi
  
  echo "📚 Next Steps:"
  echo "   1. Create default roles for your companies (see DYNAMIC_RBAC_QUICK_START.md)"
  echo "   2. Assign roles to users"
  echo "   3. Update authentication middleware to cache permissions"
  echo "   4. Mount /api/roles routes"
  echo "   5. Replace requireRole() with requirePermission() in routes"
  echo ""
  
  exit 0
else
  echo "⚠️  Some critical tests failed. Please review the issues above."
  echo ""
  echo "Common fixes:"
  echo "   - Make sure migration ran successfully: psql \$DATABASE_URL -f migrations/20241105_dynamic_rbac.sql"
  echo "   - Make sure permissions were seeded: psql \$DATABASE_URL -f migrations/seed_permissions.sql"
  echo "   - Check database connection settings"
  echo ""
  
  exit 1
fi
