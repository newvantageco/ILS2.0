-- SaaS Analytics Tables Migration
-- Adds tables for feature usage tracking, customer cohorts, churn prediction, and health scores

-- Feature Usage Events Table
CREATE TABLE IF NOT EXISTS "usage_events" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" VARCHAR NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "feature_name" VARCHAR(100) NOT NULL,
  "event_type" VARCHAR(50) NOT NULL, -- 'feature_used', 'api_call', 'page_view', etc.
  "metadata" JSONB,
  "response_time_ms" INTEGER,
  "success" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "session_id" VARCHAR(255)
);

CREATE INDEX "idx_usage_events_company" ON "usage_events"("company_id");
CREATE INDEX "idx_usage_events_feature" ON "usage_events"("feature_name");
CREATE INDEX "idx_usage_events_user" ON "usage_events"("user_id");
CREATE INDEX "idx_usage_events_created" ON "usage_events"("created_at");

-- Feature Usage Metrics (Aggregated)
CREATE TABLE IF NOT EXISTS "feature_usage_metrics" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" VARCHAR NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "feature_name" VARCHAR(100) NOT NULL,
  "tier" VARCHAR(50) NOT NULL, -- 'free', 'pro', 'premium', 'enterprise'
  "usage_count" INTEGER DEFAULT 0 NOT NULL,
  "active_users" INTEGER DEFAULT 0 NOT NULL,
  "last_used_at" TIMESTAMP,
  "period_start" TIMESTAMP NOT NULL,
  "period_end" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE("company_id", "feature_name", "period_start")
);

CREATE INDEX "idx_feature_usage_company" ON "feature_usage_metrics"("company_id");
CREATE INDEX "idx_feature_usage_period" ON "feature_usage_metrics"("period_start", "period_end");

-- Customer Cohorts
CREATE TABLE IF NOT EXISTS "customer_cohorts" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "cohort_name" VARCHAR(100) NOT NULL,
  "cohort_period" VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'annual'
  "period_start" TIMESTAMP NOT NULL,
  "period_end" TIMESTAMP NOT NULL,
  "segment" VARCHAR(50) DEFAULT 'all', -- 'all', 'enterprise', 'smb', etc.
  "total_customers" INTEGER DEFAULT 0 NOT NULL,
  "retention_data" JSONB, -- {month_0: 100, month_1: 85, month_2: 72, ...}
  "mrr_data" JSONB, -- {month_0: 50000, month_1: 48000, ...}
  "avg_retention_rate" DECIMAL(5, 2),
  "avg_mrr" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE("cohort_name", "period_start")
);

CREATE INDEX "idx_cohorts_period" ON "customer_cohorts"("period_start");
CREATE INDEX "idx_cohorts_segment" ON "customer_cohorts"("segment");

-- Customer Health Scores
CREATE TABLE IF NOT EXISTS "customer_health_scores" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" VARCHAR NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "overall_score" INTEGER NOT NULL, -- 0-100
  "engagement_score" INTEGER NOT NULL,
  "adoption_score" INTEGER NOT NULL,
  "satisfaction_score" INTEGER NOT NULL,
  "financial_score" INTEGER NOT NULL,
  "technical_score" INTEGER NOT NULL,
  "risk_level" VARCHAR(20) NOT NULL, -- 'excellent', 'good', 'at_risk', 'critical'
  "trend" VARCHAR(20) DEFAULT 'stable', -- 'improving', 'stable', 'declining'
  "score_history" JSONB, -- [{date: '2024-01', score: 85}, ...]
  "primary_concerns" JSONB, -- ['Low engagement', 'Payment issues']
  "recommendations" JSONB, -- ['Send re-engagement email', ...]
  "calculated_by" VARCHAR(100),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE("company_id", "created_at")
);

CREATE INDEX "idx_health_scores_company" ON "customer_health_scores"("company_id");
CREATE INDEX "idx_health_scores_risk" ON "customer_health_scores"("risk_level");
CREATE INDEX "idx_health_scores_overall" ON "customer_health_scores"("overall_score");

-- Churn Predictions
CREATE TABLE IF NOT EXISTS "churn_predictions" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" VARCHAR NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "churn_probability" DECIMAL(5, 4) NOT NULL, -- 0.0000 to 1.0000
  "risk_level" VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  "risk_factors" JSONB NOT NULL, -- [{factor: 'Low engagement', weight: 0.3, impact: 'high'}]
  "recommended_actions" JSONB NOT NULL, -- [{action: 'send_email', priority: 'high'}]
  "predicted_churn_date" TIMESTAMP,
  "prediction_score" INTEGER, -- Confidence score 0-100
  "model_version" VARCHAR(20) DEFAULT '1.0',
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE("company_id", "created_at")
);

CREATE INDEX "idx_churn_predictions_company" ON "churn_predictions"("company_id");
CREATE INDEX "idx_churn_predictions_risk" ON "churn_predictions"("risk_level");
CREATE INDEX "idx_churn_predictions_probability" ON "churn_predictions"("churn_probability");

-- Customer Acquisition Sources
CREATE TABLE IF NOT EXISTS "customer_acquisition_sources" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" VARCHAR NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "source_name" VARCHAR(100) NOT NULL, -- 'organic', 'paid_search', 'referral', etc.
  "source_medium" VARCHAR(100), -- 'google', 'facebook', 'partner_referral'
  "campaign_name" VARCHAR(255),
  "acquisition_date" TIMESTAMP DEFAULT NOW() NOT NULL,
  "first_touch_url" TEXT,
  "utm_source" VARCHAR(100),
  "utm_medium" VARCHAR(100),
  "utm_campaign" VARCHAR(255),
  "utm_content" VARCHAR(255),
  "utm_term" VARCHAR(255),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX "idx_acquisition_company" ON "customer_acquisition_sources"("company_id");
CREATE INDEX "idx_acquisition_source" ON "customer_acquisition_sources"("source_name");
CREATE INDEX "idx_acquisition_date" ON "customer_acquisition_sources"("acquisition_date");

-- Revenue Recognition Events (GAAP Compliant)
CREATE TABLE IF NOT EXISTS "revenue_recognition_events" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoice_id" VARCHAR NOT NULL,
  "company_id" VARCHAR NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "recognition_date" TIMESTAMP NOT NULL,
  "amount" INTEGER NOT NULL, -- In cents
  "revenue_type" VARCHAR(50) NOT NULL, -- 'subscription', 'overage', 'one_time', 'refund'
  "accounting_period" VARCHAR(20) NOT NULL, -- 'YYYY-MM'
  "status" VARCHAR(20) DEFAULT 'recognized',
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX "idx_revenue_company" ON "revenue_recognition_events"("company_id");
CREATE INDEX "idx_revenue_period" ON "revenue_recognition_events"("accounting_period");
CREATE INDEX "idx_revenue_type" ON "revenue_recognition_events"("revenue_type");

-- Subscription Change History
CREATE TABLE IF NOT EXISTS "subscription_change_history" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" VARCHAR NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "change_type" VARCHAR(50) NOT NULL, -- 'upgrade', 'downgrade', 'cancel', 'reactivate'
  "previous_plan" VARCHAR(50),
  "new_plan" VARCHAR(50),
  "previous_mrr" INTEGER,
  "new_mrr" INTEGER,
  "effective_date" TIMESTAMP NOT NULL,
  "reason" TEXT,
  "initiated_by" VARCHAR REFERENCES "users"("id"),
  "proration_amount" INTEGER, -- In cents
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX "idx_subscription_history_company" ON "subscription_change_history"("company_id");
CREATE INDEX "idx_subscription_history_date" ON "subscription_change_history"("effective_date");

COMMENT ON TABLE "usage_events" IS 'Tracks individual feature usage events for analytics';
COMMENT ON TABLE "feature_usage_metrics" IS 'Aggregated feature usage metrics by company and time period';
COMMENT ON TABLE "customer_cohorts" IS 'Customer cohort analysis for retention tracking';
COMMENT ON TABLE "customer_health_scores" IS 'Customer health scores for proactive management';
COMMENT ON TABLE "churn_predictions" IS 'ML-based churn prediction scores and risk factors';
COMMENT ON TABLE "customer_acquisition_sources" IS 'Tracks customer acquisition sources and UTM parameters';
COMMENT ON TABLE "revenue_recognition_events" IS 'GAAP-compliant revenue recognition tracking';
COMMENT ON TABLE "subscription_change_history" IS 'Audit log of all subscription plan changes';
