# Quick Platform Admin Setup

## Run this command in your terminal:

```bash
railway run bash -c 'psql $DATABASE_URL << EOF
INSERT INTO companies (id, name, type, status, email, subscription_plan, is_subscription_exempt, created_at, updated_at)
VALUES ('"'"'platform-admin-company'"'"', '"'"'ILS Platform Administration'"'"', '"'"'hybrid'"'"', '"'"'active'"'"', '"'"'care@newvantageco.com'"'"', '"'"'enterprise'"'"', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();

INSERT INTO users (id, company_id, account_status, email, password, first_name, last_name, role, subscription_plan, is_active, is_verified, last_login_at, created_at, updated_at)
VALUES (gen_random_uuid(), '"'"'platform-admin-company'"'"', '"'"'active'"'"', '"'"'care@newvantageco.com'"'"', '"'"'\$2b\$10\$Nntnf2NncPMEZ2qo5opUIuEVFmGFaWRD67ac/GGKdLVkJ0HA5bLCS'"'"', '"'"'Platform'"'"', '"'"'Admin'"'"', '"'"'platform_admin'"'"', '"'"'enterprise'"'"', true, true, NOW(), NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET role = '"'"'platform_admin'"'"', account_status = '"'"'active'"'"', is_active = true, is_verified = true, updated_at = NOW();

SELECT email, role, is_active FROM users WHERE email = '"'"'care@newvantageco.com'"'"';
EOF
'
```

## Login Details:
- **Email:** care@newvantageco.com
- **Password:** Eyecloud123
- **Role:** platform_admin

## If it says "Multiple services found":

Run `railway service` first, select your main app service, then run the command above.
