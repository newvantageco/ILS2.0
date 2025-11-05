-- Chunk 7: Cross-Tenant Analytics (Platform Admin Revenue Stream)
-- Migration to add platform analytics and market insights tables

-- Market Insights Table
-- Stores aggregated, anonymized industry data for monetization
CREATE TABLE IF NOT EXISTS market_insights (
  id VARCHAR(255) PRIMARY KEY,
  
  -- Insight metadata
  insight_type VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Time period
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  
  -- Geographic scope
  region VARCHAR(100),
  country VARCHAR(100),
  
  -- Data aggregation
  data_points JSONB NOT NULL,
  
  -- Sample size
  companies_included INTEGER NOT NULL,
  records_analyzed INTEGER NOT NULL,
  
  -- Confidence metrics
  confidence_level DECIMAL(5, 2),
  margin_of_error DECIMAL(5, 2),
  
  -- Monetization
  access_level VARCHAR(50) NOT NULL DEFAULT 'free',
  price DECIMAL(10, 2),
  
  -- Metadata
  generated_by VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for market_insights
CREATE INDEX IF NOT EXISTS idx_market_insights_type ON market_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_market_insights_category ON market_insights(category);
CREATE INDEX IF NOT EXISTS idx_market_insights_region ON market_insights(region);
CREATE INDEX IF NOT EXISTS idx_market_insights_period ON market_insights(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_market_insights_status ON market_insights(status);
CREATE INDEX IF NOT EXISTS idx_market_insights_access ON market_insights(access_level);

-- Platform Statistics Table
-- High-level metrics for platform monitoring and investor reporting
CREATE TABLE IF NOT EXISTS platform_statistics (
  id VARCHAR(255) PRIMARY KEY,
  
  -- Time period
  date DATE NOT NULL,
  period_type VARCHAR(50) NOT NULL DEFAULT 'daily',
  
  -- Company metrics
  total_companies INTEGER NOT NULL DEFAULT 0,
  active_companies INTEGER NOT NULL DEFAULT 0,
  new_companies_added INTEGER NOT NULL DEFAULT 0,
  companies_by_type JSONB,
  
  -- User metrics
  total_users INTEGER NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0,
  new_users_added INTEGER NOT NULL DEFAULT 0,
  
  -- Subscription metrics
  total_revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
  mrr DECIMAL(12, 2) NOT NULL DEFAULT 0,
  arr DECIMAL(12, 2) NOT NULL DEFAULT 0,
  churn_rate DECIMAL(5, 2),
  subscriptions_by_plan JSONB,
  
  -- Engagement metrics
  orders_created INTEGER NOT NULL DEFAULT 0,
  patients_added INTEGER NOT NULL DEFAULT 0,
  invoices_generated INTEGER NOT NULL DEFAULT 0,
  ai_queries_processed INTEGER NOT NULL DEFAULT 0,
  
  -- Platform health
  api_calls_total INTEGER NOT NULL DEFAULT 0,
  api_error_rate DECIMAL(5, 2),
  average_response_time INTEGER,
  uptime_percentage DECIMAL(5, 2),
  
  -- Network effects
  total_connections INTEGER NOT NULL DEFAULT 0,
  connection_requests_created INTEGER NOT NULL DEFAULT 0,
  connection_approval_rate DECIMAL(5, 2),
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for platform_statistics
CREATE INDEX IF NOT EXISTS idx_platform_statistics_date ON platform_statistics(date);
CREATE INDEX IF NOT EXISTS idx_platform_statistics_period ON platform_statistics(period_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_statistics_date_period ON platform_statistics(date, period_type);

-- Aggregated Metrics Table
-- Pre-computed aggregations for fast queries
CREATE TABLE IF NOT EXISTS aggregated_metrics (
  id VARCHAR(255) PRIMARY KEY,
  
  -- Metric identity
  metric_type VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  
  -- Dimensions
  company_type VARCHAR(50),
  region VARCHAR(100),
  product_type VARCHAR(100),
  
  -- Time period
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  granularity VARCHAR(50) NOT NULL,
  
  -- Aggregated values
  count INTEGER NOT NULL DEFAULT 0,
  sum DECIMAL(15, 2),
  average DECIMAL(15, 2),
  median DECIMAL(15, 2),
  min DECIMAL(15, 2),
  max DECIMAL(15, 2),
  std_dev DECIMAL(15, 2),
  
  -- Distribution
  percentile_25 DECIMAL(15, 2),
  percentile_50 DECIMAL(15, 2),
  percentile_75 DECIMAL(15, 2),
  percentile_90 DECIMAL(15, 2),
  percentile_95 DECIMAL(15, 2),
  
  -- Data quality
  sample_size INTEGER NOT NULL,
  completeness DECIMAL(5, 2),
  
  -- Refresh metadata
  last_refreshed TIMESTAMP NOT NULL DEFAULT NOW(),
  next_refresh_at TIMESTAMP,
  refresh_status VARCHAR(50) NOT NULL DEFAULT 'current',
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for aggregated_metrics
CREATE INDEX IF NOT EXISTS idx_aggregated_metrics_type ON aggregated_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_aggregated_metrics_category ON aggregated_metrics(category);
CREATE INDEX IF NOT EXISTS idx_aggregated_metrics_period ON aggregated_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_aggregated_metrics_dimensions ON aggregated_metrics(company_type, region, product_type);
CREATE INDEX IF NOT EXISTS idx_aggregated_metrics_refresh ON aggregated_metrics(refresh_status, next_refresh_at);

-- Comments for documentation
COMMENT ON TABLE market_insights IS 'Chunk 7: Aggregated industry insights for monetization';
COMMENT ON TABLE platform_statistics IS 'Chunk 7: Platform-wide metrics for monitoring and reporting';
COMMENT ON TABLE aggregated_metrics IS 'Chunk 7: Pre-computed metric aggregations for performance';

COMMENT ON COLUMN market_insights.companies_included IS 'Minimum threshold enforced for anonymization';
COMMENT ON COLUMN market_insights.access_level IS 'free=public, premium=paid tier, enterprise=custom pricing';
COMMENT ON COLUMN platform_statistics.mrr IS 'Monthly Recurring Revenue';
COMMENT ON COLUMN platform_statistics.arr IS 'Annual Recurring Revenue';
COMMENT ON COLUMN aggregated_metrics.sample_size IS 'Number of companies included in aggregation';
COMMENT ON COLUMN aggregated_metrics.refresh_status IS 'current=up to date, stale=needs refresh, error=failed';
