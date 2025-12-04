INSERT INTO companies (id, name, type, status, email, subscription_plan, is_subscription_exempt, created_at, updated_at) VALUES ('platform-admin-company', 'ILS Platform Administration', 'hybrid', 'active', 'care@newvantageco.com', 'enterprise', true, NOW(), NOW()) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

INSERT INTO users (id, company_id, account_status, email, password, first_name, last_name, role, subscription_plan, is_active, is_verified, last_login_at, created_at, updated_at) VALUES (gen_random_uuid(), 'platform-admin-company', 'active', 'care@newvantageco.com', '$2b$10$Nntnf2NncPMEZ2qo5opUIuEVFmGFaWRD67ac/GGKdLVkJ0HA5bLCS', 'Platform', 'Admin', 'platform_admin', 'enterprise', true, true, NOW(), NOW(), NOW()) ON CONFLICT (email) DO UPDATE SET role = 'platform_admin', is_active = true, account_status = 'active';

SELECT email, role, is_active FROM users WHERE email = 'care@newvantageco.com';
