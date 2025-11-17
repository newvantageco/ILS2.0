-- Migration 002: Normalize JSONB Relational Data
--
-- CRITICAL: This migration normalizes JSONB data into proper relational tables
-- to improve data integrity, query performance, and maintainability.
--
-- Risk Level: HIGH - This affects core healthcare and AI data
-- Rollback: YES - Full rollback script provided

BEGIN;

-- Step 1: Create new normalized tables (if they don't exist)
-- These tables are defined in the new schema files but we create them here for migration

-- Care Plan Goals table
CREATE TABLE IF NOT EXISTS care_plan_goals (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    care_plan_id VARCHAR NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    target_date DATE NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'not_started',
    measurable_outcome TEXT NOT NULL,
    target_value DECIMAL(10, 2),
    current_value DECIMAL(10, 2),
    unit TEXT,
    achieved_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_care_plan_goal_plan ON care_plan_goals(care_plan_id);
CREATE INDEX IF NOT EXISTS idx_care_plan_goal_status ON care_plan_goals(status);
CREATE INDEX IF NOT EXISTS idx_care_plan_goal_target_date ON care_plan_goals(target_date);

-- Care Plan Interventions table
CREATE TABLE IF NOT EXISTS care_plan_interventions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    care_plan_id VARCHAR NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
    goal_id VARCHAR REFERENCES care_plan_goals(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    frequency TEXT,
    status VARCHAR NOT NULL DEFAULT 'scheduled',
    scheduled_date DATE,
    completed_date DATE,
    assigned_to VARCHAR REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_care_plan_intervention_plan ON care_plan_interventions(care_plan_id);
CREATE INDEX IF NOT EXISTS idx_care_plan_intervention_goal ON care_plan_interventions(goal_id);
CREATE INDEX IF NOT EXISTS idx_care_plan_intervention_status ON care_plan_interventions(status);
CREATE INDEX IF NOT EXISTS idx_care_plan_intervention_assigned ON care_plan_interventions(assigned_to);

-- Care Team Members table
CREATE TABLE IF NOT EXISTS care_team_members (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    care_plan_id VARCHAR NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    responsibilities TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
    left_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_care_team_plan ON care_team_members(care_plan_id);
CREATE INDEX IF NOT EXISTS idx_care_team_user ON care_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_care_team_active ON care_team_members(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_care_team_unique ON care_team_members(care_plan_id, user_id);

-- AI Recommendation Items table
CREATE TABLE IF NOT EXISTS ai_recommendation_items (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id VARCHAR NOT NULL REFERENCES ai_dispensing_recommendations(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,
    tier VARCHAR NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    lens_type TEXT,
    lens_material TEXT,
    coating TEXT,
    price DECIMAL(10, 2),
    estimated_comfort_score DECIMAL(3, 1),
    estimated_visual_acuity DECIMAL(3, 1),
    pros TEXT,
    cons TEXT,
    is_selected BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_recommendation_item_recommendation ON ai_recommendation_items(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendation_item_type ON ai_recommendation_items(type);
CREATE INDEX IF NOT EXISTS idx_ai_recommendation_item_tier ON ai_recommendation_items(tier);
CREATE INDEX IF NOT EXISTS idx_ai_recommendation_item_selected ON ai_recommendation_items(is_selected);

-- Risk Score Factors table
CREATE TABLE IF NOT EXISTS risk_score_factors (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_score_id VARCHAR NOT NULL REFERENCES risk_scores(id) ON DELETE CASCADE,
    factor TEXT NOT NULL,
    weight DECIMAL(3, 2) NOT NULL,
    value TEXT NOT NULL,
    impact TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_risk_factor_score ON risk_score_factors(risk_score_id);
CREATE INDEX IF NOT EXISTS idx_risk_factor_weight ON risk_score_factors(weight);

-- PDSA Plan Steps table
CREATE TABLE IF NOT EXISTS pdsa_plan_steps (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id VARCHAR NOT NULL REFERENCES pdsa_cycles(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    action TEXT NOT NULL,
    measurement TEXT,
    target TEXT,
    actual TEXT,
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pdsa_step_cycle ON pdsa_plan_steps(cycle_id);
CREATE INDEX IF NOT EXISTS idx_pdsa_step_number ON pdsa_plan_steps(step_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pdsa_step_unique ON pdsa_plan_steps(cycle_id, step_number);

-- Step 2: Migrate data from care_plans.goals (JSONB) to care_plan_goals table
INSERT INTO care_plan_goals (
    id,
    care_plan_id,
    description,
    target_date,
    status,
    measurable_outcome,
    target_value,
    current_value,
    unit,
    achieved_date,
    notes,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid() as id,
    cp.id as care_plan_id,
    goal->>'description' as description,
    (goal->>'targetDate')::date as target_date,
    goal->>'status' as status,
    goal->>'measurableOutcome' as measurable_outcome,
    (goal->>'targetValue')::decimal as target_value,
    (goal->>'currentValue')::decimal as current_value,
    goal->>'unit' as unit,
    (goal->>'achievedDate')::date as achieved_date,
    goal->>'notes' as notes,
    NOW() as created_at,
    NOW() as updated_at
FROM care_plans cp,
jsonb_array_elements(cp.goals) as goal
WHERE cp.goals IS NOT NULL AND jsonb_array_length(cp.goals) > 0;

-- Step 3: Migrate data from care_plans.interventions (JSONB) to care_plan_interventions table
INSERT INTO care_plan_interventions (
    id,
    care_plan_id,
    type,
    title,
    description,
    frequency,
    status,
    scheduled_date,
    completed_date,
    assigned_to,
    notes,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid() as id,
    cp.id as care_plan_id,
    intervention->>'type' as type,
    intervention->>'title' as title,
    intervention->>'description' as description,
    intervention->>'frequency' as frequency,
    intervention->>'status' as status,
    (intervention->>'scheduledDate')::date as scheduled_date,
    (intervention->>'completedDate')::date as completed_date,
    intervention->>'assignedTo' as assigned_to,
    intervention->>'notes' as notes,
    NOW() as created_at,
    NOW() as updated_at
FROM care_plans cp,
jsonb_array_elements(cp.interventions) as intervention
WHERE cp.interventions IS NOT NULL AND jsonb_array_length(cp.interventions) > 0;

-- Step 4: Migrate care team members from JSONB
INSERT INTO care_team_members (
    id,
    care_plan_id,
    user_id,
    role,
    responsibilities,
    is_active,
    joined_at,
    created_at
)
SELECT 
    gen_random_uuid() as id,
    cp.id as care_plan_id,
    member->>'userId' as user_id,
    member->>'role' as role,
    member->>'responsibilities' as responsibilities,
    COALESCE((member->>'isActive')::boolean, TRUE) as is_active,
    COALESCE((member->>'joinedAt')::timestamp, NOW()) as joined_at,
    NOW() as created_at
FROM care_plans cp,
jsonb_array_elements(cp.careTeam->'members') as member
WHERE cp.careTeam IS NOT NULL 
  AND cp.careTeam->'members' IS NOT NULL 
  AND jsonb_array_length(cp.careTeam->'members') > 0;

-- Step 5: Migrate AI recommendation items from JSONB
INSERT INTO ai_recommendation_items (
    id,
    recommendation_id,
    type,
    tier,
    title,
    description,
    lens_type,
    lens_material,
    coating,
    price,
    estimated_comfort_score,
    estimated_visual_acuity,
    pros,
    cons,
    is_selected,
    created_at
)
SELECT 
    gen_random_uuid() as id,
    adr.id as recommendation_id,
    rec->>'type' as type,
    rec->>'tier' as tier,
    rec->>'title' as title,
    rec->>'description' as description,
    rec->>'lensType' as lens_type,
    rec->>'lensMaterial' as lens_material,
    rec->>'coating' as coating,
    (rec->>'price')::decimal as price,
    (rec->>'estimatedComfortScore')::decimal as estimated_comfort_score,
    (rec->>'estimatedVisualAcuity')::decimal as estimated_visual_acuity,
    rec->>'pros' as pros,
    rec->>'cons' as cons,
    COALESCE((rec->>'isSelected')::boolean, FALSE) as is_selected,
    NOW() as created_at
FROM ai_dispensing_recommendations adr,
jsonb_array_elements(adr.recommendations) as rec
WHERE adr.recommendations IS NOT NULL AND jsonb_array_length(adr.recommendations) > 0;

-- Step 6: Migrate risk score factors from JSONB
INSERT INTO risk_score_factors (
    id,
    risk_score_id,
    factor,
    weight,
    value,
    impact,
    created_at
)
SELECT 
    gen_random_uuid() as id,
    rs.id as risk_score_id,
    factor->>'name' as factor,
    (factor->>'weight')::decimal as weight,
    factor->>'value' as value,
    factor->>'impact' as impact,
    NOW() as created_at
FROM risk_scores rs,
jsonb_array_elements(rs.factors) as factor
WHERE rs.factors IS NOT NULL AND jsonb_array_length(rs.factors) > 0;

-- Step 7: Migrate PDSA plan steps from JSONB
INSERT INTO pdsa_plan_steps (
    id,
    cycle_id,
    step_number,
    description,
    action,
    measurement,
    target,
    actual,
    completed_at,
    notes,
    created_at
)
SELECT 
    gen_random_uuid() as id,
    pc.id as cycle_id,
    (step->>'stepNumber')::integer as step_number,
    step->>'description' as description,
    step->>'action' as action,
    step->>'measurement' as measurement,
    step->>'target' as target,
    step->>'actual' as actual,
    (step->>'completedAt')::timestamp as completed_at,
    step->>'notes' as notes,
    NOW() as created_at
FROM pdsa_cycles pc,
jsonb_array_elements(pc.plan->'steps') as step
WHERE pc.plan IS NOT NULL 
  AND pc.plan->'steps' IS NOT NULL 
  AND jsonb_array_length(pc.plan->'steps') > 0;

-- Step 8: Create backup tables before dropping JSONB columns
CREATE TABLE care_plans_backup AS SELECT * FROM care_plans;
CREATE TABLE ai_dispensing_recommendations_backup AS SELECT * FROM ai_dispensing_recommendations;
CREATE TABLE risk_scores_backup AS SELECT * FROM risk_scores;
CREATE TABLE pdsa_cycles_backup AS SELECT * FROM pdsa_cycles;

-- Step 9: Drop JSONB columns from original tables (after successful migration)
-- Note: This is commented out for safety. Uncomment after verifying migration success.
/*
ALTER TABLE care_plans 
DROP COLUMN IF EXISTS goals,
DROP COLUMN IF EXISTS interventions,
DROP COLUMN IF EXISTS careTeam;

ALTER TABLE ai_dispensing_recommendations 
DROP COLUMN IF EXISTS recommendations;

ALTER TABLE risk_scores 
DROP COLUMN IF EXISTS factors;

ALTER TABLE pdsa_cycles 
DROP COLUMN IF EXISTS plan;
*/

-- Step 10: Add foreign key constraints and indexes for performance
-- These are already created in the table definitions above

-- Step 11: Update statistics for query optimizer
ANALYZE care_plan_goals;
ANALYZE care_plan_interventions;
ANALYZE care_team_members;
ANALYZE ai_recommendation_items;
ANALYZE risk_score_factors;
ANALYZE pdsa_plan_steps;

COMMIT;

-- Rollback script (save as 002_normalize_jsonb_data_rollback.sql)
/*
BEGIN;

-- Restore JSONB columns
ALTER TABLE care_plans 
ADD COLUMN IF NOT EXISTS goals JSONB,
ADD COLUMN IF NOT EXISTS interventions JSONB,
ADD COLUMN IF NOT EXISTS careTeam JSONB;

ALTER TABLE ai_dispensing_recommendations 
ADD COLUMN IF NOT EXISTS recommendations JSONB;

ALTER TABLE risk_scores 
ADD COLUMN IF NOT EXISTS factors JSONB;

ALTER TABLE pdsa_cycles 
ADD COLUMN IF NOT EXISTS plan JSONB;

-- Restore data from backups
UPDATE care_plans cp 
SET goals = cb.goals,
    interventions = cb.interventions,
    careTeam = cb.careTeam
FROM care_plans_backup cb 
WHERE cp.id = cb.id;

UPDATE ai_dispensing_recommendations adr 
SET recommendations = adrb.recommendations
FROM ai_dispensing_recommendations_backup adrb 
WHERE adr.id = adrb.id;

UPDATE risk_scores rs 
SET factors = rsb.factors
FROM risk_scores_backup rsb 
WHERE rs.id = rsb.id;

UPDATE pdsa_cycles pc 
SET plan = pcb.plan
FROM pdsa_cycles_backup pcb 
WHERE pc.id = pcb.id;

-- Drop new normalized tables
DROP TABLE IF EXISTS care_plan_goals;
DROP TABLE IF EXISTS care_plan_interventions;
DROP TABLE IF EXISTS care_team_members;
DROP TABLE IF EXISTS ai_recommendation_items;
DROP TABLE IF EXISTS risk_score_factors;
DROP TABLE IF EXISTS pdsa_plan_steps;

-- Drop backup tables
DROP TABLE IF EXISTS care_plans_backup;
DROP TABLE IF EXISTS ai_dispensing_recommendations_backup;
DROP TABLE IF EXISTS risk_scores_backup;
DROP TABLE IF EXISTS pdsa_cycles_backup;

COMMIT;
*/
