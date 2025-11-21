-- AI Documentation Logs Table
-- Tracks usage and performance of AI-powered clinical documentation

CREATE TABLE IF NOT EXISTS ai_documentation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  company_id TEXT NOT NULL REFERENCES companies(id),
  patient_id TEXT REFERENCES patients(id),
  
  documentation_type TEXT NOT NULL CHECK (documentation_type IN ('clinical_note', 'differential_diagnosis', 'auto_coding')),
  
  token_count INTEGER,
  generation_time_ms INTEGER,
  confidence DECIMAL(5, 4) CHECK (confidence >= 0 AND confidence <= 1),
  
  was_accepted BOOLEAN,
  user_edits TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_doc_logs_company ON ai_documentation_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_doc_logs_user ON ai_documentation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_doc_logs_patient ON ai_documentation_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_doc_logs_created ON ai_documentation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_doc_logs_type ON ai_documentation_logs(documentation_type);

-- Comments for documentation
COMMENT ON TABLE ai_documentation_logs IS 'Tracks AI-powered clinical documentation generation for analytics and billing';
COMMENT ON COLUMN ai_documentation_logs.documentation_type IS 'Type of AI documentation: clinical_note, differential_diagnosis, or auto_coding';
COMMENT ON COLUMN ai_documentation_logs.token_count IS 'Approximate AI tokens used (for billing)';
COMMENT ON COLUMN ai_documentation_logs.confidence IS 'AI confidence score from 0.0 to 1.0';
COMMENT ON COLUMN ai_documentation_logs.was_accepted IS 'null=pending, true=accepted, false=rejected by clinician';
COMMENT ON COLUMN ai_documentation_logs.user_edits IS 'JSON string of edits made by user before accepting';
