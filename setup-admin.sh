#!/bin/bash
# Setup platform admin on Railway

echo "🔧 Creating platform admin user on Railway..."
echo ""

railway run bash -c 'psql $DATABASE_URL << EOF
-- Create platform admin company
INSERT INTO companies (
  id, name, type, status, email,
  subscription_plan, is_subscription_exempt,
  created_at, updated_at
) VALUES (
  '"'"'platform-admin-company'"'"',
  '"'"'ILS Platform Administration'"'"',
  '"'"'hybrid'"'"', '"'"'active'"'"', '"'"'care@newvantageco.com'"'"',
  '"'"'enterprise'"'"', true,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Create platform admin user
INSERT INTO users (
  id, company_id, account_status, email, password,
  first_name, last_name, role, subscription_plan,
  is_active, is_verified, last_login_at,
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '"'"'platform-admin-company'"'"',
  '"'"'active'"'"',
  '"'"'care@newvantageco.com'"'"',
  '"'"'\$2b\$10\$Nntnf2NncPMEZ2qo5opUIuEVFmGFaWRD67ac/GGKdLVkJ0HA5bLCS'"'"',
  '"'"'Platform'"'"', '"'"'Admin'"'"', '"'"'platform_admin'"'"', '"'"'enterprise'"'"',
  true, true, NOW(),
  NOW(), NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = '"'"'platform_admin'"'"',
  account_status = '"'"'active'"'"',
  is_active = true,
  is_verified = true,
  updated_at = NOW();

-- Show created user
SELECT email, role, is_active, account_status FROM users WHERE email = '"'"'care@newvantageco.com'"'"';
EOF
'

echo ""
echo "✅ Done! You should see the user details above."
echo ""
echo "Login credentials:"
echo "  Email: care@newvantageco.com"
echo "  Password: Eyecloud123"
echo "  Role: platform_admin"
