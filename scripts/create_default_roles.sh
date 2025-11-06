#!/bin/bash

# Create default roles for all companies
# This script creates the 8 default role templates for each company

DB_URL="postgres://neon:npg@localhost:5432/ils_db"

echo "🚀 Creating default roles for all companies..."
echo ""

# Get all company IDs
COMPANY_IDS=$(psql "$DB_URL" -t -c "SELECT id FROM companies;")

if [ -z "$COMPANY_IDS" ]; then
  echo "❌ No companies found in database"
  exit 1
fi

# Count companies
COMPANY_COUNT=$(echo "$COMPANY_IDS" | wc -l | xargs)
echo "Found $COMPANY_COUNT companies"
echo ""

# Process each company
while IFS= read -r COMPANY_ID; do
  # Trim whitespace
  COMPANY_ID=$(echo "$COMPANY_ID" | xargs)
  
  if [ -z "$COMPANY_ID" ]; then
    continue
  fi
  
  # Get company name
  COMPANY_NAME=$(psql "$DB_URL" -t -c "SELECT name FROM companies WHERE id = '$COMPANY_ID';" | xargs)
  
  echo "📦 Creating roles for: $COMPANY_NAME"
  
  # Check if roles already exist
  EXISTING_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM dynamic_roles WHERE company_id = '$COMPANY_ID';" | xargs)
  
  if [ "$EXISTING_COUNT" -gt 0 ]; then
    echo "   ⚠️  Already has $EXISTING_COUNT roles - skipping"
    echo ""
    continue
  fi
  
  # Create roles using SQL
  psql "$DB_URL" <<SQL
  
  -- Create Admin role (protected)
  INSERT INTO dynamic_roles (company_id, name, description, is_deletable)
  VALUES ('$COMPANY_ID', 'Admin', 'Full administrative access to all features', false)
  RETURNING id;
  
SQL

  # Get the created role IDs and assign permissions
  ADMIN_ROLE_ID=$(psql "$DB_URL" -t -c "SELECT id FROM dynamic_roles WHERE company_id = '$COMPANY_ID' AND name = 'Admin';" | xargs)
  
  # Assign all permissions to Admin (except analytics-only)
  psql "$DB_URL" -q <<SQL
  INSERT INTO dynamic_role_permissions (role_id, permission_id)
  SELECT '$ADMIN_ROLE_ID', id 
  FROM permissions 
  WHERE plan_level IN ('free', 'full');
SQL

  # Create other roles
  psql "$DB_URL" -q <<SQL
  
  -- Eye Care Professional
  INSERT INTO dynamic_roles (company_id, name, description, is_deletable)
  VALUES ('$COMPANY_ID', 'Eye Care Professional', 'Optometrist/ophthalmologist with full clinical access', true);
  
  -- Lab Technician
  INSERT INTO dynamic_roles (company_id, name, description, is_deletable)
  VALUES ('$COMPANY_ID', 'Lab Technician', 'Lab production and equipment management', true);
  
  -- Engineer
  INSERT INTO dynamic_roles (company_id, name, description, is_deletable)
  VALUES ('$COMPANY_ID', 'Engineer', 'Technical staff for equipment and calibration', true);
  
  -- Supplier
  INSERT INTO dynamic_roles (company_id, name, description, is_deletable)
  VALUES ('$COMPANY_ID', 'Supplier', 'External supplier with limited order access', true);
  
  -- Optometrist
  INSERT INTO dynamic_roles (company_id, name, description, is_deletable)
  VALUES ('$COMPANY_ID', 'Optometrist', 'Basic clinical access for examinations and prescriptions', true);
  
  -- Dispenser
  INSERT INTO dynamic_roles (company_id, name, description, is_deletable)
  VALUES ('$COMPANY_ID', 'Dispenser', 'Optical dispenser with order and inventory access', true);
  
  -- Retail Assistant
  INSERT INTO dynamic_roles (company_id, name, description, is_deletable)
  VALUES ('$COMPANY_ID', 'Retail Assistant', 'Front desk and basic customer service', true);
  
SQL

  # Get role IDs
  ECP_ID=$(psql "$DB_URL" -t -c "SELECT id FROM dynamic_roles WHERE company_id = '$COMPANY_ID' AND name = 'Eye Care Professional';" | xargs)
  LAB_ID=$(psql "$DB_URL" -t -c "SELECT id FROM dynamic_roles WHERE company_id = '$COMPANY_ID' AND name = 'Lab Technician';" | xargs)
  ENG_ID=$(psql "$DB_URL" -t -c "SELECT id FROM dynamic_roles WHERE company_id = '$COMPANY_ID' AND name = 'Engineer';" | xargs)
  SUP_ID=$(psql "$DB_URL" -t -c "SELECT id FROM dynamic_roles WHERE company_id = '$COMPANY_ID' AND name = 'Supplier';" | xargs)
  OPT_ID=$(psql "$DB_URL" -t -c "SELECT id FROM dynamic_roles WHERE company_id = '$COMPANY_ID' AND name = 'Optometrist';" | xargs)
  DIS_ID=$(psql "$DB_URL" -t -c "SELECT id FROM dynamic_roles WHERE company_id = '$COMPANY_ID' AND name = 'Dispenser';" | xargs)
  RET_ID=$(psql "$DB_URL" -t -c "SELECT id FROM dynamic_roles WHERE company_id = '$COMPANY_ID' AND name = 'Retail Assistant';" | xargs)
  
  # Assign permissions to ECP
  psql "$DB_URL" -q <<SQL
  INSERT INTO dynamic_role_permissions (role_id, permission_id)
  SELECT '$ECP_ID', id FROM permissions WHERE permission_key IN (
    'patients:view', 'patients:create', 'patients:edit',
    'examinations:view', 'examinations:create', 'examinations:edit',
    'prescriptions:view', 'prescriptions:create', 'prescriptions:sign',
    'orders:view', 'orders:create',
    'reports:view'
  );
SQL

  # Assign permissions to Lab Technician
  psql "$DB_URL" -q <<SQL
  INSERT INTO dynamic_role_permissions (role_id, permission_id)
  SELECT '$LAB_ID', id FROM permissions WHERE permission_key IN (
    'lab:view_jobs', 'lab:create_jobs', 'lab:manage_jobs', 'lab:quality_control',
    'inventory:view', 'inventory:edit',
    'equipment:view', 'equipment:manage',
    'orders:view'
  );
SQL

  # Assign permissions to Engineer
  psql "$DB_URL" -q <<SQL
  INSERT INTO dynamic_role_permissions (role_id, permission_id)
  SELECT '$ENG_ID', id FROM permissions WHERE permission_key IN (
    'equipment:view', 'equipment:manage', 'equipment:calibrate',
    'inventory:view',
    'reports:view'
  );
SQL

  # Assign permissions to Supplier
  psql "$DB_URL" -q <<SQL
  INSERT INTO dynamic_role_permissions (role_id, permission_id)
  SELECT '$SUP_ID', id FROM permissions WHERE permission_key IN (
    'orders:view',
    'inventory:view'
  );
SQL

  # Assign permissions to Optometrist
  psql "$DB_URL" -q <<SQL
  INSERT INTO dynamic_role_permissions (role_id, permission_id)
  SELECT '$OPT_ID', id FROM permissions WHERE permission_key IN (
    'patients:view', 'patients:create',
    'examinations:view', 'examinations:create',
    'prescriptions:view', 'prescriptions:create',
    'orders:view',
    'reports:view'
  );
SQL

  # Assign permissions to Dispenser
  psql "$DB_URL" -q <<SQL
  INSERT INTO dynamic_role_permissions (role_id, permission_id)
  SELECT '$DIS_ID', id FROM permissions WHERE permission_key IN (
    'patients:view',
    'orders:view', 'orders:create', 'orders:edit',
    'inventory:view',
    'prescriptions:view'
  );
SQL

  # Assign permissions to Retail Assistant
  psql "$DB_URL" -q <<SQL
  INSERT INTO dynamic_role_permissions (role_id, permission_id)
  SELECT '$RET_ID', id FROM permissions WHERE permission_key IN (
    'patients:view',
    'orders:view',
    'inventory:view'
  );
SQL

  # Count roles and permissions created
  ROLE_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM dynamic_roles WHERE company_id = '$COMPANY_ID';" | xargs)
  
  echo "   ✅ Created $ROLE_COUNT roles:"
  
  # Show roles with permission counts
  psql "$DB_URL" -t -c "
    SELECT '      - ' || dr.name || ' (' || COUNT(drp.permission_id) || ' permissions)'
    FROM dynamic_roles dr
    LEFT JOIN dynamic_role_permissions drp ON drp.role_id = dr.id
    WHERE dr.company_id = '$COMPANY_ID'
    GROUP BY dr.id, dr.name
    ORDER BY dr.name;
  "
  
  echo ""
  
done <<< "$COMPANY_IDS"

echo "✅ Done! All companies now have default roles."
echo ""
echo "📊 Summary:"
psql "$DB_URL" -c "
  SELECT 
    c.name as company,
    COUNT(DISTINCT dr.id) as roles,
    COUNT(drp.permission_id) as total_permissions
  FROM companies c
  LEFT JOIN dynamic_roles dr ON dr.company_id = c.id
  LEFT JOIN dynamic_role_permissions drp ON drp.role_id = dr.id
  GROUP BY c.id, c.name
  ORDER BY c.name;
"
