-- Enhanced Telehealth Tables
-- Video consultations, messages, and documents

CREATE TABLE IF NOT EXISTS telehealth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL REFERENCES companies(id),
  provider_id TEXT NOT NULL REFERENCES users(id),
  patient_id TEXT NOT NULL REFERENCES patients(id),
  appointment_id TEXT REFERENCES appointments(id),
  
  session_type TEXT NOT NULL CHECK (session_type IN ('video', 'async', 'phone')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  
  room_id TEXT,
  recording_url TEXT,
  
  scheduled_start TIMESTAMP,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  duration INTEGER,
  
  consent_given BOOLEAN DEFAULT FALSE,
  consent_timestamp TIMESTAMP,
  
  clinical_notes TEXT,
  prescription_issued BOOLEAN DEFAULT FALSE,
  follow_up_required BOOLEAN DEFAULT FALSE,
  
  technical_issues TEXT,
  patient_rating INTEGER CHECK (patient_rating >= 1 AND patient_rating <= 5),
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telehealth_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES telehealth_sessions(id) ON DELETE CASCADE,
  
  sender_id TEXT NOT NULL REFERENCES users(id),
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'file', 'prescription')),
  content TEXT NOT NULL,
  attachment_url TEXT,
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telehealth_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES telehealth_sessions(id) ON DELETE CASCADE,
  
  document_type TEXT NOT NULL CHECK (document_type IN ('consent', 'prescription', 'image', 'test_result')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_telehealth_sessions_company ON telehealth_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_telehealth_sessions_provider ON telehealth_sessions(provider_id);
CREATE INDEX IF NOT EXISTS idx_telehealth_sessions_patient ON telehealth_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_telehealth_sessions_status ON telehealth_sessions(status);
CREATE INDEX IF NOT EXISTS idx_telehealth_sessions_scheduled ON telehealth_sessions(scheduled_start);

CREATE INDEX IF NOT EXISTS idx_telehealth_messages_session ON telehealth_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_telehealth_messages_sender ON telehealth_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_telehealth_messages_created ON telehealth_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_telehealth_documents_session ON telehealth_documents(session_id);
CREATE INDEX IF NOT EXISTS idx_telehealth_documents_type ON telehealth_documents(document_type);

-- Comments
COMMENT ON TABLE telehealth_sessions IS 'Video consultation sessions and telehealth appointments';
COMMENT ON TABLE telehealth_messages IS 'Asynchronous messages between patient and provider';
COMMENT ON TABLE telehealth_documents IS 'Documents shared during telehealth sessions';
