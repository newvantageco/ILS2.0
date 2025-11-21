-- Comprehensive Test Data for All Features
-- Run this to populate database with realistic test data

-- Variables (using WITH clause for reusability)
WITH constants AS (
  SELECT 
    'e635e4d5-0a44-4acf-a798-5ca3a450f601'::varchar AS company_id,
    '$2b$10$WNxx8GpypqOkJ3oUecMi7OHXgowzwEMvhrtpthkPZ3Q8Kym.CxEaa'::varchar AS password_hash
)

-- ========== CREATE ADDITIONAL TEST USERS ==========
INSERT INTO users (id, email, password, first_name, last_name, role, is_company_admin, company_id, account_status, subscription_plan, is_active, is_verified, can_prescribe, can_dispense)
SELECT 
  id, email, (SELECT password_hash FROM constants), first_name, last_name, role, is_company_admin, 
  (SELECT company_id FROM constants), 'active', 'full', true, true, can_prescribe, can_dispense
FROM (VALUES
  ('11111111-1111-1111-1111-111111111111', 'owner@test.com', 'Owner', 'Admin', 'admin', true, true, true),
  ('22222222-2222-2222-2222-222222222222', 'ecp1@test.com', 'Sarah', 'Johnson', 'ecp', true, true, true),
  ('33333333-3333-3333-3333-333333333333', 'ecp2@test.com', 'Michael', 'Chen', 'ecp', false, true, true),
  ('44444444-4444-4444-4444-444444444444', 'optometrist@test.com', 'Dr. Emily', 'Roberts', 'ecp', false, true, true),
  ('55555555-5555-5555-5555-555555555555', 'lab1@test.com', 'David', 'Martinez', 'lab_tech', false, false, false),
  ('66666666-6666-6666-6666-666666666666', 'lab2@test.com', 'Jennifer', 'Wilson', 'lab_tech', false, false, false),
  ('77777777-7777-7777-7777-777777777777', 'dispenser@test.com', 'Robert', 'Brown', 'dispenser', false, false, true),
  ('88888888-8888-8888-8888-888888888888', 'engineer@test.com', 'Lisa', 'Anderson', 'engineer', false, false, false),
  ('99999999-9999-9999-9999-999999999999', 'supplier@test.com', 'James', 'Taylor', 'supplier', false, false, false)
) AS t(id, email, first_name, last_name, role, is_company_admin, can_prescribe, can_dispense)
ON CONFLICT (email) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  is_company_admin = EXCLUDED.is_company_admin,
  account_status = 'active';

-- ========== CREATE TEST PATIENTS ==========
INSERT INTO patients (id, name, date_of_birth, email, phone, company_id, ecp_id, status)
SELECT 
  gen_random_uuid(), name, dob, email, phone,
  (SELECT company_id FROM constants),
  '22222222-2222-2222-2222-222222222222', -- Sarah Johnson
  'active'
FROM (VALUES
  ('John Smith', '1985-05-15', 'john.smith@email.com', '555-0101'),
  ('Emma Wilson', '1992-08-22', 'emma.wilson@email.com', '555-0102'),
  ('Oliver Brown', '1978-03-10', 'oliver.brown@email.com', '555-0103'),
  ('Sophia Davis', '1995-11-30', 'sophia.davis@email.com', '555-0104'),
  ('William Miller', '1988-07-18', 'william.miller@email.com', '555-0105'),
  ('Ava Garcia', '2000-01-25', 'ava.garcia@email.com', '555-0106'),
  ('James Rodriguez', '1970-09-08', 'james.rodriguez@email.com', '555-0107'),
  ('Isabella Martinez', '1998-12-14', 'isabella.martinez@email.com', '555-0108'),
  ('Lucas Anderson', '1982-04-20', 'lucas.anderson@email.com', '555-0109'),
  ('Mia Thompson', '1990-06-05', 'mia.thompson@email.com', '555-0110')
) AS t(name, dob, email, phone)
ON CONFLICT (email) DO NOTHING;

-- ========== CREATE TEST PRODUCTS ==========
INSERT INTO products (id, company_id, name, category, price, stock_quantity, is_active, created_at, updated_at)
SELECT
  gen_random_uuid(),
  (SELECT company_id FROM constants),
  name, category, price, stock, true, NOW(), NOW()
FROM (VALUES
  ('Single Vision Lens', 'lenses', '89.99', 100),
  ('Progressive Lens', 'lenses', '249.99', 50),
  ('Blue Light Filter', 'coatings', '49.99', 200),
  ('Anti-Glare Coating', 'coatings', '39.99', 150),
  ('Titanium Frame', 'frames', '199.99', 30),
  ('Acetate Frame', 'frames', '149.99', 45),
  ('Metal Frame', 'frames', '129.99', 60),
  ('Cleaning Kit', 'accessories', '19.99', 100),
  ('Lens Case', 'accessories', '9.99', 200),
  ('Microfiber Cloth', 'accessories', '4.99', 300)
) AS t(name, category, price, stock)
ON CONFLICT DO NOTHING;

-- ========== CREATE TEST ORDERS (using existing patients) ==========
INSERT INTO orders (id, patient_id, company_id, ecp_id, status, total_amount, order_date, notes, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  p.id,
  (SELECT company_id FROM constants),
  '22222222-2222-2222-2222-222222222222',
  (ARRAY['pending', 'processing', 'completed', 'shipped'])[floor(random() * 4 + 1)],
  (random() * 400 + 100)::numeric(10,2),
  NOW() - (random() * 30 || ' days')::interval,
  'Test order for ' || p.name,
  NOW(), NOW()
FROM patients p
WHERE p.company_id = (SELECT company_id FROM constants)
LIMIT 8
ON CONFLICT DO NOTHING;

-- ========== CREATE TEST PRESCRIPTIONS ==========
INSERT INTO prescriptions (id, patient_id, company_id, ecp_id, prescription_date, expiry_date, right_eye, left_eye, pd, notes, status, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  p.id,
  (SELECT company_id FROM constants),
  '44444444-4444-4444-4444-444444444444', -- Dr. Emily Roberts
  NOW() - (random() * 90 || ' days')::interval,
  NOW() + (365 || ' days')::interval,
  jsonb_build_object(
    'sphere', -2.50 + (random() * 2 - 1),
    'cylinder', -0.75 + (random() * 0.5),
    'axis', floor(random() * 180),
    'add', 0,
    'prism', 0
  ),
  jsonb_build_object(
    'sphere', -2.25 + (random() * 2 - 1),
    'cylinder', -0.50 + (random() * 0.5),
    'axis', floor(random() * 180),
    'add', 0,
    'prism', 0
  ),
  62 + floor(random() * 6),
  'Standard prescription for myopia correction',
  'active',
  NOW(), NOW()
FROM patients p
WHERE p.company_id = (SELECT company_id FROM constants)
LIMIT 5
ON CONFLICT DO NOTHING;

-- ========== CREATE TEST APPOINTMENTS ==========
INSERT INTO appointments (id, patient_id, provider_id, company_id, appointment_type, scheduled_at, duration, status, notes, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  p.id,
  '44444444-4444-4444-4444-444444444444', -- Dr. Emily Roberts
  (SELECT company_id FROM constants),
  (ARRAY['eye_exam', 'follow_up', 'consultation'])[floor(random() * 3 + 1)],
  NOW() + ((floor(random() * 20) - 10) || ' days')::interval + ((floor(random() * 8) + 9) || ' hours')::interval,
  30,
  CASE WHEN random() > 0.7 THEN 'completed' WHEN random() > 0.5 THEN 'scheduled' ELSE 'confirmed' END,
  'Regular checkup appointment',
  NOW(), NOW()
FROM patients p
WHERE p.company_id = (SELECT company_id FROM constants)
LIMIT 10
ON CONFLICT DO NOTHING;

-- ========== CREATE TEST EQUIPMENT ==========
INSERT INTO equipment (id, company_id, name, equipment_type, status, location, purchase_date, last_maintenance_date, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  (SELECT company_id FROM constants),
  name, type, status, 'Main Office', '2023-01-15', '2024-10-01', NOW(), NOW()
FROM (VALUES
  ('Phoropter Model A', 'refraction', 'operational'),
  ('Slit Lamp SL-1', 'examination', 'operational'),
  ('Tonometer T-200', 'diagnostic', 'operational'),
  ('Auto-Refractor AR-1', 'refraction', 'operational'),
  ('Keratometer K-500', 'diagnostic', 'maintenance')
) AS t(name, type, status)
ON CONFLICT DO NOTHING;

-- ========== CREATE TEST NOTIFICATIONS ==========
INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
SELECT 
  gen_random_uuid(),
  u.id,
  notif.title,
  notif.message,
  notif.type,
  random() > 0.7,
  NOW() - (random() * 7 || ' days')::interval
FROM users u
CROSS JOIN (VALUES
  ('New Order Received', 'Order has been placed and is awaiting processing', 'order'),
  ('Appointment Reminder', 'You have an appointment tomorrow at 2 PM', 'appointment'),
  ('Lab Results Ready', 'Lab results for patient are ready for review', 'lab'),
  ('Low Stock Alert', 'Progressive Lenses stock is running low', 'inventory'),
  ('Payment Received', 'Payment received for invoice', 'payment')
) AS notif(title, message, type)
WHERE u.company_id = (SELECT company_id FROM constants)
LIMIT 15
ON CONFLICT DO NOTHING;

-- ========== CREATE TEST TEST ROOMS ==========
INSERT INTO test_rooms (id, company_id, name, room_type, capacity, is_available, equipment, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  (SELECT company_id FROM constants),
  name, type, capacity, true, equipment, NOW(), NOW()
FROM (VALUES
  ('Exam Room 1', 'examination', 1, ARRAY['Phoropter', 'Slit Lamp']),
  ('Exam Room 2', 'examination', 1, ARRAY['Phoropter', 'Auto-Refractor']),
  ('Consultation Room', 'consultation', 3, ARRAY['Computer', 'Display Screen']),
  ('Testing Room', 'testing', 2, ARRAY['Vision Chart', 'Color Test'])
) AS t(name, type, capacity, equipment)
ON CONFLICT DO NOTHING;

-- Verification
SELECT 
  'Users' as entity, 
  COUNT(*) as count 
FROM users 
WHERE company_id = 'e635e4d5-0a44-4acf-a798-5ca3a450f601'
UNION ALL
SELECT 'Patients', COUNT(*) FROM patients WHERE company_id = 'e635e4d5-0a44-4acf-a798-5ca3a450f601'
UNION ALL
SELECT 'Products', COUNT(*) FROM products WHERE company_id = 'e635e4d5-0a44-4acf-a798-5ca3a450f601'
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders WHERE company_id = 'e635e4d5-0a44-4acf-a798-5ca3a450f601'
UNION ALL
SELECT 'Prescriptions', COUNT(*) FROM prescriptions WHERE company_id = 'e635e4d5-0a44-4acf-a798-5ca3a450f601'
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments WHERE company_id = 'e635e4d5-0a44-4acf-a798-5ca3a450f601'
UNION ALL
SELECT 'Equipment', COUNT(*) FROM equipment WHERE company_id = 'e635e4d5-0a44-4acf-a798-5ca3a450f601'
UNION ALL
SELECT 'Test Rooms', COUNT(*) FROM test_rooms WHERE company_id = 'e635e4d5-0a44-4acf-a798-5ca3a450f601'
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications WHERE user_id IN (SELECT id FROM users WHERE company_id = 'e635e4d5-0a44-4acf-a798-5ca3a450f601');
