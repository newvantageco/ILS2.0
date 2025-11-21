-- AR Virtual Try-On Tables
-- Tracks AR sessions and favorite frames

CREATE TABLE IF NOT EXISTS ar_try_on_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id),
  company_id TEXT NOT NULL REFERENCES companies(id),
  
  device_info TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration INTEGER,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ar_try_on_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  session_id UUID NOT NULL REFERENCES ar_try_on_sessions(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  screenshot TEXT,
  notes TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add 3D model field to products table (if not exists)
ALTER TABLE products ADD COLUMN IF NOT EXISTS model_3d_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ar_enabled BOOLEAN DEFAULT FALSE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ar_sessions_user ON ar_try_on_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ar_sessions_company ON ar_try_on_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_ar_sessions_status ON ar_try_on_sessions(status);
CREATE INDEX IF NOT EXISTS idx_ar_sessions_created ON ar_try_on_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ar_favorites_user ON ar_try_on_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_ar_favorites_session ON ar_try_on_favorites(session_id);
CREATE INDEX IF NOT EXISTS idx_ar_favorites_product ON ar_try_on_favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_ar_favorites_created ON ar_try_on_favorites(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_ar_enabled ON products(ar_enabled) WHERE ar_enabled = TRUE;

-- Comments
COMMENT ON TABLE ar_try_on_sessions IS 'Tracks AR virtual try-on sessions for analytics';
COMMENT ON TABLE ar_try_on_favorites IS 'User favorites from AR try-on sessions';
COMMENT ON COLUMN products.model_3d_url IS 'URL to 3D model file (GLTF/GLB format) for AR try-on';
COMMENT ON COLUMN products.ar_enabled IS 'Whether product is available for AR virtual try-on';
