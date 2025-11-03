-- ============================================
-- Email Tracking & Communication System Migration
-- ============================================
-- This migration adds comprehensive email tracking capabilities
-- including templates, logs, and detailed engagement analytics

-- Create email type enum
CREATE TYPE email_type AS ENUM (
  'invoice',
  'receipt',
  'prescription_reminder',
  'recall_notification',
  'appointment_reminder',
  'order_confirmation',
  'order_update',
  'marketing',
  'general'
);

-- Create email status enum
CREATE TYPE email_status AS ENUM (
  'queued',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'failed',
  'spam'
);

-- Create email event type enum
CREATE TYPE email_event_type AS ENUM (
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'spam',
  'unsubscribed'
);

-- ============================================
-- Email Templates Table
-- ============================================
CREATE TABLE email_templates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id VARCHAR NOT NULL REFERENCES companies(id),
  
  -- Template details
  name VARCHAR(200) NOT NULL,
  description TEXT,
  email_type email_type NOT NULL,
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  
  -- Template variables (e.g., {{customerName}}, {{invoiceNumber}})
  variables JSONB,
  
  -- Settings
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_default BOOLEAN DEFAULT false,
  
  created_by VARCHAR NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for email_templates
CREATE INDEX idx_email_templates_company ON email_templates(company_id);
CREATE INDEX idx_email_templates_type ON email_templates(email_type);
CREATE INDEX idx_email_templates_active ON email_templates(is_active);

-- ============================================
-- Email Logs Table
-- ============================================
CREATE TABLE email_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id VARCHAR NOT NULL REFERENCES companies(id),
  
  -- Recipient info
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  patient_id VARCHAR REFERENCES patients(id),
  
  -- Email details
  email_type email_type NOT NULL,
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  
  -- Tracking
  status email_status DEFAULT 'queued' NOT NULL,
  tracking_id VARCHAR(100) UNIQUE,
  
  -- Related entities
  template_id VARCHAR REFERENCES email_templates(id),
  related_entity_type VARCHAR(50),
  related_entity_id VARCHAR,
  
  -- Delivery info
  sent_by VARCHAR NOT NULL REFERENCES users(id),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  
  -- Engagement tracking
  open_count INTEGER DEFAULT 0 NOT NULL,
  first_opened_at TIMESTAMP,
  last_opened_at TIMESTAMP,
  click_count INTEGER DEFAULT 0 NOT NULL,
  first_clicked_at TIMESTAMP,
  last_clicked_at TIMESTAMP,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0 NOT NULL,
  
  -- Metadata
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for email_logs
CREATE INDEX idx_email_logs_company ON email_logs(company_id);
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_patient ON email_logs(patient_id);
CREATE INDEX idx_email_logs_type ON email_logs(email_type);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX idx_email_logs_tracking_id ON email_logs(tracking_id);
CREATE INDEX idx_email_logs_related ON email_logs(related_entity_type, related_entity_id);

-- ============================================
-- Email Tracking Events Table
-- ============================================
CREATE TABLE email_tracking_events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email_log_id VARCHAR NOT NULL REFERENCES email_logs(id),
  
  -- Event details
  event_type email_event_type NOT NULL,
  event_data JSONB,
  
  -- User agent and location tracking
  user_agent TEXT,
  ip_address VARCHAR(45),
  location JSONB,
  device VARCHAR(50),
  
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for email_tracking_events
CREATE INDEX idx_email_tracking_events_log ON email_tracking_events(email_log_id);
CREATE INDEX idx_email_tracking_events_type ON email_tracking_events(event_type);
CREATE INDEX idx_email_tracking_events_timestamp ON email_tracking_events(timestamp);

-- ============================================
-- Permissions
-- ============================================
GRANT ALL ON email_templates TO neon;
GRANT ALL ON email_logs TO neon;
GRANT ALL ON email_tracking_events TO neon;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE email_templates IS 'Reusable email templates with variable substitution';
COMMENT ON TABLE email_logs IS 'Comprehensive log of all sent emails with engagement tracking';
COMMENT ON TABLE email_tracking_events IS 'Detailed event log for email opens, clicks, and other interactions';
COMMENT ON COLUMN email_logs.tracking_id IS 'Unique identifier for tracking pixel and link clicks';
COMMENT ON COLUMN email_logs.open_count IS 'Number of times the email was opened';
COMMENT ON COLUMN email_logs.click_count IS 'Number of times links in the email were clicked';
