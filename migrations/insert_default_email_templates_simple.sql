-- Insert Default Email Templates for Order Journey
-- Simplified version that works with existing schema

-- Get first company ID for default templates
DO $$
DECLARE
  first_company_id VARCHAR;
  first_user_id VARCHAR;
BEGIN
  SELECT id INTO first_company_id FROM companies LIMIT 1;
  SELECT id INTO first_user_id FROM users WHERE role = 'admin' LIMIT 1;
  
  IF first_company_id IS NULL THEN
    RAISE NOTICE 'No companies found - templates will not be created';
    RETURN;
  END IF;
  
  IF first_user_id IS NULL THEN
    RAISE NOTICE 'No admin users found - templates will not be created';
    RETURN;
  END IF;

  -- Order Confirmation Template
  INSERT INTO email_templates (
    name, company_id, email_type, subject, html_content, text_content, variables, is_default, created_by
  ) VALUES (
    'Order Confirmation - Default',
    first_company_id,
    'order_confirmation',
    'Order Confirmation #{{orderNumber}} - {{companyName}}',
    '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #667eea;">Order Confirmed!</h1><p>Dear {{customerName}},</p><p>Thank you for your order! We have received your order and it is now being processed.</p><div style="background: #f8f9fa; padding: 15px; margin: 20px 0;"><strong>Order #:</strong> {{orderNumber}}<br><strong>Order Date:</strong> {{orderDate}}<br><strong>Expected:</strong> {{expectedDate}}</div><p>We will keep you updated on your order status via email.</p><p>Best regards,<br>{{companyName}}<br>{{companyPhone}}</p></div></body></html>',
    'Dear {{customerName}}, Thank you for your order! Order #{{orderNumber}} confirmed. Expected completion: {{expectedDate}}. - {{companyName}}',
    '["customerName", "orderNumber", "orderDate", "expectedDate", "companyName", "companyPhone"]'::jsonb,
    true,
    first_user_id
  ) ON CONFLICT DO NOTHING;

  -- Production Started Template
  INSERT INTO email_templates (
    name, company_id, email_type, subject, html_content, text_content, variables, is_default, created_by
  ) VALUES (
    'Order In Production - Default',
    first_company_id,
    'order_update',
    'Your Order #{{orderNumber}} is Now in Production',
    '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #f5576c;">🔧 In Production</h1><p>Dear {{customerName}},</p><p>Great news! Your order has entered production and our lab team is now working on your lenses.</p><div style="background: #fff3cd; padding: 15px; margin: 20px 0;"><strong>What happens next?</strong><ul><li>Our skilled lab technicians are crafting your lenses</li><li>Quality control checks will be performed</li><li>You''ll receive an email when ready for collection</li></ul></div><p>Expected completion: <strong>{{expectedDate}}</strong></p><p>Questions? {{companyPhone}}<br>{{companyName}}</p></div></body></html>',
    'Dear {{customerName}}, Your order #{{orderNumber}} is in production. Expected: {{expectedDate}}. - {{companyName}} {{companyPhone}}',
    '["customerName", "orderNumber", "expectedDate", "companyName", "companyPhone"]'::jsonb,
    true,
    first_user_id
  ) ON CONFLICT DO NOTHING;

  -- Quality Check Template
  INSERT INTO email_templates (
    name, company_id, email_type, subject, html_content, text_content, variables, is_default, created_by
  ) VALUES (
    'Order Quality Check - Default',
    first_company_id,
    'order_update',
    'Your Order #{{orderNumber}} is Undergoing Quality Checks',
    '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #00f2fe;">✓ Quality Check</h1><p>Dear {{customerName}},</p><p>Your lenses have been manufactured and are now undergoing our rigorous quality control checks.</p><div style="background: #d1ecf1; padding: 15px; margin: 20px 0;"><strong>Quality Assurance:</strong><ul><li>Power and axis verification</li><li>Surface quality inspection</li><li>Coating assessment</li><li>Final approval</li></ul></div><p>Once approved, you''ll receive a notification!</p><p>{{companyName}}<br>{{companyPhone}}</p></div></body></html>',
    'Dear {{customerName}}, Your order #{{orderNumber}} is undergoing quality checks. - {{companyName}} {{companyPhone}}',
    '["customerName", "orderNumber", "companyName", "companyPhone"]'::jsonb,
    true,
    first_user_id
  ) ON CONFLICT DO NOTHING;

  -- Ready for Collection Template
  INSERT INTO email_templates (
    name, company_id, email_type, subject, html_content, text_content, variables, is_default, created_by
  ) VALUES (
    'Order Ready for Collection - Default',
    first_company_id,
    'order_update',
    '🎉 Your Order #{{orderNumber}} is Ready for Collection!',
    '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #38ef7d;">🎉 Ready to Collect!</h1><p>Dear {{customerName}},</p><p style="font-size: 18px; color: #11998e;"><strong>Great news! Your order is ready for collection!</strong></p><div style="background: #d4edda; padding: 15px; margin: 20px 0;"><strong>Collection Details:</strong><br>Order: {{orderNumber}}<br>Address: {{collectionAddress}}<br>Hours: {{openingHours}}<br>Phone: {{companyPhone}}</div><p style="background: #fff3cd; padding: 10px;"><strong>Please bring:</strong> Your order confirmation or this email</p><p>We look forward to seeing you!<br>{{companyName}}</p></div></body></html>',
    'Dear {{customerName}}, Your order #{{orderNumber}} is ready at {{collectionAddress}}. Hours: {{openingHours}}. See you soon! - {{companyName}}',
    '["customerName", "orderNumber", "collectionAddress", "openingHours", "companyName", "companyPhone"]'::jsonb,
    true,
    first_user_id
  ) ON CONFLICT DO NOTHING;

  -- Order Completed Template
  INSERT INTO email_templates (
    name, company_id, email_type, subject, html_content, text_content, variables, is_default, created_by
  ) VALUES (
    'Order Completed - Default',
    first_company_id,
    'order_update',
    'Thank You! Order #{{orderNumber}} Completed',
    '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #667eea;">Thank You!</h1><p>Dear {{customerName}},</p><p>Thank you for collecting your order! We hope you enjoy your new lenses.</p><div style="background: #e8f4f8; padding: 15px; margin: 20px 0;"><strong>Aftercare Tips:</strong><ul><li>Clean your lenses daily</li><li>Store in protective case</li><li>Visit us for adjustments</li><li>Schedule next eye test in 12 months</li></ul></div><p>If you need any adjustments, please contact us.</p><p>Thank you for choosing us,<br>{{companyName}}<br>{{companyPhone}}</p></div></body></html>',
    'Dear {{customerName}}, Thank you for collecting order #{{orderNumber}}! Schedule your next eye test in 12 months. - {{companyName}} {{companyPhone}}',
    '["customerName", "orderNumber", "companyName", "companyPhone"]'::jsonb,
    true,
    first_user_id
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Successfully created 5 default email templates for company %', first_company_id;
END $$;
