-- Migration: Add Multi-tenant Companies and AI Assistant System
-- Date: 2025-10-28
-- Description: Adds company profiles, supplier relationships, and AI assistant features with progressive learning

-- ============== ENUMS ==============

-- Company-related enums
CREATE TYPE company_type AS ENUM ('ecp', 'lab', 'supplier', 'hybrid');
CREATE TYPE company_status AS ENUM ('active', 'suspended', 'pending_approval', 'deactivated');

-- AI-related enums
CREATE TYPE ai_conversation_status AS ENUM ('active', 'resolved', 'archived');
CREATE TYPE ai_message_role AS ENUM ('user', 'assistant', 'system');

-- ============== COMPANIES TABLE ==============

CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type company_type NOT NULL,
  status company_status NOT NULL DEFAULT 'pending_approval',
  email VARCHAR NOT NULL,
  phone VARCHAR,
  website VARCHAR,
  address JSONB,
  
  -- Registration details
  registration_number VARCHAR,
  goc_number VARCHAR,
  tax_id VARCHAR,
  
  -- Subscription and billing
  subscription_plan subscription_plan NOT NULL DEFAULT 'free_ecp',
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  billing_email VARCHAR,
  
  -- Settings and preferences
  settings JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  
  -- AI settings
  ai_enabled BOOLEAN DEFAULT TRUE,
  ai_model VARCHAR DEFAULT 'gpt-4',
  use_external_ai BOOLEAN DEFAULT TRUE,
  ai_learning_progress INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(type);

-- ============== COMPANY SUPPLIER RELATIONSHIPS ==============

CREATE TABLE IF NOT EXISTS company_supplier_relationships (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL DEFAULT 'pending',
  approved_by VARCHAR REFERENCES users(id),
  approved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_company_supplier_company ON company_supplier_relationships(company_id);
CREATE INDEX IF NOT EXISTS idx_company_supplier_supplier ON company_supplier_relationships(supplier_id);

-- ============== AI CONVERSATIONS ==============

CREATE TABLE IF NOT EXISTS ai_conversations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  status ai_conversation_status NOT NULL DEFAULT 'active',
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_company ON ai_conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);

-- ============== AI MESSAGES ==============

CREATE TABLE IF NOT EXISTS ai_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id VARCHAR NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role ai_message_role NOT NULL,
  content TEXT NOT NULL,
  used_external_ai BOOLEAN DEFAULT TRUE,
  confidence DECIMAL(3,2),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);

-- ============== AI KNOWLEDGE BASE ==============

CREATE TABLE IF NOT EXISTS ai_knowledge_base (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  uploaded_by VARCHAR NOT NULL REFERENCES users(id),
  
  -- Document details
  filename TEXT NOT NULL,
  file_type VARCHAR NOT NULL,
  file_size INTEGER,
  file_url TEXT,
  
  -- Processed content
  content TEXT,
  summary TEXT,
  tags JSONB,
  embeddings JSONB,
  
  -- Metadata
  category VARCHAR,
  is_active BOOLEAN DEFAULT TRUE,
  processing_status VARCHAR DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_company ON ai_knowledge_base(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_category ON ai_knowledge_base(category);

-- ============== AI LEARNING DATA ==============

CREATE TABLE IF NOT EXISTS ai_learning_data (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Learning source
  source_type VARCHAR NOT NULL,
  source_id VARCHAR,
  
  -- Learned information
  question TEXT,
  answer TEXT,
  context JSONB,
  category VARCHAR,
  
  -- Quality metrics
  use_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2) DEFAULT 1.00,
  last_used TIMESTAMP,
  
  -- Confidence and validation
  confidence DECIMAL(3,2) DEFAULT 0.50,
  is_validated BOOLEAN DEFAULT FALSE,
  validated_by VARCHAR REFERENCES users(id),
  validated_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_learning_company ON ai_learning_data(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_learning_category ON ai_learning_data(category);
CREATE INDEX IF NOT EXISTS idx_ai_learning_confidence ON ai_learning_data(confidence);

-- ============== AI FEEDBACK ==============

CREATE TABLE IF NOT EXISTS ai_feedback (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id VARCHAR NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  helpful BOOLEAN,
  accurate BOOLEAN,
  comments TEXT,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_message ON ai_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_company ON ai_feedback(company_id);

-- ============== UPDATE USERS TABLE ==============

-- Add company_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id VARCHAR REFERENCES companies(id) ON DELETE CASCADE;

-- ============== MIGRATION COMPLETE ==============

COMMENT ON TABLE companies IS 'Multi-tenant company profiles for ECPs, labs, and suppliers';
COMMENT ON TABLE ai_conversations IS 'AI assistant conversation sessions';
COMMENT ON TABLE ai_messages IS 'Individual messages in AI conversations';
COMMENT ON TABLE ai_knowledge_base IS 'Documents and data uploaded by companies for AI learning';
COMMENT ON TABLE ai_learning_data IS 'Learned Q&A pairs and knowledge extracted from conversations and documents';
COMMENT ON TABLE ai_feedback IS 'User feedback on AI responses for quality improvement';
