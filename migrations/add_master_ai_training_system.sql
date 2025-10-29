-- Migration: Master AI Training System
-- Date: 2025-10-29
-- Description: Adds AI model versioning, master training datasets, and deployment pipeline

-- AI Model Versions table (master AI versions)
CREATE TABLE IF NOT EXISTS ai_model_versions (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number VARCHAR(50) NOT NULL UNIQUE,
  model_name VARCHAR(100) NOT NULL DEFAULT 'ils-master-ai',
  description TEXT,
  training_data_count INTEGER DEFAULT 0,
  performance_metrics JSONB, -- accuracy, response_time, quality_scores
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, training, testing, approved, deployed, deprecated
  created_by VARCHAR(255) REFERENCES users(id),
  approved_by VARCHAR(255) REFERENCES users(id),
  approved_at TIMESTAMP,
  deployed_at TIMESTAMP,
  deprecated_at TIMESTAMP,
  deprecation_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_model_versions_status ON ai_model_versions(status);
CREATE INDEX IF NOT EXISTS idx_ai_model_versions_version ON ai_model_versions(version_number);

-- AI Model Deployments table (tracks which companies have which versions)
CREATE TABLE IF NOT EXISTS ai_model_deployments (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  model_version_id VARCHAR(255) NOT NULL REFERENCES ai_model_versions(id),
  version_number VARCHAR(50) NOT NULL,
  deployment_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, deploying, active, failed, rolled_back
  deployed_by VARCHAR(255) REFERENCES users(id),
  deployed_at TIMESTAMP,
  rollback_from_version VARCHAR(50),
  rollback_reason TEXT,
  performance_data JSONB, -- Company-specific performance metrics
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_deployments_company ON ai_model_deployments(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_deployments_version ON ai_model_deployments(model_version_id);
CREATE INDEX IF NOT EXISTS idx_ai_deployments_status ON ai_model_deployments(deployment_status);

-- Master Training Datasets table (curated by platform admin)
CREATE TABLE IF NOT EXISTS master_training_datasets (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version_id VARCHAR(255) REFERENCES ai_model_versions(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL, -- 'optical_terms', 'prescription_analysis', 'patient_care', 'product_knowledge'
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  content_type VARCHAR(50), -- 'qa_pair', 'document', 'conversation', 'guidelines'
  source VARCHAR(255), -- Original source of training data
  quality_score DECIMAL(3, 2), -- 0-1 quality rating
  usage_count INTEGER DEFAULT 0,
  effectiveness_rating DECIMAL(3, 2), -- Based on company feedback
  tags JSONB, -- Array of relevant tags
  metadata JSONB,
  created_by VARCHAR(255) NOT NULL REFERENCES users(id),
  approved_by VARCHAR(255) REFERENCES users(id),
  approved_at TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, deprecated
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_master_training_category ON master_training_datasets(category);
CREATE INDEX IF NOT EXISTS idx_master_training_status ON master_training_datasets(status);
CREATE INDEX IF NOT EXISTS idx_master_training_version ON master_training_datasets(model_version_id);

-- Training Data Usage Analytics table
CREATE TABLE IF NOT EXISTS training_data_analytics (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  training_data_id VARCHAR(255) NOT NULL REFERENCES master_training_datasets(id) ON DELETE CASCADE,
  company_id VARCHAR(255) REFERENCES companies(id) ON DELETE CASCADE,
  model_version_id VARCHAR(255) REFERENCES ai_model_versions(id),
  used_in_response BOOLEAN DEFAULT FALSE,
  response_quality_rating INTEGER, -- 1-5 rating from user feedback
  context TEXT, -- What question/scenario was this used for
  effectiveness_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_training_analytics_data ON training_data_analytics(training_data_id);
CREATE INDEX IF NOT EXISTS idx_training_analytics_company ON training_data_analytics(company_id);

-- Company AI Settings table (enhanced)
CREATE TABLE IF NOT EXISTS company_ai_settings (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  current_model_version VARCHAR(50),
  auto_update_enabled BOOLEAN DEFAULT FALSE, -- Auto-deploy new approved versions
  training_mode VARCHAR(50) DEFAULT 'hybrid', -- 'master_only', 'hybrid', 'company_custom'
  custom_training_enabled BOOLEAN DEFAULT TRUE, -- Allow company-specific training
  feedback_collection_enabled BOOLEAN DEFAULT TRUE,
  performance_threshold DECIMAL(3, 2) DEFAULT 0.80, -- Minimum acceptable performance
  last_training_sync TIMESTAMP,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_company_ai_settings_company ON company_ai_settings(company_id);

-- AI Training Jobs table (batch training processes)
CREATE TABLE IF NOT EXISTS ai_training_jobs (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version_id VARCHAR(255) REFERENCES ai_model_versions(id),
  job_type VARCHAR(50) NOT NULL, -- 'initial_training', 'incremental', 'retraining', 'evaluation'
  status VARCHAR(50) NOT NULL DEFAULT 'queued', -- queued, running, completed, failed, cancelled
  training_dataset_ids JSONB, -- Array of training dataset IDs used
  progress_percentage INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_seconds INTEGER,
  error_message TEXT,
  results JSONB, -- Training metrics, loss curves, validation scores
  created_by VARCHAR(255) NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_training_jobs_status ON ai_training_jobs(status);
CREATE INDEX IF NOT EXISTS idx_training_jobs_version ON ai_training_jobs(model_version_id);

-- Deployment Queue table (schedule deployments)
CREATE TABLE IF NOT EXISTS ai_deployment_queue (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version_id VARCHAR(255) NOT NULL REFERENCES ai_model_versions(id),
  company_ids JSONB, -- Array of company IDs to deploy to, or null for all
  deployment_type VARCHAR(50) NOT NULL, -- 'immediate', 'scheduled', 'gradual_rollout'
  scheduled_at TIMESTAMP,
  priority INTEGER DEFAULT 5, -- 1-10, higher = more urgent
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
  companies_deployed INTEGER DEFAULT 0,
  companies_failed INTEGER DEFAULT 0,
  error_log JSONB,
  created_by VARCHAR(255) NOT NULL REFERENCES users(id),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_deployment_queue_status ON ai_deployment_queue(status);
CREATE INDEX IF NOT EXISTS idx_deployment_queue_scheduled ON ai_deployment_queue(scheduled_at);

-- Insert initial master AI version
INSERT INTO ai_model_versions (version_number, model_name, description, status, created_at)
VALUES 
  ('v1.0.0', 'ils-master-ai', 'Initial master AI model for optical industry', 'approved', NOW())
ON CONFLICT DO NOTHING;

-- Create default company AI settings for existing companies
INSERT INTO company_ai_settings (company_id, current_model_version)
SELECT id, 'v1.0.0' FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM company_ai_settings WHERE company_ai_settings.company_id = companies.id
);

COMMENT ON TABLE ai_model_versions IS 'Master AI model versions managed by platform admin';
COMMENT ON TABLE ai_model_deployments IS 'Tracks AI model deployment to individual companies';
COMMENT ON TABLE master_training_datasets IS 'Curated training data for master AI model';
COMMENT ON TABLE training_data_analytics IS 'Analytics on training data effectiveness';
COMMENT ON TABLE company_ai_settings IS 'Per-company AI configuration and preferences';
COMMENT ON TABLE ai_training_jobs IS 'Background training job tracking';
COMMENT ON TABLE ai_deployment_queue IS 'Scheduled AI model deployments';
