-- Enable AI for New Vantage Co company
UPDATE companies 
SET 
  ai_enabled = true,
  is_subscription_exempt = true,
  subscription_plan = 'full',
  stripe_subscription_status = 'active'
WHERE 
  name ILIKE '%new vantage%' OR 
  name ILIKE '%newvantageco%' OR
  id IN (
    SELECT company_id 
    FROM users 
    WHERE email = 'saba@newvantageco.com'
  );

-- Also ensure the user is active and has full subscription
UPDATE users
SET 
  is_active = true,
  subscription_plan = 'full',
  role = 'platform_admin'
WHERE email = 'saba@newvantageco.com';

-- Verify the changes
SELECT 
  u.id as user_id,
  u.email,
  u.role,
  u.is_active,
  u.subscription_plan as user_plan,
  c.id as company_id,
  c.name as company_name,
  c.ai_enabled,
  c.subscription_plan as company_plan,
  c.stripe_subscription_status,
  c.is_subscription_exempt
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.email = 'saba@newvantageco.com';
