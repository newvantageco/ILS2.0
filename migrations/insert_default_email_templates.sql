-- Insert Default Email Templates
-- This migration creates pre-built email templates for the complete customer journey

-- Order Confirmation Template
INSERT INTO email_templates (
  name,
  company_id,
  email_type,
  subject,
  html_content,
  text_content,
  variables,
  is_default
) VALUES (
  'Order Confirmation - Default',
  (SELECT id FROM companies LIMIT 1), -- Will be created per company
  'order_confirmation',
  'Order Confirmation #{{orderNumber}} - {{companyName}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">Order Confirmed!</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Order #{{orderNumber}}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Dear {{customerName}},
              </p>
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Thank you for your order! We have received your order and it is now being processed.
              </p>
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Order Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Order Number:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 600; text-align: right;">{{orderNumber}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Order Date:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">{{orderDate}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Expected Completion:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">{{expectedDate}}</td>
                  </tr>
                </table>
              </div>
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                We will keep you updated on your order status via email. You can expect to hear from us when your order enters production and when it''s ready for collection.
              </p>
              <p style="margin: 30px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;">
                Best regards,<br>
                <strong>{{companyName}}</strong><br>
                {{companyPhone}}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.4;">
                This is an automated message from {{companyName}}<br>
                Please do not reply to this email
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Dear {{customerName}}, Thank you for your order! Order #{{orderNumber}} has been confirmed and is being processed. Expected completion: {{expectedDate}}. We will keep you updated. Best regards, {{companyName}}',
  '["customerName", "orderNumber", "orderDate", "expectedDate", "companyName", "companyPhone"]'::jsonb,
  true,
  'system'
) ON CONFLICT DO NOTHING;

-- Order In Production Template
INSERT INTO email_templates (
  name,
  company_id,
  email_type,
  subject,
  html_content,
  text_content,
  variables,
  is_default,
  )
) VALUES (
  'Order In Production - Default',
  (SELECT id FROM companies LIMIT 1),
  'order_update',
  'Your Order #{{orderNumber}} is Now in Production',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order In Production</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">🔧 In Production</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Order #{{orderNumber}}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Dear {{customerName}},
              </p>
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Great news! Your order has entered production and our lab team is now working on your lenses.
              </p>
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">What happens next?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 14px; line-height: 1.8;">
                  <li>Our skilled lab technicians are crafting your lenses</li>
                  <li>Quality control checks will be performed</li>
                  <li>You''ll receive an email when ready for collection</li>
                </ul>
              </div>
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Expected completion date: <strong>{{expectedDate}}</strong>
              </p>
              <p style="margin: 30px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;">
                Questions? Contact us at {{companyPhone}}<br>
                <strong>{{companyName}}</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.4;">
                This is an automated update from {{companyName}}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Dear {{customerName}}, Great news! Your order #{{orderNumber}} has entered production. Our lab team is now working on your lenses. Expected completion: {{expectedDate}}. Questions? Call {{companyPhone}}. - {{companyName}}',
  '["customerName", "orderNumber", "expectedDate", "companyName", "companyPhone"]'::jsonb,
  true,
  'system'
) ON CONFLICT DO NOTHING;

-- Order Quality Check Template
INSERT INTO email_templates (
  name,
  company_id,
  email_type,
  subject,
  html_content,
  text_content,
  variables,
  is_default,
  )
) VALUES (
  'Order Quality Check - Default',
  (SELECT id FROM companies LIMIT 1),
  'order_update',
  'Your Order #{{orderNumber}} is Undergoing Quality Checks',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quality Check</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">✓ Quality Check</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Order #{{orderNumber}}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Dear {{customerName}},
              </p>
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Your lenses have been manufactured and are now undergoing our rigorous quality control checks to ensure they meet our high standards.
              </p>
              <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">Quality Assurance Process:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #0c5460; font-size: 14px; line-height: 1.8;">
                  <li>Power and axis verification</li>
                  <li>Surface quality inspection</li>
                  <li>Coating and finish assessment</li>
                  <li>Final approval by senior optician</li>
                </ul>
              </div>
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Once approved, you''ll receive a notification that your order is ready for collection!
              </p>
              <p style="margin: 30px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;">
                Thank you for your patience,<br>
                <strong>{{companyName}}</strong><br>
                {{companyPhone}}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.4;">
                This is an automated update from {{companyName}}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Dear {{customerName}}, Your order #{{orderNumber}} is now undergoing quality control checks. We ensure every lens meets our high standards. You will be notified when ready for collection. - {{companyName}} {{companyPhone}}',
  '["customerName", "orderNumber", "companyName", "companyPhone"]'::jsonb,
  true,
  'system'
) ON CONFLICT DO NOTHING;

-- Order Ready for Collection Template
INSERT INTO email_templates (
  name,
  company_id,
  email_type,
  subject,
  html_content,
  text_content,
  variables,
  is_default,
  )
) VALUES (
  'Order Ready for Collection - Default',
  (SELECT id FROM companies LIMIT 1),
  'order_update',
  '🎉 Your Order #{{orderNumber}} is Ready for Collection!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ready for Collection</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 600;">🎉 Ready to Collect!</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 18px;">Order #{{orderNumber}}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Dear {{customerName}},
              </p>
              <p style="margin: 0 0 20px 0; color: #333; font-size: 18px; font-weight: 600; line-height: 1.6; color: #11998e;">
                Great news! Your order has passed all quality checks and is now ready for collection!
              </p>
              <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #155724; font-size: 18px;">Collection Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #155724; font-size: 14px;">Order Number:</td>
                    <td style="padding: 8px 0; color: #155724; font-size: 14px; font-weight: 600; text-align: right;">{{orderNumber}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #155724; font-size: 14px;">Collection Address:</td>
                    <td style="padding: 8px 0; color: #155724; font-size: 14px; text-align: right;">{{collectionAddress}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #155724; font-size: 14px;">Opening Hours:</td>
                    <td style="padding: 8px 0; color: #155724; font-size: 14px; text-align: right;">{{openingHours}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #155724; font-size: 14px;">Contact:</td>
                    <td style="padding: 8px 0; color: #155724; font-size: 14px; text-align: right;">{{companyPhone}}</td>
                  </tr>
                </table>
              </div>
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                  <strong>Please bring:</strong> Your order confirmation or this email for quick collection
                </p>
              </div>
              <p style="margin: 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                We look forward to seeing you! Our team will be happy to assist with fitting and any adjustments needed.
              </p>
              <p style="margin: 30px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;">
                See you soon,<br>
                <strong>{{companyName}}</strong><br>
                {{companyPhone}}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.4;">
                This is an automated notification from {{companyName}}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Dear {{customerName}}, Great news! Your order #{{orderNumber}} is ready for collection at {{collectionAddress}}. Opening hours: {{openingHours}}. Please bring this email or your order confirmation. Contact: {{companyPhone}}. See you soon! - {{companyName}}',
  '["customerName", "orderNumber", "collectionAddress", "openingHours", "companyName", "companyPhone"]'::jsonb,
  true,
  'system'
) ON CONFLICT DO NOTHING;

-- Order Completed Template
INSERT INTO email_templates (
  name,
  company_id,
  email_type,
  subject,
  html_content,
  text_content,
  variables,
  is_default,
  )
) VALUES (
  'Order Completed - Default',
  (SELECT id FROM companies LIMIT 1),
  'order_update',
  'Thank You! Order #{{orderNumber}} Completed',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Completed</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">Thank You!</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Order #{{orderNumber}} Completed</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Dear {{customerName}},
              </p>
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Thank you for collecting your order! We hope you enjoy your new lenses and that they serve you well.
              </p>
              <div style="background-color: #e8f4f8; border-left: 4px solid #17a2b8; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">Aftercare Tips:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #0c5460; font-size: 14px; line-height: 1.8;">
                  <li>Clean your lenses daily with the provided solution</li>
                  <li>Store in the protective case when not in use</li>
                  <li>Visit us for any adjustments or concerns</li>
                  <li>Schedule your next eye test in 12 months</li>
                </ul>
              </div>
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                If you experience any issues or need adjustments, please don''t hesitate to contact us or visit our practice.
              </p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">We''d love to hear about your experience!</p>
                <p style="margin: 0; color: #333; font-size: 16px; font-weight: 600;">Your feedback helps us improve</p>
              </div>
              <p style="margin: 30px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;">
                Thank you for choosing us,<br>
                <strong>{{companyName}}</strong><br>
                {{companyPhone}}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.4;">
                This is an automated message from {{companyName}}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Dear {{customerName}}, Thank you for collecting your order #{{orderNumber}}! Remember to clean your lenses daily and visit us for any adjustments. Schedule your next eye test in 12 months. Questions? Call {{companyPhone}}. - {{companyName}}',
  '["customerName", "orderNumber", "companyName", "companyPhone"]'::jsonb,
  true,
  'system'
) ON CONFLICT DO NOTHING;

COMMENT ON TABLE email_templates IS 'Pre-built default email templates created for the complete customer order journey';
